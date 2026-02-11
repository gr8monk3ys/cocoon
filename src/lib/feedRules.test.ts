import { describe, expect, it } from "vitest";
import { buildFeedCleanerCss, getFeedSelectors, supportsFeedCleaner } from "./feedRules";

describe("feedRules", () => {
  it("supports known social hostnames", () => {
    expect(supportsFeedCleaner("www.reddit.com")).toBe(true);
    expect(supportsFeedCleaner("x.com")).toBe(true);
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
});
