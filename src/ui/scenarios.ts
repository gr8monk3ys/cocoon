import type { ScenarioType } from "../lib/types";

/** Scenario buttons, shared so the popup and options cannot drift apart. */
export const SCENARIOS: ReadonlyArray<{ label: string; value: ScenarioType }> = [
  { label: "Focus session", value: "focus_session" },
  { label: "Low stimulation", value: "low_stimulation" },
  { label: "Calm reset", value: "calm_reset" },
  { label: "Social guardrails", value: "social_guardrails" }
];

export const SCENARIO_DURATIONS = [15, 30, 60] as const;
