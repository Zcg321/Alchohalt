import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  scheduleSync,
  setSyncRunner,
  attachForegroundSync,
  __resetSchedulerForTests,
  __schedulerSnapshot,
  DEBOUNCE_MS,
} from '../scheduler';
import { useSyncStore } from '../syncStore';

beforeEach(() => {
  __resetSchedulerForTests();
  useSyncStore.getState().reset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

async function flushTimers(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

describe('[SYNC-3b] scheduler — debounce + coalescing + serialization', () => {
  it('mutation reason debounces at 5s and runs once for 5 rapid calls', async () => {
    let runs = 0;
    setSyncRunner(async () => { runs++; });

    for (let i = 0; i < 5; i++) scheduleSync('mutation');
    expect(__schedulerSnapshot().hasTimer).toBe(true);
    expect(runs).toBe(0);

    await flushTimers(DEBOUNCE_MS.mutation + 100);
    expect(runs).toBe(1);
    expect(__schedulerSnapshot().hasTimer).toBe(false);
  });

  it('manual reason fires immediately (microtask), no debounce', async () => {
    let runs = 0;
    setSyncRunner(async () => { runs++; });

    scheduleSync('manual');
    // No timer armed — manual goes through Promise.resolve().
    expect(__schedulerSnapshot().hasTimer).toBe(false);
    await flushTimers(0);
    expect(runs).toBe(1);
  });

  it('manual cancels a pending mutation timer (shorter wins)', async () => {
    let runs = 0;
    setSyncRunner(async () => { runs++; });

    scheduleSync('mutation');
    expect(__schedulerSnapshot().scheduledReason).toBe('mutation');
    scheduleSync('manual');

    await flushTimers(0);
    expect(runs).toBe(1);
  });

  it('foreground (30s) defers to a queued mutation (5s)', async () => {
    let runs = 0;
    setSyncRunner(async () => { runs++; });

    scheduleSync('mutation');
    scheduleSync('foreground'); // longer — should NOT replace mutation

    await flushTimers(DEBOUNCE_MS.mutation + 100);
    expect(runs).toBe(1);
    // The foreground request was discarded (no retrigger because no
    // sync was in flight when foreground was scheduled).
    expect(__schedulerSnapshot().hasTimer).toBe(false);
  });

  it('coalesces mutations during an in-flight run into ONE retrigger', async () => {
    let runs = 0;
    let resolveRun: (() => void) | null = null;
    setSyncRunner(
      () => new Promise<void>((res) => { runs++; resolveRun = res; }),
    );

    scheduleSync('mutation');
    await flushTimers(DEBOUNCE_MS.mutation + 100);
    // First runner is in flight, blocked on resolveRun.
    expect(__schedulerSnapshot().inFlight).toBe(true);

    scheduleSync('mutation');
    scheduleSync('mutation');
    scheduleSync('mutation');
    expect(__schedulerSnapshot().retriggerAfter).toBe(true);

    resolveRun!();
    await flushTimers(0);
    expect(runs).toBe(2); // exactly one retrigger, not 3.
    expect(__schedulerSnapshot().retriggerAfter).toBe(false);
  });

  it('runner failure is recorded as activity and does not block the next trigger', async () => {
    let calls = 0;
    setSyncRunner(async () => {
      calls++;
      if (calls === 1) throw new Error('network down');
    });

    scheduleSync('manual');
    await flushTimers(0);
    expect(useSyncStore.getState().activity[0]?.kind).toBe('sync-error');
    expect(useSyncStore.getState().activity[0]?.detail).toBe('network down');

    scheduleSync('manual');
    await flushTimers(0);
    expect(calls).toBe(2);
  });

  it('default runner records a noop sync-success', async () => {
    // No explicit setSyncRunner — uses the module default.
    scheduleSync('manual');
    await flushTimers(0);
    expect(useSyncStore.getState().activity[0]?.kind).toBe('sync-success');
  });
});

describe('[SYNC-3b] attachForegroundSync — visibilitychange wiring', () => {
  it('returns a no-op when document is undefined (SSR / Node)', () => {
    // jsdom DOES define document, but we can call the API and get
    // a valid teardown function.
    const detach = attachForegroundSync();
    expect(typeof detach).toBe('function');
    detach();
  });

  it('triggers a foreground sync ONLY when sync is enabled', async () => {
    let runs = 0;
    setSyncRunner(async () => { runs++; });

    const detach = attachForegroundSync();

    // Sync is OFF — visibility change should NOT trigger.
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await flushTimers(DEBOUNCE_MS.foreground + 100);
    expect(runs).toBe(0);

    // Enable sync, then dispatch again.
    useSyncStore.getState().setEnabled('user-1');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(__schedulerSnapshot().scheduledReason).toBe('foreground');
    await flushTimers(DEBOUNCE_MS.foreground + 100);
    expect(runs).toBe(1);

    detach();
  });
});
