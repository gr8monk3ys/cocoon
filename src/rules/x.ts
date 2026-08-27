import type { HostRules } from "./types";

export const X_RULES: HostRules = {
  host: "x.com",
  aliases: ["twitter.com"],
  rules: [
    {
      id: "x.homeTimeline",
      label: "Home timeline",
      intensity: "limited",
      selector: "[aria-label='Timeline: Your Home Timeline']"
    },
    {
      id: "x.primaryColumn",
      label: "Every region in the primary column",
      intensity: "none",
      selector: "[data-testid='primaryColumn'] [role='region']"
    }
  ]
};
