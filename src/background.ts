import { broadcastSettings } from "./lib/messages";
import { clearExpiredScenario, getSettings, readStoredSettings, saveSettings } from "./lib/settings";
import type { CocoonSettings } from "./lib/types";

const SCENARIO_ALARM = "cocoon-scenario-expiry";

function scheduleScenarioAlarm(settings: CocoonSettings | undefined): void {
  const expiresAt = settings?.activeScenario?.expiresAt ?? null;
  void chrome.alarms?.clear(SCENARIO_ALARM);
  if (typeof expiresAt === "number" && expiresAt > Date.now()) {
    void chrome.alarms?.create(SCENARIO_ALARM, { when: expiresAt });
  }
}

// Proactively restore the pre-scenario settings when a timed scenario expires —
// even if no page reads settings in the meantime — and refresh open tabs.
async function syncScenarioExpiry(): Promise<void> {
  const current = await readStoredSettings();
  const restored = clearExpiredScenario(current);
  scheduleScenarioAlarm(restored);

  if (restored !== current) {
    await saveSettings(restored);
    await broadcastSettings(restored);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await saveSettings(settings);
  scheduleScenarioAlarm(settings);
});

chrome.runtime.onStartup?.addListener(() => {
  void syncScenarioExpiry();
});

// Re-arm the alarm whenever settings change (e.g. the popup starts a scenario).
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

chrome.alarms?.onAlarm.addListener((alarm) => {
  if (alarm.name === SCENARIO_ALARM) {
    void syncScenarioExpiry();
  }
});

// Best-effort: ensure the alarm is armed even if the worker starts for another reason.
void syncScenarioExpiry();
