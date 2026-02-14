import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { supportsFeedCleaner } from "../lib/feedRules";
import {
  applyProfile,
  applyScenario,
  getAdaptiveProfileSuggestion,
  getFeedIntensityForHost,
  getSettings,
  normalizeHostname,
  removeSiteFeedCleanerOverride,
  saveSettings,
  updateSiteFeedCleanerOverride
} from "../lib/settings";
import { openGroundingInActiveTab } from "../lib/messages";
import type { CocoonProfile, CocoonSettings, FeedIntensity, ScenarioType } from "../lib/types";

async function getActiveHostname(): Promise<string | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    return null;
  }

  try {
    return normalizeHostname(new URL(tab.url).hostname);
  } catch {
    return null;
  }
}

const SCENARIOS: Array<{ label: string; value: ScenarioType }> = [
  { label: "Focus", value: "focus_session" },
  { label: "Low stimulation", value: "low_stimulation" },
  { label: "Calm reset", value: "calm_reset" },
  { label: "Social guardrails", value: "social_guardrails" }
];

function PopupApp(): React.JSX.Element {
  const [settings, setSettings] = useState<CocoonSettings | null>(null);
  const [activeHostname, setActiveHostname] = useState<string | null>(null);

  useEffect(() => {
    void getSettings().then(setSettings);
    void getActiveHostname().then(setActiveHostname);
  }, []);

  if (!settings) {
    return <main style={{ width: 340, padding: 16 }}>Loading…</main>;
  }

  const update = async (next: CocoonSettings): Promise<void> => {
    setSettings(next);
    await saveSettings(next);
  };

  const setProfile = async (profile: CocoonProfile): Promise<void> => {
    await update(profile === "custom" ? { ...settings, profile } : applyProfile(profile));
  };

  const toggle =
    (field: keyof Omit<CocoonSettings, "profile" | "siteFeedCleanerOverrides" | "adaptive" | "activeScenario">) =>
    async (): Promise<void> => {
      await update({ ...settings, profile: "custom", [field]: !settings[field] });
    };

  const updateIntensity = async (intensity: FeedIntensity): Promise<void> => {
    await update({ ...settings, profile: "custom", feedIntensity: intensity, hideAlgorithmicFeeds: intensity !== "full" });
  };

  const applyScenarioNow = async (scenario: ScenarioType): Promise<void> => {
    await update(applyScenario(settings, scenario, 30));
  };

  const toggleCurrentSite = async (): Promise<void> => {
    if (!activeHostname) {
      return;
    }

    const intensity = getFeedIntensityForHost(settings, activeHostname);
    const next = updateSiteFeedCleanerOverride(settings, activeHostname, intensity === "full");
    await update({ ...next, profile: "custom" });
  };

  const resetCurrentSite = async (): Promise<void> => {
    if (!activeHostname) {
      return;
    }

    const next = removeSiteFeedCleanerOverride(settings, activeHostname);
    await update({ ...next, profile: "custom" });
  };

  const activeSiteSupported = Boolean(activeHostname && supportsFeedCleaner(activeHostname));
  const currentSiteIntensity = activeHostname ? getFeedIntensityForHost(settings, activeHostname) : "full";
  const suggestion = activeHostname ? getAdaptiveProfileSuggestion(settings, activeHostname) : null;

  return (
    <main style={{ width: 340, padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20, margin: "0 0 12px" }}>Cocoon</h1>

      <label style={{ display: "block", marginBottom: 10 }}>
        Profile
        <select
          value={settings.profile}
          onChange={(event) => void setProfile(event.target.value as CocoonProfile)}
          style={{ display: "block", width: "100%", marginTop: 4 }}
        >
          <option value="adhd">ADHD</option>
          <option value="autism">Autism</option>
          <option value="anxiety">Anxiety</option>
          <option value="custom">Custom</option>
        </select>
      </label>

      {suggestion && suggestion !== settings.profile && (
        <div style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8, marginBottom: 10, fontSize: 13 }}>
          Suggested profile for this context: <strong>{suggestion}</strong>
          <button type="button" onClick={() => void setProfile(suggestion)} style={{ display: "block", marginTop: 6 }}>
            Apply suggestion
          </button>
        </div>
      )}

      <label style={{ display: "block", marginBottom: 8 }}>
        Feed intensity
        <select
          value={settings.feedIntensity}
          onChange={(event) => void updateIntensity(event.target.value as FeedIntensity)}
          style={{ display: "block", width: "100%", marginTop: 4 }}
        >
          <option value="full">Full</option>
          <option value="limited">Limited</option>
          <option value="none">None</option>
        </select>
      </label>

      <label style={{ display: "block", marginBottom: 8 }}>
        <input type="checkbox" checked={settings.darkMode} onChange={() => void toggle("darkMode")()} /> Dark mode
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        <input type="checkbox" checked={settings.reduceMotion} onChange={() => void toggle("reduceMotion")()} /> Reduce motion
      </label>
      <label style={{ display: "block", marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={settings.enableGroundingTool}
          onChange={() => void toggle("enableGroundingTool")()}
        />
        Enable grounding overlay
      </label>

      <section style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd", marginBottom: 12 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 14 }}>Scenario quick-switches</h2>
        <div style={{ display: "grid", gap: 6 }}>
          {SCENARIOS.map((scenario) => (
            <button key={scenario.value} type="button" onClick={() => void applyScenarioNow(scenario.value)}>
              {scenario.label}
            </button>
          ))}
        </div>
      </section>

      <section style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd", marginBottom: 12 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 14 }}>Current site override</h2>
        <p style={{ margin: "0 0 8px", fontSize: 12 }}>
          {activeHostname ? `Site: ${activeHostname}` : "No active website detected."}
        </p>
        {activeSiteSupported ? (
          <>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
              <input type="checkbox" checked={currentSiteIntensity !== "full"} onChange={() => void toggleCurrentSite()} />
              Enable feed cleaner on this site
            </label>
            <button type="button" onClick={() => void resetCurrentSite()} style={{ width: "100%", padding: "6px 8px" }}>
              Reset to global default
            </button>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 12 }}>Per-site feed overrides are only available on supported social domains.</p>
        )}
      </section>

      <button
        type="button"
        onClick={() => void openGroundingInActiveTab()}
        disabled={!settings.enableGroundingTool}
        style={{ width: "100%", padding: "8px 10px", marginBottom: 8 }}
      >
        Open grounding tool
      </button>
      <button type="button" onClick={() => void chrome.runtime.openOptionsPage()} style={{ width: "100%", padding: "8px 10px" }}>
        Open full settings
      </button>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<PopupApp />);
