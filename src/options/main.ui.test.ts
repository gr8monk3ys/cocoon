// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/dom";
import { axe } from "jest-axe";

function createChromeMock(): typeof chrome {
  const storage: Record<string, unknown> = {
    settings: {
      profile: "adhd",
      darkMode: false,
      reduceMotion: true,
      hideAlgorithmicFeeds: true,
      enableGroundingTool: true,
      siteFeedCleanerOverrides: {}
    }
  };

  return {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: storage[key] })),
        set: vi.fn(async (value: Record<string, unknown>) => {
          Object.assign(storage, value);
        })
      }
    },
    tabs: {
      query: vi.fn(async () => [{ id: 1, url: "https://reddit.com/r/test" }]),
      sendMessage: vi.fn(async () => undefined)
    },
    runtime: {
      openOptionsPage: vi.fn(async () => undefined)
    }
  } as unknown as typeof chrome;
}

describe("options ui flows", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
    vi.stubGlobal("chrome", createChromeMock());
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

  it("has no obvious accessibility violations", async () => {
    await import("./main");
    await screen.findByText("Cocoon Settings");

    const result = await axe(document.body);
    expect(result.violations).toHaveLength(0);
  });
});
