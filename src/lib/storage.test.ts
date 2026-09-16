import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock } from "../test/chromeMock";
import { getSettings, saveSettings } from "./settings";
import { DEFAULT_SETTINGS } from "./types";

function withStored(settings?: Record<string, unknown>): void {
  vi.stubGlobal("chrome", createChromeMock({ store: settings ? { settings } : {} }).chrome);
}

describe("storage settings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns defaults when storage is empty", async () => {
    withStored();
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("saves settings into chrome storage", async () => {
    withStored();
    const settings = { ...DEFAULT_SETTINGS, darkMode: true };

    await saveSettings(settings);

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings });
  });

  it("migrates legacy hideAlgorithmicFeeds=true to limited feed intensity", async () => {
    withStored({ hideAlgorithmicFeeds: true });
    const result = await getSettings();
    expect(result.feedIntensity).toBe("limited");
    expect(result.hideAlgorithmicFeeds).toBe(true);
  });

  it("migrates legacy hideAlgorithmicFeeds=false to full feed intensity", async () => {
    withStored({ hideAlgorithmicFeeds: false });
    const result = await getSettings();
    expect(result.feedIntensity).toBe("full");
    expect(result.hideAlgorithmicFeeds).toBe(false);
  });

  it("restores pre-scenario settings when a stored scenario has already expired", async () => {
    withStored({
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
    });

    const result = await getSettings();
    expect(result.activeScenario).toBeNull();
    expect(result.profile).toBe("adhd");
    expect(result.feedIntensity).toBe("limited");
  });
});

describe("commitSettings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("derives the legacy mirror, persists, and tells open tabs — in that order", async () => {
    const env = createChromeMock({ store: {}, tabs: [{ id: 1 }, { id: 2 }] });
    vi.stubGlobal("chrome", env.chrome);
    const { commitSettings } = await import("./settings");

    // hideAlgorithmicFeeds deliberately disagrees with feedIntensity: the one
    // write path must derive it rather than trust the caller.
    const committed = await commitSettings({ ...DEFAULT_SETTINGS, feedIntensity: "none", hideAlgorithmicFeeds: false });

    expect(committed.hideAlgorithmicFeeds).toBe(true);
    expect((env.store.settings as typeof DEFAULT_SETTINGS).hideAlgorithmicFeeds).toBe(true);
    expect(env.chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
  });

  it("clears the mirror when the feed is left alone", async () => {
    const env = createChromeMock({ store: {}, tabs: [{ id: 1 }] });
    vi.stubGlobal("chrome", env.chrome);
    const { commitSettings } = await import("./settings");

    const committed = await commitSettings({ ...DEFAULT_SETTINGS, feedIntensity: "full", hideAlgorithmicFeeds: true });
    expect(committed.hideAlgorithmicFeeds).toBe(false);
  });
});

describe("manualEdit", () => {
  it("moves the profile to custom and re-derives the mirror", async () => {
    const { manualEdit } = await import("./settings");
    const edited = manualEdit({ ...DEFAULT_SETTINGS, profile: "adhd" }, { feedIntensity: "full" });

    expect(edited.profile).toBe("custom");
    expect(edited.hideAlgorithmicFeeds).toBe(false);
  });

  it("marks the profile custom even when the patch is empty", async () => {
    const { manualEdit } = await import("./settings");
    // Per-site overrides and adaptive rules are applied by their own helpers and
    // then handed here, so the empty-patch case is the common one.
    expect(manualEdit({ ...DEFAULT_SETTINGS, profile: "anxiety" }).profile).toBe("custom");
  });
});
