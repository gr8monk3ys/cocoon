import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CocoonSettings } from "./lib/types";
import { applyProfile, applyScenario } from "./lib/settings";

type StorageChangeListener = (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>, areaName: string) => void;
type AlarmListener = (alarm: { name: string }) => void | Promise<void>;

function createChromeMock(initialSettings: CocoonSettings) {
  let storedSettings: CocoonSettings = initialSettings;

  let onChanged: StorageChangeListener | null = null;
  let onAlarm: AlarmListener | null = null;
  let onInstalled: (() => void | Promise<void>) | null = null;
  let onStartup: (() => void | Promise<void>) | null = null;

  const chromeMock = {
    alarms: {
      clear: vi.fn(async () => true),
      create: vi.fn(async () => undefined),
      onAlarm: {
        addListener: vi.fn((cb: AlarmListener) => {
          onAlarm = cb;
        })
      }
    },
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: storedSettings })),
        set: vi.fn(async (value: Record<string, unknown>) => {
          if (value.settings) {
            storedSettings = value.settings as CocoonSettings;
          }
        })
      },
      onChanged: {
        addListener: vi.fn((cb: StorageChangeListener) => {
          onChanged = cb;
        })
      }
    },
    runtime: {
      onInstalled: {
        addListener: vi.fn((cb: () => void | Promise<void>) => {
          onInstalled = cb;
        })
      },
      onStartup: {
        addListener: vi.fn((cb: () => void | Promise<void>) => {
          onStartup = cb;
        })
      }
    }
  } as unknown as typeof chrome;

  return {
    chromeMock,
    getSettings() {
      return storedSettings;
    },
    async fireInstalled() {
      await onInstalled?.();
    },
    async fireStartup() {
      await onStartup?.();
    },
    fireChanged(next: CocoonSettings) {
      const previous = storedSettings;
      storedSettings = next;
      onChanged?.({ settings: { oldValue: previous, newValue: next } }, "local");
    },
    async fireAlarm(name: string) {
      await onAlarm?.({ name });
    }
  };
}

describe("background scenario expiry", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("schedules an alarm when settings gain a timed scenario", async () => {
    const base = applyProfile("adhd");
    const { chromeMock, fireChanged } = createChromeMock(base);
    vi.stubGlobal("chrome", chromeMock);

    await import("./background");

    const inScenario = applyScenario(base, "focus_session", 30);
    fireChanged(inScenario);

    expect(chrome.alarms.create).toHaveBeenCalled();
    const [name, info] = (chrome.alarms.create as unknown as { mock: { calls: unknown[][] } }).mock.calls.at(-1) as [
      string,
      { when?: number }
    ];
    expect(name).toBe("cocoon-scenario-expiry");
    expect(typeof info.when).toBe("number");
  });

  it("restores expired scenario when alarm fires", async () => {
    const base = applyProfile("adhd");
    const expired = applyScenario(base, "focus_session", 30);
    const expiredAt = Date.now() - 1;
    const expiredSettings: CocoonSettings = {
      ...expired,
      activeScenario: { ...expired.activeScenario!, expiresAt: expiredAt }
    };

    const { chromeMock, fireAlarm, getSettings } = createChromeMock(expiredSettings);
    vi.stubGlobal("chrome", chromeMock);

    await import("./background");

    await fireAlarm("cocoon-scenario-expiry");

    const stored = getSettings();
    expect(stored.activeScenario).toBeNull();
    expect(stored.profile).toBe("adhd");
    expect(chrome.storage.local.set).toHaveBeenCalled();
  });

  it("runs install/startup sync without throwing", async () => {
    const base = applyProfile("adhd");
    const { chromeMock, fireInstalled, fireStartup } = createChromeMock(base);
    vi.stubGlobal("chrome", chromeMock);

    await import("./background");

    await fireInstalled();
    await fireStartup();
    expect(chrome.storage.local.set).toHaveBeenCalled();
  });
});
