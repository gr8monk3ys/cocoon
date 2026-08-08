import type { FeedIntensity } from "./types";

export const SOCIAL_HOSTS = [
  "x.com",
  "twitter.com",
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "reddit.com",
  "tiktok.com"
] as const;

const FEED_RULES: Record<string, string[]> = {
  "x.com": ["[aria-label='Timeline: Your Home Timeline']", "[data-testid='primaryColumn'] [role='region']"],
  "twitter.com": ["[aria-label='Timeline: Your Home Timeline']", "[data-testid='primaryColumn'] [role='region']"],
  "facebook.com": ["div[role='feed']", "div[data-pagelet='FeedUnit']"],
  "instagram.com": ["main article", "main [role='presentation'] article"],
  "youtube.com": ["ytd-rich-grid-renderer", "ytd-browse[page-subtype='home'] #contents"],
  // `[data-testid='post-container']` was removed: it is from Reddit's pre-shreddit
  // markup and matches nothing on the current site (verified 2026-08-08 on the
  // home feed, a subreddit listing, and a post page). It is NOT replaced with
  // `shreddit-post`, the obvious modern equivalent, because that matches the
  // single post on a comments page too — hiding the exact post the user just
  // opened. `shreddit-feed` is absent on post pages, so it stays correctly
  // scoped to feed surfaces on its own.
  "reddit.com": ["shreddit-feed"],
  "tiktok.com": ["[data-e2e='recommend-list']", "div[data-e2e='video-feed-item']"]
};

/** Returns true when a hostname is in the supported social-domain set for feed cleaning. */
export function supportsFeedCleaner(hostname: string): boolean {
  return SOCIAL_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

/** Returns scoped CSS selectors for feed surfaces on a supported hostname. */
export function getFeedSelectors(hostname: string): string[] {
  const matchedHost = SOCIAL_HOSTS.find((host) => hostname === host || hostname.endsWith(`.${host}`));
  if (!matchedHost) {
    return [];
  }

  return FEED_RULES[matchedHost] ?? [];
}

/**
 * Selectors actually hidden for a given intensity: none when "full", the first
 * (least aggressive) selector when "limited", all of them otherwise.
 */
export function getEffectiveFeedSelectors(hostname: string, intensity: FeedIntensity): string[] {
  if (intensity === "full") {
    return [];
  }

  const selectors = getFeedSelectors(hostname);
  if (selectors.length === 0) {
    return [];
  }

  return intensity === "limited" ? selectors.slice(0, 1) : selectors;
}

/** Builds feed-hiding CSS only when a supported hostname has known selectors. */
export function buildFeedCleanerCss(hostname: string, intensity: FeedIntensity): string {
  const effectiveSelectors = getEffectiveFeedSelectors(hostname, intensity);
  if (effectiveSelectors.length === 0) {
    return "";
  }

  // The user-facing notice is rendered as a real DOM node by the content script
  // (see content.ts) so it is exposed to assistive tech and dismissible, rather
  // than as inaccessible CSS `content` text on body::before.
  return `${effectiveSelectors.join(",")} { display: none !important; }`;
}

/**
 * Counts how many feed elements the effective selectors currently match in the
 * given root. Used by the content script to detect selector rot (a supported
 * site changed its markup) so it can warn the user instead of silently failing.
 */
export function countFeedMatches(root: ParentNode, hostname: string, intensity: FeedIntensity): number {
  let count = 0;
  for (const selector of getEffectiveFeedSelectors(hostname, intensity)) {
    try {
      count += root.querySelectorAll(selector).length;
    } catch {
      // Malformed selector: treat as no match rather than throwing.
    }
  }
  return count;
}
