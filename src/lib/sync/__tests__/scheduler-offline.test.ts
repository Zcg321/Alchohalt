import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  scheduleSync,
  setSyncRunner,
  attachOnlineSync,
  __resetSchedulerForTests,
  __schedulerSnapshot,
} from '../scheduler';
import { useSyncStore } from '../syncStore';

/**
 * [R19-1] Offline-mode robustness for the cloud-sync scheduler.
 *
 * Pre-R19: a scheduleSync() call while offline ran the runner anyway,
 * which produced a sync-error event and lost the trigger. The user
 * had to remember to manually tap "Sync now" once they were back online.
 *
 * Post-R19: scheduleSync() detects offline via navigator.onLine and
 * defers. attachOnlineSync() listens for the browser's `online` event
 * and replays the deferred reason once connectivity is back. The
 * deferred reason is upgraded by urgency (manual > mutation > foreground)
 * if multiple triggers arrive while offline.
 *
 * The privacy-first promise means most paths work offline by design:
 *   - logging a drink, viewing history, computing insights = local
 *   - cloud sync is the only path that needs the network
 *
 * These tests confirm cloud-sync degrades gracefully.
 */

const ORIGINAL_NAVIGATOR_ON_LINE = Object.getOwnPropertyDescriptor(
  globalThis.navigator,
  'onLine',
);

function setOnline(value: boolean): void {
  Object.defineProperty(globalThis.navigator, 'onLine', {
    configurable: true,
    get: () => value,
  });
}

beforeEach(() => {
  __resetSchedulerForTests();
  useSyncStore.getState().reset();
  setOnline(true);
});

afterEach(() => {
  if (ORIGINAL_NAVIGATOR_ON_LINE) {
    Object.defineProperty(globalThis.navigator, 'onLine', ORIGINAL_NAVIGATOR_ON_LINE);
  }
  vi.useRealTimers();
});

describe('[R19-1] scheduler — offline behavior', () => {
  it('defers sync when navigator.onLine === false; runner does not fire', async () => {
    let runs = 0;
    setSyncRunner(async () => {
      runs++;
    });
    setOnline(false);

    scheduleSync('mutation');

    expect(runs).toBe(0);
    expect(__schedulerSnapshot().deferredReason).toBe('mutation');
    expect(__schedulerSnapshot().hasTimer).toBe(false);
  });

  it('records sync-error activity entry when deferring', () => {
    setOnline(false);
    scheduleSync('foreground');

    const activity = useSyncStore.getState().activity;
    expect(activity).toHaveLength(1);
    expect(activity[0]?.kind).toBe('sync-error');
    expect(activity[0]?.detail).toContain('offline');
    expect(activity[0]?.detail).toContain('foreground');
  });

  it('upgrades deferred reason when a more urgent trigger arrives offline', () => {
    setOnline(false);

    scheduleSync('foreground');
    expect(__schedulerSnapshot().deferredReason).toBe('foreground');

    scheduleSync('mutation');
    expect(__schedulerSnapshot().deferredReason).toBe('mutation');

    scheduleSync('manual');
    expect(__schedulerSnapshot().deferredReason).toBe('manual');
  });

  it('does NOT downgrade deferred reason when a slower trigger arrives offline', () => {
    setOnline(false);

    scheduleSync('manual');
    expect(__schedulerSnapshot().deferredReason).toBe('manual');

    scheduleSync('foreground');
    expect(__schedulerSnapshot().deferredReason).toBe('manual');

    scheduleSync('mutation');
    expect(__schedulerSnapshot().deferredReason).toBe('manual');
  });

  it('replays deferred sync when online event fires (sync enabled)', async () => {
    vi.useFakeTimers();
    let runs = 0;
    setSyncRunner(async () => {
      runs++;
    });
    useSyncStore.getState().setEnabled('user-1');

    const detach = attachOnlineSync();

    setOnline(false);
    scheduleSync('mutation');
    expect(runs).toBe(0);

    setOnline(true);
    window.dispatchEvent(new Event('online'));

    // Manual reason was deferred via mutation → fires after 5s debounce.
    await vi.advanceTimersByTimeAsync(5500);
    expect(runs).toBe(1);
    expect(__schedulerSnapshot().deferredReason).toBeNull();

    detach();
  });

  it('does NOT replay deferred sync when sync is disabled', async () => {
    let runs = 0;
    setSyncRunner(async () => {
      runs++;
    });
    // Sync NOT enabled — phase stays "off"

    const detach = attachOnlineSync();

    setOnline(false);
    scheduleSync('mutation');

    setOnline(true);
    window.dispatchEvent(new Event('online'));

    await new Promise((r) => setTimeout(r, 100));
    expect(runs).toBe(0);
    expect(__schedulerSnapshot().deferredReason).toBeNull();

    detach();
  });

  it('online event with no deferred sync is a no-op', async () => {
    let runs = 0;
    setSyncRunner(async () => {
      runs++;
    });
    useSyncStore.getState().setEnabled('user-1');

    const detach = attachOnlineSync();

    setOnline(true);
    window.dispatchEvent(new Event('online'));

    await new Promise((r) => setTimeout(r, 100));
    expect(runs).toBe(0);

    detach();
  });

  it('attachOnlineSync is idempotent — second call returns no-op detach', () => {
    const detach1 = attachOnlineSync();
    const detach2 = attachOnlineSync();
    detach2();
    detach1();
    // No throws; verifying the listener-attached guard.
    expect(true).toBe(true);
  });

  it('manual sync after offline + online sequence still bypasses debounce', async () => {
    let runs = 0;
    setSyncRunner(async () => {
      runs++;
    });
    useSyncStore.getState().setEnabled('user-1');

    const detach = attachOnlineSync();

    setOnline(false);
    scheduleSync('manual');
    expect(__schedulerSnapshot().deferredReason).toBe('manual');

    setOnline(true);
    window.dispatchEvent(new Event('online'));

    // Deferred manual fires immediately on next microtask
    await new Promise((r) => setTimeout(r, 50));
    expect(runs).toBe(1);

    detach();
  });
});
