import { describe, it, expect } from 'vitest';
import { computeMonthlyDelta } from '../monthlyDelta';
import type { Entry } from '../../../store/db';

function entry(ts: number, stdDrinks = 1): Entry {
  return {
    id: `e-${ts}`,
    ts,
    kind: 'beer',
    stdDrinks,
    intention: 'social',
    craving: 0,
    halt: { H: false, A: false, L: false, T: false },
  };
}

const NOW = new Date('2026-05-15T12:00:00').getTime();
const APRIL_15 = new Date('2026-04-15T12:00:00').getTime();
const MAY_2 = new Date('2026-05-02T12:00:00').getTime();
const MAY_5 = new Date('2026-05-05T12:00:00').getTime();
const APRIL_2 = new Date('2026-04-02T12:00:00').getTime();
const APRIL_3 = new Date('2026-04-03T12:00:00').getTime();
const MARCH_15 = new Date('2026-03-15T12:00:00').getTime();

describe('computeMonthlyDelta', () => {
  it('returns null prior when no entries before current month', () => {
    const result = computeMonthlyDelta([entry(MAY_2)], NOW);
    expect(result.prior).toBeNull();
    expect(result.totalChangePct).toBeNull();
    expect(result.current.drinkCount).toBe(1);
  });

  it('computes prior summary when entries exist in prior month', () => {
    const result = computeMonthlyDelta(
      [entry(MAY_2, 2), entry(APRIL_15, 1), entry(APRIL_2, 1)],
      NOW
    );
    expect(result.prior).not.toBeNull();
    expect(result.prior?.drinkCount).toBe(2);
    expect(result.prior?.totalStdDrinks).toBe(2);
    expect(result.current.totalStdDrinks).toBe(2);
  });

  it('computes positive percent change correctly', () => {
    const result = computeMonthlyDelta(
      [entry(MAY_2, 4), entry(MAY_5, 4), entry(APRIL_15, 4)],
      NOW
    );
    expect(result.current.totalStdDrinks).toBe(8);
    expect(result.prior?.totalStdDrinks).toBe(4);
    expect(result.totalChangePct).toBe(100);
  });

  it('computes negative percent change correctly', () => {
    const result = computeMonthlyDelta(
      [entry(MAY_2, 1), entry(APRIL_2, 4), entry(APRIL_15, 4)],
      NOW
    );
    expect(result.totalChangePct).toBe(-87.5);
  });

  it('counts AF days correctly for current and prior months', () => {
    const result = computeMonthlyDelta(
      [entry(MAY_2), entry(APRIL_15), entry(APRIL_2)],
      NOW
    );
    expect(result.current.afDays).toBe(14); // 15 days through May 15, 1 drinking day
    expect(result.prior?.afDays).toBe(28); // 30 in April, 2 drinking days
  });

  it('caps current month days at "now"', () => {
    const result = computeMonthlyDelta([entry(MARCH_15), entry(APRIL_15)], NOW);
    expect(result.current.daysCounted).toBe(15); // through May 15
    expect(result.prior?.daysCounted).toBe(30);
  });

  it('treats multiple entries on the same day as one drinking day', () => {
    const may2EarlyTs = new Date('2026-05-02T08:00:00').getTime();
    const may2LateTs = new Date('2026-05-02T20:00:00').getTime();
    const result = computeMonthlyDelta(
      [entry(may2EarlyTs), entry(may2LateTs), entry(APRIL_15)],
      NOW
    );
    expect(result.current.drinkCount).toBe(2);
    expect(result.current.drinkingDays).toBe(1);
  });

  describe('[R15-1] avg-per-drinking-day + drinking-days delta', () => {
    it('computes avgPerDrinkingDay as totalStd / drinkingDays', () => {
      const may2EarlyTs = new Date('2026-05-02T08:00:00').getTime();
      const may2LateTs = new Date('2026-05-02T20:00:00').getTime();
      const result = computeMonthlyDelta(
        [entry(may2EarlyTs, 2), entry(may2LateTs, 3), entry(MAY_5, 1), entry(APRIL_15, 1)],
        NOW
      );
      // Current: 2 drinking days (May 2 + May 5), total 6 std → avg 3
      expect(result.current.drinkingDays).toBe(2);
      expect(result.current.totalStdDrinks).toBe(6);
      expect(result.current.avgPerDrinkingDay).toBe(3);
    });

    it('returns 0 avgPerDrinkingDay when there are no drinking days', () => {
      const result = computeMonthlyDelta([entry(APRIL_15, 1)], NOW);
      expect(result.current.drinkingDays).toBe(0);
      expect(result.current.avgPerDrinkingDay).toBe(0);
    });

    it('computes drinkingDaysChangePct vs prior month', () => {
      // Current: 2 drinking days. Prior: 4 drinking days. -50%.
      const result = computeMonthlyDelta(
        [
          entry(MAY_2),
          entry(MAY_5),
          entry(APRIL_2),
          entry(APRIL_3),
          entry(APRIL_15),
          entry(new Date('2026-04-22T12:00:00').getTime()),
        ],
        NOW
      );
      expect(result.current.drinkingDays).toBe(2);
      expect(result.prior?.drinkingDays).toBe(4);
      expect(result.drinkingDaysChangePct).toBe(-50);
    });

    it('computes avgPerDrinkingDayChangePct vs prior month', () => {
      // Current: 1 drinking day, 2 std → avg 2.
      // Prior: 1 drinking day, 4 std → avg 4. -50%.
      const result = computeMonthlyDelta(
        [entry(MAY_2, 2), entry(APRIL_15, 4)],
        NOW
      );
      expect(result.current.avgPerDrinkingDay).toBe(2);
      expect(result.prior?.avgPerDrinkingDay).toBe(4);
      expect(result.avgPerDrinkingDayChangePct).toBe(-50);
    });

    it('returns null deltas when prior is null', () => {
      const result = computeMonthlyDelta([entry(MAY_2)], NOW);
      expect(result.drinkingDaysChangePct).toBeNull();
      expect(result.avgPerDrinkingDayChangePct).toBeNull();
    });
  });
});
