import { describe, expect, it } from "vitest";
import { HOST_RULES, ruleSelector } from "../rules";
import { PATH_ATTR, planPage, SOCIAL_HOSTS, supportsFeedCleaner, type PagePlan } from "./pagePlan";
import { DEFAULT_SETTINGS, type CocoonSettings, type FeedIntensity } from "./types";

function settingsAt(intensity: FeedIntensity, patch: Partial<CocoonSettings> = {}): CocoonSettings {
  return { ...DEFAULT_SETTINGS, feedIntensity: intensity, ...patch };
}

function plan(hostname: string, intensity: FeedIntensity = "limited", pathname = "/"): PagePlan {
  return planPage(hostname, pathname, settingsAt(intensity));
}

function selectorsOf(p: PagePlan): string[] {
  return p.activeRules.map(ruleSelector);
}

describe("planPage: which rules are active", () => {
  it("supports known social hostnames", () => {
    expect(supportsFeedCleaner("www.reddit.com")).toBe(true);
    expect(supportsFeedCleaner("x.com")).toBe(true);
  });

  it("has active rules for every supported host", () => {
    for (const host of SOCIAL_HOSTS) {
      expect(selectorsOf(plan(host, "none")).length, `no active rules for ${host}`).toBeGreaterThan(0);
    }
  });

  it("plans nothing for unknown hostnames", () => {
    const unknown = plan("example.com", "none");
    expect(supportsFeedCleaner("example.com")).toBe(false);
    expect(unknown.supported).toBe(false);
    expect(unknown.intensity).toBe("full");
    expect(unknown.activeRules).toEqual([]);
    expect(unknown.feedCss).toBe("");
  });

  it("generates css only for supported hosts at a non-full intensity", () => {
    expect(plan("m.facebook.com", "limited").feedCss).toContain("display: none !important");
    expect(plan("example.com", "limited").feedCss).toBe("");
    expect(plan("m.facebook.com", "full").feedCss).toBe("");
  });

  it("uses only the gentle rules at 'limited' and all of them at 'none'", () => {
    // Uses a host with more than one selector on purpose: on a single-selector
    // host `limited` and `none` are trivially equal and this asserts nothing.
    const all = selectorsOf(plan("x.com", "none"));
    expect(all.length).toBeGreaterThan(1);
    expect(selectorsOf(plan("x.com", "limited"))).toEqual(["[aria-label='Timeline: Your Home Timeline']"]);
    expect(selectorsOf(plan("x.com", "full"))).toEqual([]);
  });

  it("keeps the pre-merge rules for the hosts that already worked", () => {
    // Regression guard for the port of feedless's rule design: the selectors
    // that shipped in 1.0.0 must still be emitted, in the same intensity tier.
    expect(selectorsOf(plan("www.youtube.com", "limited"))).toEqual(["ytd-rich-grid-renderer"]);
    expect(selectorsOf(plan("www.youtube.com", "none"))).toEqual([
      "ytd-rich-grid-renderer",
      "ytd-browse[page-subtype='home'] #contents"
    ]);
    expect(selectorsOf(plan("www.reddit.com", "none"))).toEqual(["shreddit-feed"]);
    expect(selectorsOf(plan("www.tiktok.com", "limited"))).toEqual(["[data-e2e='recommend-list']"]);
    expect(selectorsOf(plan("www.tiktok.com", "none"))).toEqual([
      "[data-e2e='recommend-list']",
      "div[data-e2e='video-feed-item']"
    ]);
    expect(selectorsOf(plan("twitter.com", "none"))).toEqual(selectorsOf(plan("x.com", "none")));
  });
});

describe("planPage: the stylesheet", () => {
  it("does not embed an inaccessible CSS-content banner", () => {
    const { feedCss } = plan("reddit.com", "limited");
    expect(feedCss).not.toContain("content:");
    expect(feedCss).not.toContain("body::before");
  });

  it("gates path-scoped rules on the html path attribute", () => {
    const { feedCss } = plan("www.instagram.com", "limited");
    expect(feedCss).toContain(`html[${PATH_ATTR}="home"] main article { display: none !important; }`);
    expect(feedCss).not.toMatch(/^main article/m);
    // Unscoped rules stay unguarded.
    expect(plan("x.com", "limited").feedCss).toBe(
      "[aria-label='Timeline: Your Home Timeline'] { display: none !important; }"
    );
  });

  it("emits a marker rule for observer-marked surfaces", () => {
    expect(plan("www.facebook.com", "limited").feedCss).toContain(
      `html[${PATH_ATTR}="home"] [data-cocoon-unit~="facebook.feedPosts"] { display: none !important; }`
    );
  });

  it("feedCssRuleCount matches the number of emitted rules", () => {
    for (const host of SOCIAL_HOSTS) {
      const { feedCss, feedCssRuleCount } = plan(host, "none");
      expect((feedCss.match(/display: none/g) ?? []).length, host).toBe(feedCssRuleCount);
    }
  });

  it("carries the sensory css, which follows the user across every host", () => {
    const dark = planPage("example.com", "/", settingsAt("full", { darkMode: true, reduceMotion: false }));
    expect(dark.css).toContain("filter: invert(0.93)");
    expect(dark.css).toContain("hue-rotate(180deg)");

    const calm = planPage("example.com", "/", settingsAt("full", { darkMode: false, reduceMotion: true }));
    expect(calm.css).toContain("animation: none !important");
    expect(calm.css).toContain("scroll-behavior: auto !important");

    // DEFAULT_SETTINGS turns reduce-motion on, so "nothing to inject" needs
    // both sensory switches off explicitly.
    expect(planPage("example.com", "/", settingsAt("full", { darkMode: false, reduceMotion: false })).css).toBe("");
  });

  it("puts sensory css and feed css in the same stylesheet", () => {
    const both = planPage("x.com", "/", settingsAt("limited", { darkMode: true }));
    expect(both.css).toContain("filter: invert(0.93)");
    expect(both.css).toContain(both.feedCss);
  });
});

describe("planPage: page kind", () => {
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
  ] as const)("instagram %s -> %s", (pathname, kind) => {
    expect(plan("www.instagram.com", "limited", pathname).path).toBe(kind);
  });

  it.each([
    ["/", "home"],
    ["/reel/123456", "reels"],
    ["/stories/123/", "stories"],
    ["/watch/", "watch"],
    ["/watch", "watch"],
    ["/groups/feed/", "other"],
    ["/marketplace/", "other"]
  ] as const)("facebook %s -> %s", (pathname, kind) => {
    expect(plan("www.facebook.com", "limited", pathname).path).toBe(kind);
  });

  it("treats every non-root path as other on hosts without page prefixes", () => {
    expect(plan("reddit.com", "limited", "/r/foo/").path).toBe("other");
    expect(plan("example.com", "limited", "/").path).toBe("home");
  });

  it("has nothing to check on a page kind the active rules do not cover", () => {
    // Instagram's feed rules are home-only. On a post page their absence is not
    // rot, so there is nothing to verify and no banner either way.
    expect(plan("www.instagram.com", "limited", "/").checkableRules.length).toBeGreaterThan(0);
    expect(plan("www.instagram.com", "limited", "/p/abc/").checkableRules).toEqual([]);
  });

  it("never treats a mayBeAbsent rule as checkable", () => {
    for (const host of SOCIAL_HOSTS) {
      expect(plan(host, "none").checkableRules.some((r) => r.mayBeAbsent), host).toBe(false);
    }
  });
});

describe("planPage: hostname and overrides", () => {
  it("normalizes the hostname it plans for, and keys everything on that", () => {
    // Case and a trailing dot are legal in a URL host and must not produce a
    // different plan, or a different banner-state key, than the plain form.
    for (const raw of ["www.Reddit.com", "WWW.REDDIT.COM", "www.reddit.com."]) {
      const p = plan(raw);
      expect(p.hostname, raw).toBe(raw.trim().toLowerCase().replace(/\.$/, ""));
      expect(p.supported, raw).toBe(true);
      expect(selectorsOf(p), raw).toEqual(["shreddit-feed"]);
    }
    expect(supportsFeedCleaner("WWW.Reddit.com.")).toBe(true);
  });

  it("does not match a host that merely ends with a supported name", () => {
    expect(supportsFeedCleaner("notreddit.com")).toBe(false);
    expect(plan("notreddit.com").supported).toBe(false);
    expect(supportsFeedCleaner("evil-x.com")).toBe(false);
  });

  it("applies the per-site override to the intensity it plans with", () => {
    const off = planPage(
      "www.reddit.com",
      "/",
      settingsAt("none", { siteFeedCleanerOverrides: { "www.reddit.com": false } })
    );
    expect(off.intensity).toBe("full");
    expect(off.activeRules).toEqual([]);

    // Enabling a site can only ever clean more than the global setting.
    const on = planPage(
      "www.reddit.com",
      "/",
      settingsAt("full", { siteFeedCleanerOverrides: { "www.reddit.com": true } })
    );
    expect(on.intensity).toBe("limited");
    expect(selectorsOf(on)).toEqual(["shreddit-feed"]);
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
        expect(rule.id.startsWith(`${prefix}.`), rule.id).toBe(true);
        expect(rule.id.slice(prefix.length + 1), rule.id).toMatch(/^[a-zA-Z]+$/);
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
