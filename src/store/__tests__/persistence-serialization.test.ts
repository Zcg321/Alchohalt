/**
 * Regression for [BUG-DB-SERIALIZATION].
 *
 * Before the fix, src/store/db.ts cast a string-based StateStorage to
 * PersistStorage<unknown>. Zustand then passed in an object on setItem,
 * localStorage coerced it to "[object Object]", and the entire persisted
 * DB was unrecoverable on next load. This test asserts the round-trip:
 * write → read returns valid JSON / structured data, never the literal
 * "[object Object]".
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useDB } from '../db';
import { __resetPreferencesCacheForTests } from '../../shared/capacitor';

const STORAGE_KEY = 'alchohalt:alchohalt.db';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('useDB persistence — JSON serialization', () => {
  it('writes a JSON string to localStorage, never "[object Object]"', async () => {
    const store = useDB.getState();
    store.setSettings({ dailyGoalDrinks: 3 });
    // Allow the persist middleware's debounced write to flush
    await new Promise((r) => setTimeout(r, 50));
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(raw).not.toBe('[object Object]');
    // Must round-trip through JSON
    expect(() => JSON.parse(raw as string)).not.toThrow();
  });

  it('persisted blob has the expected zustand persist shape', async () => {
    useDB.getState().setSettings({ dailyGoalDrinks: 7 });
    await new Promise((r) => setTimeout(r, 50));
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw as string);
    expect(parsed).toMatchObject({ state: { db: expect.any(Object) }, version: expect.any(Number) });
    expect(parsed.state.db.settings.dailyGoalDrinks).toBe(7);
  });

  it('survives a write → read round trip (entries preserved)', async () => {
    const store = useDB.getState();
    store.addEntry({
      ts: Date.now(),
      kind: 'beer',
      stdDrinks: 1,
      cost: 5,
      intention: 'social',
      craving: 2,
      halt: { H: false, A: false, L: false, T: false },
    });
    await new Promise((r) => setTimeout(r, 50));
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.db.entries).toHaveLength(1);
    expect(parsed.state.db.entries[0].kind).toBe('beer');
  });
});
