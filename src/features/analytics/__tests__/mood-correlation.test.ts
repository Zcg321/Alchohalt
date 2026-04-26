import { describe, expect, it } from 'vitest';
import { computeMoodCorrelation } from '../mood-correlation';
import type { Entry } from '../../../store/db';

function entry(partial: Partial<Entry>): Entry {
  return {
    id: 'e' + Math.random(),
    ts: Date.now(),
    kind: 'beer',
    stdDrinks: 1,
    intention: 'social',
    craving: 1,
    halt: { H: false, A: false, L: false, T: false },
    ...partial,
  };
}

describe('computeMoodCorrelation — on-device aggregation', () => {
  it('empty entries → totalDrinks 0, no top mood/halt', () => {
    const out = computeMoodCorrelation([]);
    expect(out.totalDrinks).toBe(0);
    expect(out.topMood).toBeNull();
    expect(out.topHalt).toBeNull();
  });

  it('counts mood frequencies, picks the most common as topMood', () => {
    const out = computeMoodCorrelation([
      entry({ mood: 'stressed', stdDrinks: 2 }),
      entry({ mood: 'stressed', stdDrinks: 1 }),
      entry({ mood: 'happy', stdDrinks: 1 }),
    ]);
    expect(out.topMood).toBe('stressed');
    const stressed = out.byMood.find((r) => r.mood === 'stressed');
    expect(stressed?.count).toBe(2);
    expect(stressed?.meanStdDrinks).toBeCloseTo(1.5);
  });

  it('counts HALT frequencies, picks the most common as topHalt', () => {
    const out = computeMoodCorrelation([
      entry({ halt: { H: false, A: false, L: false, T: true } }),
      entry({ halt: { H: false, A: false, L: false, T: true } }),
      entry({ halt: { H: true, A: false, L: false, T: false } }),
    ]);
    expect(out.topHalt).toBe('T');
    const tired = out.byHalt.find((r) => r.halt === 'T');
    expect(tired?.count).toBe(2);
  });

  it('handles entries with multiple HALT flags', () => {
    const out = computeMoodCorrelation([
      entry({ halt: { H: true, A: true, L: true, T: true }, stdDrinks: 4 }),
    ]);
    expect(out.byHalt.find((r) => r.halt === 'H')?.count).toBe(1);
    expect(out.byHalt.find((r) => r.halt === 'A')?.count).toBe(1);
    expect(out.byHalt.find((r) => r.halt === 'L')?.count).toBe(1);
    expect(out.byHalt.find((r) => r.halt === 'T')?.count).toBe(1);
  });

  it('respects windowDays cutoff', () => {
    const now = 1_700_000_000_000;
    const old = now - 60 * 24 * 60 * 60 * 1000; // 60 days ago
    const recent = now - 5 * 24 * 60 * 60 * 1000; // 5 days ago
    const out = computeMoodCorrelation(
      [
        entry({ ts: old, mood: 'happy' }),
        entry({ ts: recent, mood: 'sad' }),
      ],
      30,
      now,
    );
    expect(out.totalDrinks).toBe(1);
    expect(out.topMood).toBe('sad');
  });

  it('entry without mood field defaults to neutral', () => {
    const out = computeMoodCorrelation([entry({})]);
    expect(out.topMood).toBe('neutral');
  });

  it('byMood always returns all 7 mood rows (even with count 0)', () => {
    const out = computeMoodCorrelation([entry({ mood: 'happy' })]);
    expect(out.byMood.length).toBe(7);
  });

  it('mean craving computed only over entries with that mood', () => {
    const out = computeMoodCorrelation([
      entry({ mood: 'anxious', craving: 5 }),
      entry({ mood: 'anxious', craving: 3 }),
      entry({ mood: 'happy', craving: 1 }),
    ]);
    const anxious = out.byMood.find((r) => r.mood === 'anxious');
    expect(anxious?.meanCraving).toBe(4); // (5+3)/2
  });
});
