// @vitest-environment jsdom
// @vitest-environment-options {"url": "https://www.reddit.com/"}
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock } from "./test/chromeMock";
import { DEFAULT_SETTINGS } from "./lib/types";

function mockChrome(initialStore: Record<string, unknown> = {}) {
  return createChromeMock({ store: { settings: DEFAULT_SETTINGS, ...initialStore } });
}

// Grounding tests run with the feed cleaner off so they don't schedule banner
// re-checks (real timers) that could leak into the banner tests below.
const NO_FEED_SETTINGS = { ...DEFAULT_SETTINGS, feedIntensity: "full" as const, hideAlgorithmicFeeds: false };

describe("content grounding accessibility", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.body.innerHTML = '<button id="origin">Focus origin</button>';
    (document.getElementById("origin") as HTMLButtonElement).focus();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens dialog with semantics and restores focus on escape", async () => {
    const env = mockChrome({ settings: NO_FEED_SETTINGS });
    vi.stubGlobal("chrome", env.chrome);

    await import("./content");

    env.send({ type: "COCOON_APPLY_SETTINGS", payload: { ...NO_FEED_SETTINGS, enableGroundingTool: true } });
    env.send({ type: "COCOON_OPEN_GROUNDING" });

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
    const env = mockChrome({ settings: NO_FEED_SETTINGS });
    vi.stubGlobal("chrome", env.chrome);

    await import("./content");

    env.send({ type: "COCOON_APPLY_SETTINGS", payload: { ...NO_FEED_SETTINGS, enableGroundingTool: true } });
    env.send({ type: "COCOON_OPEN_GROUNDING" });

    // Simulate focus escaping to the page behind the modal, then press Tab.
    (document.getElementById("origin") as HTMLButtonElement).focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

    // Focus is pulled back into the dialog instead of staying on the page.
    expect(document.activeElement?.id).toBe("cocoon-close");
  });

  it("stays shut when the grounding tool is switched off", async () => {
    const env = mockChrome({ settings: NO_FEED_SETTINGS });
    vi.stubGlobal("chrome", env.chrome);

    await import("./content");

    env.send({ type: "COCOON_APPLY_SETTINGS", payload: { ...NO_FEED_SETTINGS, enableGroundingTool: false } });
    env.send({ type: "COCOON_OPEN_GROUNDING" });

    expect(document.getElementById("cocoon-grounding")).toBeNull();
  });
});

describe("content applies the page plan", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("injects the plan's stylesheet and stamps the page kind", async () => {
    vi.useFakeTimers();
    const env = mockChrome();
    vi.stubGlobal("chrome", env.chrome);

    await import("./content");
    await vi.advanceTimersByTimeAsync(10);

    expect(document.getElementById("cocoon-style")?.textContent).toContain("shreddit-feed");
    expect(document.documentElement.getAttribute("data-cocoon-path")).toBe("home");

    await vi.advanceTimersByTimeAsync(5000);
  });

  it("re-plans when the SPA navigates under it", async () => {
    vi.useFakeTimers();
    const env = mockChrome();
    vi.stubGlobal("chrome", env.chrome);

    await import("./content");
    await vi.advanceTimersByTimeAsync(10);
    expect(document.documentElement.getAttribute("data-cocoon-path")).toBe("home");

    // A content script cannot see the page's own pushState, so the pathname is
    // polled. Reddit declares no page prefixes, so a subreddit is "other".
    window.history.pushState({}, "", "/r/foo/");
    await vi.advanceTimersByTimeAsync(800);

    expect(document.documentElement.getAttribute("data-cocoon-path")).toBe("other");
    await vi.advanceTimersByTimeAsync(5000);
  });

  it("writes the sensory css the settings ask for", async () => {
    vi.useFakeTimers();
    const env = mockChrome({ settings: { ...NO_FEED_SETTINGS, darkMode: true, reduceMotion: true } });
    vi.stubGlobal("chrome", env.chrome);

    await import("./content");
    await vi.advanceTimersByTimeAsync(10);

    const css = document.getElementById("cocoon-style")?.textContent ?? "";
    expect(css).toContain("filter: invert(0.93)");
    expect(css).toContain("animation: none !important");
  });
});

describe("content feed banner persistence", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function bannerText(): string | null {
    return document.querySelector("#cocoon-feed-banner-text")?.textContent ?? null;
  }

  it("shows the filtered confirmation once per host, not on later page loads", async () => {
    vi.useFakeTimers();
    const env = mockChrome();
    vi.stubGlobal("chrome", env.chrome);
    // Feed element present: the cleaner finds its target.
    document.body.innerHTML = "<shreddit-feed></shreddit-feed>";

    await import("./content");
    await vi.advanceTimersByTimeAsync(10);

    expect(bannerText()).toContain("feed filtered on this site");
    const state = env.store.bannerState as Record<string, { filteredShownAt?: number }>;
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
    const env = mockChrome();
    vi.stubGlobal("chrome", env.chrome);
    // No feed element: selectors match nothing (layout-changed scenario).

    await import("./content");
    await vi.advanceTimersByTimeAsync(10);

    expect(bannerText()).toContain("couldn't find this site's feed");

    document.querySelector<HTMLButtonElement>("#cocoon-feed-banner button")?.click();
    await vi.advanceTimersByTimeAsync(10);

    expect(document.getElementById("cocoon-feed-banner")).toBeNull();
    const state = env.store.bannerState as Record<string, { rotDismissedAt?: number }>;
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
