// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { countFeedMatches, findDeadFeedSelectors, getCheckableFeedRules, getFeedSelectors } from "./feedRules";

describe("countFeedMatches (selector-rot detection)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("counts matching feed elements on a supported host", () => {
    document.body.innerHTML = "<shreddit-feed></shreddit-feed>";
    expect(countFeedMatches(document, "reddit.com", "limited")).toBe(1);
  });

  it("returns 0 when the markup no longer matches (selector rot)", () => {
    document.body.innerHTML = "<div class='totally-different-layout'></div>";
    expect(countFeedMatches(document, "reddit.com", "limited")).toBe(0);
  });

  it("returns 0 for unsupported hosts and for 'full' intensity", () => {
    document.body.innerHTML = "<shreddit-feed></shreddit-feed>";
    expect(countFeedMatches(document, "example.com", "none")).toBe(0);
    expect(countFeedMatches(document, "reddit.com", "full")).toBe(0);
  });

  it("reports a dead selector while a sibling still matches (partial rot)", () => {
    // The exact shape countFeedMatches cannot see: the total stays above zero,
    // so no user-facing rot warning fires, while half the rule is dead.
    const [live, dead] = getFeedSelectors("x.com");
    document.body.innerHTML = "<div aria-label='Timeline: Your Home Timeline'></div>";

    expect(countFeedMatches(document, "x.com", "none")).toBe(1);
    expect(findDeadFeedSelectors(document, "x.com", "none")).toEqual([dead]);
    expect(live).toBe("[aria-label='Timeline: Your Home Timeline']");
  });

  it("reports nothing when every selector matches", () => {
    document.body.innerHTML =
      "<div aria-label='Timeline: Your Home Timeline'></div>" +
      "<div data-testid='primaryColumn'><div role='region'></div></div>";
    expect(findDeadFeedSelectors(document, "x.com", "none")).toEqual([]);
  });

  it("reports nothing on total rot, which countFeedMatches already surfaces", () => {
    // Every selector dead is not *partial* rot. Returning all of them here would
    // duplicate the user-facing warning as a console warning on every page load.
    document.body.innerHTML = "<div class='totally-different-layout'></div>";
    expect(countFeedMatches(document, "x.com", "none")).toBe(0);
    expect(findDeadFeedSelectors(document, "x.com", "none")).toEqual([]);
  });

  it("only checks rules that apply to the current page kind", () => {
    // Instagram's feed rules are home-only. On a post page they are out of
    // scope, so their absence is not rot — and the opened post is not counted.
    document.body.innerHTML = "<main><article>the post the user opened</article></main>";
    expect(countFeedMatches(document, "www.instagram.com", "limited", "home")).toBe(1);
    expect(countFeedMatches(document, "www.instagram.com", "limited", "post")).toBe(0);
    expect(getCheckableFeedRules("www.instagram.com", "limited", "post")).toEqual([]);
  });

  it("ignores mayBeAbsent rules when looking for dead selectors", () => {
    // Facebook's legacy role="feed" is expected to be missing on the current
    // layout; the marked container is what proves the feed was found.
    document.body.innerHTML = '<div role="main"><div data-cocoon-unit="facebook.feedPosts"><h3>Feed posts</h3></div></div>';
    expect(countFeedMatches(document, "www.facebook.com", "limited", "home")).toBe(1);
    expect(findDeadFeedSelectors(document, "www.facebook.com", "limited", "home")).toEqual([]);
  });

  it("does not match a Reddit post page at any intensity", () => {
    // A comments page renders <shreddit-post> with no enclosing <shreddit-feed>.
    // Guards against 'fixing' the stale [data-testid='post-container'] rule by
    // adding a post-level selector, which would hide the post the user opened.
    document.body.innerHTML = "<shreddit-post></shreddit-post>";
    expect(countFeedMatches(document, "reddit.com", "limited")).toBe(0);
    expect(countFeedMatches(document, "reddit.com", "none")).toBe(0);
  });
});
