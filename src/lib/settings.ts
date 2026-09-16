import {
  DEFAULT_SETTINGS,
  PROFILE_PRESETS,
  type AdaptiveScheduleRule,
  type CocoonProfile,
  type CocoonSettings,
  type FeedIntensity,
  type ScenarioRestoreSnapshot,
  type ScenarioType
} from "./types";
import { broadcastSettings } from "./messages";
import { settingsStore } from "./store";

export function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

/** Keeps the legacy `hideAlgorithmicFeeds` mirror in step with `feedIntensity`. */
function withDerived(settings: CocoonSettings): CocoonSettings {
  return { ...settings, hideAlgorithmicFeeds: settings.feedIntensity !== "full" };
}

export function applyProfile(profile: CocoonProfile, current?: CocoonSettings): CocoonSettings {
  const preset = PROFILE_PRESETS[profile];
  if (!current) {
    return { ...preset, profile };
  }

  // Presets carry empty overrides/adaptive defaults; preserve the user's
  // per-site overrides and adaptive rules across a profile switch instead of
  // silently wiping them. A manual profile switch is an explicit choice, so it
  // cancels any active scenario (preset.activeScenario is null) rather than
  // letting the scenario later restore the pre-scenario profile.
  return {
    ...preset,
    profile,
    siteFeedCleanerOverrides: current.siteFeedCleanerOverrides,
    adaptive: current.adaptive
  };
}

export function getFeedIntensityForHost(settings: CocoonSettings, hostname: string): FeedIntensity {
  const normalized = normalizeHostname(hostname);
  const override = settings.siteFeedCleanerOverrides[normalized];
  if (override === true) {
    // Per-site "enable" must never clean less than the global setting:
    // upgrade only when the global default is "full" (off).
    return settings.feedIntensity === "full" ? "limited" : settings.feedIntensity;
  }

  if (override === false) {
    return "full";
  }

  return settings.feedIntensity;
}

export function isFeedCleanerEnabledForHost(settings: CocoonSettings, hostname: string): boolean {
  return getFeedIntensityForHost(settings, hostname) !== "full";
}

export function updateSiteFeedCleanerOverride(
  settings: CocoonSettings,
  hostname: string,
  enabled: boolean
): CocoonSettings {
  const normalized = normalizeHostname(hostname);
  const nextOverrides = { ...settings.siteFeedCleanerOverrides, [normalized]: enabled };
  return { ...settings, siteFeedCleanerOverrides: nextOverrides };
}

export function removeSiteFeedCleanerOverride(settings: CocoonSettings, hostname: string): CocoonSettings {
  const normalized = normalizeHostname(hostname);
  const nextOverrides = { ...settings.siteFeedCleanerOverrides };
  delete nextOverrides[normalized];
  return { ...settings, siteFeedCleanerOverrides: nextOverrides };
}

export function upsertDomainRule(
  settings: CocoonSettings,
  hostname: string,
  profile: CocoonProfile
): CocoonSettings {
  const normalized = normalizeHostname(hostname);
  return {
    ...settings,
    adaptive: {
      ...settings.adaptive,
      domainRules: { ...settings.adaptive.domainRules, [normalized]: profile }
    }
  };
}

export function removeDomainRule(settings: CocoonSettings, hostname: string): CocoonSettings {
  const normalized = normalizeHostname(hostname);
  const domainRules = { ...settings.adaptive.domainRules };
  delete domainRules[normalized];
  return { ...settings, adaptive: { ...settings.adaptive, domainRules } };
}

export function upsertScheduleRule(
  settings: CocoonSettings,
  rule: AdaptiveScheduleRule,
  index?: number
): CocoonSettings {
  const nextRules = [...settings.adaptive.scheduleRules];
  if (typeof index === "number") {
    nextRules[index] = rule;
  } else {
    nextRules.push(rule);
  }

  return { ...settings, adaptive: { ...settings.adaptive, scheduleRules: nextRules } };
}

export function removeScheduleRule(settings: CocoonSettings, index: number): CocoonSettings {
  const nextRules = settings.adaptive.scheduleRules.filter((_, idx) => idx !== index);
  return { ...settings, adaptive: { ...settings.adaptive, scheduleRules: nextRules } };
}

function matchScheduleRule(hour: number, rule: AdaptiveScheduleRule): boolean {
  if (rule.startHour <= rule.endHour) {
    return hour >= rule.startHour && hour < rule.endHour;
  }

  return hour >= rule.startHour || hour < rule.endHour;
}

export function getAdaptiveProfileSuggestion(
  settings: CocoonSettings,
  hostname: string,
  now: Date = new Date()
): CocoonProfile | null {
  if (!settings.adaptive.enabled) {
    return null;
  }

  const normalized = normalizeHostname(hostname);
  const domainProfile = settings.adaptive.domainRules[normalized];
  if (domainProfile) {
    return domainProfile;
  }

  const hour = now.getHours();
  const scheduleMatch = settings.adaptive.scheduleRules.find((rule) => matchScheduleRule(hour, rule));
  return scheduleMatch?.profile ?? null;
}

function scenarioPatch(type: ScenarioType): Partial<CocoonSettings> {
  if (type === "focus_session") {
    return { reduceMotion: true, feedIntensity: "none", enableGroundingTool: true };
  }

  if (type === "low_stimulation") {
    return { darkMode: true, reduceMotion: true, feedIntensity: "none" };
  }

  if (type === "calm_reset") {
    return { darkMode: true, reduceMotion: true, feedIntensity: "limited", enableGroundingTool: true };
  }

  if (type === "social_guardrails") {
    return { reduceMotion: true, feedIntensity: "none", enableGroundingTool: true };
  }

  return { reduceMotion: true, feedIntensity: "limited" };
}

export function applyScenario(
  settings: CocoonSettings,
  type: ScenarioType,
  durationMinutes?: number
): CocoonSettings {
  const expiresAt = typeof durationMinutes === "number" ? Date.now() + durationMinutes * 60_000 : null;
  // If a scenario is already active, carry forward its original baseline instead
  // of snapshotting the current (already-patched) settings — otherwise stacking
  // scenarios would strand the user in the first scenario's restrictive values.
  const previous: ScenarioRestoreSnapshot = settings.activeScenario?.previous ?? {
    profile: settings.profile,
    darkMode: settings.darkMode,
    reduceMotion: settings.reduceMotion,
    feedIntensity: settings.feedIntensity,
    hideAlgorithmicFeeds: settings.hideAlgorithmicFeeds,
    enableGroundingTool: settings.enableGroundingTool
  };
  const patched = withDerived({ ...settings, ...scenarioPatch(type), profile: "custom" as const });
  return { ...patched, activeScenario: { type, expiresAt, previous } };
}

export function clearExpiredScenario(settings: CocoonSettings, now: number = Date.now()): CocoonSettings {
  const scenario = settings.activeScenario;
  if (!scenario?.expiresAt) {
    return settings;
  }

  if (now < scenario.expiresAt) {
    return settings;
  }

  // Expired: restore the pre-scenario settings if we captured them.
  if (scenario.previous) {
    return { ...settings, ...scenario.previous, activeScenario: null };
  }

  return { ...settings, activeScenario: null };
}

function migrateSettings(raw: Partial<CocoonSettings> | undefined): CocoonSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  // Derive intensity from the legacy `hideAlgorithmicFeeds` flag only when the
  // stored data predates `feedIntensity`. Read from `raw`, not `merged`, since
  // `merged` always inherits DEFAULT_SETTINGS.feedIntensity and would mask it.
  const legacyHide = raw?.hideAlgorithmicFeeds;
  const feedIntensity: FeedIntensity =
    raw?.feedIntensity ??
    (typeof legacyHide === "boolean" ? (legacyHide ? "limited" : "full") : DEFAULT_SETTINGS.feedIntensity);
  return {
    ...merged,
    hideAlgorithmicFeeds: feedIntensity !== "full",
    feedIntensity,
    adaptive: { ...DEFAULT_SETTINGS.adaptive, ...(merged.adaptive ?? {}) }
  };
}

/** Reads + migrates stored settings WITHOUT clearing an expired scenario. */
export async function readStoredSettings(): Promise<CocoonSettings> {
  return migrateSettings(await settingsStore.read());
}

export async function getSettings(): Promise<CocoonSettings> {
  return clearExpiredScenario(await readStoredSettings());
}

export async function saveSettings(settings: CocoonSettings): Promise<void> {
  await settingsStore.write(settings);
}

/**
 * Applies a hand edit. Two rules hold for every one of them, and both used to
 * be copied into each call site (fourteen times, already drifting): leaving a
 * preset moves the profile to "custom", and `hideAlgorithmicFeeds` is derived,
 * never set by hand.
 */
export function manualEdit(settings: CocoonSettings, patch: Partial<CocoonSettings> = {}): CocoonSettings {
  return withDerived({ ...settings, ...patch, profile: "custom" });
}

/**
 * The one write path: derive the mirrored fields, persist, tell open tabs.
 * Nothing else saves settings, so the ordering cannot drift between callers.
 */
export async function commitSettings(next: CocoonSettings): Promise<CocoonSettings> {
  const settings = withDerived(next);
  await saveSettings(settings);
  await broadcastSettings(settings);
  return settings;
}
