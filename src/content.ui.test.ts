// @vitest-environment jsdom
// @vitest-environment-options {"url": "https://www.reddit.com/"}
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "./lib/types";

type MessageListener = (message: unknown) => void;

function createChromeMock(initialStore: Record<string, unknown> = {}) {
  let listener: MessageListener | null = null;
  const store: Record<string, unknown> = { settings: DEFAULT_SETTINGS, ...initialStore };

  const chromeMock = {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store[key] })),
        set: vi.fn(async (value: Record<string, unknown>) => {
          Object.assign(store, value);
        })
      }
    },
    runtime: {
      onMessage: {
        addListener: vi.fn((cb: MessageListener) => {
          listener = cb;
        })
      }
    }
  } as unknown as typeof chrome;

  return {
    chromeMock,
    store,
    send(message: unknown) {
      listener?.(message);
    }
  };
}

// Grounding tests run with the feed cleaner off so they don't schedule banner
// re-checks (real timers) that could leak into the banner tests below.
const NO_FEED_SETTINGS = { ...DEFAULT_SETTINGS, feedIntensity: "full" as const, hideAlgorithmicFeeds: false };

describe("content grounding accessibility", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.body.innerHTML = '<button id="origin">Focus origin</button>';
    const originButton = document.getElementById("origin") as HTMLButtonElement;
    originButton.focus();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens dialog with semantics and restores focus on escape", async () => {
    const { chromeMock, send } = createChromeMock({ settings: NO_FEED_SETTINGS });
    vi.stubGlobal("chrome", chromeMock);

    await import("./content");

    send({ type: "COCOON_APPLY_SETTINGS", payload: { ...NO_FEED_SETTINGS, enableGroundingTool: true } });
    send({ type: "COCOON_OPEN_GROUNDING" });

    const overlay = document.getElementById("cocoon-grounding") as HTMLDivElement;
    expect(overlay).toBeTruthy();
    expect(overlay.getAttribute("role")).toBe("dialog");
    expect(overlay.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement?.id).toBe("cocoon-close");
    expect(overlay.querySelector("#cocoon-breath-cue")?.textContent).toContain("Round 1 of 4");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(document.getElementById("cocoon-grounding")).toBeNull();
    expect(document.activeElement?.id).toBe("origin");
  });

  it("traps Tab focus inside the dialog", async () => {
    const { chromeMock, send } = createChromeMock({ settings: NO_FEED_SETTINGS });
    vi.stubGlobal("chrome", chromeMock);

    await import("./content");

    send({ type: "COCOON_APPLY_SETTINGS", payload: { ...NO_FEED_SETTINGS, enableGroundingTool: true } });
    send({ type: "COCOON_OPEN_GROUNDING" });

    // Simulate focus escaping to the page behind the modal, then press Tab.
    (document.getElementById("origin") as HTMLButtonElement).focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

    // Focus is pulled back into the dialog instead of staying on the page.
    expect(document.activeElement?.id).toBe("cocoon-close");
  });
});

describe("content feed banner persistence", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function bannerText(): string | null {
    return document.querySelector("#cocoon-feed-banner-text")?.textContent ?? null;
  }

  it("shows the filtered confirmation once per host, not on later page loads", async () => {
    vi.useFakeTimers();
    const { chromeMock, store } = createChromeMock();
    vi.stubGlobal("chrome", chromeMock);
    // Feed element present: the cleaner finds its target.
    document.body.innerHTML = "<shreddit-feed></shreddit-feed>";

    await import("./content");
    await vi.advanceTimersByTimeAsync(10);

    expect(bannerText()).toContain("feed filtered on this site");
    const state = store.bannerState as Record<string, { filteredShownAt?: number }>;
    expect(state["www.reddit.com"]?.filteredShownAt).toBeTypeOf("number");

    // Let all delayed re-checks run inside this test so nothing leaks.
    await vi.advanceTimersByTimeAsync(5000);

    // Second page load on the same host: confirmation stays quiet.
    vi.resetModules();
    document.body.innerHTML = "<shreddit-feed></shreddit-feed>";
    await import("./content");
    await vi.advanceTimersByTimeAsync(5000);

    expect(document.getElementById("cocoon-feed-banner")).toBeNull();
  });

  it("shows the rot warning when no feed matches, and dismissal persists across loads", async () => {
    vi.useFakeTimers();
    const { chromeMock, store } = createChromeMock();
    vi.stubGlobal("chrome", chromeMock);
    // No feed element: selectors match nothing (layout-changed scenario).

    await import("./content");
    await vi.advanceTimersByTimeAsync(10);

    expect(bannerText()).toContain("couldn't find this site's feed");

    const dismiss = document.querySelector<HTMLButtonElement>("#cocoon-feed-banner button");
    dismiss?.click();
    await vi.advanceTimersByTimeAsync(10);

    expect(document.getElementById("cocoon-feed-banner")).toBeNull();
    const state = store.bannerState as Record<string, { rotDismissedAt?: number }>;
    expect(state["www.reddit.com"]?.rotDismissedAt).toBeTypeOf("number");

    await vi.advanceTimersByTimeAsync(5000);

    // Next page load: the dismissed warning does not come back.
    vi.resetModules();
    document.body.innerHTML = "";
    await import("./content");
    await vi.advanceTimersByTimeAsync(5000);

    expect(document.getElementById("cocoon-feed-banner")).toBeNull();
  });
});
