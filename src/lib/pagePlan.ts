import { HOST_RULES, ruleSelector, type FeedRule, type HostRules, type PageKind } from "../rules";
import { getFeedIntensityForHost, normalizeHostname } from "./settings";
import type { CocoonSettings, FeedIntensity } from "./types";

export const PATH_ATTR = "data-cocoon-path";

/** Every hostname the feed cleaner supports (hosts plus their aliases). */
export const SOCIAL_HOSTS: readonly string[] = HOST_RULES.flatMap((h) => [h.host, ...(h.aliases ?? [])]);

/**
 * Everything the content script needs to know about the current page, decided
 * in one pure call. The host is resolved once, the per-site override applied
 * once, the page kind classified once; callers read fields instead of asking
 * the rule set the same question from four directions.
 *
 * Deciding is pure and lives here. Touching the document is `pageDom`.
 */
export interface PagePlan {
  /** Normalized hostname this plan was computed for. */
  hostname: string;
  /** True when the hostname has a rule set at all. */
  supported: boolean;
  /** Intensity after the per-site override; "full" means nothing hides here. */
  intensity: FeedIntensity;
  /** Page kind for the pathname; stamped on <html> as `data-cocoon-path`. */
  path: PageKind;
  /** The complete stylesheet for this page: sensory CSS plus `feedCss`. */
  css: string;
  /** Just the feed-hiding portion, which the fixture e2e injects on its own. */
  feedCss: string;
  /** How many CSS rules `feedCss` contains — a parse test compares against this. */
  feedCssRuleCount: number;
  /** Rules switched on at this intensity, in rule-file order. */
  activeRules: FeedRule[];
  /**
   * Rules whose absence on this page kind means something is wrong: active,
   * applicable to `path`, and not flagged `mayBeAbsent`. Empty means there is
   * nothing to verify here, so no banner either way.
   */
  checkableRules: FeedRule[];
}

function hostMatches(hostname: string, host: string): boolean {
  return hostname === host || hostname.endsWith(`.${host}`);
}

/** The rule set for a hostname (or any of its subdomains/aliases), if supported. */
export function hostRulesFor(hostname: string): HostRules | undefined {
  const normalized = normalizeHostname(hostname);
  return HOST_RULES.find((h) => [h.host, ...(h.aliases ?? [])].some((host) => hostMatches(normalized, host)));
}

/** Returns true when a hostname is in the supported social-domain set. */
export function supportsFeedCleaner(hostname: string): boolean {
  return hostRulesFor(hostname) !== undefined;
}

/** Coarse page kind for a pathname on a host: "/" is home, declared prefixes map, else other. */
function classifyPath(host: HostRules | undefined, pathname: string): PageKind {
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

/**
 * Generates the CSS for one rule. Path-scoped rules are gated on the
 * `data-cocoon-path` attribute the content script stamps on <html>, so the
 * stylesheet stays valid across SPA navigation and only the attribute moves.
 */
function buildRuleCss(rule: FeedRule): string {
  const selector = ruleSelector(rule);
  const guards = rule.paths?.length ? rule.paths.map((p) => `html[${PATH_ATTR}="${p}"]`) : [""];
  return guards.map((guard) => `${guard ? `${guard} ` : ""}${selector} { display: none !important; }`).join("\n");
}

/**
 * Colour inversion and motion suppression. Host-independent: these follow the
 * user wherever they browse, unlike the feed rules.
 */
function buildSensoryCss(settings: CocoonSettings): string {
  const rules: string[] = [];

  if (settings.darkMode) {
    rules.push("html { filter: invert(0.93) hue-rotate(180deg); background: #121212 !important; }");
    // Re-invert media so photos/video/graphics keep their true colors. This is
    // a heuristic; it covers inline background-image elements but not every
    // CSS-painted surface.
    rules.push(
      'img, picture, video, canvas, svg, [style*="background-image"] { filter: invert(1) hue-rotate(180deg); }'
    );
  }

  if (settings.reduceMotion) {
    rules.push(`
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
    `);
  }

  return rules.join("\n");
}

export function planPage(hostname: string, pathname: string, settings: CocoonSettings): PagePlan {
  const normalized = normalizeHostname(hostname);
  const host = hostRulesFor(normalized);
  const intensity: FeedIntensity = host ? getFeedIntensityForHost(settings, normalized) : "full";
  const path = classifyPath(host, pathname);

  const activeRules = (host?.rules ?? []).filter((rule) => activeAt(rule, intensity));
  // The user-facing rot notice is rendered as a real DOM node by `banner.ts` so
  // it is exposed to assistive tech and dismissible, rather than as
  // inaccessible CSS `content` text on body::before.
  const feedCss = activeRules.map(buildRuleCss).join("\n");
  const sensoryCss = buildSensoryCss(settings);

  return {
    hostname: normalized,
    supported: host !== undefined,
    intensity,
    path,
    css: [sensoryCss, feedCss].filter(Boolean).join("\n"),
    feedCss,
    feedCssRuleCount: activeRules.reduce((n, rule) => n + (rule.paths?.length || 1), 0),
    activeRules,
    checkableRules: activeRules.filter(
      (rule) => !rule.mayBeAbsent && (!rule.paths || rule.paths.includes(path))
    )
  };
}
