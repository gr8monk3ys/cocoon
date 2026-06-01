import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSettings, saveSettings } from "./settings";
import { DEFAULT_SETTINGS } from "./types";

function createStorageMock(stored: Record<string, unknown>): typeof chrome {
  return {
    storage: {
      local: {
        get: vi.fn(async () => stored),
        set: vi.fn(async () => undefined)
      }
    }
  } as unknown as typeof chrome;
}

describe("storage settings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns defaults when storage is empty", async () => {
    vi.stubGlobal("chrome", createStorageMock({}));
    const result = await getSettings();
    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it("saves settings into chrome storage", async () => {
    vi.stubGlobal("chrome", createStorageMock({}));
    const settings = { ...DEFAULT_SETTINGS, darkMode: true };

    await saveSettings(settings);

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings });
  });

  it("migrates legacy hideAlgorithmicFeeds=true to limited feed intensity", async () => {
    vi.stubGlobal("chrome", createStorageMock({ settings: { hideAlgorithmicFeeds: true } }));
    const result = await getSettings();
    expect(result.feedIntensity).toBe("limited");
    expect(result.hideAlgorithmicFeeds).toBe(true);
  });

  it("migrates legacy hideAlgorithmicFeeds=false to full feed intensity", async () => {
    vi.stubGlobal("chrome", createStorageMock({ settings: { hideAlgorithmicFeeds: false } }));
    const result = await getSettings();
    expect(result.feedIntensity).toBe("full");
    expect(result.hideAlgorithmicFeeds).toBe(false);
  });

  it("restores pre-scenario settings when a stored scenario has already expired", async () => {
    vi.stubGlobal(
      "chrome",
      createStorageMock({
        settings: {
          ...DEFAULT_SETTINGS,
          profile: "custom",
          feedIntensity: "none",
          activeScenario: {
            type: "focus_session",
            expiresAt: 1,
            previous: {
              profile: "adhd",
              darkMode: false,
              reduceMotion: true,
              feedIntensity: "limited",
              hideAlgorithmicFeeds: true,
              enableGroundingTool: true
            }
          }
        }
      })
    );

    const result = await getSettings();
    expect(result.activeScenario).toBeNull();
    expect(result.profile).toBe("adhd");
    expect(result.feedIntensity).toBe("limited");
  });
});
