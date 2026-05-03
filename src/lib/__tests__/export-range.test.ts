/**
 * [R16-3] Tests for export-range helpers.
 */
import { describe, expect, it } from 'vitest';
import {
  dateInputValue,
  dbForExportRange,
  defaultLast30DaysRange,
  filterEntriesByRange,
  parseDateInputValue,
  validateRange,
} from '../export-range';
import type { DB, Entry } from '../../store/db';

function makeEntry(ts: number, id = `e-${ts}`): Entry {
  return {
    id: id as Entry['id'],
    ts,
    kind: 'beer' as Entry['kind'],
    stdDrinks: 1,
    intention: 'social' as Entry['intention'],
    craving: 0,
    halt: { H: false, A: false, L: false, T: false },
  };
}

function makeDb(entries: Entry[]): DB {
  return {
    version: 1,
    entries,
    trash: [
      {
        id: 'trash-1' as Entry['id'],
        snapshot: makeEntry(1_000),
        deletedAt: 1_000,
      },
    ],
    settings: {
      version: 1,
      language: 'en',
      theme: 'system',
      dailyGoalDrinks: 0,
      weeklyGoalDrinks: 0,
      monthlyBudget: 0,
      reminders: { enabled: false, times: [] },
      showBAC: false,
    },
    advancedGoals: [],
    presets: [],
    healthMetrics: [
      { date: '2026-04-01', source: 'manual' },
      { date: '2026-04-15', source: 'manual' },
      { date: '2026-04-30', source: 'manual' },
      { date: '2026-05-10', source: 'manual' },
    ],
    meta: {},
  };
}

describe('[R16-3] filterEntriesByRange', () => {
  it('keeps entries inside the range (inclusive on both ends)', () => {
    const entries = [
      makeEntry(99),
      makeEntry(100),
      makeEntry(150),
      makeEntry(200),
      makeEntry(201),
    ];
    const out = filterEntriesByRange(entries, { fromMs: 100, toMs: 200 });
    expect(out.map((e) => e.ts)).toEqual([100, 150, 200]);
  });

  it('returns empty when nothing is inside the range', () => {
    const entries = [makeEntry(50), makeEntry(60)];
    const out = filterEntriesByRange(entries, { fromMs: 100, toMs: 200 });
    expect(out).toEqual([]);
  });
});

describe('[R16-3] dbForExportRange', () => {
  it('preserves settings/presets/advancedGoals; drops trash; filters entries + healthMetrics', () => {
    const entries = [
      makeEntry(new Date('2026-04-10T12:00:00').getTime(), 'a'),
      makeEntry(new Date('2026-04-15T12:00:00').getTime(), 'b'),
      makeEntry(new Date('2026-05-10T12:00:00').getTime(), 'c'),
    ];
    const db = makeDb(entries);
    const range = {
      fromMs: new Date('2026-04-01T00:00:00').getTime(),
      toMs: new Date('2026-04-30T23:59:59.999').getTime(),
    };
    const out = dbForExportRange(db, range);
    expect(out.entries.map((e) => e.id)).toEqual(['a', 'b']);
    expect(out.trash).toEqual([]);
    expect(out.settings).toBe(db.settings);
    expect(out.presets).toBe(db.presets);
    expect(out.healthMetrics?.map((m) => m.date)).toEqual([
      '2026-04-01',
      '2026-04-15',
      '2026-04-30',
    ]);
  });
});

describe('[R16-3] defaultLast30DaysRange', () => {
  it('spans 30 inclusive days ending today (rough size check)', () => {
    const now = new Date('2026-05-03T12:34:56').getTime();
    const r = defaultLast30DaysRange(now);
    /* End of today minus start of 29 days back is just shy of 30 days
     * (one ms short — 23:59:59.999 vs 24:00:00.000 the next day). */
    const days = (r.toMs - r.fromMs) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(29);
    expect(days).toBeLessThan(30);
  });
});

describe('[R16-3] validateRange', () => {
  it('returns null when range is well-formed', () => {
    expect(validateRange({ fromMs: 100, toMs: 200 })).toBeNull();
    expect(validateRange({ fromMs: 100, toMs: 100 })).toBeNull();
  });
  it('flags reversed range', () => {
    expect(validateRange({ fromMs: 200, toMs: 100 })).toMatch(/can't be after/i);
  });
  it('flags NaN dates', () => {
    expect(validateRange({ fromMs: NaN, toMs: 100 })).toMatch(/Pick both/i);
    expect(validateRange({ fromMs: 100, toMs: NaN })).toMatch(/Pick both/i);
  });
});

describe('[R16-3] dateInputValue / parseDateInputValue round-trip', () => {
  it('round-trips a local YYYY-MM-DD across the start-of-day boundary', () => {
    const ms = parseDateInputValue('2026-04-15', 'start');
    expect(dateInputValue(ms)).toBe('2026-04-15');
  });

  it('end-of-day mode is the same calendar day', () => {
    const ms = parseDateInputValue('2026-04-15', 'end');
    expect(dateInputValue(ms)).toBe('2026-04-15');
    /* Should be 23:59:59.999 local. */
    const d = new Date(ms);
    expect(d.getHours()).toBe(23);
    expect(d.getMinutes()).toBe(59);
    expect(d.getMilliseconds()).toBe(999);
  });

  it('returns NaN for empty / malformed input', () => {
    expect(parseDateInputValue('', 'start')).toBeNaN();
    expect(parseDateInputValue('not-a-date', 'start')).toBeNaN();
    expect(parseDateInputValue('2026-04', 'start')).toBeNaN();
  });
});
