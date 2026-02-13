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
  "reddit.com": ["shreddit-feed", "[data-testid='post-container']"],
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

/** Builds feed-hiding CSS only when a supported hostname has known selectors. */
export function buildFeedCleanerCss(hostname: string, intensity: FeedIntensity): string {
  if (intensity === "full") {
    return "";
  }

  const selectors = getFeedSelectors(hostname);
  if (selectors.length === 0) {
    return "";
  }

  const effectiveSelectors = intensity === "limited" ? selectors.slice(0, 1) : selectors;

  return `
    ${effectiveSelectors.join(",")} { display: none !important; }
    body::before {
      content: "Cocoon: Feed filtered on this site (${intensity}).";
      display: block;
      padding: 12px;
      margin: 12px;
      border-radius: 8px;
      font-family: system-ui, sans-serif;
      background: #e8f0fe;
      color: #1f1f1f;
      max-width: 460px;
    }
  `;
}
