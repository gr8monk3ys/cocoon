import { beforeEach, describe, expect, it, vi } from "vitest";
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

function makeChrome(initial: CocoonSettings) {
  const store: { settings: CocoonSettings } = { settings: initial };
  let alarmListener: ((alarm: { name: string }) => void) | undefined;

  const chromeMock = {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store.settings })),
        set: vi.fn(async (obj: { settings: CocoonSettings }) => {
          store.settings = obj.settings;
        })
      },
      onChanged: { addListener: vi.fn() }
    },
    alarms: {
      clear: vi.fn(async () => undefined),
      create: vi.fn(async () => undefined),
      onAlarm: {
        addListener: vi.fn((cb: (alarm: { name: string }) => void) => {
          alarmListener = cb;
        })
      }
    },
    runtime: {
      onInstalled: { addListener: vi.fn() },
      onStartup: { addListener: vi.fn() }
    },
    tabs: {
      query: vi.fn(async () => [{ id: 1 }]),
      sendMessage: vi.fn(async () => undefined)
    }
  } as unknown as typeof chrome;

  return { chromeMock, store, fireAlarm: (name: string) => alarmListener?.({ name }) };
}

describe("background scenario expiry", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("restores baseline settings and broadcasts when the scenario alarm fires", async () => {
    const env = makeChrome(expiredScenarioSettings());
    vi.stubGlobal("chrome", env.chromeMock);

    await import("./background");

    // Reset to a fresh expired scenario, then fire the alarm explicitly.
    env.store.settings = expiredScenarioSettings();
    env.fireAlarm("cocoon-scenario-expiry");

    await vi.waitFor(() => expect(env.store.settings.activeScenario).toBeNull());
    expect(env.store.settings.profile).toBe("adhd");
    expect(env.store.settings.feedIntensity).toBe("limited");
    expect(env.chromeMock.tabs.sendMessage).toHaveBeenCalled();
  });

  it("ignores unrelated alarms", async () => {
    const env = makeChrome(expiredScenarioSettings());
    vi.stubGlobal("chrome", env.chromeMock);
    await import("./background");

    env.store.settings = expiredScenarioSettings();
    env.chromeMock.storage.local.set = vi.fn(async () => undefined);
    env.fireAlarm("some-other-alarm");

    // Give any stray async work a chance to run, then assert nothing changed.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(env.store.settings.activeScenario).not.toBeNull();
  });
});
