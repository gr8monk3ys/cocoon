import { beforeEach, describe, expect, it, vi } from "vitest";
import { openGroundingInActiveTab } from "./messages";

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
