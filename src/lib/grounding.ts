/**
 * The grounding overlay: a motion-free breathing timer plus the 5-4-3-2-1 flow.
 * Self-contained — it owns its own DOM, focus trap and interval, and knows
 * nothing about feeds, rules or settings.
 */
let overlay: HTMLDivElement | null = null;
let breathTimer: number | null = null;
let previousFocusedElement: HTMLElement | null = null;

const BREATH_PHASES = [
  { label: "Breathe in", seconds: 4 },
  { label: "Hold", seconds: 4 },
  { label: "Breathe out", seconds: 4 }
];
const BREATH_ROUNDS = 4;

function stopBreathingGuide(): void {
  if (breathTimer !== null) {
    window.clearInterval(breathTimer);
    breathTimer = null;
  }
}

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

  breathTimer = window.setInterval(() => {
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

function closeGroundingOverlay(): void {
  if (!overlay) {
    return;
  }

  stopBreathingGuide();
  document.removeEventListener("keydown", handleOverlayKeydown);
  overlay.remove();
  overlay = null;
  previousFocusedElement?.focus();
  previousFocusedElement = null;
}

function handleOverlayKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    closeGroundingOverlay();
    return;
  }

  if (event.key !== "Tab" || !overlay) {
    return;
  }

  // Trap focus inside the modal so Tab cannot reach the page behind it.
  const focusable = Array.from(
    overlay.querySelectorAll<HTMLElement>(
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
  const outside = !(active instanceof HTMLElement) || !overlay.contains(active);

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
  const root = document.createElement("div");
  root.id = "cocoon-grounding";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "cocoon-grounding-title");
  root.style.cssText =
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

  panel.querySelector<HTMLButtonElement>("#cocoon-close")?.addEventListener("click", closeGroundingOverlay);

  root.addEventListener("click", (event) => {
    if (event.target === root) {
      closeGroundingOverlay();
    }
  });

  root.appendChild(panel);
  startBreathingGuide(panel);
  return root;
}

export function openGroundingOverlay(): void {
  if (overlay) {
    return;
  }

  previousFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  overlay = createGroundingOverlay();
  document.body.appendChild(overlay);
  document.addEventListener("keydown", handleOverlayKeydown);
  overlay.querySelector<HTMLButtonElement>("#cocoon-close")?.focus();
}
