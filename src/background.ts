import { getSettings, restoreExpiredScenario, saveSettings } from "./lib/settings";
import { broadcastSettings } from "./lib/messages";
import type { CocoonSettings } from "./lib/types";

const SCENARIO_ALARM = "cocoon-scenario-expiry";

function scheduleScenarioAlarm(settings: CocoonSettings | undefined): void {
  const expiresAt = settings?.activeScenario?.expiresAt ?? null;

  void chrome.alarms?.clear(SCENARIO_ALARM);
  if (typeof expiresAt === "number" && expiresAt > Date.now()) {
    void chrome.alarms?.create(SCENARIO_ALARM, { when: expiresAt });
  }
}

async function syncScenarioExpiry(): Promise<void> {
  const settings = await getSettings();
  scheduleScenarioAlarm(settings);

  const restored = restoreExpiredScenario(settings, Date.now());
  if (restored === settings) {
    return;
  }

  await saveSettings(restored);
  await broadcastSettings(restored);
  scheduleScenarioAlarm(restored);
}

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await saveSettings(settings);
});

chrome.runtime.onStartup?.addListener(() => {
  void syncScenarioExpiry();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  const change = changes.settings;
  if (!change) {
    return;
  }

  scheduleScenarioAlarm(change.newValue as CocoonSettings | undefined);
});

chrome.alarms?.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== SCENARIO_ALARM) {
    return;
  }

  await syncScenarioExpiry();
});

// Best-effort: ensure alarms are scheduled even if the SW starts due to a non-startup event.
void syncScenarioExpiry();
