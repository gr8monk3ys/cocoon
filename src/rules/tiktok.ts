import type { HostRules } from "./types";

export const TIKTOK_RULES: HostRules = {
  host: "tiktok.com",
  rules: [
    {
      id: "tiktok.recommendList",
      label: "For You list",
      intensity: "limited",
      selector: "[data-e2e='recommend-list']"
    },
    {
      id: "tiktok.feedItems",
      label: "Individual feed videos",
      intensity: "none",
      selector: "div[data-e2e='video-feed-item']"
    }
  ]
};
