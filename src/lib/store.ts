import type { CocoonSettings } from "./types";

/**
 * Every read and write of extension storage goes through here. Two key-spaces
 * live in `chrome.storage.local` and they are not interchangeable: settings are
 * the user's choices, banner state is per-host UI history. Both are keyed on
 * hostnames that have already been normalized by the caller.
 */
const SETTINGS_KEY = "settings";
const BANNER_STATE_KEY = "bannerState";

export interface HostBannerState {
  filteredShownAt?: number;
  rotDismissedAt?: number;
}

async function readObject<T>(key: string): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key);
  const raw = result[key];
  return raw && typeof raw === "object" ? (raw as T) : undefined;
}

export const settingsStore = {
  /** Raw stored settings, un-migrated. `settings.ts` owns the migration. */
  async read(): Promise<Partial<CocoonSettings> | undefined> {
    return readObject<Partial<CocoonSettings>>(SETTINGS_KEY);
  },
  async write(settings: CocoonSettings): Promise<void> {
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  }
};

/**
 * Per-host banner history, kept apart from settings so the confirmation banner
 * shows once per host ever and a dismissed rot warning stays dismissed across
 * page loads. For a calm-focused extension, a banner that reappears on every
 * navigation is itself a stressor.
 *
 * Failures are swallowed on both sides: banner history is a convenience, and a
 * storage error must never take down the content script.
 */
export const bannerStore = {
  async read(): Promise<Record<string, HostBannerState>> {
    try {
      return (await readObject<Record<string, HostBannerState>>(BANNER_STATE_KEY)) ?? {};
    } catch {
      return {};
    }
  },
  async mark(hostname: string, patch: HostBannerState): Promise<void> {
    const state = await bannerStore.read();
    try {
      await chrome.storage.local.set({
        [BANNER_STATE_KEY]: { ...state, [hostname]: { ...state[hostname], ...patch } }
      });
    } catch {
      // Storage unavailable: banner history just won't persist this time.
    }
  }
};
