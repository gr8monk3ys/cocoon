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

describe("popup ui flows", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
    vi.stubGlobal("chrome", createChromeMock());
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
