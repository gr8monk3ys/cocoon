import {
  buildFeedCleanerCss,
  countFeedMatches,
  findDeadFeedSelectors,
  supportsFeedCleaner
} from "./lib/feedRules";
import { getFeedIntensityForHost, getSettings } from "./lib/settings";
import type { CocoonMessage, CocoonSettings, FeedIntensity } from "./lib/types";

let styleTag: HTMLStyleElement | null = null;
let groundingOverlay: HTMLDivElement | null = null;
let groundingTimer: number | null = null;
let previousFocusedElement: HTMLElement | null = null;
let currentSettings: CocoonSettings | null = null;
let feedBanner: HTMLDivElement | null = null;
let feedBannerKind: BannerKind | null = null;
let feedBannerDismissed = false;
let feedCheckToken = 0;
let partialRotReported = false;

/**
 * Per-host banner history, persisted separately from settings so the
 * confirmation banner shows once per host ever and a dismissed rot warning
 * stays dismissed across page loads. For a calm-focused extension, a banner
 * that reappears on every navigation is itself a stressor.
 */
const BANNER_STATE_KEY = "bannerState";

type BannerKind = "filtered" | "rot";

interface HostBannerState {
  filteredShownAt?: number;
  rotDismissedAt?: number;
}

async function readBannerState(): Promise<Record<string, HostBannerState>> {
  try {
    const result = await chrome.storage.local.get(BANNER_STATE_KEY);
    const raw = result[BANNER_STATE_KEY];
    return raw && typeof raw === "object" ? (raw as Record<string, HostBannerState>) : {};
  } catch {
    return {};
  }
}

async function markBannerState(hostname: string, patch: HostBannerState): Promise<void> {
  const state = await readBannerState();
  const next = { ...state, [hostname]: { ...state[hostname], ...patch } };
  try {
    await chrome.storage.local.set({ [BANNER_STATE_KEY]: next });
  } catch {
    // Storage unavailable: banner history just won't persist this time.
  }
}

function ensureStyleTag(): HTMLStyleElement {
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "cocoon-style";
    document.documentElement.appendChild(styleTag);
  }

  return styleTag;
}

function buildCss(settings: CocoonSettings): string {
  const rules: string[] = [];
  const hostname = window.location.hostname;

  if (settings.darkMode) {
    rules.push("html { filter: invert(0.93) hue-rotate(180deg); background: #121212 !important; }");
    // Re-invert media so photos/video/graphics keep their true colors. This is
    // a heuristic; it covers inline background-image elements but not every
    // CSS-painted surface.
    rules.push(
      'img, picture, video, canvas, svg, [style*="background-image"] { filter: invert(1) hue-rotate(180deg); }'
    );
  }

  if (settings.reduceMotion) {
    rules.push(`
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
    `);
  }

  if (supportsFeedCleaner(hostname)) {
    const intensity = getFeedIntensityForHost(settings, hostname);
    rules.push(buildFeedCleanerCss(hostname, intensity));
  }

  return rules.join("\n");
}

function closeGroundingOverlay(): void {
  if (!groundingOverlay) {
    return;
  }

  stopBreathingGuide();
  document.removeEventListener("keydown", handleOverlayKeydown);
  groundingOverlay.remove();
  groundingOverlay = null;
  previousFocusedElement?.focus();
  previousFocusedElement = null;
}

function handleOverlayKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    closeGroundingOverlay();
    return;
  }

  if (event.key !== "Tab" || !groundingOverlay) {
    return;
  }

  // Trap focus inside the modal so Tab cannot reach the page behind it.
  const focusable = Array.from(
    groundingOverlay.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  );
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  const outside = !(active instanceof HTMLElement) || !groundingOverlay.contains(active);

  if (outside) {
    event.preventDefault();
    first.focus();
  } else if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function createGroundingOverlay(): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.id = "cocoon-grounding";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "cocoon-grounding-title");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;background:rgba(23,26,47,0.55);display:flex;align-items:center;justify-content:center;";

  const panel = document.createElement("div");
  panel.style.cssText =
    "max-width:420px;background:#fdfdff;color:#20264a;padding:24px;border-radius:14px;" +
    "font-family:system-ui,sans-serif;box-shadow:0 18px 50px rgba(23,26,47,0.35);border:1px solid #e3e6f7;";

  panel.innerHTML = `
    <h2 id="cocoon-grounding-title" style="margin:0 0 8px;font-size:20px;color:#20264a;">60-second reset</h2>
    <p id="cocoon-breath-cue" aria-live="polite" style="margin:0 0 12px;line-height:1.4;font-weight:600;min-height:1.4em;color:#3b4ac4;">Breathe in for 4, hold for 4, breathe out for 4.</p>
    <ol style="margin:0 0 16px;padding-left:18px;line-height:1.5;">
      <li>Name 5 things you can see.</li>
      <li>Name 4 things you can feel.</li>
      <li>Name 3 things you can hear.</li>
      <li>Name 2 things you can smell.</li>
      <li>Name 1 thing you can taste.</li>
    </ol>
    <button id="cocoon-close" type="button" style="border:0;background:#3b4ac4;color:#fff;padding:9px 16px;border-radius:999px;cursor:pointer;font-size:14px;">Continue browsing</button>
  `;

  const closeButton = panel.querySelector<HTMLButtonElement>("#cocoon-close");
  closeButton?.addEventListener("click", closeGroundingOverlay);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeGroundingOverlay();
    }
  });

  overlay.appendChild(panel);
  startBreathingGuide(panel);
  return overlay;
}

const BREATH_PHASES = [
  { label: "Breathe in", seconds: 4 },
  { label: "Hold", seconds: 4 },
  { label: "Breathe out", seconds: 4 }
];
const BREATH_ROUNDS = 4;

// Text-only guided breathing: updates an aria-live cue each second. No CSS
// animation, so it stays compatible with the reduce-motion goal.
function startBreathingGuide(panel: HTMLElement): void {
  const cue = panel.querySelector<HTMLElement>("#cocoon-breath-cue");
  if (!cue) {
    return;
  }

  let round = 1;
  let phase = 0;
  let remaining = BREATH_PHASES[0].seconds;
  const render = (): void => {
    cue.textContent = `Round ${round} of ${BREATH_ROUNDS} — ${BREATH_PHASES[phase].label} (${remaining})`;
  };
  render();

  groundingTimer = window.setInterval(() => {
    remaining -= 1;
    if (remaining > 0) {
      render();
      return;
    }

    phase += 1;
    if (phase >= BREATH_PHASES.length) {
      phase = 0;
      round += 1;
    }
    if (round > BREATH_ROUNDS) {
      cue.textContent = "Nice work — take that calm with you.";
      stopBreathingGuide();
      return;
    }
    remaining = BREATH_PHASES[phase].seconds;
    render();
  }, 1000);
}

function stopBreathingGuide(): void {
  if (groundingTimer !== null) {
    window.clearInterval(groundingTimer);
    groundingTimer = null;
  }
}

function openGroundingOverlay(): void {
  if (groundingOverlay) {
    return;
  }

  previousFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  groundingOverlay = createGroundingOverlay();
  document.body.appendChild(groundingOverlay);
  document.addEventListener("keydown", handleOverlayKeydown);

  const closeButton = groundingOverlay.querySelector<HTMLButtonElement>("#cocoon-close");
  closeButton?.focus();
}

function removeFeedBanner(): void {
  feedBanner?.remove();
  feedBanner = null;
  feedBannerKind = null;
}

function setFeedBanner(message: string, kind: BannerKind): void {
  // Once dismissed, stay dismissed for the lifetime of this page (a later
  // settings save must not resurrect the banner).
  if (feedBannerDismissed || !document.body) {
    return;
  }

  if (!feedBanner) {
    feedBanner = document.createElement("div");
    feedBanner.id = "cocoon-feed-banner";
    feedBanner.setAttribute("role", "status");
    feedBanner.style.cssText =
      "display:flex;align-items:center;gap:12px;padding:12px 14px;margin:12px;border-radius:10px;" +
      "font-family:system-ui,sans-serif;font-size:14px;background:#eef1fe;color:#20264a;" +
      "border:1px solid #c7cdf4;box-shadow:0 2px 8px rgba(32,38,74,0.08);max-width:460px;";

    const text = document.createElement("span");
    text.id = "cocoon-feed-banner-text";
    feedBanner.appendChild(text);

    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.textContent = "Dismiss";
    dismiss.setAttribute("aria-label", "Dismiss Cocoon feed notice");
    dismiss.style.cssText =
      "margin-left:auto;border:0;background:#3b4ac4;color:#fff;padding:5px 12px;border-radius:999px;cursor:pointer;font-size:13px;";
    dismiss.addEventListener("click", () => {
      feedBannerDismissed = true;
      // A dismissed rot warning stays dismissed on future visits to this host.
      if (feedBannerKind === "rot") {
        void markBannerState(window.location.hostname, { rotDismissedAt: Date.now() });
      }
      removeFeedBanner();
    });
    feedBanner.appendChild(dismiss);

    document.body.prepend(feedBanner);
  }

  feedBannerKind = kind;
  const text = feedBanner.querySelector("#cocoon-feed-banner-text");
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
 * warning would be pure noise. `docs/BRAND.md` treats an unnecessary banner as a
 * stressor, which is exactly the wrong thing to hand someone using a calm-focused
 * extension. The audience for partial rot is whoever maintains `FEED_RULES`, so
 * it goes where a maintainer or bug reporter will look and a user never will.
 */
function reportPartialRot(hostname: string, intensity: FeedIntensity): void {
  if (partialRotReported) {
    return;
  }
  const dead = findDeadFeedSelectors(document, hostname, intensity);
  if (dead.length === 0) {
    return;
  }
  partialRotReported = true;
  console.warn(
    `[Cocoon] ${dead.length} feed selector(s) for ${hostname} no longer match anything, ` +
      `though the feed is still being hidden by the rest. Please report this: ${dead.join(", ")}`
  );
}

// Detects selector rot: if the effective selectors match nothing on a supported
// host, tell the user the layout likely changed instead of failing silently.
// Re-checks shortly after because social SPAs render their feed asynchronously.
// Persistence rules: the "feed filtered" confirmation shows once per host ever;
// the rot warning shows until the user dismisses it, then stays dismissed.
function evaluateFeedBanner(hostname: string, intensity: FeedIntensity): void {
  const token = ++feedCheckToken;

  const check = async (): Promise<void> => {
    if (token !== feedCheckToken) {
      return; // superseded by a newer settings application
    }
    const matched = countFeedMatches(document, hostname, intensity) > 0;
    const state = (await readBannerState())[hostname] ?? {};
    if (token !== feedCheckToken) {
      return; // settings changed while we read storage
    }

    if (matched) {
      reportPartialRot(hostname, intensity);
      if (!state.filteredShownAt) {
        setFeedBanner(`Cocoon: feed filtered on this site (${intensity}).`, "filtered");
        void markBannerState(hostname, { filteredShownAt: Date.now() });
      } else if (feedBannerKind === "rot") {
        // A late-rendering feed was found after an early rot warning: clear it.
        removeFeedBanner();
      }
      return;
    }

    if (!state.rotDismissedAt) {
      setFeedBanner(
        "Cocoon: couldn't find this site's feed to filter — the page layout may have changed.",
        "rot"
      );
    }
  };

  void check();
  window.setTimeout(() => void check(), 1500);
  window.setTimeout(() => void check(), 4000);
}

function applySettings(settings: CocoonSettings): void {
  currentSettings = settings;
  const style = ensureStyleTag();
  style.textContent = buildCss(settings);

  const hostname = window.location.hostname;
  const intensity = supportsFeedCleaner(hostname) ? getFeedIntensityForHost(settings, hostname) : "full";
  if (intensity === "full") {
    feedCheckToken++; // cancel any pending re-checks
    removeFeedBanner();
  } else {
    evaluateFeedBanner(hostname, intensity);
  }
}

chrome.runtime.onMessage.addListener((message: CocoonMessage) => {
  if (message.type === "COCOON_APPLY_SETTINGS") {
    applySettings(message.payload);
  }

  if (message.type === "COCOON_OPEN_GROUNDING" && currentSettings?.enableGroundingTool) {
    openGroundingOverlay();
  }
});

void getSettings().then(applySettings);
