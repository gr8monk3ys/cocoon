import type { HostRules } from "./types";

export const YOUTUBE_RULES: HostRules = {
  host: "youtube.com",
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
    }
  ]
};
