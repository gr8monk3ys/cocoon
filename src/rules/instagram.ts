import type { HostRules } from "./types";

// Ported from feedless (src/features/instagram.ts), which was verified against
// the live site in July 2026. Engagement rules (like counts, comments, badges)
// were left behind: Cocoon hides feed surfaces, not social signals.
export const INSTAGRAM_RULES: HostRules = {
  host: "instagram.com",
  pages: {
    reels: ["/reels"],
    explore: ["/explore"],
    stories: ["/stories"],
    post: ["/p/"]
  },
  rules: [
    {
      id: "instagram.feed",
      label: "Home feed",
      intensity: "limited",
      selector: 'main [role="feed"]',
      paths: ["home"]
    },
    {
      id: "instagram.feedPosts",
      label: "Home feed posts",
      intensity: "limited",
      // Scoped to home so a post the user opened directly (/p/...) stays visible.
      selector: "main article",
      paths: ["home"]
    },
    {
      id: "instagram.storiesTray",
      label: "Stories tray",
      intensity: "none",
      selector: "main div:has(> ul li canvas)",
      paths: ["home"]
    },
    {
      id: "instagram.stories",
      label: "Stories viewer",
      intensity: "none",
      selector: "main",
      paths: ["stories"]
    },
    {
      id: "instagram.reelsLink",
      label: "Reels navigation link",
      intensity: "none",
      selector: 'a[href^="/reels"]'
    },
    {
      id: "instagram.reels",
      label: "Reels page",
      intensity: "none",
      selector: "main",
      paths: ["reels"]
    },
    {
      id: "instagram.exploreLink",
      label: "Explore navigation link",
      intensity: "none",
      selector: 'a[href^="/explore"]'
    },
    {
      id: "instagram.explore",
      label: "Explore page",
      intensity: "none",
      selector: "main",
      paths: ["explore"]
    },
    {
      id: "instagram.suggestedAccounts",
      label: "Suggested accounts sidebar",
      intensity: "none",
      selector: 'main div:has(> div a[href^="/explore/people"])',
      paths: ["home"]
    }
  ]
};
