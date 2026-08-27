import type { FeedIntensity } from "../lib/types";

/**
 * Coarse page classification used to scope rules. A host declares which path
 * prefixes map to which kind (see `HostRules.pages`); "/" is always `home` and
 * anything unlisted is `other`.
 */
export type PageKind = "home" | "reels" | "explore" | "stories" | "watch" | "post" | "other";

/** Intensities at which a rule can be switched on; "full" never hides anything. */
export type RuleIntensity = Exclude<FeedIntensity, "full">;

/**
 * Config for a MutationObserver-driven rule: units that CSS alone cannot tell
 * apart (e.g. Facebook's feed container is only identifiable by its
 * screen-reader heading text) are found by text and stamped with
 * `data-cocoon-unit`, which the generated CSS then hides.
 */
export interface MarkerConfig {
  containerSelector: string;
  unitSelector: string;
  textAnchors: string[];
}

export interface FeedRule {
  /** Stable id, `<host>.<surface>`, e.g. "instagram.feed". */
  id: string;
  label: string;
  /**
   * The gentlest intensity at which this rule is active. "limited" rules apply
   * at both "limited" and "none"; "none" rules only at "none".
   */
  intensity: RuleIntensity;
  /** CSS selector to hide. Omit when `mark` is set: the marker selector is derived. */
  selector?: string;
  /** Restrict the rule to these page kinds. Omit = every page on the host. */
  paths?: PageKind[];
  /**
   * True when matching nothing is normal (legacy-layout fallbacks, surfaces
   * only some accounts see). Selector-rot detection ignores these rules.
   */
  mayBeAbsent?: boolean;
  /** Text-anchored unit marking for surfaces CSS cannot distinguish. */
  mark?: MarkerConfig;
}

export interface HostRules {
  /** Registrable domain; subdomains match too. */
  host: string;
  /** Other domains that serve the same site with the same markup. */
  aliases?: string[];
  /** Path prefixes per page kind. "/" is always `home`; unlisted paths are `other`. */
  pages?: Partial<Record<Exclude<PageKind, "home" | "other">, string[]>>;
  rules: FeedRule[];
}

export const UNIT_ATTR = "data-cocoon-unit";

/** Selector for elements the marker observer stamped for `ruleId`. */
export function markerSelector(ruleId: string): string {
  return `[${UNIT_ATTR}~="${ruleId}"]`;
}

/** The selector a rule hides: its own, or the marker selector for `mark` rules. */
export function ruleSelector(rule: FeedRule): string {
  return rule.selector ?? markerSelector(rule.id);
}
