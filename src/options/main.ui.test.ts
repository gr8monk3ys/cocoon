// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/dom";
import { axe } from "jest-axe";
import { createChromeMock } from "../test/chromeMock";

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

describe("options ui flows", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
    vi.stubGlobal("chrome", createChromeMock({ store: { settings: LEGACY_STORED_SETTINGS } }).chrome);
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
