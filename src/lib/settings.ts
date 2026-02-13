import {
  DEFAULT_SETTINGS,
  PROFILE_PRESETS,
  type ActiveScenario,
  type AdaptiveScheduleRule,
  type CocoonProfile,
  type CocoonSettings,
  type FeedIntensity,
  type ScenarioType
} from "./types";

const STORAGE_KEY = "settings";

export function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

export function applyProfile(profile: CocoonProfile): CocoonSettings {
  return { ...PROFILE_PRESETS[profile], profile };
}

export function getFeedIntensityForHost(settings: CocoonSettings, hostname: string): FeedIntensity {
  const normalized = normalizeHostname(hostname);
  const override = settings.siteFeedCleanerOverrides[normalized];
  if (override === true) {
    return "limited";
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

  return { reduceMotion: true, feedIntensity: "limited" };
}

export function applyScenario(
  settings: CocoonSettings,
  type: ScenarioType,
  durationMinutes?: number
): CocoonSettings {
  const expiresAt = typeof durationMinutes === "number" ? Date.now() + durationMinutes * 60_000 : null;
  const activeScenario: ActiveScenario = { type, expiresAt };
  return { ...settings, ...scenarioPatch(type), profile: "custom", activeScenario };
}

export function clearExpiredScenario(settings: CocoonSettings, now: number = Date.now()): CocoonSettings {
  if (!settings.activeScenario?.expiresAt) {
    return settings;
  }

  if (now < settings.activeScenario.expiresAt) {
    return settings;
  }

  return { ...settings, activeScenario: null };
}

function migrateSettings(raw: Partial<CocoonSettings> | undefined): CocoonSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  const feedIntensity = merged.feedIntensity ?? (merged.hideAlgorithmicFeeds ? "limited" : "full");
  return {
    ...merged,
    hideAlgorithmicFeeds: feedIntensity !== "full",
    feedIntensity,
    adaptive: { ...DEFAULT_SETTINGS.adaptive, ...(merged.adaptive ?? {}) }
  };
}

export async function getSettings(): Promise<CocoonSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return migrateSettings(result[STORAGE_KEY] as Partial<CocoonSettings> | undefined);
}

export async function saveSettings(settings: CocoonSettings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

export async function updateSettings(
  updater: (current: CocoonSettings) => CocoonSettings
): Promise<CocoonSettings> {
  const current = await getSettings();
  const next = updater(current);
  await saveSettings(next);
  return next;
}
