import type { HostRules } from "./types";

// Ported from feedless (src/features/facebook.ts), verified live July 2026.
// The old `div[data-pagelet='FeedUnit']` rule was dropped: it is pre-2022
// markup and matched nothing.
export const FACEBOOK_RULES: HostRules = {
  host: "facebook.com",
  pages: {
    reels: ["/reel"],
    stories: ["/stories"],
    watch: ["/watch"]
  },
  rules: [
    {
      id: "facebook.feed",
      label: "News feed (legacy layout)",
      intensity: "limited",
      // Facebook removed role="feed" (observed live 2026-07-09). Kept as a
      // fallback for accounts still on the older layout.
      selector: 'div[role="feed"]',
      paths: ["home"],
      mayBeAbsent: true
    },
    {
      id: "facebook.feedPosts",
      label: "News feed",
      intensity: "limited",
      paths: ["home"],
      // The current feed container is only identifiable by its screen-reader
      // heading (<h3>Feed posts</h3>), which CSS cannot match by text — the
      // marker observer stamps it instead.
      mark: {
        containerSelector: 'div[role="main"]',
        unitSelector: "div:has(> h3)",
        textAnchors: ["Feed posts"]
      }
    },
    {
      id: "facebook.storiesRow",
      label: "Stories row",
      intensity: "none",
      selector: 'div[aria-label="Stories"]'
    },
    {
      id: "facebook.stories",
      label: "Stories viewer",
      intensity: "none",
      selector: 'div[role="main"]',
      paths: ["stories"]
    },
    {
      id: "facebook.reelsLink",
      label: "Reels links",
      intensity: "none",
      selector: 'a[href^="/reel"]'
    },
    {
      id: "facebook.reels",
      label: "Reels page",
      intensity: "none",
      selector: 'div[role="main"]',
      paths: ["reels"]
    },
    {
      id: "facebook.watchLink",
      label: "Watch navigation link",
      intensity: "none",
      selector: 'a[href^="/watch"]',
      mayBeAbsent: true
    },
    {
      id: "facebook.watch",
      label: "Watch page",
      intensity: "none",
      selector: 'div[role="main"]',
      paths: ["watch"],
      mayBeAbsent: true
    },
    {
      id: "facebook.rightRail",
      label: "Right rail (sponsored, contacts)",
      intensity: "none",
      selector: 'div[role="complementary"]',
      paths: ["home"]
    }
  ]
};
