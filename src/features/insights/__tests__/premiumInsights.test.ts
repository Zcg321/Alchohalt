import { describe, it, expect } from 'vitest';
import { generatePremiumInsights } from '../premiumInsights';
import type { Entry } from '../../../store/db';

/**
 * Tests for premiumInsights.ts — the AI-Insights generator that runs
 * pattern / correlation / cost / time-of-day / intention analysis on
 * the user's local entries. Pure logic, deterministic. Owner-locked
 * coverage gap (1.44% → ~90% after this file).
 *
 * Each block: builds a focused fixture, asserts the right insight
 * surfaces and the wrong ones don't. No timers, no Date.now mocking
 * needed — every assertion is shape / threshold based on the entry data.
 */

const baseEntry = (over: Partial<Entry>): Entry => ({
  id: over.id ?? 'e' + Math.random().toString(36).slice(2),
  ts: over.ts ?? Date.now(),
  kind: over.kind ?? 'beer',
  stdDrinks: over.stdDrinks ?? 1,
  intention: over.intention ?? 'social',
  craving: over.craving ?? 5,
  halt: over.halt ?? { H: false, A: false, L: false, T: false },
  ...over,
});

describe('generatePremiumInsights — gating', () => {
  it('returns empty when fewer than 7 entries', () => {
    const entries = Array.from({ length: 6 }, () => baseEntry({}));
    expect(generatePremiumInsights(entries)).toEqual([]);
  });

  it('returns array when entries >= 7', () => {
    const entries = Array.from({ length: 7 }, () => baseEntry({}));
    expect(Array.isArray(generatePremiumInsights(entries))).toBe(true);
  });

  it('returns at most 10 insights even with mountains of data', () => {
    const entries = Array.from({ length: 200 }, (_, i) =>
      baseEntry({
        ts: Date.now() - i * 60_000,
        stdDrinks: 2 + (i % 5),
        cost: 8,
        craving: i % 10,
        intention: i % 2 ? 'cope' : 'social',
        halt: { H: i % 2 === 0, A: i % 3 === 0, L: false, T: i % 5 === 0 },
      }),
    );
    expect(generatePremiumInsights(entries).length).toBeLessThanOrEqual(10);
  });

  it('orders insights by confidence descending', () => {
    const entries = Array.from({ length: 30 }, (_, i) =>
      baseEntry({
        ts: Date.now() - i * 3_600_000,
        stdDrinks: 1 + (i % 4),
        craving: i % 10,
        cost: 12,
        intention: i % 2 ? 'cope' : 'social',
        halt: { H: i % 2 === 0, A: false, L: false, T: false },
      }),
    );
    const insights = generatePremiumInsights(entries);
    for (let i = 0; i < insights.length - 1; i++) {
      expect(insights[i]!.confidence).toBeGreaterThanOrEqual(insights[i + 1]!.confidence);
    }
  });
});

describe('analyzeHALTPatterns', () => {
  it('flags hunger when hungry-tagged drinks have higher avg', () => {
    const hungry = Array.from({ length: 10 }, () =>
      baseEntry({ stdDrinks: 4, halt: { H: true, A: false, L: false, T: false } }),
    );
    const baseline = Array.from({ length: 10 }, () =>
      baseEntry({ stdDrinks: 1, halt: { H: false, A: false, L: false, T: false } }),
    );
    const insights = generatePremiumInsights([...hungry, ...baseline]);
    const halt = insights.find((i) => /Hunger|Anger|Loneliness|Tiredness/.test(i.title));
    expect(halt).toBeDefined();
    expect(halt!.category).toBe('pattern');
    expect(halt!.actionable).toBe(true);
  });

  it('does not flag HALT when avg is below the 1.5 threshold', () => {
    const entries = Array.from({ length: 10 }, () =>
      baseEntry({ stdDrinks: 1.0, halt: { H: true, A: false, L: false, T: false } }),
    );
    const insights = generatePremiumInsights(entries);
    expect(insights.find((i) => /shows up most/.test(i.title))).toBeUndefined();
  });
});

describe('analyzeTimePatterns', () => {
  it('flags an evening peak when 3+ drinks logged at the same hour run heavier', () => {
    const at9pm = Array.from({ length: 5 }, () => {
      const d = new Date(); d.setHours(21, 0, 0, 0);
      return baseEntry({ ts: d.getTime(), stdDrinks: 4 });
    });
    const otherTimes = Array.from({ length: 5 }, () => {
      const d = new Date(); d.setHours(11, 0, 0, 0);
      return baseEntry({ ts: d.getTime(), stdDrinks: 1 });
    });
    const insights = generatePremiumInsights([...at9pm, ...otherTimes]);
    const time = insights.find((i) => /evening|afternoon|morning/i.test(i.title));
    expect(time).toBeDefined();
    expect(time!.category).toBe('pattern');
  });

  it('skips time pattern when no hour has 3+ entries', () => {
    const entries = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(); d.setHours(i, 0, 0, 0);
      return baseEntry({ ts: d.getTime(), stdDrinks: 2 });
    });
    const insights = generatePremiumInsights(entries);
    expect(insights.find((i) => /runs heavier/.test(i.title))).toBeUndefined();
  });
});

describe('analyzeCravingCorrelations', () => {
  it('flags craving correlation when high-craving days are 1+ drinks higher', () => {
    const highCraving = Array.from({ length: 5 }, () =>
      baseEntry({ craving: 9, stdDrinks: 5 }),
    );
    const lowCraving = Array.from({ length: 5 }, () =>
      baseEntry({ craving: 2, stdDrinks: 1 }),
    );
    const filler = Array.from({ length: 4 }, () => baseEntry({ craving: 5, stdDrinks: 2 }));
    const insights = generatePremiumInsights([...highCraving, ...lowCraving, ...filler]);
    const corr = insights.find((i) => /[Ss]tronger cravings/.test(i.title));
    expect(corr).toBeDefined();
    expect(corr!.category).toBe('correlation');
  });

  it('skips craving correlation under 14 entries', () => {
    const entries = Array.from({ length: 13 }, (_, i) =>
      baseEntry({ craving: i < 5 ? 9 : 2, stdDrinks: i < 5 ? 5 : 1 }),
    );
    const insights = generatePremiumInsights(entries);
    expect(insights.find((i) => /Stronger cravings/.test(i.title))).toBeUndefined();
  });
});

describe('analyzeCostImpacts', () => {
  it('flags monthly spend when projected > $100/mo', () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      baseEntry({
        ts: Date.now() - i * 86_400_000, // one per day, 20 days
        cost: 12,
        kind: 'beer',
      }),
    );
    const insights = generatePremiumInsights(entries);
    const cost = insights.find((i) => /Monthly spend/.test(i.title));
    expect(cost).toBeDefined();
    expect(cost!.category).toBe('optimization');
  });

  it('skips cost insight when fewer than 5 entries have a cost', () => {
    const entries = Array.from({ length: 7 }, (_, i) =>
      baseEntry({ cost: i < 4 ? 50 : undefined }),
    );
    const insights = generatePremiumInsights(entries);
    expect(insights.find((i) => /spend|expensive/i.test(i.title))).toBeUndefined();
  });

  it('flags expensive drink kind when one runs 1.5x the average', () => {
    const cheap = Array.from({ length: 5 }, () =>
      baseEntry({ kind: 'beer', cost: 5, ts: Date.now() - Math.random() * 86_400_000 * 30 }),
    );
    const pricey = Array.from({ length: 5 }, () =>
      baseEntry({ kind: 'spirits', cost: 18, ts: Date.now() - Math.random() * 86_400_000 * 30 }),
    );
    const insights = generatePremiumInsights([...cheap, ...pricey]);
    const expensive = insights.find((i) => /runs your spend up/.test(i.title));
    expect(expensive).toBeDefined();
  });
});

describe('analyzeIntentionEffectiveness', () => {
  it('flags worst intention when it averages 1.5x the best', () => {
    const social = Array.from({ length: 5 }, () =>
      baseEntry({ intention: 'social', stdDrinks: 1 }),
    );
    const cope = Array.from({ length: 5 }, () =>
      baseEntry({ intention: 'cope', stdDrinks: 4 }),
    );
    const insights = generatePremiumInsights([...social, ...cope]);
    const intent = insights.find((i) => /runs heaviest/.test(i.title));
    expect(intent).toBeDefined();
    expect(intent!.category).toBe('pattern');
  });

  it('skips when only one intention has enough data', () => {
    const entries = Array.from({ length: 10 }, () =>
      baseEntry({ intention: 'social', stdDrinks: 2 }),
    );
    const insights = generatePremiumInsights(entries);
    expect(insights.find((i) => /runs heaviest/.test(i.title))).toBeUndefined();
  });

  it('skips when worst is within 1.5x of best (no actionable gap)', () => {
    const social = Array.from({ length: 5 }, () =>
      baseEntry({ intention: 'social', stdDrinks: 2 }),
    );
    const cope = Array.from({ length: 5 }, () =>
      baseEntry({ intention: 'cope', stdDrinks: 2.5 }),
    );
    const insights = generatePremiumInsights([...social, ...cope]);
    expect(insights.find((i) => /runs heaviest/.test(i.title))).toBeUndefined();
  });
});

describe('insight shape invariants', () => {
  it('every returned insight has the full PremiumInsight contract', () => {
    const entries = Array.from({ length: 30 }, (_, i) =>
      baseEntry({
        ts: Date.now() - i * 3_600_000,
        stdDrinks: 2 + (i % 4),
        cost: 10,
        craving: (i * 3) % 10,
        intention: i % 3 === 0 ? 'cope' : 'social',
        halt: { H: i % 2 === 0, A: false, L: false, T: false },
      }),
    );
    const insights = generatePremiumInsights(entries);
    expect(insights.length).toBeGreaterThan(0);
    for (const i of insights) {
      expect(typeof i.title).toBe('string');
      expect(typeof i.description).toBe('string');
      expect(['pattern', 'correlation', 'prediction', 'optimization']).toContain(i.category);
      expect(i.confidence).toBeGreaterThanOrEqual(0);
      expect(i.confidence).toBeLessThanOrEqual(100);
      expect(typeof i.actionable).toBe('boolean');
      expect(typeof i.timeframe).toBe('string');
    }
  });
});
