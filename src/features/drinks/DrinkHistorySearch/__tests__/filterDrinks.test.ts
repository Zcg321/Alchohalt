import { describe, it, expect } from 'vitest';
import { filterDrinks, isCriteriaEmpty } from '../filterDrinks';
import type { Drink } from '../../../../types/common';

const NOW = Date.UTC(2026, 4, 15, 12, 0, 0);
const DAY = 86_400_000;

function drink(opts: Partial<Drink> & { ts: number }): Drink {
  return {
    volumeMl: 350,
    abvPct: 5,
    intention: 'social',
    craving: 0,
    halt: [],
    alt: '',
    ...opts,
  };
}

describe('[R14-2] filterDrinks', () => {
  const sample: Drink[] = [
    drink({ ts: NOW, intention: 'celebrate', alt: 'sparkling water' }),
    drink({ ts: NOW - DAY, intention: 'social', alt: '' }),
    drink({ ts: NOW - 5 * DAY, intention: 'cope', alt: 'walk around block' }),
    drink({ ts: NOW - 10 * DAY, intention: 'taste', alt: '', volumeMl: 750, abvPct: 13 }),
  ];

  it('returns all drinks when criteria is empty', () => {
    expect(filterDrinks(sample, {})).toEqual(sample);
  });

  it('matches query against intention name (case-insensitive)', () => {
    expect(filterDrinks(sample, { query: 'COPE' })).toHaveLength(1);
    expect(filterDrinks(sample, { query: 'social' })).toHaveLength(1);
  });

  it('matches query against alt text', () => {
    const r = filterDrinks(sample, { query: 'sparkling' });
    expect(r).toHaveLength(1);
    expect(r[0]?.intention).toBe('celebrate');
  });

  it('matches query across intention OR alt', () => {
    expect(filterDrinks(sample, { query: 'walk' })).toHaveLength(1);
  });

  it('returns no drinks when query has no matches', () => {
    expect(filterDrinks(sample, { query: 'nonexistent-keyword' })).toHaveLength(0);
  });

  it('treats whitespace-only query as no filter', () => {
    expect(filterDrinks(sample, { query: '   ' })).toHaveLength(sample.length);
  });

  it('filters by dateFrom (inclusive)', () => {
    const r = filterDrinks(sample, { dateFrom: NOW - 3 * DAY });
    expect(r).toHaveLength(2);
  });

  it('filters by dateTo (inclusive)', () => {
    const r = filterDrinks(sample, { dateTo: NOW - 5 * DAY });
    expect(r).toHaveLength(2);
  });

  it('filters by date range (both bounds)', () => {
    const r = filterDrinks(sample, {
      dateFrom: NOW - 6 * DAY,
      dateTo: NOW - 1 * DAY,
    });
    expect(r).toHaveLength(2);
  });

  it('filters by stdMin (drinks at or above)', () => {
    // 750 ml at 13% ABV → ~5.5 std drinks. Rest are 350×5 → ~1.0 std.
    const r = filterDrinks(sample, { stdMin: 3 });
    expect(r).toHaveLength(1);
  });

  it('filters by stdMax (drinks at or below)', () => {
    const r = filterDrinks(sample, { stdMax: 2 });
    expect(r).toHaveLength(3);
  });

  it('filters by std range', () => {
    const r = filterDrinks(sample, { stdMin: 0.5, stdMax: 2 });
    expect(r).toHaveLength(3);
  });

  it('combines query + date + std filters with AND semantics', () => {
    const r = filterDrinks(sample, {
      query: 'taste',
      dateFrom: NOW - 30 * DAY,
      stdMin: 3,
    });
    expect(r).toHaveLength(1);
  });

  it('returns empty when combined filters have no overlap', () => {
    const r = filterDrinks(sample, {
      query: 'taste',
      stdMin: 100,
    });
    expect(r).toHaveLength(0);
  });

  it('matches against tags when Drink has them (forward-compat for R14-3)', () => {
    const tagged = drink({ ts: NOW, intention: 'social' });
    Object.assign(tagged, { tags: ['stressed', 'family-dinner'] });
    const r = filterDrinks([tagged], { query: 'stressed' });
    expect(r).toHaveLength(1);
  });

  it('does not crash when Drink lacks alt or tags', () => {
    const minimal: Drink = {
      ts: NOW,
      volumeMl: 350,
      abvPct: 5,
      intention: 'social',
      craving: 0,
      halt: [],
      alt: '',
    };
    expect(() => filterDrinks([minimal], { query: 'foo' })).not.toThrow();
  });
});

describe('[R14-2] isCriteriaEmpty', () => {
  it('reports empty for {}', () => {
    expect(isCriteriaEmpty({})).toBe(true);
  });
  it('reports empty for whitespace-only query', () => {
    expect(isCriteriaEmpty({ query: '   ' })).toBe(true);
  });
  it('reports non-empty when any filter is set', () => {
    expect(isCriteriaEmpty({ query: 'a' })).toBe(false);
    expect(isCriteriaEmpty({ dateFrom: 0 })).toBe(false);
    expect(isCriteriaEmpty({ stdMax: 5 })).toBe(false);
  });
});
