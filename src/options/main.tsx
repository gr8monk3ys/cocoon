import { createRoot } from "react-dom/client";
import React, { useEffect, useState } from "react";
import { SOCIAL_HOSTS, supportsFeedCleaner } from "../lib/pagePlan";
import {
  applyProfile,
  applyScenario,
  commitSettings,
  getSettings,
  manualEdit,
  normalizeHostname,
  removeDomainRule,
  removeScheduleRule,
  removeSiteFeedCleanerOverride,
  upsertDomainRule,
  upsertScheduleRule,
  updateSiteFeedCleanerOverride
} from "../lib/settings";
import type {
  AdaptiveScheduleRule,
  CocoonProfile,
  CocoonSettings,
  FeedIntensity,
  ScenarioType
} from "../lib/types";
import { SCENARIOS, SCENARIO_DURATIONS } from "../ui/scenarios";
import "../ui/theme.css";

/** Coerce a number-input value to a valid hour (0–23); empty/NaN becomes 0. */
function clampHour(value: string): number {
  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.min(23, Math.max(0, parsed));
}

const SUPPORTED_DOMAINS_HINT = SOCIAL_HOSTS.join(", ");

function OptionsApp(): React.JSX.Element {
  const [settings, setSettings] = useState<CocoonSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [hostnameInput, setHostnameInput] = useState("");
  const [overrideEnabled, setOverrideEnabled] = useState(true);
  const [overrideError, setOverrideError] = useState("");
  const [domainRuleHost, setDomainRuleHost] = useState("");
  const [domainRuleProfile, setDomainRuleProfile] = useState<CocoonProfile>("adhd");
  const [domainRuleError, setDomainRuleError] = useState("");
  const [scheduleRule, setScheduleRule] = useState<AdaptiveScheduleRule>({ startHour: 18, endHour: 23, profile: "anxiety" });
  const [scheduleError, setScheduleError] = useState("");
  const [scenarioMinutes, setScenarioMinutes] = useState<number>(30);

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (!saved) {
      return;
    }

    const timer = window.setTimeout(() => setSaved(false), 1500);
    return () => window.clearTimeout(timer);
  }, [saved]);

  if (!settings) {
    return <main className="cocoon-app options">Loading settings…</main>;
  }

  const update = async (next: CocoonSettings): Promise<void> => {
    setSettings(await commitSettings(next));
    setSaved(true);
  };

  const onProfileChange = async (profile: CocoonProfile): Promise<void> => {
    await update(profile === "custom" ? { ...settings, profile } : applyProfile(profile, settings));
  };

  const onFeedIntensityChange = async (feedIntensity: FeedIntensity): Promise<void> => {
    await update(manualEdit(settings, { feedIntensity }));
  };

  const validateSupportedHost = (raw: string): string | null => {
    const normalized = normalizeHostname(raw);
    if (!normalized) {
      return null;
    }
    return supportsFeedCleaner(normalized) ? normalized : null;
  };

  const addOverride = async (): Promise<void> => {
    const normalized = validateSupportedHost(hostnameInput);
    if (!normalized) {
      setOverrideError(
        hostnameInput.trim()
          ? `“${hostnameInput.trim()}” isn't a supported domain. Supported: ${SUPPORTED_DOMAINS_HINT}.`
          : "Enter a hostname first, e.g. reddit.com."
      );
      return;
    }

    setOverrideError("");
    await update(manualEdit(updateSiteFeedCleanerOverride(settings, normalized, overrideEnabled)));
    setHostnameInput("");
    setOverrideEnabled(true);
  };

  const removeOverride = async (hostname: string): Promise<void> => {
    await update(manualEdit(removeSiteFeedCleanerOverride(settings, hostname)));
  };

  const applyScenarioNow = async (scenario: ScenarioType): Promise<void> => {
    await update(applyScenario(settings, scenario, scenarioMinutes));
  };

  const addDomainRule = async (): Promise<void> => {
    const normalized = validateSupportedHost(domainRuleHost);
    if (!normalized) {
      setDomainRuleError(
        domainRuleHost.trim()
          ? `“${domainRuleHost.trim()}” isn't a supported domain. Supported: ${SUPPORTED_DOMAINS_HINT}.`
          : "Enter a hostname first, e.g. reddit.com."
      );
      return;
    }

    setDomainRuleError("");
    await update(manualEdit(upsertDomainRule(settings, normalized, domainRuleProfile)));
    setDomainRuleHost("");
  };

  const addScheduleRule = async (): Promise<void> => {
    if (scheduleRule.startHour === scheduleRule.endHour) {
      setScheduleError("Start and end hour are the same, so the rule would never match. Pick two different hours (rules may wrap past midnight).");
      return;
    }

    setScheduleError("");
    await update(manualEdit(upsertScheduleRule(settings, scheduleRule)));
  };

  const sortedOverrides = Object.entries(settings.siteFeedCleanerOverrides).sort(([a], [b]) => a.localeCompare(b));
  const sortedDomainRules = Object.entries(settings.adaptive.domainRules).sort(([a], [b]) => a.localeCompare(b));

  return (
    <main className="cocoon-app options">
      <header className="cocoon-header">
        <img src="/icons/icon-48.png" alt="" width={32} height={32} />
        <h1>Cocoon Settings</h1>
      </header>
      <div className="brand-rule" />
      <p className="lede">Settings are stored locally. Adaptive suggestions are user-controlled and transparent.</p>

      <section className="card">
        <h2>Profile presets</h2>
        <label className="field">
          Profile
          <select value={settings.profile} onChange={(event) => void onProfileChange(event.target.value as CocoonProfile)}>
            <option value="adhd">ADHD focus</option>
            <option value="autism">Autism sensory</option>
            <option value="anxiety">Anxiety calm</option>
            <option value="custom">Custom</option>
          </select>
        </label>
      </section>

      <section className="card">
        <h2>Feature toggles</h2>
        <label className="field">
          Feed intensity
          <select
            value={settings.feedIntensity}
            onChange={(event) => void onFeedIntensityChange(event.target.value as FeedIntensity)}
          >
            <option value="full">Full feed</option>
            <option value="limited">Limited feed</option>
            <option value="none">No feed</option>
          </select>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.darkMode}
            onChange={() => void update(manualEdit(settings, { darkMode: !settings.darkMode }))}
          />
          Dark mode
        </label>
        <p className="hint">
          Lightweight dark mode via color inversion. For full, per-site theming we recommend a dedicated extension such
          as Dark Reader.
        </p>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={() => void update(manualEdit(settings, { reduceMotion: !settings.reduceMotion }))}
          />
          Reduce motion
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.enableGroundingTool}
            onChange={() =>
              void update(manualEdit(settings, { enableGroundingTool: !settings.enableGroundingTool }))
            }
          />
          Enable grounding tool
        </label>
      </section>

      <section className="card">
        <h2>Scenario quick-switches</h2>
        <label className="field">
          Scenario length
          <select
            value={scenarioMinutes}
            onChange={(event) => setScenarioMinutes(Number(event.target.value))}
          >
            {SCENARIO_DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </select>
        </label>
        <div className="button-grid two-col">
          {SCENARIOS.map((scenario) => (
            <button key={scenario.value} type="button" className="btn" onClick={() => void applyScenarioNow(scenario.value)}>
              {scenario.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Adaptive profile engine</h2>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.adaptive.enabled}
            onChange={() =>
              void update(manualEdit(settings, { adaptive: { ...settings.adaptive, enabled: !settings.adaptive.enabled } }))
            }
          />
          Enable adaptive suggestions
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.adaptive.suggestOnly}
            onChange={() =>
              void update(
                manualEdit(settings, { adaptive: { ...settings.adaptive, suggestOnly: !settings.adaptive.suggestOnly } })
              )
            }
          />
          Suggest, don’t force
        </label>

        <h3>Domain rules</h3>
        <div className="inline-form host-row">
          <input
            type="text"
            value={domainRuleHost}
            onChange={(event) => setDomainRuleHost(event.target.value)}
            placeholder="reddit.com"
            aria-label="Domain rule hostname"
          />
          <select aria-label="Domain rule profile" value={domainRuleProfile} onChange={(event) => setDomainRuleProfile(event.target.value as CocoonProfile)}>
            <option value="adhd">ADHD</option>
            <option value="autism">Autism</option>
            <option value="anxiety">Anxiety</option>
            <option value="custom">Custom</option>
          </select>
          <button type="button" className="btn btn-primary" onClick={() => void addDomainRule()}>
            Save
          </button>
        </div>
        {domainRuleError && (
          <p className="field-error" role="alert">
            {domainRuleError}
          </p>
        )}
        <ul className="item-list">
          {sortedDomainRules.map(([hostname, profile]) => (
            <li key={hostname}>
              {hostname} → {profile}
              <button type="button" className="btn btn-small" onClick={() => void update(manualEdit(removeDomainRule(settings, hostname)))}>
                Remove
              </button>
            </li>
          ))}
        </ul>

        <h3>Schedule rules</h3>
        <div className="inline-form schedule-row">
          <input
            type="number"
            min={0}
            max={23}
            value={scheduleRule.startHour}
            onChange={(event) => setScheduleRule({ ...scheduleRule, startHour: clampHour(event.target.value) })}
            aria-label="Schedule start hour"
          />
          <input
            type="number"
            min={0}
            max={23}
            value={scheduleRule.endHour}
            onChange={(event) => setScheduleRule({ ...scheduleRule, endHour: clampHour(event.target.value) })}
            aria-label="Schedule end hour"
          />
          <select
            aria-label="Schedule rule profile"
            value={scheduleRule.profile}
            onChange={(event) => setScheduleRule({ ...scheduleRule, profile: event.target.value as CocoonProfile })}
          >
            <option value="adhd">ADHD</option>
            <option value="autism">Autism</option>
            <option value="anxiety">Anxiety</option>
            <option value="custom">Custom</option>
          </select>
          <button type="button" className="btn btn-primary" onClick={() => void addScheduleRule()}>
            Add
          </button>
        </div>
        {scheduleError && (
          <p className="field-error" role="alert">
            {scheduleError}
          </p>
        )}
        <ul className="item-list">
          {settings.adaptive.scheduleRules.map((rule, index) => (
            <li key={`${rule.profile}-${index}`}>
              {rule.startHour}:00-{rule.endHour}:00 → {rule.profile}
              <button type="button" className="btn btn-small" onClick={() => void update(manualEdit(removeScheduleRule(settings, index)))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Per-site feed cleaner overrides</h2>
        <p className="site-line">Supported domains: {SUPPORTED_DOMAINS_HINT}.</p>

        <div className="inline-form host-row">
          <input
            type="text"
            value={hostnameInput}
            onChange={(event) => setHostnameInput(event.target.value)}
            placeholder="e.g. reddit.com"
            aria-label="Hostname"
          />
          <label className="checkbox-row" style={{ marginBottom: 0 }}>
            <input type="checkbox" checked={overrideEnabled} onChange={() => setOverrideEnabled((value) => !value)} />
            Enable
          </label>
          <button type="button" className="btn btn-primary" onClick={() => void addOverride()}>
            Save
          </button>
        </div>
        {overrideError && (
          <p className="field-error" role="alert">
            {overrideError}
          </p>
        )}

        {sortedOverrides.length === 0 ? (
          <p className="empty-note">No per-site overrides yet.</p>
        ) : (
          <ul className="item-list">
            {sortedOverrides.map(([hostname, enabled]) => (
              <li key={hostname}>
                <strong>{hostname}</strong>: {enabled ? "Enabled" : "Disabled"}
                <button type="button" className="btn btn-small" onClick={() => void removeOverride(hostname)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {saved && <p className="save-toast">Saved.</p>}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<OptionsApp />);
