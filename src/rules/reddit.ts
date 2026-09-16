import type { HostRules } from "./types";

export const REDDIT_RULES: HostRules = {
  host: "reddit.com",
  rules: [
    {
      id: "reddit.feed",
      label: "Feed listing",
      intensity: "limited",
      // `[data-testid='post-container']` was removed: it is from Reddit's
      // pre-shreddit markup and matches nothing on the current site (verified
      // 2026-08-08 on the home feed, a subreddit listing, and a post page). It
      // is NOT replaced with `shreddit-post`, the obvious modern equivalent,
      // because that matches the single post on a comments page too — hiding
      // the exact post the user just opened. `shreddit-feed` is absent on post
      // pages, so it stays correctly scoped to feed surfaces on its own.
      selector: "shreddit-feed"
    }
  ]
};
