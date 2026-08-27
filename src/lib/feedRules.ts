import { HOST_RULES, ruleSelector, type FeedRule, type HostRules, type PageKind } from "../rules";
import type { FeedIntensity } from "./types";

export const PATH_ATTR = "data-cocoon-path";

/** Every hostname the feed cleaner supports (hosts plus their aliases). */
export const SOCIAL_HOSTS: readonly string[] = HOST_RULES.flatMap((h) => [h.host, ...(h.aliases ?? [])]);

function hostMatches(hostname: string, host: string): boolean {
  return hostname === host || hostname.endsWith(`.${host}`);
}

/** The rule set for a hostname (or any of its subdomains), if supported. */
export function getHostRules(hostname: string): HostRules | undefined {
  return HOST_RULES.find((h) => [h.host, ...(h.aliases ?? [])].some((host) => hostMatches(hostname, host)));
}

/** Returns true when a hostname is in the supported social-domain set for feed cleaning. */
export function supportsFeedCleaner(hostname: string): boolean {
  return getHostRules(hostname) !== undefined;
}

/** Coarse page kind for a pathname on a host: "/" is home, declared prefixes map, else other. */
export function classifyPath(host: HostRules | undefined, pathname: string): PageKind {
  if (pathname === "/" || pathname === "") {
    return "home";
  }
  for (const [kind, prefixes] of Object.entries(host?.pages ?? {})) {
    if (prefixes?.some((prefix) => pathname.startsWith(prefix))) {
      return kind as PageKind;
    }
  }
  return "other";
}

function activeAt(rule: FeedRule, intensity: FeedIntensity): boolean {
  if (intensity === "full") {
    return false;
  }
  return intensity === "none" || rule.intensity === "limited";
}

/** Returns scoped CSS selectors for feed surfaces on a supported hostname. */
export function getFeedSelectors(hostname: string): string[] {
  return (getHostRules(hostname)?.rules ?? []).map(ruleSelector);
}

/**
 * Rules switched on for a given intensity: none when "full", the gentle
 * ("limited") rules when "limited", all of them when "none".
 */
export function getEffectiveFeedRules(hostname: string, intensity: FeedIntensity): FeedRule[] {
  return (getHostRules(hostname)?.rules ?? []).filter((rule) => activeAt(rule, intensity));
}

/** Selectors of the rules `getEffectiveFeedRules` returns. */
export function getEffectiveFeedSelectors(hostname: string, intensity: FeedIntensity): string[] {
  return getEffectiveFeedRules(hostname, intensity).map(ruleSelector);
}

/**
 * Rules whose absence on the current page kind means something is wrong:
 * effective, applicable to `path`, and not flagged `mayBeAbsent`.
 */
export function getCheckableFeedRules(hostname: string, intensity: FeedIntensity, path: PageKind): FeedRule[] {
  return getEffectiveFeedRules(hostname, intensity).filter(
    (rule) => !rule.mayBeAbsent && (!rule.paths || rule.paths.includes(path))
  );
}

/**
 * Generates the CSS for one rule. Path-scoped rules are gated on the
 * `data-cocoon-path` attribute the content script stamps on <html>, so the
 * stylesheet stays valid across SPA navigation and only the attribute moves.
 */
export function buildRuleCss(rule: FeedRule): string {
  const selector = ruleSelector(rule);
  const guards = rule.paths?.length ? rule.paths.map((p) => `html[${PATH_ATTR}="${p}"]`) : [""];
  return guards.map((guard) => `${guard ? `${guard} ` : ""}${selector} { display: none !important; }`).join("\n");
}

/** Number of CSS rules `buildFeedCleanerCss` emits — a parse test compares against this. */
export function countRuleCss(rules: FeedRule[]): number {
  return rules.reduce((n, rule) => n + (rule.paths?.length || 1), 0);
}

/** Builds feed-hiding CSS only when a supported hostname has known selectors. */
export function buildFeedCleanerCss(hostname: string, intensity: FeedIntensity): string {
  // The user-facing notice is rendered as a real DOM node by the content script
  // (see content.ts) so it is exposed to assistive tech and dismissible, rather
  // than as inaccessible CSS `content` text on body::before.
  return getEffectiveFeedRules(hostname, intensity).map(buildRuleCss).join("\n");
}

function countMatches(root: ParentNode, selector: string): number {
  try {
    return root.querySelectorAll(selector).length;
  } catch {
    // Malformed selector: treat as no match rather than throwing.
    return 0;
  }
}

/**
 * Counts how many feed elements the checkable rules currently match in the
 * given root. Used by the content script to detect selector rot (a supported
 * site changed its markup) so it can warn the user instead of silently failing.
 */
export function countFeedMatches(
  root: ParentNode,
  hostname: string,
  intensity: FeedIntensity,
  path: PageKind = "home"
): number {
  let count = 0;
  for (const rule of getCheckableFeedRules(hostname, intensity, path)) {
    count += countMatches(root, ruleSelector(rule));
  }
  return count;
}

/**
 * Checkable selectors that currently match nothing, while at least one sibling
 * still does — i.e. *partial* rot.
 *
 * `countFeedMatches` sums across selectors, so it cannot see this: Reddit
 * carried a dead `[data-testid='post-container']` rule for months while
 * `shreddit-feed` kept the total above zero and the user-facing rot warning
 * silent. Partial rot is invisible to the total by construction, and it is the
 * more common kind, because sites rarely rename every feed surface at once.
 *
 * Returns [] when nothing matches at all — that is total rot, which
 * `countFeedMatches` already reports to the user.
 */
export function findDeadFeedSelectors(
  root: ParentNode,
  hostname: string,
  intensity: FeedIntensity,
  path: PageKind = "home"
): string[] {
  const dead: string[] = [];
  let anyMatched = false;

  for (const rule of getCheckableFeedRules(hostname, intensity, path)) {
    const selector = ruleSelector(rule);
    if (countMatches(root, selector) > 0) {
      anyMatched = true;
    } else {
      dead.push(selector);
    }
  }

  return anyMatched ? dead : [];
}
