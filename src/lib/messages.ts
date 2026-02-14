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
