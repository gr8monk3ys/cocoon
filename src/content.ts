import { buildFeedCleanerCss, supportsFeedCleaner } from "./lib/feedRules";
import { getFeedIntensityForHost, getSettings } from "./lib/settings";
import type { CocoonMessage, CocoonSettings } from "./lib/types";

let styleTag: HTMLStyleElement | null = null;
let groundingOverlay: HTMLDivElement | null = null;
let previousFocusedElement: HTMLElement | null = null;
let currentSettings: CocoonSettings | null = null;

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
    rules.push("img, video { filter: invert(1) hue-rotate(180deg); }");
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

  document.removeEventListener("keydown", handleOverlayKeydown);
  groundingOverlay.remove();
  groundingOverlay = null;
  previousFocusedElement?.focus();
  previousFocusedElement = null;
}

function handleOverlayKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    closeGroundingOverlay();
  }
}

function createGroundingOverlay(): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.id = "cocoon-grounding";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "cocoon-grounding-title");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;background:rgba(10,10,10,0.6);display:flex;align-items:center;justify-content:center;";

  const panel = document.createElement("div");
  panel.style.cssText =
    "max-width:420px;background:#fff;padding:20px;border-radius:10px;font-family:system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,0.2);";

  panel.innerHTML = `
    <h2 id="cocoon-grounding-title" style="margin:0 0 8px;">60-second reset</h2>
    <p style="margin:0 0 12px;line-height:1.4;">Breathe in for 4, hold for 4, breathe out for 4. Repeat 4 rounds.</p>
    <ol style="margin:0 0 16px;padding-left:18px;line-height:1.5;">
      <li>Name 5 things you can see.</li>
      <li>Name 4 things you can feel.</li>
      <li>Name 3 things you can hear.</li>
      <li>Name 2 things you can smell.</li>
      <li>Name 1 thing you can taste.</li>
    </ol>
    <button id="cocoon-close" type="button" style="border:0;background:#2457ff;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer;">Continue browsing</button>
  `;

  const closeButton = panel.querySelector<HTMLButtonElement>("#cocoon-close");
  closeButton?.addEventListener("click", closeGroundingOverlay);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeGroundingOverlay();
    }
  });

  overlay.appendChild(panel);
  return overlay;
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

function applySettings(settings: CocoonSettings): void {
  currentSettings = settings;
  const style = ensureStyleTag();
  style.textContent = buildCss(settings);
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
