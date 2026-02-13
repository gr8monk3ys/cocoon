export type CocoonProfile = "adhd" | "autism" | "anxiety" | "custom";
export type FeedIntensity = "full" | "limited" | "none";
export type ScenarioType = "focus_session" | "low_stimulation" | "calm_reset" | "social_guardrails";

export interface AdaptiveScheduleRule {
  startHour: number;
  endHour: number;
  profile: CocoonProfile;
}

export interface AdaptiveSettings {
  enabled: boolean;
  suggestOnly: boolean;
  scheduleRules: AdaptiveScheduleRule[];
  domainRules: Record<string, CocoonProfile>;
}

export interface ActiveScenario {
  type: ScenarioType;
  expiresAt: number | null;
}

export interface CocoonSettings {
  profile: CocoonProfile;
  darkMode: boolean;
  reduceMotion: boolean;
  hideAlgorithmicFeeds: boolean;
  feedIntensity: FeedIntensity;
  enableGroundingTool: boolean;
  siteFeedCleanerOverrides: Record<string, boolean>;
  adaptive: AdaptiveSettings;
  activeScenario: ActiveScenario | null;
}

export interface RootStorage {
  settings: CocoonSettings;
}

export const DEFAULT_ADAPTIVE_SETTINGS: AdaptiveSettings = {
  enabled: false,
  suggestOnly: true,
  scheduleRules: [],
  domainRules: {}
};

export const DEFAULT_SETTINGS: CocoonSettings = {
  profile: "adhd",
  darkMode: false,
  reduceMotion: true,
  hideAlgorithmicFeeds: true,
  feedIntensity: "limited",
  enableGroundingTool: true,
  siteFeedCleanerOverrides: {},
  adaptive: DEFAULT_ADAPTIVE_SETTINGS,
  activeScenario: null
};

export const PROFILE_PRESETS: Record<CocoonProfile, CocoonSettings> = {
  adhd: {
    profile: "adhd",
    darkMode: false,
    reduceMotion: true,
    hideAlgorithmicFeeds: true,
    feedIntensity: "limited",
    enableGroundingTool: true,
    siteFeedCleanerOverrides: {},
    adaptive: DEFAULT_ADAPTIVE_SETTINGS,
    activeScenario: null
  },
  autism: {
    profile: "autism",
    darkMode: true,
    reduceMotion: true,
    hideAlgorithmicFeeds: true,
    feedIntensity: "none",
    enableGroundingTool: true,
    siteFeedCleanerOverrides: {},
    adaptive: DEFAULT_ADAPTIVE_SETTINGS,
    activeScenario: null
  },
  anxiety: {
    profile: "anxiety",
    darkMode: true,
    reduceMotion: true,
    hideAlgorithmicFeeds: false,
    feedIntensity: "full",
    enableGroundingTool: true,
    siteFeedCleanerOverrides: {},
    adaptive: DEFAULT_ADAPTIVE_SETTINGS,
    activeScenario: null
  },
  custom: DEFAULT_SETTINGS
};

export type CocoonMessage =
  | { type: "COCOON_GET_SETTINGS" }
  | { type: "COCOON_APPLY_SETTINGS"; payload: CocoonSettings }
  | { type: "COCOON_OPEN_GROUNDING" };
