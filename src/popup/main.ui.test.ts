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
      feedIntensity: "limited",
      enableGroundingTool: true,
      siteFeedCleanerOverrides: {},
      adaptive: {
        enabled: true,
        suggestOnly: true,
        scheduleRules: [],
        domainRules: { "reddit.com": "autism" }
      },
      activeScenario: null
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
      query: vi.fn(async () => [{ id: 1, url: "https://www.reddit.com/r/test" }]),
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

  it("covers core popup flows end-to-end", async () => {
    await import("./main");

    expect(await screen.findByText("Cocoon")).toBeTruthy();
    expect(await screen.findByText("Site: www.reddit.com")).toBeTruthy();

    expect(await screen.findByText("Suggested profile for this context:")).toBeTruthy();
    await userEvent.click(await screen.findByRole("button", { name: "Apply suggestion" }));

    const profileSelect = (await screen.findByLabelText("Profile")) as HTMLSelectElement;
    expect(profileSelect.value).toBe("autism");

    const intensitySelect = (await screen.findByLabelText("Feed intensity")) as HTMLSelectElement;
    await userEvent.selectOptions(intensitySelect, "full");
    expect(intensitySelect.value).toBe("full");

    const darkModeCheckbox = (await screen.findByLabelText("Dark mode")) as HTMLInputElement;
    await userEvent.click(darkModeCheckbox);
    expect(darkModeCheckbox.checked).toBe(false);

    const reduceMotionCheckbox = (await screen.findByLabelText("Reduce motion")) as HTMLInputElement;
    await userEvent.click(reduceMotionCheckbox);
    expect(reduceMotionCheckbox.checked).toBe(false);

    const groundingToggle = (await screen.findByLabelText("Enable grounding overlay")) as HTMLInputElement;
    await userEvent.click(groundingToggle);
    expect(groundingToggle.checked).toBe(false);
    const openGroundingButton = (await screen.findByRole("button", { name: "Open grounding tool" })) as HTMLButtonElement;
    expect(openGroundingButton.disabled).toBe(true);
    await userEvent.click(groundingToggle);
    expect(groundingToggle.checked).toBe(true);

    const checkbox = (await screen.findByRole("checkbox", {
      name: "Enable feed cleaner on this site"
    })) as HTMLInputElement;

    const initialChecked = checkbox.checked;
    await userEvent.click(checkbox);
    expect(checkbox.checked).toBe(!initialChecked);
    await userEvent.click(await screen.findByRole("button", { name: "Reset to global default" }));

    await userEvent.click(await screen.findByRole("button", { name: "Focus" }));
    expect(profileSelect.value).toBe("custom");

    const sendsBefore = (chrome.tabs.sendMessage as unknown as { mock: { calls: unknown[][] } }).mock.calls.length;
    await userEvent.click(openGroundingButton);
    const sendsAfter = (chrome.tabs.sendMessage as unknown as { mock: { calls: unknown[][] } }).mock.calls.length;
    expect(sendsAfter).toBeGreaterThan(sendsBefore);

    await userEvent.click(await screen.findByRole("button", { name: "Open full settings" }));
    expect(chrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
  });

  it("has no obvious accessibility violations", async () => {
    await import("./main");
    await screen.findByText("Cocoon");

    const result = await axe(document.body);
    expect(result.violations).toHaveLength(0);
  });
});
