import { describe, expect, it } from "vitest";
import {
  applyProfile,
  applyScenario,
  clearExpiredScenario,
  getAdaptiveProfileSuggestion,
  getFeedIntensityForHost,
  normalizeHostname,
  removeSiteFeedCleanerOverride,
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

  it("removes per-site override", () => {
    const updated = updateSiteFeedCleanerOverride(applyProfile("adhd"), "youtube.com", false);
    const removed = removeSiteFeedCleanerOverride(updated, "youtube.com");
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

  it("suggests profile from schedule rule", () => {
    let settings = applyProfile("adhd");
    settings = { ...settings, adaptive: { ...settings.adaptive, enabled: true } };
    settings = upsertScheduleRule(settings, { startHour: 20, endHour: 6, profile: "anxiety" });

    expect(getAdaptiveProfileSuggestion(settings, "youtube.com", new Date("2026-02-11T22:00:00"))).toBe("anxiety");
  });

  it("applies scenario quick switch", () => {
    const settings = applyScenario(applyProfile("adhd"), "focus_session", 30);
    expect(settings.feedIntensity).toBe("none");
    expect(settings.activeScenario?.type).toBe("focus_session");
    expect(settings.activeScenario?.expiresAt).not.toBeNull();
  });

  it("applies a distinct patch for social_guardrails instead of the generic fallback", () => {
    const settings = applyScenario(applyProfile("anxiety"), "social_guardrails", 30);
    expect(settings.feedIntensity).toBe("none");
    expect(settings.enableGroundingTool).toBe(true);
    expect(settings.activeScenario?.type).toBe("social_guardrails");
  });

  it("keeps hideAlgorithmicFeeds in sync with the scenario feed intensity", () => {
    const settings = applyScenario(applyProfile("anxiety"), "focus_session", 30);
    expect(settings.feedIntensity).toBe("none");
    expect(settings.hideAlgorithmicFeeds).toBe(true);
  });

  it("suggests profile from a normal (non-overnight) schedule rule and respects the exclusive end hour", () => {
    let settings = applyProfile("adhd");
    settings = { ...settings, adaptive: { ...settings.adaptive, enabled: true } };
    settings = upsertScheduleRule(settings, { startHour: 9, endHour: 17, profile: "autism" });

    expect(getAdaptiveProfileSuggestion(settings, "x.com", new Date("2026-02-11T12:00:00"))).toBe("autism");
    expect(getAdaptiveProfileSuggestion(settings, "x.com", new Date("2026-02-11T09:00:00"))).toBe("autism");
    // end hour is exclusive
    expect(getAdaptiveProfileSuggestion(settings, "x.com", new Date("2026-02-11T17:00:00"))).toBeNull();
    expect(getAdaptiveProfileSuggestion(settings, "x.com", new Date("2026-02-11T08:00:00"))).toBeNull();
  });
});

describe("applyProfile preserves user data", () => {
  it("keeps per-site overrides, adaptive rules, and active scenario when switching profile", () => {
    let settings = applyProfile("adhd");
    settings = updateSiteFeedCleanerOverride(settings, "reddit.com", false);
    settings = upsertDomainRule(settings, "youtube.com", "autism");
    settings = upsertScheduleRule(settings, { startHour: 20, endHour: 23, profile: "anxiety" });

    const switched = applyProfile("autism", settings);

    expect(switched.profile).toBe("autism");
    expect(switched.darkMode).toBe(true); // preset applied
    expect(switched.siteFeedCleanerOverrides["reddit.com"]).toBe(false); // preserved
    expect(switched.adaptive.domainRules["youtube.com"]).toBe("autism"); // preserved
    expect(switched.adaptive.scheduleRules).toHaveLength(1); // preserved
  });

  it("uses empty preset defaults when no current settings are provided", () => {
    const result = applyProfile("autism");
    expect(result.siteFeedCleanerOverrides).toEqual({});
    expect(result.adaptive.scheduleRules).toEqual([]);
  });

  it("cancels an active scenario on a manual profile switch", () => {
    const active = applyScenario(applyProfile("adhd"), "focus_session", 30);
    expect(active.activeScenario).not.toBeNull();

    const switched = applyProfile("autism", active);

    // A later expiry must not resurrect the pre-scenario profile.
    expect(switched.activeScenario).toBeNull();
    expect(switched.profile).toBe("autism");
  });
});

describe("per-site override never cleans less than the global setting", () => {
  it("does not downgrade a global 'none' to 'limited' when enabled per-site", () => {
    const base = { ...applyProfile("adhd"), feedIntensity: "none" as const };
    const settings = updateSiteFeedCleanerOverride(base, "reddit.com", true);
    expect(getFeedIntensityForHost(settings, "reddit.com")).toBe("none");
  });

  it("upgrades a global 'full' to 'limited' when enabled per-site", () => {
    const base = { ...applyProfile("adhd"), feedIntensity: "full" as const };
    const settings = updateSiteFeedCleanerOverride(base, "reddit.com", true);
    expect(getFeedIntensityForHost(settings, "reddit.com")).toBe("limited");
  });
});

describe("clearExpiredScenario", () => {
  it("restores the pre-scenario settings once the scenario expires", () => {
    const active = applyScenario(applyProfile("anxiety"), "focus_session", 30);
    const expiresAt = active.activeScenario?.expiresAt as number;

    const restored = clearExpiredScenario(active, expiresAt + 1);

    expect(restored.activeScenario).toBeNull();
    expect(restored.profile).toBe("anxiety");
    expect(restored.feedIntensity).toBe("full"); // anxiety's original intensity
  });

  it("clears exactly at the expiry boundary (now === expiresAt)", () => {
    const active = applyScenario(applyProfile("adhd"), "focus_session", 30);
    const expiresAt = active.activeScenario?.expiresAt as number;

    expect(clearExpiredScenario(active, expiresAt).activeScenario).toBeNull();
  });

  it("leaves an unexpired scenario untouched", () => {
    const active = applyScenario(applyProfile("adhd"), "focus_session", 30);
    const expiresAt = active.activeScenario?.expiresAt as number;

    const result = clearExpiredScenario(active, expiresAt - 1);
    expect(result.activeScenario?.type).toBe("focus_session");
    expect(result.feedIntensity).toBe("none");
  });

  it("clears the marker for a legacy scenario without a restore snapshot", () => {
    const settings = {
      ...applyProfile("adhd"),
      activeScenario: { type: "focus_session" as const, expiresAt: 1000, previous: null }
    };

    const result = clearExpiredScenario(settings, 2000);
    expect(result.activeScenario).toBeNull();
    expect(result.profile).toBe("adhd");
  });
});
