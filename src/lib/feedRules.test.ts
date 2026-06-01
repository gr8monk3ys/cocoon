import { describe, expect, it } from "vitest";
import {
  buildFeedCleanerCss,
  getEffectiveFeedSelectors,
  getFeedSelectors,
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

  it("limits to the first selector at 'limited' and uses all at 'none'", () => {
    const all = getFeedSelectors("reddit.com");
    expect(getEffectiveFeedSelectors("reddit.com", "limited")).toEqual(all.slice(0, 1));
    expect(getEffectiveFeedSelectors("reddit.com", "none")).toEqual(all);
    expect(getEffectiveFeedSelectors("reddit.com", "full")).toEqual([]);
    expect(getEffectiveFeedSelectors("example.com", "none")).toEqual([]);
  });
});
