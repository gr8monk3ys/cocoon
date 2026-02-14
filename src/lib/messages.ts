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
    // Most commonly: no content script is listening on this tab (unsupported domain / chrome:// / etc).
  }
}
