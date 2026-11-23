import type { HostRules } from "./types";

export const YOUTUBE_RULES: HostRules = {
  host: "youtube.com",
  pages: {
    reels: ["/shorts"]
  },
  rules: [
    {
      id: "youtube.homeGrid",
      label: "Home recommendations grid",
      intensity: "limited",
      selector: "ytd-rich-grid-renderer"
    },
    {
      id: "youtube.homeContents",
      label: "Home page contents",
      intensity: "none",
      selector: "ytd-browse[page-subtype='home'] #contents"
    },
    {
      id: "youtube.shortsShelf",
      label: "Shorts shelf in grids",
      intensity: "none",
      selector: "ytd-rich-shelf-renderer[is-shorts]",
      // Home, Subscriptions and channel grids show it for some accounts only.
      mayBeAbsent: true
    },
    {
      id: "youtube.shortsReelShelf",
      label: "Shorts shelf in search and watch-next",
      intensity: "none",
      selector: "ytd-reel-shelf-renderer",
      mayBeAbsent: true
    },
    {
      id: "youtube.shorts",
      label: "Shorts player",
      intensity: "none",
      selector: "ytd-shorts",
      paths: ["reels"]
    }
  ]
};
