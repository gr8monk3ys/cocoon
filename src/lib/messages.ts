import type { CocoonSettings } from "./types";

export async function broadcastSettings(settings: CocoonSettings): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const sends = tabs
    .filter((tab): tab is chrome.tabs.Tab & { id: number } => typeof tab.id === "number")
    .map((tab) =>
      chrome.tabs.sendMessage(tab.id, {
        type: "COCOON_APPLY_SETTINGS",
        payload: settings
      })
    );

  await Promise.allSettled(sends);
}

export async function openGroundingInActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (typeof tab?.id !== "number") {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "COCOON_OPEN_GROUNDING" });
  } catch {
    // Active tab has no content script (chrome:// page, new tab, unsupported
    // domain). Nothing to open there; ignore rather than rejecting.
  }
}

/**
 * Hostname of the tab the user is looking at, or null when there isn't one
 * (a chrome:// page, a tab with no URL). Raw, as the tab reports it; callers
 * normalize. This module owns every `chrome.tabs` call, so the popup does not
 * repeat the active-tab query.
 */
export async function getActiveTabHostname(): Promise<string | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    return null;
  }

  try {
    return new URL(tab.url).hostname;
  } catch {
    return null;
  }
}
