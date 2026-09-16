import { countFeedMatches, findDeadFeedSelectors } from "./pageDom";
import type { PagePlan } from "./pagePlan";
import { bannerStore } from "./store";

type BannerKind = "filtered" | "rot";

let banner: HTMLDivElement | null = null;
let bannerKind: BannerKind | null = null;
let dismissedThisPage = false;
let checkToken = 0;
let partialRotReported = false;
let hostname = "";

function removeBanner(): void {
  banner?.remove();
  banner = null;
  bannerKind = null;
}

function setBanner(message: string, kind: BannerKind): void {
  // Once dismissed, stay dismissed for the lifetime of this page (a later
  // settings save must not resurrect the banner).
  if (dismissedThisPage || !document.body) {
    return;
  }

  if (!banner) {
    banner = document.createElement("div");
    banner.id = "cocoon-feed-banner";
    banner.setAttribute("role", "status");
    banner.style.cssText =
      "display:flex;align-items:center;gap:12px;padding:12px 14px;margin:12px;border-radius:10px;" +
      "font-family:system-ui,sans-serif;font-size:14px;background:#eef1fe;color:#20264a;" +
      "border:1px solid #c7cdf4;box-shadow:0 2px 8px rgba(32,38,74,0.08);max-width:460px;";

    const text = document.createElement("span");
    text.id = "cocoon-feed-banner-text";
    banner.appendChild(text);

    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.textContent = "Dismiss";
    dismiss.setAttribute("aria-label", "Dismiss Cocoon feed notice");
    dismiss.style.cssText =
      "margin-left:auto;border:0;background:#3b4ac4;color:#fff;padding:5px 12px;border-radius:999px;cursor:pointer;font-size:13px;";
    dismiss.addEventListener("click", () => {
      dismissedThisPage = true;
      // A dismissed rot warning stays dismissed on future visits to this host.
      if (bannerKind === "rot") {
        void bannerStore.mark(hostname, { rotDismissedAt: Date.now() });
      }
      removeBanner();
    });
    banner.appendChild(dismiss);

    document.body.prepend(banner);
  }

  bannerKind = kind;
  const text = banner.querySelector("#cocoon-feed-banner-text");
  if (text) {
    text.textContent = message;
  }
}

/**
 * Reports *partial* rot — some feed selectors for this host are dead while
 * others still match — to the console, once per page load.
 *
 * Deliberately not a banner. When one selector still matches, the feed is still
 * being hidden, so the feature is working from the user's point of view and a
 * warning would be pure noise, which is exactly the wrong thing to hand someone
 * using a calm-focused extension. The audience for partial rot is whoever
 * maintains the rules, so it goes where a maintainer or bug reporter will look
 * and a user never will.
 */
function reportPartialRot(plan: PagePlan): void {
  if (partialRotReported) {
    return;
  }
  const dead = findDeadFeedSelectors(document, plan);
  if (dead.length === 0) {
    return;
  }
  partialRotReported = true;
  console.warn(
    `[Cocoon] ${dead.length} feed selector(s) for ${plan.hostname} no longer match anything, ` +
      `though the feed is still being hidden by the rest. Please report this: ${dead.join(", ")}`
  );
}

/**
 * Reconciles the banner with a plan.
 *
 * A plan with no checkable rules — the feed cleaner is off here, or every
 * active rule is scoped to a different page kind — means there is nothing to
 * verify, so any pending check is cancelled and no banner shows either way.
 *
 * Otherwise: if the plan's selectors match, confirm once per host ever; if they
 * match nothing, warn that the layout likely changed, until the user dismisses
 * it. Re-checks twice because social SPAs render their feed asynchronously.
 */
export function updateFeedBanner(plan: PagePlan): void {
  hostname = plan.hostname;

  if (plan.checkableRules.length === 0) {
    checkToken += 1; // cancel any pending re-checks
    removeBanner();
    return;
  }

  const token = ++checkToken;
  const check = async (): Promise<void> => {
    if (token !== checkToken) {
      return; // superseded by a newer plan
    }
    const matched = countFeedMatches(document, plan) > 0;
    const state = (await bannerStore.read())[plan.hostname] ?? {};
    if (token !== checkToken) {
      return; // the plan changed while we read storage
    }

    if (matched) {
      reportPartialRot(plan);
      if (!state.filteredShownAt) {
        setBanner(`Cocoon: feed filtered on this site (${plan.intensity}).`, "filtered");
        void bannerStore.mark(plan.hostname, { filteredShownAt: Date.now() });
      } else if (bannerKind === "rot") {
        // A late-rendering feed was found after an early rot warning: clear it.
        removeBanner();
      }
      return;
    }

    if (!state.rotDismissedAt) {
      setBanner("Cocoon: couldn't find this site's feed to filter — the page layout may have changed.", "rot");
    }
  };

  void check();
  window.setTimeout(() => void check(), 1500);
  window.setTimeout(() => void check(), 4000);
}
