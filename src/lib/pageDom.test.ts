// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { ruleSelector } from "../rules";
import { countFeedMatches, findDeadFeedSelectors } from "./pageDom";
import { planPage } from "./pagePlan";
import { DEFAULT_SETTINGS, type CocoonSettings, type FeedIntensity } from "./types";

function plan(hostname: string, intensity: FeedIntensity = "limited", pathname = "/") {
  const settings: CocoonSettings = { ...DEFAULT_SETTINGS, feedIntensity: intensity };
  return planPage(hostname, pathname, settings);
}

describe("countFeedMatches (selector-rot detection)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("counts matching feed elements on a supported host", () => {
    document.body.innerHTML = "<shreddit-feed></shreddit-feed>";
    expect(countFeedMatches(document, plan("reddit.com"))).toBe(1);
  });

  it("returns 0 when the markup no longer matches (selector rot)", () => {
    document.body.innerHTML = "<div class='totally-different-layout'></div>";
    expect(countFeedMatches(document, plan("reddit.com"))).toBe(0);
  });

  it("returns 0 for unsupported hosts and for 'full' intensity", () => {
    document.body.innerHTML = "<shreddit-feed></shreddit-feed>";
    expect(countFeedMatches(document, plan("example.com", "none"))).toBe(0);
    expect(countFeedMatches(document, plan("reddit.com", "full"))).toBe(0);
  });

  it("reports a dead selector while a sibling still matches (partial rot)", () => {
    // The exact shape countFeedMatches cannot see: the total stays above zero,
    // so no user-facing rot warning fires, while half the rule is dead.
    const x = plan("x.com", "none");
    const [live, dead] = x.activeRules.map(ruleSelector);
    document.body.innerHTML = "<div aria-label='Timeline: Your Home Timeline'></div>";

    expect(countFeedMatches(document, x)).toBe(1);
    expect(findDeadFeedSelectors(document, x)).toEqual([dead]);
    expect(live).toBe("[aria-label='Timeline: Your Home Timeline']");
  });

  it("reports nothing when every selector matches", () => {
    document.body.innerHTML =
      "<div aria-label='Timeline: Your Home Timeline'></div>" +
      "<div data-testid='primaryColumn'><div role='region'></div></div>";
    expect(findDeadFeedSelectors(document, plan("x.com", "none"))).toEqual([]);
  });

  it("reports nothing on total rot, which countFeedMatches already surfaces", () => {
    // Every selector dead is not *partial* rot. Returning all of them here would
    // duplicate the user-facing warning as a console warning on every page load.
    document.body.innerHTML = "<div class='totally-different-layout'></div>";
    const x = plan("x.com", "none");
    expect(countFeedMatches(document, x)).toBe(0);
    expect(findDeadFeedSelectors(document, x)).toEqual([]);
  });

  it("only checks rules that apply to the current page kind", () => {
    // Instagram's feed rules are home-only. On a post page they are out of
    // scope, so their absence is not rot — and the opened post is not counted.
    document.body.innerHTML = "<main><article>the post the user opened</article></main>";
    expect(countFeedMatches(document, plan("www.instagram.com", "limited", "/"))).toBe(1);
    expect(countFeedMatches(document, plan("www.instagram.com", "limited", "/p/abc/"))).toBe(0);
  });

  it("ignores mayBeAbsent rules when looking for dead selectors", () => {
    // Facebook's legacy role="feed" is expected to be missing on the current
    // layout; the marked container is what proves the feed was found.
    document.body.innerHTML = '<div role="main"><div data-cocoon-unit="facebook.feedPosts"><h3>Feed posts</h3></div></div>';
    const fb = plan("www.facebook.com");
    expect(countFeedMatches(document, fb)).toBe(1);
    expect(findDeadFeedSelectors(document, fb)).toEqual([]);
  });

  it("does not match a Reddit post page at any intensity", () => {
    // A comments page renders <shreddit-post> with no enclosing <shreddit-feed>.
    // Guards against 'fixing' the stale [data-testid='post-container'] rule by
    // adding a post-level selector, which would hide the post the user opened.
    document.body.innerHTML = "<shreddit-post></shreddit-post>";
    expect(countFeedMatches(document, plan("reddit.com", "limited"))).toBe(0);
    expect(countFeedMatches(document, plan("reddit.com", "none"))).toBe(0);
  });
});

describe("applyPlan", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("writes the plan's stylesheet and stamps its page kind on <html>", async () => {
    const { applyPlan } = await import("./pageDom");
    const p = plan("www.instagram.com", "limited", "/p/abc123/");
    applyPlan(p);

    const style = document.getElementById("cocoon-style");
    expect(style?.textContent).toBe(p.css);
    expect(document.documentElement.getAttribute("data-cocoon-path")).toBe("post");

    // Re-applying reuses the one style tag rather than stacking new ones.
    applyPlan(plan("www.instagram.com", "none", "/"));
    expect(document.querySelectorAll("#cocoon-style")).toHaveLength(1);
    expect(document.documentElement.getAttribute("data-cocoon-path")).toBe("home");
  });
});
