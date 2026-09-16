// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/dom";
import { axe } from "jest-axe";
import { createChromeMock } from "../test/chromeMock";
import type { CocoonSettings } from "../lib/types";

// Stored settings deliberately predate `feedIntensity`, `adaptive` and
// `activeScenario`, so every render also exercises the settings migration.
const LEGACY_STORED_SETTINGS = {
  profile: "adhd",
  darkMode: false,
  reduceMotion: true,
  hideAlgorithmicFeeds: true,
  enableGroundingTool: true,
  siteFeedCleanerOverrides: {}
};

let env: ReturnType<typeof createChromeMock>;

function stored(): CocoonSettings {
  return env.store.settings as CocoonSettings;
}

/** Boots the popup against `settings`, with the active tab on reddit.com. */
async function bootWith(settings: Record<string, unknown>): Promise<void> {
  env = createChromeMock({ store: { settings } });
  vi.stubGlobal("chrome", env.chrome);
  await import("./main");
  await screen.findByText("Cocoon");
}

describe("popup ui flows", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
    env = createChromeMock({ store: { settings: LEGACY_STORED_SETTINGS } });
    vi.stubGlobal("chrome", env.chrome);
  });

  it("renders active site and supports current-site toggle", async () => {
    await import("./main");

    expect(await screen.findByText("Cocoon")).toBeTruthy();
    expect(await screen.findByText("Site: reddit.com")).toBeTruthy();

    const checkbox = (await screen.findByRole("checkbox", {
      name: "Enable feed cleaner on this site"
    })) as HTMLInputElement;

    await userEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it("has no obvious accessibility violations", async () => {
    await import("./main");
    await screen.findByText("Cocoon");

    const result = await axe(document.body);
    expect(result.violations).toHaveLength(0);
  });
});

describe("popup controls persist through the one write path", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("feed intensity saves, derives the legacy mirror, and broadcasts", async () => {
    await bootWith(LEGACY_STORED_SETTINGS);

    await userEvent.selectOptions(await screen.findByLabelText("Feed intensity"), "none");

    await vi.waitFor(() => expect(stored().feedIntensity).toBe("none"));
    expect(stored().hideAlgorithmicFeeds).toBe(true);
    expect(stored().profile).toBe("custom");
    expect(env.chrome.tabs.sendMessage).toHaveBeenCalled();
  });

  it("the per-site toggle writes an override for the active host", async () => {
    await bootWith(LEGACY_STORED_SETTINGS);

    await userEvent.click(await screen.findByRole("checkbox", { name: "Enable feed cleaner on this site" }));

    await vi.waitFor(() => expect(stored().siteFeedCleanerOverrides).toEqual({ "reddit.com": false }));
    expect(stored().profile).toBe("custom");
  });

  it("'Reset to global default' drops the override rather than inverting it", async () => {
    await bootWith({ ...LEGACY_STORED_SETTINGS, siteFeedCleanerOverrides: { "reddit.com": false } });

    await userEvent.click(await screen.findByRole("button", { name: "Reset to global default" }));

    await vi.waitFor(() => expect(stored().siteFeedCleanerOverrides).toEqual({}));
  });

  it("a scenario button records an active scenario with an expiry", async () => {
    await bootWith(LEGACY_STORED_SETTINGS);

    await userEvent.click(await screen.findByRole("button", { name: "Focus session" }));

    await vi.waitFor(() => expect(stored().activeScenario).not.toBeNull());
    expect(stored().activeScenario?.type).toBe("focus_session");
    expect(stored().activeScenario?.expiresAt).toBeTypeOf("number");
  });

  it("the grounding button is disabled when the tool is switched off", async () => {
    await bootWith({ ...LEGACY_STORED_SETTINGS, enableGroundingTool: false });

    const button = (await screen.findByRole("button", { name: "Open grounding tool" })) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("auto-applies the adaptive suggestion once, when suggest-only is off", async () => {
    // The ref-guarded one-shot effect — the most intricate logic in the popup
    // and, until now, entirely untested.
    await bootWith({
      ...LEGACY_STORED_SETTINGS,
      profile: "adhd",
      adaptive: { enabled: true, suggestOnly: false, domainRules: { "reddit.com": "anxiety" }, scheduleRules: [] }
    });

    await vi.waitFor(() => expect(stored().profile).toBe("anxiety"));
    // applyProfile preserves the user's own overrides and adaptive rules.
    expect(stored().adaptive.domainRules).toEqual({ "reddit.com": "anxiety" });
    expect(env.chrome.tabs.sendMessage).toHaveBeenCalled();
  });

  it("suggests without applying when suggest-only is on", async () => {
    await bootWith({
      ...LEGACY_STORED_SETTINGS,
      profile: "adhd",
      adaptive: { enabled: true, suggestOnly: true, domainRules: { "reddit.com": "anxiety" }, scheduleRules: [] }
    });

    expect(await screen.findByText("Suggested profile for this context:")).toBeTruthy();
    expect(await screen.findByRole("button", { name: "Apply suggestion" })).toBeTruthy();
    expect(stored().profile).toBe("adhd");
  });
});
