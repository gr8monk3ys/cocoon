// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "./lib/types";

type MessageListener = (message: unknown) => void;
type StorageChangeListener = (
  changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
  areaName: string
) => void;

function createChromeMock() {
  let listener: MessageListener | null = null;
  let onChanged: StorageChangeListener | null = null;
  let storedSettings = DEFAULT_SETTINGS;

  const chromeMock = {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: storedSettings }))
      },
      onChanged: {
        addListener: vi.fn((cb: StorageChangeListener) => {
          onChanged = cb;
        })
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
    },
    setSettings(next: typeof DEFAULT_SETTINGS) {
      const previous = storedSettings;
      storedSettings = next;
      onChanged?.({ settings: { oldValue: previous, newValue: next } }, "local");
    }
  };
}

describe("content grounding accessibility", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.querySelectorAll("#cocoon-style, #cocoon-grounding").forEach((el) => el.remove());
    document.body.innerHTML = '<button id="origin">Focus origin</button>';
    const originButton = document.getElementById("origin") as HTMLButtonElement;
    originButton.focus();
  });

  it("opens dialog with semantics and restores focus on escape", async () => {
    const { chromeMock, send } = createChromeMock();
    vi.stubGlobal("chrome", chromeMock);

    await import("./content");

    send({ type: "COCOON_OPEN_GROUNDING" });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const overlay = document.getElementById("cocoon-grounding") as HTMLDivElement;
    expect(overlay).toBeTruthy();
    expect(overlay.getAttribute("role")).toBe("dialog");
    expect(overlay.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement?.id).toBe("cocoon-close");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(document.getElementById("cocoon-grounding")).toBeNull();
    expect(document.activeElement?.id).toBe("origin");
  });

  it("applies css, avoids duplicate overlays, and closes on backdrop click", async () => {
    const { chromeMock, send, setSettings } = createChromeMock();
    vi.stubGlobal("chrome", chromeMock);

    await import("./content");
    // Allow the initial getSettings() call in the module to resolve and apply defaults.
    await new Promise((resolve) => setTimeout(resolve, 0));

    setSettings({
      ...DEFAULT_SETTINGS,
      darkMode: true,
      reduceMotion: false,
      feedIntensity: "full",
      hideAlgorithmicFeeds: false,
      enableGroundingTool: false
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const style = document.getElementById("cocoon-style") as HTMLStyleElement;
    expect(style).toBeTruthy();
    expect(style.textContent).toContain("hue-rotate(180deg)");
    expect(style.textContent).not.toContain("animation: none !important");
    expect(style.textContent).not.toContain("display: none !important");

    send({ type: "COCOON_OPEN_GROUNDING" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.getElementById("cocoon-grounding")).toBeNull();

    setSettings({ ...DEFAULT_SETTINGS, enableGroundingTool: true, darkMode: true });
    await new Promise((resolve) => setTimeout(resolve, 0));

    send({ type: "COCOON_OPEN_GROUNDING" });
    send({ type: "COCOON_OPEN_GROUNDING" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.querySelectorAll("#cocoon-grounding")).toHaveLength(1);

    const overlay = document.getElementById("cocoon-grounding") as HTMLDivElement;
    overlay.click();

    expect(document.getElementById("cocoon-grounding")).toBeNull();
    expect(document.activeElement?.id).toBe("origin");
  });
});
