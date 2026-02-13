import { beforeEach, describe, expect, it, vi } from "vitest";
import { broadcastSettings, openGroundingInActiveTab } from "./messages";
import { applyProfile } from "./settings";

type Tab = { id?: number };

function createChromeMock(tabs: Tab[]): typeof chrome {
  return {
    tabs: {
      query: vi.fn(async () => tabs),
      sendMessage: vi.fn(async () => undefined)
    }
  } as unknown as typeof chrome;
}

describe("messages", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("broadcasts settings to tabs with numeric ids", async () => {
    const chromeMock = createChromeMock([{ id: 1 }, {}, { id: 2 }]);
    vi.stubGlobal("chrome", chromeMock);

    await broadcastSettings(applyProfile("adhd"));

    expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
  });

  it("opens grounding only when active tab has id", async () => {
    const chromeMock = createChromeMock([{}]);
    vi.stubGlobal("chrome", chromeMock);

    await openGroundingInActiveTab();
    expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(0);

    vi.stubGlobal("chrome", createChromeMock([{ id: 9 }]));
    await openGroundingInActiveTab();
    expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(1);
  });
});
