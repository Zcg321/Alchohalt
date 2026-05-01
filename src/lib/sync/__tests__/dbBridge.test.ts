import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  attachDbBridge,
  __resetDbBridgeForTests,
} from '../dbBridge';
import {
  setSyncRunner,
  __resetSchedulerForTests,
  __schedulerSnapshot,
  DEBOUNCE_MS,
} from '../scheduler';
import { useDB } from '../../../store/db';
import { useSyncStore } from '../syncStore';

beforeEach(() => {
  __resetDbBridgeForTests();
  __resetSchedulerForTests();
  useSyncStore.getState().reset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  __resetDbBridgeForTests();
});

describe('[SYNC-3b] dbBridge — drink-log mutation triggers scheduleSync', () => {
  it('addEntry while sync is OFF does NOT trigger a scheduled sync', async () => {
    let runs = 0;
    setSyncRunner(async () => { runs++; });
    attachDbBridge();

    useDB.getState().addEntry({
      ts: Date.now(),
      drinkType: 'beer',
      kind: 'beer',
      stdDrinks: 1,
      volumeMl: 350,
      abvPct: 5,
      cost: 0,
      intention: 'social',
      cravingLevel: 1,
      halt: { H: false, A: false, L: false, T: false },
      altActionUsed: false,
      coping: false,
    });

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS.mutation + 100);
    expect(runs).toBe(0);
    expect(__schedulerSnapshot().hasTimer).toBe(false);
  });

  it('addEntry while sync is ENABLED schedules a mutation sync (debounced 5s)', async () => {
    let runs = 0;
    setSyncRunner(async () => { runs++; });
    useSyncStore.getState().setEnabled('user-1');
    attachDbBridge();

    useDB.getState().addEntry({
      ts: Date.now(),
      drinkType: 'beer',
      kind: 'beer',
      stdDrinks: 1,
      volumeMl: 350,
      abvPct: 5,
      cost: 0,
      intention: 'social',
      cravingLevel: 1,
      halt: { H: false, A: false, L: false, T: false },
      altActionUsed: false,
      coping: false,
    });

    expect(__schedulerSnapshot().scheduledReason).toBe('mutation');
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS.mutation + 100);
    expect(runs).toBe(1);
  });

  it('three rapid addEntry calls coalesce into one push', async () => {
    let runs = 0;
    setSyncRunner(async () => { runs++; });
    useSyncStore.getState().setEnabled('user-1');
    attachDbBridge();

    for (let i = 0; i < 3; i++) {
      useDB.getState().addEntry({
        ts: Date.now() + i,
        drinkType: 'beer',
        kind: 'beer',
        stdDrinks: 1,
        volumeMl: 350,
        abvPct: 5,
        cost: 0,
        intention: 'social',
        cravingLevel: 1,
        halt: { H: false, A: false, L: false, T: false },
        altActionUsed: false,
        coping: false,
      });
    }

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS.mutation + 100);
    expect(runs).toBe(1);
  });

  it('detach() unsubscribes — subsequent mutations no longer trigger', async () => {
    let runs = 0;
    setSyncRunner(async () => { runs++; });
    useSyncStore.getState().setEnabled('user-1');
    const detach = attachDbBridge();
    detach();

    useDB.getState().addEntry({
      ts: Date.now(),
      drinkType: 'beer',
      kind: 'beer',
      stdDrinks: 1,
      volumeMl: 350,
      abvPct: 5,
      cost: 0,
      intention: 'social',
      cravingLevel: 1,
      halt: { H: false, A: false, L: false, T: false },
      altActionUsed: false,
      coping: false,
    });

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS.mutation + 100);
    expect(runs).toBe(0);
  });
});
