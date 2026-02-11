import { getSettings, saveSettings } from "./lib/settings";

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await saveSettings(settings);
});
