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

describe("options ui flows", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
    env = createChromeMock({ store: { settings: LEGACY_STORED_SETTINGS } });
    vi.stubGlobal("chrome", env.chrome);
  });

  it("adds and removes per-site overrides", async () => {
    await import("./main");

    expect(await screen.findByText("Cocoon Settings")).toBeTruthy();

    const hostnameInput = (await screen.findByLabelText("Hostname")) as HTMLInputElement;
    await userEvent.type(hostnameInput, "reddit.com");
    const sections = await screen.findAllByRole("button", { name: "Save" });
    await userEvent.click(sections[1]);

    expect(await screen.findByText("reddit.com")).toBeTruthy();

    await userEvent.click((await screen.findAllByRole("button", { name: "Remove" }))[0]);
    expect(await screen.findByText("No per-site overrides yet.")).toBeTruthy();
  });

  it("shows an inline error for unsupported override hostnames", async () => {
    await import("./main");
    await screen.findByText("Cocoon Settings");

    const hostnameInput = (await screen.findByLabelText("Hostname")) as HTMLInputElement;
    await userEvent.type(hostnameInput, "news.ycombinator.com");
    const saveButtons = await screen.findAllByRole("button", { name: "Save" });
    await userEvent.click(saveButtons[1]);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("isn't a supported domain");

    // A valid hostname clears the error and saves.
    await userEvent.clear(hostnameInput);
    await userEvent.type(hostnameInput, "reddit.com");
    await userEvent.click(saveButtons[1]);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(await screen.findByText("reddit.com")).toBeTruthy();
  });

  it("rejects schedule rules whose start and end hour match", async () => {
    await import("./main");
    await screen.findByText("Cocoon Settings");

    const startInput = (await screen.findByLabelText("Schedule start hour")) as HTMLInputElement;
    const endInput = (await screen.findByLabelText("Schedule end hour")) as HTMLInputElement;
    await userEvent.clear(startInput);
    await userEvent.type(startInput, "9");
    await userEvent.clear(endInput);
    await userEvent.type(endInput, "9");
    await userEvent.click(await screen.findByRole("button", { name: "Add" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("never match");
  });

  it("has no obvious accessibility violations", async () => {
    await import("./main");
    await screen.findByText("Cocoon Settings");

    const result = await axe(document.body);
    expect(result.violations).toHaveLength(0);
  });
});

/**
 * The controls the suite never touched. Every one of them was rewritten to go
 * through `manualEdit` + `commitSettings`, and none of the old tests asserted
 * that anything was actually persisted or broadcast — only that the DOM moved.
 */
describe("options controls persist through the one write path", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
    env = createChromeMock({ store: { settings: LEGACY_STORED_SETTINGS } });
    vi.stubGlobal("chrome", env.chrome);
  });

  it("feed intensity saves, derives the legacy mirror, and broadcasts", async () => {
    await import("./main");
    await screen.findByText("Cocoon Settings");

    await userEvent.selectOptions(await screen.findByLabelText("Feed intensity"), "none");

    await vi.waitFor(() => expect(stored().feedIntensity).toBe("none"));
    expect(stored().hideAlgorithmicFeeds).toBe(true);
    expect(stored().profile).toBe("custom");
    expect(env.chrome.tabs.sendMessage).toHaveBeenCalled();
  });

  it("turning the feed cleaner off clears the legacy mirror", async () => {
    await import("./main");
    await screen.findByText("Cocoon Settings");

    await userEvent.selectOptions(await screen.findByLabelText("Feed intensity"), "full");

    await vi.waitFor(() => expect(stored().feedIntensity).toBe("full"));
    expect(stored().hideAlgorithmicFeeds).toBe(false);
  });

  it("a feature toggle persists and moves the profile to custom", async () => {
    await import("./main");
    await screen.findByText("Cocoon Settings");

    await userEvent.click(await screen.findByRole("checkbox", { name: "Dark mode" }));

    await vi.waitFor(() => expect(stored().darkMode).toBe(true));
    expect(stored().profile).toBe("custom");
  });

  it("an adaptive toggle persists without flattening the rest of adaptive", async () => {
    await import("./main");
    await screen.findByText("Cocoon Settings");

    await userEvent.click(await screen.findByRole("checkbox", { name: "Enable adaptive suggestions" }));

    await vi.waitFor(() => expect(stored().adaptive.enabled).toBe(true));
    expect(stored().adaptive.domainRules).toEqual({});
    expect(stored().adaptive.scheduleRules).toEqual([]);
  });

  it("choosing a preset applies that profile rather than custom", async () => {
    await import("./main");
    await screen.findByText("Cocoon Settings");

    await userEvent.selectOptions(await screen.findByLabelText("Profile"), "autism");

    await vi.waitFor(() => expect(stored().profile).toBe("autism"));
    expect(stored().feedIntensity).toBe("none");
  });

  it("a scenario button records an active scenario with an expiry", async () => {
    await import("./main");
    await screen.findByText("Cocoon Settings");

    await userEvent.click(await screen.findByRole("button", { name: "Focus session" }));

    await vi.waitFor(() => expect(stored().activeScenario).not.toBeNull());
    expect(stored().activeScenario?.type).toBe("focus_session");
    expect(stored().activeScenario?.expiresAt).toBeTypeOf("number");
    expect(stored().activeScenario?.previous?.profile).toBe("adhd");
  });

  it("removing a domain rule moves the profile to custom, like every other manual edit", async () => {
    // The deliberate behaviour change: this call site and removeScheduleRule
    // were the two of fourteen that did not stamp custom.
    await import("./main");
    await screen.findByText("Cocoon Settings");

    await userEvent.type(await screen.findByLabelText("Domain rule hostname"), "reddit.com");
    await userEvent.click((await screen.findAllByRole("button", { name: "Save" }))[0]);
    await vi.waitFor(() => expect(stored().adaptive.domainRules).toEqual({ "reddit.com": "adhd" }));

    await userEvent.selectOptions(await screen.findByLabelText("Profile"), "anxiety");
    await vi.waitFor(() => expect(stored().profile).toBe("anxiety"));

    await userEvent.click((await screen.findAllByRole("button", { name: "Remove" }))[0]);

    await vi.waitFor(() => expect(stored().adaptive.domainRules).toEqual({}));
    expect(stored().profile).toBe("custom");
  });
});
