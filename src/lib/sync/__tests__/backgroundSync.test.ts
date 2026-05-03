/**
 * [R20-2] Background-sync registrar contract.
 *
 * Pins:
 *   - registerCloudSyncRetry() returns true when SW + sync supported
 *   - returns false when navigator.serviceWorker is missing
 *     (test env, Safari, etc.)
 *   - returns false when registration.sync is missing (Firefox,
 *     iOS, browsers without Background Sync API)
 *   - onCloudSyncRetry handler fires on a SW-sourced 'alch-retry-sync'
 *     message
 *   - rejects messages without source: 'sw-bg-sync' (defense-in-depth
 *     against page-level postMessage spoofing)
 */

import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import {
  registerCloudSyncRetry,
  onCloudSyncRetry,
  __resetBackgroundSyncForTests,
} from '../backgroundSync';

afterEach(() => {
  vi.unstubAllGlobals();
  __resetBackgroundSyncForTests();
});

describe('[R20-2] registerCloudSyncRetry', () => {
  it('returns false when navigator.serviceWorker is missing', async () => {
    vi.stubGlobal('navigator', {});
    expect(await registerCloudSyncRetry()).toBe(false);
  });

  it('returns false when registration.sync is missing (no Background Sync API)', async () => {
    const fakeReg = {} as ServiceWorkerRegistration;
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(fakeReg) },
    });
    expect(await registerCloudSyncRetry()).toBe(false);
  });

  it('returns true when sync.register succeeds', async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      serviceWorker: {
        ready: Promise.resolve({ sync: { register } }),
      },
    });
    expect(await registerCloudSyncRetry()).toBe(true);
    expect(register).toHaveBeenCalledWith('alch-sync-cloud');
  });

  it('returns false when sync.register throws', async () => {
    vi.stubGlobal('navigator', {
      serviceWorker: {
        ready: Promise.resolve({
          sync: { register: vi.fn().mockRejectedValue(new Error('boom')) },
        }),
      },
    });
    expect(await registerCloudSyncRetry()).toBe(false);
  });
});

describe('[R20-2] onCloudSyncRetry', () => {
  let messageHandler: ((e: MessageEvent) => void) | null = null;

  beforeEach(() => {
    messageHandler = null;
    vi.stubGlobal('navigator', {
      serviceWorker: {
        addEventListener: (type: string, h: (e: MessageEvent) => void) => {
          if (type === 'message') messageHandler = h;
        },
      },
    });
  });

  function fireMessage(data: unknown) {
    messageHandler?.({ data } as MessageEvent);
  }

  it('handler fires on SW-sourced alch-retry-sync message', () => {
    const handler = vi.fn();
    onCloudSyncRetry(handler);
    fireMessage({ type: 'alch-retry-sync', source: 'sw-bg-sync' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores messages without source: sw-bg-sync', () => {
    const handler = vi.fn();
    onCloudSyncRetry(handler);
    fireMessage({ type: 'alch-retry-sync' });
    fireMessage({ type: 'alch-retry-sync', source: 'page-spoofed' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores messages with the wrong type', () => {
    const handler = vi.fn();
    onCloudSyncRetry(handler);
    fireMessage({ type: 'something-else', source: 'sw-bg-sync' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('detach function clears the registered handler', () => {
    const handler = vi.fn();
    const detach = onCloudSyncRetry(handler);
    detach();
    fireMessage({ type: 'alch-retry-sync', source: 'sw-bg-sync' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('replacing handler keeps only the latest', () => {
    const a = vi.fn();
    const b = vi.fn();
    onCloudSyncRetry(a);
    onCloudSyncRetry(b);
    fireMessage({ type: 'alch-retry-sync', source: 'sw-bg-sync' });
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });
});
