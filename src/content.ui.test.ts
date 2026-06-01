// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "./lib/types";

type MessageListener = (message: unknown) => void;

function createChromeMock() {
  let listener: MessageListener | null = null;

  const chromeMock = {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: DEFAULT_SETTINGS }))
      }
    },
    runtime: {
      onMessage: {
        addListener: vi.fn((cb: MessageListener) => {
          listener = cb;
        })
      }
    }
  } as unknown as typeof chrome;

  return {
    chromeMock,
    send(message: unknown) {
      listener?.(message);
    }
  };
}

describe("content grounding accessibility", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.body.innerHTML = '<button id="origin">Focus origin</button>';
    const originButton = document.getElementById("origin") as HTMLButtonElement;
    originButton.focus();
  });

  it("opens dialog with semantics and restores focus on escape", async () => {
    const { chromeMock, send } = createChromeMock();
    vi.stubGlobal("chrome", chromeMock);

    await import("./content");

    send({ type: "COCOON_APPLY_SETTINGS", payload: { ...DEFAULT_SETTINGS, enableGroundingTool: true } });
    send({ type: "COCOON_OPEN_GROUNDING" });

    const overlay = document.getElementById("cocoon-grounding") as HTMLDivElement;
    expect(overlay).toBeTruthy();
    expect(overlay.getAttribute("role")).toBe("dialog");
    expect(overlay.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement?.id).toBe("cocoon-close");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(document.getElementById("cocoon-grounding")).toBeNull();
    expect(document.activeElement?.id).toBe("origin");
  });

  it("traps Tab focus inside the dialog", async () => {
    const { chromeMock, send } = createChromeMock();
    vi.stubGlobal("chrome", chromeMock);

    await import("./content");

    send({ type: "COCOON_APPLY_SETTINGS", payload: { ...DEFAULT_SETTINGS, enableGroundingTool: true } });
    send({ type: "COCOON_OPEN_GROUNDING" });

    // Simulate focus escaping to the page behind the modal, then press Tab.
    (document.getElementById("origin") as HTMLButtonElement).focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

    // Focus is pulled back into the dialog instead of staying on the page.
    expect(document.activeElement?.id).toBe("cocoon-close");
  });
});
