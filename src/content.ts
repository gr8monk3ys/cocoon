import { updateFeedBanner } from "./lib/banner";
import { openGroundingOverlay } from "./lib/grounding";
import { applyPlan } from "./lib/pageDom";
import { planPage } from "./lib/pagePlan";
import { getSettings } from "./lib/settings";
import type { CocoonMessage, CocoonSettings } from "./lib/types";

let currentSettings: CocoonSettings | null = null;
let lastPathname: string | null = null;

/**
 * Decide, then touch. `planPage` resolves the host, the override, the page kind
 * and the stylesheet with no side effects; `applyPlan` and `updateFeedBanner`
 * are the only things that reach the document.
 */
function apply(settings: CocoonSettings): void {
  currentSettings = settings;
  lastPathname = window.location.pathname;

  const plan = planPage(window.location.hostname, window.location.pathname, settings);
  applyPlan(plan);
  updateFeedBanner(plan);
}

// Social sites are SPAs: the content script loads once and the URL then moves
// under it. Content scripts cannot observe the page's own pushState, so poll
// the pathname cheaply and re-plan when it changes (which re-stamps the path
// attribute and re-runs the rot check for the new page kind).
function watchNavigation(): void {
  const check = (): void => {
    if (currentSettings && lastPathname !== null && window.location.pathname !== lastPathname) {
      apply(currentSettings);
    }
  };
  window.addEventListener("popstate", check);
  window.setInterval(check, 750);
}

chrome.runtime.onMessage.addListener((message: CocoonMessage) => {
  if (message.type === "COCOON_APPLY_SETTINGS") {
    apply(message.payload);
  }

  if (message.type === "COCOON_OPEN_GROUNDING" && currentSettings?.enableGroundingTool) {
    openGroundingOverlay();
  }
});

watchNavigation();
void getSettings().then(apply);
