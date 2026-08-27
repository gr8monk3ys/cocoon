import { describe, expect, it } from "vitest";
import { HOST_RULES } from "../rules";
import {
  buildFeedCleanerCss,
  classifyPath,
  countRuleCss,
  getEffectiveFeedRules,
  getEffectiveFeedSelectors,
  getFeedSelectors,
  getHostRules,
  PATH_ATTR,
  SOCIAL_HOSTS,
  supportsFeedCleaner
} from "./feedRules";

describe("feedRules", () => {
  it("supports known social hostnames", () => {
    expect(supportsFeedCleaner("www.reddit.com")).toBe(true);
    expect(supportsFeedCleaner("x.com")).toBe(true);
  });

  it("defines feed selectors for every supported host", () => {
    for (const host of SOCIAL_HOSTS) {
      expect(getFeedSelectors(host).length, `missing feed selectors for ${host}`).toBeGreaterThan(0);
    }
  });

  it("does not embed an inaccessible CSS-content banner", () => {
    const css = buildFeedCleanerCss("reddit.com", "limited");
    expect(css).not.toContain("content:");
    expect(css).not.toContain("body::before");
  });

  it("does not support unknown hostnames", () => {
    expect(supportsFeedCleaner("example.com")).toBe(false);
    expect(getFeedSelectors("example.com")).toEqual([]);
  });

  it("generates css only for supported hosts and non-full intensity", () => {
    expect(buildFeedCleanerCss("m.facebook.com", "limited")).toContain("display: none !important");
    expect(buildFeedCleanerCss("example.com", "limited")).toBe("");
    expect(buildFeedCleanerCss("m.facebook.com", "full")).toBe("");
  });

  it("uses only the gentle rules at 'limited' and all of them at 'none'", () => {
    // Uses a host with more than one selector on purpose: on a single-selector
    // host `limited` and `none` are trivially equal and this asserts nothing.
    const all = getFeedSelectors("x.com");
    expect(all.length).toBeGreaterThan(1);
    expect(getEffectiveFeedSelectors("x.com", "limited")).toEqual(["[aria-label='Timeline: Your Home Timeline']"]);
    expect(getEffectiveFeedSelectors("x.com", "none")).toEqual(all);
    expect(getEffectiveFeedSelectors("x.com", "full")).toEqual([]);
    expect(getEffectiveFeedSelectors("example.com", "none")).toEqual([]);
  });

  it("keeps the pre-merge rules for the hosts that already worked", () => {
    // Regression guard for the port of feedless's rule design: the selectors
    // that shipped in 1.0.0 must still be emitted, in the same intensity tier.
    expect(getEffectiveFeedSelectors("www.youtube.com", "limited")).toEqual(["ytd-rich-grid-renderer"]);
    expect(getEffectiveFeedSelectors("www.youtube.com", "none")).toEqual([
      "ytd-rich-grid-renderer",
      "ytd-browse[page-subtype='home'] #contents"
    ]);
    expect(getEffectiveFeedSelectors("www.reddit.com", "none")).toEqual(["shreddit-feed"]);
    expect(getEffectiveFeedSelectors("www.tiktok.com", "limited")).toEqual(["[data-e2e='recommend-list']"]);
    expect(getEffectiveFeedSelectors("www.tiktok.com", "none")).toEqual([
      "[data-e2e='recommend-list']",
      "div[data-e2e='video-feed-item']"
    ]);
    expect(getEffectiveFeedSelectors("twitter.com", "none")).toEqual(getEffectiveFeedSelectors("x.com", "none"));
  });

  it("gates path-scoped rules on the html path attribute", () => {
    const css = buildFeedCleanerCss("www.instagram.com", "limited");
    expect(css).toContain(`html[${PATH_ATTR}="home"] main article { display: none !important; }`);
    expect(css).not.toMatch(/^main article/m);
    // Unscoped rules stay unguarded.
    expect(buildFeedCleanerCss("x.com", "limited")).toBe(
      "[aria-label='Timeline: Your Home Timeline'] { display: none !important; }"
    );
  });

  it("emits a marker rule for observer-marked surfaces", () => {
    expect(buildFeedCleanerCss("www.facebook.com", "limited")).toContain(
      `html[${PATH_ATTR}="home"] [data-cocoon-unit~="facebook.feedPosts"] { display: none !important; }`
    );
  });

  it("countRuleCss matches the number of emitted rules", () => {
    for (const host of SOCIAL_HOSTS) {
      const css = buildFeedCleanerCss(host, "none");
      expect((css.match(/display: none/g) ?? []).length).toBe(countRuleCss(getEffectiveFeedRules(host, "none")));
    }
  });
});

describe("classifyPath", () => {
  const ig = getHostRules("www.instagram.com");
  const fb = getHostRules("www.facebook.com");

  it.each([
    ["/", "home"],
    ["/reels/", "reels"],
    ["/reels/audio/123/", "reels"],
    ["/explore/", "explore"],
    ["/explore/tags/cats/", "explore"],
    ["/stories/someuser/1/", "stories"],
    ["/p/DajV-LAJWVE/", "post"],
    ["/someuser/", "other"],
    ["/direct/inbox/", "other"]
  ] as const)("instagram %s -> %s", (path, kind) => {
    expect(classifyPath(ig, path)).toBe(kind);
  });

  it.each([
    ["/", "home"],
    ["/reel/123456", "reels"],
    ["/stories/123/", "stories"],
    ["/watch/", "watch"],
    ["/watch", "watch"],
    ["/groups/feed/", "other"],
    ["/marketplace/", "other"]
  ] as const)("facebook %s -> %s", (path, kind) => {
    expect(classifyPath(fb, path)).toBe(kind);
  });

  it("treats every non-root path as other on hosts without page prefixes", () => {
    expect(classifyPath(getHostRules("reddit.com"), "/r/foo/")).toBe("other");
    expect(classifyPath(undefined, "/")).toBe("home");
  });
});

describe("rule definitions", () => {
  const all = HOST_RULES.flatMap((h) => h.rules);

  it("ids are unique and prefixed with the host's first label", () => {
    const ids = all.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const host of HOST_RULES) {
      const prefix = host.host.split(".")[0];
      for (const rule of host.rules) {
        expect(rule.id, rule.id).toMatch(new RegExp(`^${prefix}[.][a-zA-Z]+$`));
      }
    }
  });

  it("every host has a gentle rule, so 'limited' hides something everywhere", () => {
    for (const host of HOST_RULES) {
      expect(host.rules.some((r) => r.intensity === "limited"), host.host).toBe(true);
    }
  });

  it("every rule has a selector or a marker, never both", () => {
    for (const rule of all) {
      expect(rule.selector !== undefined || rule.mark !== undefined, rule.id).toBe(true);
      expect(rule.selector !== undefined && rule.mark !== undefined, rule.id).toBe(false);
    }
  });

  it("no selector uses obfuscated class names", () => {
    for (const rule of all) {
      expect(rule.selector ?? "", rule.id).not.toMatch(/\.x[0-9a-z]{4,}/);
    }
  });

  it("every page kind a rule targets is classifiable on its host", () => {
    for (const host of HOST_RULES) {
      for (const rule of host.rules) {
        for (const kind of rule.paths ?? []) {
          const known = kind === "home" || kind === "other" || host.pages?.[kind] !== undefined;
          expect(known, `${rule.id} targets '${kind}' which ${host.host} never classifies`).toBe(true);
        }
      }
    }
  });
});
