// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openGroundingOverlay } from "./grounding";

// One full guide: 4 rounds x (in 4s + hold 4s + out 4s).
const FULL_GUIDE_SECONDS = 4 * 3 * 4;

function cue(): string {
  return document.getElementById("cocoon-breath-cue")?.textContent ?? "";
}

function closeButton(): HTMLButtonElement {
  return document.getElementById("cocoon-close") as HTMLButtonElement;
}

function advanceSeconds(seconds: number): void {
  vi.advanceTimersByTime(seconds * 1000);
}

describe("grounding breathing guide", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    // Close through the UI so the module-level overlay state resets between tests.
    document.getElementById("cocoon-close")?.click();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("counts down each phase and moves through in, hold, out", () => {
    openGroundingOverlay();
    expect(cue()).toBe("Round 1 of 4 — Breathe in (4)");

    advanceSeconds(1);
    expect(cue()).toBe("Round 1 of 4 — Breathe in (3)");

    advanceSeconds(3);
    expect(cue()).toBe("Round 1 of 4 — Hold (4)");

    advanceSeconds(4);
    expect(cue()).toBe("Round 1 of 4 — Breathe out (4)");

    advanceSeconds(4);
    expect(cue()).toBe("Round 2 of 4 — Breathe in (4)");
  });

  it("finishes after four rounds and stops ticking", () => {
    openGroundingOverlay();

    advanceSeconds(FULL_GUIDE_SECONDS - 1);
    expect(cue()).toBe("Round 4 of 4 — Breathe out (1)");

    const clearInterval = vi.spyOn(window, "clearInterval");
    advanceSeconds(1);
    expect(cue()).toBe("Nice work — take that calm with you.");
    expect(clearInterval).toHaveBeenCalledTimes(1);

    // Nothing restarts it: the closing line stays put.
    advanceSeconds(30);
    expect(cue()).toBe("Nice work — take that calm with you.");
  });

  it("stops the timer when closed mid-guide and restarts from round 1 on reopen", () => {
    openGroundingOverlay();
    advanceSeconds(13);
    const firstCue = document.getElementById("cocoon-breath-cue") as HTMLElement;
    expect(firstCue.textContent).toBe("Round 2 of 4 — Breathe in (3)");

    closeButton().click();
    expect(document.getElementById("cocoon-grounding")).toBeNull();

    // A leaked interval would keep rewriting the detached cue.
    advanceSeconds(10);
    expect(firstCue.textContent).toBe("Round 2 of 4 — Breathe in (3)");

    openGroundingOverlay();
    expect(cue()).toBe("Round 1 of 4 — Breathe in (4)");
    advanceSeconds(1);
    expect(cue()).toBe("Round 1 of 4 — Breathe in (3)");
  });

  it("does not start a second timer when opened while already open", () => {
    const setInterval = vi.spyOn(window, "setInterval");
    openGroundingOverlay();
    openGroundingOverlay();

    expect(document.querySelectorAll("#cocoon-grounding")).toHaveLength(1);
    expect(setInterval).toHaveBeenCalledTimes(1);

    // One tick per second, not two.
    advanceSeconds(1);
    expect(cue()).toBe("Round 1 of 4 — Breathe in (3)");
  });

  it("closes on a backdrop click but not on a click inside the panel", () => {
    openGroundingOverlay();
    const overlay = document.getElementById("cocoon-grounding") as HTMLDivElement;

    (document.getElementById("cocoon-grounding-title") as HTMLElement).click();
    expect(document.getElementById("cocoon-grounding")).not.toBeNull();

    const clearInterval = vi.spyOn(window, "clearInterval");
    overlay.click();
    expect(document.getElementById("cocoon-grounding")).toBeNull();
    expect(clearInterval).toHaveBeenCalledTimes(1);
  });
});
