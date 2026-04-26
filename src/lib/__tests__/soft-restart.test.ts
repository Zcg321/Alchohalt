import { describe, expect, it } from 'vitest';
import { computeTotalAFDays, getStreakStatus } from '../calc';

describe('computeTotalAFDays — lifetime AF days never decrease', () => {
  it('empty record yields 0', () => {
    expect(computeTotalAFDays({})).toBe(0);
  });

  it('counts days with 0 std drinks across the whole record range', () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const dayBefore = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);
    const drinks = { [dayBefore]: 2, [yesterday]: 0, [today]: 0 };
    expect(computeTotalAFDays(drinks)).toBe(2);
  });

  it('soft-restart preserves prior wins (drink-day in middle does not zero history)', () => {
    const d0 = new Date(Date.now() - 5 * 86_400_000).toISOString().slice(0, 10);
    const d1 = new Date(Date.now() - 4 * 86_400_000).toISOString().slice(0, 10);
    const d2 = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
    const d3 = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);
    const d4 = new Date(Date.now() - 1 * 86_400_000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    // d0=AF, d1=drank, d2=AF, d3=AF, d4=drank, today=AF
    const drinks = { [d0]: 0, [d1]: 3, [d2]: 0, [d3]: 0, [d4]: 1, [today]: 0 };
    // total AF = d0 + d2 + d3 + today = 4
    expect(computeTotalAFDays(drinks)).toBe(4);
  });
});

describe('getStreakStatus — soft-restart classification', () => {
  it('current streak ≥ 1 → building, regardless of total', () => {
    expect(getStreakStatus(7, 100)).toEqual({
      kind: 'building',
      currentStreak: 7,
      totalAFDays: 100,
    });
  });

  it('current = 0 + total = 0 → starting (new user)', () => {
    expect(getStreakStatus(0, 0)).toEqual({
      kind: 'starting',
      currentStreak: 0,
      totalAFDays: 0,
    });
  });

  it('current = 0 + total > 0 → restart (returning user)', () => {
    expect(getStreakStatus(0, 42)).toEqual({
      kind: 'restart',
      currentStreak: 0,
      totalAFDays: 42,
    });
  });

  it('NEVER returns "0 days" framing for a returning user', () => {
    // Owner-locked invariant: a relapse must not show "0 days" as
    // the only headline. The 'restart' branch carries the lifetime
    // total which the UI surfaces.
    const status = getStreakStatus(0, 365);
    expect(status.kind).toBe('restart');
    expect(status.totalAFDays).toBe(365);
  });
});
