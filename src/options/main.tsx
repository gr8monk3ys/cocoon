import { createRoot } from "react-dom/client";
import React, { useEffect, useState } from "react";
import { supportsFeedCleaner } from "../lib/feedRules";
import {
  applyProfile,
  applyScenario,
  getSettings,
  normalizeHostname,
  removeDomainRule,
  removeScheduleRule,
  removeSiteFeedCleanerOverride,
  saveSettings,
  upsertDomainRule,
  upsertScheduleRule,
  updateSiteFeedCleanerOverride
} from "../lib/settings";
import { broadcastSettings } from "../lib/messages";
import type {
  AdaptiveScheduleRule,
  CocoonProfile,
  CocoonSettings,
  FeedIntensity,
  ScenarioType
} from "../lib/types";

/** Coerce a number-input value to a valid hour (0–23); empty/NaN becomes 0. */
function clampHour(value: string): number {
  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.min(23, Math.max(0, parsed));
}

const SCENARIOS: Array<{ label: string; value: ScenarioType }> = [
  { label: "Focus session", value: "focus_session" },
  { label: "Low stimulation", value: "low_stimulation" },
  { label: "Calm reset", value: "calm_reset" },
  { label: "Social guardrails", value: "social_guardrails" }
];

function OptionsApp(): React.JSX.Element {
  const [settings, setSettings] = useState<CocoonSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [hostnameInput, setHostnameInput] = useState("");
  const [overrideEnabled, setOverrideEnabled] = useState(true);
  const [domainRuleHost, setDomainRuleHost] = useState("");
  const [domainRuleProfile, setDomainRuleProfile] = useState<CocoonProfile>("adhd");
  const [scheduleRule, setScheduleRule] = useState<AdaptiveScheduleRule>({ startHour: 18, endHour: 23, profile: "anxiety" });

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
    return <main style={{ padding: 24 }}>Loading settings…</main>;
  }

  const update = async (next: CocoonSettings): Promise<void> => {
    setSettings(next);
    await saveSettings(next);
    await broadcastSettings(next);
    setSaved(true);
  };

  const onProfileChange = async (profile: CocoonProfile): Promise<void> => {
    await update(profile === "custom" ? { ...settings, profile } : applyProfile(profile, settings));
  };

  const onFeedIntensityChange = async (feedIntensity: FeedIntensity): Promise<void> => {
    await update({ ...settings, profile: "custom", feedIntensity, hideAlgorithmicFeeds: feedIntensity !== "full" });
  };

  const addOverride = async (): Promise<void> => {
    const normalized = normalizeHostname(hostnameInput);
    if (!supportsFeedCleaner(normalized)) {
      return;
    }

    const next = updateSiteFeedCleanerOverride(settings, normalized, overrideEnabled);
    await update({ ...next, profile: "custom" });
    setHostnameInput("");
    setOverrideEnabled(true);
  };

  const removeOverride = async (hostname: string): Promise<void> => {
    await update({ ...removeSiteFeedCleanerOverride(settings, hostname), profile: "custom" });
  };

  const applyScenarioNow = async (scenario: ScenarioType): Promise<void> => {
    await update(applyScenario(settings, scenario, 30));
  };

  const addDomainRule = async (): Promise<void> => {
    const normalized = normalizeHostname(domainRuleHost);
    if (!supportsFeedCleaner(normalized)) {
      return;
    }

    await update({ ...upsertDomainRule(settings, normalized, domainRuleProfile), profile: "custom" });
    setDomainRuleHost("");
  };

  const addScheduleRule = async (): Promise<void> => {
    await update({ ...upsertScheduleRule(settings, scheduleRule), profile: "custom" });
  };

  const sortedOverrides = Object.entries(settings.siteFeedCleanerOverrides).sort(([a], [b]) => a.localeCompare(b));
  const sortedDomainRules = Object.entries(settings.adaptive.domainRules).sort(([a], [b]) => a.localeCompare(b));

  return (
    <main style={{ maxWidth: 760, margin: "30px auto", fontFamily: "system-ui, sans-serif", lineHeight: 1.4 }}>
      <h1>Cocoon Settings</h1>
      <p>Settings are stored locally. Adaptive suggestions are user-controlled and transparent.</p>

      <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Profile presets</h2>
        <label style={{ display: "block", marginBottom: 8 }}>
          Profile
          <select
            value={settings.profile}
            onChange={(event) => void onProfileChange(event.target.value as CocoonProfile)}
            style={{ display: "block", marginTop: 4 }}
          >
            <option value="adhd">ADHD focus</option>
            <option value="autism">Autism sensory</option>
            <option value="anxiety">Anxiety calm</option>
            <option value="custom">Custom</option>
          </select>
        </label>
      </section>

      <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Feature toggles</h2>
        <label style={{ display: "block", marginBottom: 8 }}>
          Feed intensity
          <select
            value={settings.feedIntensity}
            onChange={(event) => void onFeedIntensityChange(event.target.value as FeedIntensity)}
            style={{ display: "block", marginTop: 4 }}
          >
            <option value="full">Full feed</option>
            <option value="limited">Limited feed</option>
            <option value="none">No feed</option>
          </select>
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={settings.darkMode}
            onChange={() => void update({ ...settings, profile: "custom", darkMode: !settings.darkMode })}
          />
          Dark mode
        </label>
        <p style={{ margin: "0 0 8px 22px", fontSize: 12, color: "#555" }}>
          Lightweight dark mode via color inversion. For full, per-site theming we recommend a dedicated
          extension such as Dark Reader.
        </p>
        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={() => void update({ ...settings, profile: "custom", reduceMotion: !settings.reduceMotion })}
          />
          Reduce motion
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={settings.enableGroundingTool}
            onChange={() =>
              void update({ ...settings, profile: "custom", enableGroundingTool: !settings.enableGroundingTool })
            }
          />
          Enable grounding tool
        </label>
      </section>

      <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Scenario quick-switches</h2>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(160px, 1fr))" }}>
          {SCENARIOS.map((scenario) => (
            <button key={scenario.value} type="button" onClick={() => void applyScenarioNow(scenario.value)}>
              {scenario.label}
            </button>
          ))}
        </div>
      </section>

      <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Adaptive profile engine</h2>
        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={settings.adaptive.enabled}
            onChange={() =>
              void update({ ...settings, profile: "custom", adaptive: { ...settings.adaptive, enabled: !settings.adaptive.enabled } })
            }
          />
          Enable adaptive suggestions
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={settings.adaptive.suggestOnly}
            onChange={() =>
              void update({
                ...settings,
                profile: "custom",
                adaptive: { ...settings.adaptive, suggestOnly: !settings.adaptive.suggestOnly }
              })
            }
          />
          Suggest, don’t force
        </label>

        <h3 style={{ margin: "8px 0" }}>Domain rules</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, marginBottom: 8 }}>
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
          <button type="button" onClick={() => void addDomainRule()}>
            Save
          </button>
        </div>
        <ul style={{ paddingLeft: 18 }}>
          {sortedDomainRules.map(([hostname, profile]) => (
            <li key={hostname}>
              {hostname} → {profile}
              <button type="button" onClick={() => void update(removeDomainRule(settings, hostname))} style={{ marginLeft: 8 }}>
                Remove
              </button>
            </li>
          ))}
        </ul>

        <h3 style={{ margin: "8px 0" }}>Schedule rules</h3>
        <div style={{ display: "grid", gridTemplateColumns: "90px 90px 1fr auto", gap: 8, marginBottom: 8 }}>
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
          <button type="button" onClick={() => void addScheduleRule()}>
            Add
          </button>
        </div>
        <ul style={{ paddingLeft: 18 }}>
          {settings.adaptive.scheduleRules.map((rule, index) => (
            <li key={`${rule.profile}-${index}`}>
              {rule.startHour}:00-{rule.endHour}:00 → {rule.profile}
              <button type="button" onClick={() => void update(removeScheduleRule(settings, index))} style={{ marginLeft: 8 }}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10 }}>
        <h2 style={{ marginTop: 0 }}>Per-site feed cleaner overrides</h2>
        <p style={{ marginTop: 0 }}>Supported domains: x/twitter, facebook/instagram, youtube, reddit, tiktok.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={hostnameInput}
            onChange={(event) => setHostnameInput(event.target.value)}
            placeholder="e.g. reddit.com"
            aria-label="Hostname"
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={overrideEnabled} onChange={() => setOverrideEnabled((value) => !value)} />
            Enable
          </label>
          <button type="button" onClick={() => void addOverride()}>
            Save
          </button>
        </div>

        {sortedOverrides.length === 0 ? (
          <p style={{ marginBottom: 0 }}>No per-site overrides yet.</p>
        ) : (
          <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
            {sortedOverrides.map(([hostname, enabled]) => (
              <li key={hostname} style={{ marginBottom: 8 }}>
                <strong>{hostname}</strong>: {enabled ? "Enabled" : "Disabled"}
                <button type="button" onClick={() => void removeOverride(hostname)} style={{ marginLeft: 8 }}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {saved && <p style={{ color: "#0d7a30" }}>Saved.</p>}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<OptionsApp />);
