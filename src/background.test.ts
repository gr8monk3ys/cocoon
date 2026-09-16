import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock } from "./test/chromeMock";
import { DEFAULT_SETTINGS, type CocoonSettings } from "./lib/types";

function expiredScenarioSettings(): CocoonSettings {
  return {
    ...DEFAULT_SETTINGS,
    profile: "custom",
    feedIntensity: "none",
    hideAlgorithmicFeeds: true,
    activeScenario: {
      type: "focus_session",
      expiresAt: 1, // long past
      previous: {
        profile: "adhd",
        darkMode: false,
        reduceMotion: true,
        feedIntensity: "limited",
        hideAlgorithmicFeeds: true,
        enableGroundingTool: true
      }
    }
  };
}

function makeEnv() {
  return createChromeMock({ store: { settings: expiredScenarioSettings() } });
}

function storedSettings(store: Record<string, unknown>): CocoonSettings {
  return store.settings as CocoonSettings;
}

describe("background scenario expiry", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("restores baseline settings and broadcasts when the scenario alarm fires", async () => {
    const env = makeEnv();
    vi.stubGlobal("chrome", env.chrome);

    await import("./background");

    // Reset to a fresh expired scenario, then fire the alarm explicitly.
    env.store.settings = expiredScenarioSettings();
    env.fireAlarm("cocoon-scenario-expiry");

    await vi.waitFor(() => expect(storedSettings(env.store).activeScenario).toBeNull());
    expect(storedSettings(env.store).profile).toBe("adhd");
    expect(storedSettings(env.store).feedIntensity).toBe("limited");
    expect(env.chrome.tabs.sendMessage).toHaveBeenCalled();
  });

  it("ignores unrelated alarms", async () => {
    const env = makeEnv();
    vi.stubGlobal("chrome", env.chrome);
    await import("./background");

    env.store.settings = expiredScenarioSettings();
    env.fireAlarm("some-other-alarm");

    // Give any stray async work a chance to run, then assert nothing changed.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(storedSettings(env.store).activeScenario).not.toBeNull();
  });
});
