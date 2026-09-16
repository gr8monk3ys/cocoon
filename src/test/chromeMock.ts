import { vi } from "vitest";

/**
 * The one `chrome` mock. There used to be six hand-rolled ones, and they
 * disagreed: `storage.local.get` ignored its key argument in one of them, so
 * `getSettings` was verified against a contract no other test — and not the
 * real API — used.
 */
export interface ChromeMockOptions {
  /** Initial `chrome.storage.local` contents, keyed exactly as stored. */
  store?: Record<string, unknown>;
  tabs?: Array<{ id?: number; url?: string }>;
}

export interface ChromeMock {
  chrome: typeof chrome;
  /** Live view of storage: assert on it after the code under test writes. */
  store: Record<string, unknown>;
  /** Delivers a message to whatever `runtime.onMessage` listener registered. */
  send(message: unknown): void;
  /** Fires an alarm at whatever `alarms.onAlarm` listener registered. */
  fireAlarm(name: string): void;
}

export function createChromeMock(options: ChromeMockOptions = {}): ChromeMock {
  const store: Record<string, unknown> = { ...options.store };
  const tabs = options.tabs ?? [{ id: 1, url: "https://reddit.com/r/test" }];
  let messageListener: ((message: unknown) => void) | null = null;
  let alarmListener: ((alarm: { name: string }) => void) | null = null;

  const chromeMock = {
    storage: {
      local: {
        // Honours the key argument, as the real API does.
        get: vi.fn(async (key: string) => ({ [key]: store[key] })),
        set: vi.fn(async (value: Record<string, unknown>) => {
          Object.assign(store, value);
        })
      },
      onChanged: { addListener: vi.fn() }
    },
    tabs: {
      query: vi.fn(async () => tabs),
      sendMessage: vi.fn(async () => undefined)
    },
    runtime: {
      onMessage: {
        addListener: vi.fn((cb: (message: unknown) => void) => {
          messageListener = cb;
        })
      },
      onInstalled: { addListener: vi.fn() },
      onStartup: { addListener: vi.fn() },
      openOptionsPage: vi.fn(async () => undefined)
    },
    alarms: {
      clear: vi.fn(async () => undefined),
      create: vi.fn(async () => undefined),
      onAlarm: {
        addListener: vi.fn((cb: (alarm: { name: string }) => void) => {
          alarmListener = cb;
        })
      }
    }
  } as unknown as typeof chrome;

  return {
    chrome: chromeMock,
    store,
    send: (message: unknown) => messageListener?.(message),
    fireAlarm: (name: string) => alarmListener?.({ name })
  };
}
