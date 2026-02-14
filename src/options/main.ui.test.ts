// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, within } from "@testing-library/dom";
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

  it("covers core settings flows end-to-end", async () => {
    await import("./main");

    expect(await screen.findByText("Cocoon Settings")).toBeTruthy();

    const profileSelect = (await screen.findByLabelText("Profile")) as HTMLSelectElement;
    await userEvent.selectOptions(profileSelect, "autism");
    expect(profileSelect.value).toBe("autism");

    const darkModeCheckbox = (await screen.findByLabelText("Dark mode")) as HTMLInputElement;
    expect(darkModeCheckbox.checked).toBe(true);
    await userEvent.click(darkModeCheckbox);
    expect(darkModeCheckbox.checked).toBe(false);

    const intensitySelect = (await screen.findByLabelText("Feed intensity")) as HTMLSelectElement;
    await userEvent.selectOptions(intensitySelect, "none");
    expect(intensitySelect.value).toBe("none");

    const reduceMotionCheckbox = (await screen.findByLabelText("Reduce motion")) as HTMLInputElement;
    await userEvent.click(reduceMotionCheckbox);
    expect(reduceMotionCheckbox.checked).toBe(false);

    const groundingCheckbox = (await screen.findByLabelText("Enable grounding tool")) as HTMLInputElement;
    await userEvent.click(groundingCheckbox);
    expect(groundingCheckbox.checked).toBe(false);

    await userEvent.click(await screen.findByRole("button", { name: "Calm reset" }));
    expect(intensitySelect.value).toBe("limited");

    const adaptiveToggle = (await screen.findByLabelText("Enable adaptive suggestions")) as HTMLInputElement;
    await userEvent.click(adaptiveToggle);
    expect(adaptiveToggle.checked).toBe(true);

    const suggestOnlyToggle = (await screen.findByRole("checkbox", { name: /Suggest/ })) as HTMLInputElement;
    await userEvent.click(suggestOnlyToggle);
    expect(suggestOnlyToggle.checked).toBe(false);

    const domainHostInput = (await screen.findByLabelText("Domain rule hostname")) as HTMLInputElement;
    await userEvent.type(domainHostInput, "reddit.com");
    const domainProfileSelect = (await screen.findByLabelText("Domain rule profile")) as HTMLSelectElement;
    await userEvent.selectOptions(domainProfileSelect, "autism");
    const domainSaveButton = domainHostInput.closest("div")?.querySelector("button");
    expect(domainSaveButton).toBeTruthy();
    await userEvent.click(domainSaveButton as HTMLButtonElement);
    const domainRuleItem = await screen.findByText("reddit.com → autism");
    expect(domainRuleItem).toBeTruthy();
    const domainRuleLi = domainRuleItem.closest("li");
    expect(domainRuleLi).toBeTruthy();
    await userEvent.click(within(domainRuleLi as HTMLElement).getByRole("button", { name: "Remove" }));

    const scheduleStart = (await screen.findByLabelText("Schedule start hour")) as HTMLInputElement;
    const scheduleEnd = (await screen.findByLabelText("Schedule end hour")) as HTMLInputElement;
    const scheduleProfile = (await screen.findByLabelText("Schedule rule profile")) as HTMLSelectElement;

    await userEvent.clear(scheduleStart);
    await userEvent.type(scheduleStart, "9");
    await userEvent.clear(scheduleEnd);
    await userEvent.type(scheduleEnd, "17");
    await userEvent.selectOptions(scheduleProfile, "autism");

    await userEvent.click(await screen.findByRole("button", { name: "Add" }));
    const scheduleItem = await screen.findByText("9:00-17:00 → autism");
    expect(scheduleItem).toBeTruthy();
    const scheduleLi = scheduleItem.closest("li");
    expect(scheduleLi).toBeTruthy();
    await userEvent.click(within(scheduleLi as HTMLElement).getByRole("button", { name: "Remove" }));

    const perSiteHeading = await screen.findByText("Per-site feed cleaner overrides");
    const perSiteSection = perSiteHeading.closest("section");
    expect(perSiteSection).toBeTruthy();

    const perSiteEnable = within(perSiteSection as HTMLElement).getByLabelText("Enable") as HTMLInputElement;
    await userEvent.click(perSiteEnable);
    expect(perSiteEnable.checked).toBe(false);

    const hostnameInput = within(perSiteSection as HTMLElement).getByLabelText("Hostname") as HTMLInputElement;
    await userEvent.type(hostnameInput, "reddit.com");
    const perSiteSaveButton = hostnameInput.closest("div")?.querySelector("button");
    expect(perSiteSaveButton).toBeTruthy();
    await userEvent.click(perSiteSaveButton as HTMLButtonElement);

    expect(await within(perSiteSection as HTMLElement).findByText("reddit.com")).toBeTruthy();
    expect((perSiteSection as HTMLElement).textContent).toContain("Disabled");

    await userEvent.click(within(perSiteSection as HTMLElement).getByRole("button", { name: "Remove" }));
    expect(await within(perSiteSection as HTMLElement).findByText("No per-site overrides yet.")).toBeTruthy();
  });

  it("has no obvious accessibility violations", async () => {
    await import("./main");
    await screen.findByText("Cocoon Settings");

    const result = await axe(document.body);
    expect(result.violations).toHaveLength(0);
  });
});
