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
});
