import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { supportsFeedCleaner } from "../lib/pagePlan";
import {
  applyProfile,
  applyScenario,
  commitSettings,
  getAdaptiveProfileSuggestion,
  isFeedCleanerEnabledForHost,
  getSettings,
  manualEdit,
  normalizeHostname,
  removeSiteFeedCleanerOverride,
  updateSiteFeedCleanerOverride
} from "../lib/settings";
import { getActiveTabHostname, openGroundingInActiveTab } from "../lib/messages";
import type { CocoonProfile, CocoonSettings, FeedIntensity, ScenarioType } from "../lib/types";
import { SCENARIOS, SCENARIO_DURATIONS } from "../ui/scenarios";
import "../ui/theme.css";

function PopupApp(): React.JSX.Element {
  const [settings, setSettings] = useState<CocoonSettings | null>(null);
  const [activeHostname, setActiveHostname] = useState<string | null>(null);
  const [scenarioMinutes, setScenarioMinutes] = useState<number>(30);

  useEffect(() => {
    void getSettings().then(setSettings);
    void getActiveTabHostname().then((hostname) => setActiveHostname(hostname && normalizeHostname(hostname)));
  }, []);

  // When adaptive is enabled and the user opted out of suggest-only mode,
  // auto-apply the suggested profile once per visited host. Guarded by a ref so
  // it applies on popup open but does not fight the user's later manual toggles.
  const autoAppliedHostRef = useRef<string | null>(null);
  useEffect(() => {
    if (!settings || !activeHostname) {
      return;
    }
    if (autoAppliedHostRef.current === activeHostname) {
      return;
    }
    if (!settings.adaptive.enabled || settings.adaptive.suggestOnly) {
      return;
    }
    autoAppliedHostRef.current = activeHostname;
    const suggested = getAdaptiveProfileSuggestion(settings, activeHostname);
    if (!suggested || suggested === settings.profile) {
      return;
    }
    const next = applyProfile(suggested, settings);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional ref-guarded one-shot per hostname; persists + broadcasts, cannot cascade
    setSettings(next);
    void commitSettings(next);
  }, [settings, activeHostname]);

  if (!settings) {
    return <main className="cocoon-app popup">Loading…</main>;
  }

  const update = async (next: CocoonSettings): Promise<void> => {
    setSettings(await commitSettings(next));
  };

  const setProfile = async (profile: CocoonProfile): Promise<void> => {
    await update(profile === "custom" ? { ...settings, profile } : applyProfile(profile, settings));
  };

  const toggle =
    (field: keyof Omit<CocoonSettings, "profile" | "siteFeedCleanerOverrides" | "adaptive" | "activeScenario">) =>
    async (): Promise<void> => {
      await update(manualEdit(settings, { [field]: !settings[field] }));
    };

  const updateIntensity = async (feedIntensity: FeedIntensity): Promise<void> => {
    await update(manualEdit(settings, { feedIntensity }));
  };

  const applyScenarioNow = async (scenario: ScenarioType): Promise<void> => {
    await update(applyScenario(settings, scenario, scenarioMinutes));
  };

  const toggleCurrentSite = async (): Promise<void> => {
    if (!activeHostname) {
      return;
    }

    const enabled = isFeedCleanerEnabledForHost(settings, activeHostname);
    await update(manualEdit(updateSiteFeedCleanerOverride(settings, activeHostname, !enabled)));
  };

  const resetCurrentSite = async (): Promise<void> => {
    if (!activeHostname) {
      return;
    }

    await update(manualEdit(removeSiteFeedCleanerOverride(settings, activeHostname)));
  };

  const activeSiteSupported = Boolean(activeHostname && supportsFeedCleaner(activeHostname));
  const cleanerOnHere = activeHostname ? isFeedCleanerEnabledForHost(settings, activeHostname) : false;
  const suggestion = activeHostname ? getAdaptiveProfileSuggestion(settings, activeHostname) : null;

  return (
    <main className="cocoon-app popup">
      <header className="cocoon-header">
        <img src="/icons/icon-48.png" alt="" width={24} height={24} />
        <h1>Cocoon</h1>
      </header>
      <div className="brand-rule" />

      <label className="field">
        Profile
        <select value={settings.profile} onChange={(event) => void setProfile(event.target.value as CocoonProfile)}>
          <option value="adhd">ADHD</option>
          <option value="autism">Autism</option>
          <option value="anxiety">Anxiety</option>
          <option value="custom">Custom</option>
        </select>
      </label>

      {suggestion && suggestion !== settings.profile && (
        <div className="suggestion">
          Suggested profile for this context: <strong>{suggestion}</strong>
          <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 6 }} onClick={() => void setProfile(suggestion)}>
            Apply suggestion
          </button>
        </div>
      )}

      <label className="field">
        Feed intensity
        <select value={settings.feedIntensity} onChange={(event) => void updateIntensity(event.target.value as FeedIntensity)}>
          <option value="full">Full</option>
          <option value="limited">Limited</option>
          <option value="none">None</option>
        </select>
      </label>

      <label className="checkbox-row">
        <input type="checkbox" checked={settings.darkMode} onChange={() => void toggle("darkMode")()} /> Dark mode
      </label>
      <label className="checkbox-row">
        <input type="checkbox" checked={settings.reduceMotion} onChange={() => void toggle("reduceMotion")()} /> Reduce motion
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={settings.enableGroundingTool}
          onChange={() => void toggle("enableGroundingTool")()}
        />
        Enable grounding overlay
      </label>

      <section className="card">
        <h2>Scenario quick-switches</h2>
        <label className="field">
          Scenario length
          <select value={scenarioMinutes} onChange={(event) => setScenarioMinutes(Number(event.target.value))}>
            {SCENARIO_DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </select>
        </label>
        <div className="button-grid">
          {SCENARIOS.map((scenario) => (
            <button key={scenario.value} type="button" className="btn" onClick={() => void applyScenarioNow(scenario.value)}>
              {scenario.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Current site override</h2>
        <p className="site-line">{activeHostname ? `Site: ${activeHostname}` : "No active website detected."}</p>
        {activeSiteSupported ? (
          <>
            <label className="checkbox-row">
              <input type="checkbox" checked={cleanerOnHere} onChange={() => void toggleCurrentSite()} />
              Enable feed cleaner on this site
            </label>
            <button type="button" className="btn btn-block" onClick={() => void resetCurrentSite()}>
              Reset to global default
            </button>
          </>
        ) : (
          <p className="site-line" style={{ marginBottom: 0 }}>
            Per-site feed overrides are only available on supported social domains.
          </p>
        )}
      </section>

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={() => void openGroundingInActiveTab()}
        disabled={!settings.enableGroundingTool}
      >
        Open grounding tool
      </button>
      <button type="button" className="btn btn-block" onClick={() => void chrome.runtime.openOptionsPage()}>
        Open full settings
      </button>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<PopupApp />);
