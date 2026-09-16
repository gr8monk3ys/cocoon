import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock } from "../test/chromeMock";
import { broadcastSettings, getActiveTabHostname, openGroundingInActiveTab } from "./messages";
import { applyProfile } from "./settings";

function withTabs(tabs: Array<{ id?: number; url?: string }>): void {
  vi.stubGlobal("chrome", createChromeMock({ tabs }).chrome);
}

describe("messages", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("broadcasts settings to tabs with numeric ids", async () => {
    withTabs([{ id: 1 }, {}, { id: 2 }]);

    await broadcastSettings(applyProfile("adhd"));

    expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
  });

  it("opens grounding only when active tab has id", async () => {
    withTabs([{}]);
    await openGroundingInActiveTab();
    expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(0);

    withTabs([{ id: 9 }]);
    await openGroundingInActiveTab();
    expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("reads the active tab's hostname, and null when there isn't one", async () => {
    withTabs([{ id: 1, url: "https://www.reddit.com/r/test" }]);
    expect(await getActiveTabHostname()).toBe("www.reddit.com");

    withTabs([{ id: 1 }]);
    expect(await getActiveTabHostname()).toBeNull();

    withTabs([{ id: 1, url: "not a url" }]);
    expect(await getActiveTabHostname()).toBeNull();
  });
});
