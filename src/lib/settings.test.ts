import { describe, expect, it } from "vitest";
import {
  applyProfile,
  applyScenario,
  getAdaptiveProfileSuggestion,
  getFeedIntensityForHost,
  normalizeHostname,
  removeSiteFeedCleanerOverride,
  restoreExpiredScenario,
  updateSiteFeedCleanerOverride,
  upsertDomainRule,
  upsertScheduleRule
} from "./settings";

describe("applyProfile", () => {
  it("loads autism preset", () => {
    const result = applyProfile("autism");
    expect(result.profile).toBe("autism");
    expect(result.darkMode).toBe(true);
    expect(result.reduceMotion).toBe(true);
    expect(result.feedIntensity).toBe("none");
  });

  it("loads adhd preset with limited feed intensity", () => {
    const result = applyProfile("adhd");
    expect(result.feedIntensity).toBe("limited");
    expect(result.enableGroundingTool).toBe(true);
  });
});

describe("site feed cleaner overrides", () => {
  it("normalizes hostnames", () => {
    expect(normalizeHostname("WWW.REDDIT.COM.")).toBe("www.reddit.com");
  });

  it("uses global setting when no override exists", () => {
    const settings = applyProfile("adhd");
    expect(getFeedIntensityForHost(settings, "www.youtube.com")).toBe("limited");
  });

  it("uses per-site override when present", () => {
    const settings = updateSiteFeedCleanerOverride(applyProfile("adhd"), "youtube.com", false);
    expect(getFeedIntensityForHost(settings, "youtube.com")).toBe("full");
  });

  it("applies root-domain override to subdomains", () => {
    const settings = updateSiteFeedCleanerOverride(applyProfile("adhd"), "youtube.com", false);
    expect(getFeedIntensityForHost(settings, "www.youtube.com")).toBe("full");
  });

  it("removes per-site override", () => {
    const updated = updateSiteFeedCleanerOverride(applyProfile("adhd"), "youtube.com", false);
    const removed = removeSiteFeedCleanerOverride(updated, "youtube.com");
    expect(removed.siteFeedCleanerOverrides["youtube.com"]).toBeUndefined();
  });

  it("removes root-domain override when removing a subdomain key", () => {
    const updated = updateSiteFeedCleanerOverride(applyProfile("adhd"), "www.youtube.com", false);
    const removed = removeSiteFeedCleanerOverride(updated, "www.youtube.com");
    expect(removed.siteFeedCleanerOverrides["youtube.com"]).toBeUndefined();
  });
});

describe("adaptive suggestions and scenarios", () => {
  it("suggests profile from domain rule", () => {
    let settings = applyProfile("adhd");
    settings = { ...settings, adaptive: { ...settings.adaptive, enabled: true } };
    settings = upsertDomainRule(settings, "reddit.com", "autism");

    expect(getAdaptiveProfileSuggestion(settings, "reddit.com")).toBe("autism");
  });

  it("suggests profile from domain rule on subdomains", () => {
    let settings = applyProfile("adhd");
    settings = { ...settings, adaptive: { ...settings.adaptive, enabled: true } };
    settings = upsertDomainRule(settings, "reddit.com", "autism");

    expect(getAdaptiveProfileSuggestion(settings, "www.reddit.com")).toBe("autism");
  });

  it("suggests profile from schedule rule", () => {
    let settings = applyProfile("adhd");
    settings = { ...settings, adaptive: { ...settings.adaptive, enabled: true } };
    settings = upsertScheduleRule(settings, { startHour: 20, endHour: 6, profile: "anxiety" });

    expect(getAdaptiveProfileSuggestion(settings, "youtube.com", new Date("2026-02-11T22:00:00"))).toBe("anxiety");
  });

  it("applies scenario quick switch", () => {
    const settings = applyScenario(applyProfile("adhd"), "focus_session", 30);
    expect(settings.feedIntensity).toBe("none");
    expect(settings.hideAlgorithmicFeeds).toBe(true);
    expect(settings.activeScenario?.type).toBe("focus_session");
    expect(settings.activeScenario?.expiresAt).not.toBeNull();
  });

  it("restores scenario baseline after expiry", () => {
    const base = applyProfile("adhd");
    const inScenario = applyScenario(base, "focus_session", 30);
    const expiresAt = inScenario.activeScenario?.expiresAt ?? 0;

    const restored = restoreExpiredScenario(inScenario, expiresAt + 1);
    expect(restored.activeScenario).toBeNull();
    expect(restored.profile).toBe("adhd");
    expect(restored.feedIntensity).toBe("limited");
    expect(restored.hideAlgorithmicFeeds).toBe(true);
  });
});
