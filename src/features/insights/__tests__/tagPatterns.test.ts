import { describe, it, expect } from 'vitest';
import { computeTagPatterns } from '../tagPatterns';
import type { Drink } from '../../../types/common';

function drink(opts: Partial<Drink> & { ts: number; tags?: string[] }): Drink {
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

describe('[R14-3] computeTagPatterns', () => {
  it('returns empty array for empty drinks', () => {
    expect(computeTagPatterns([])).toEqual([]);
  });

  it('returns empty when no drink has tags', () => {
    const drinks = [drink({ ts: 0 }), drink({ ts: 1 })];
    expect(computeTagPatterns(drinks)).toEqual([]);
  });

  it('drops tags below minOccurrences threshold', () => {
    // Single occurrence of a tag; default minOccurrences=3 → dropped.
    const drinks = [drink({ ts: 0, tags: ['lonely'] })];
    expect(computeTagPatterns(drinks)).toEqual([]);
  });

  it('reports tags meeting the occurrence threshold', () => {
    const drinks = [
      drink({ ts: 0, tags: ['stressed'], volumeMl: 750, abvPct: 13 }),
      drink({ ts: 1, tags: ['stressed'], volumeMl: 750, abvPct: 13 }),
      drink({ ts: 2, tags: ['stressed'], volumeMl: 750, abvPct: 13 }),
    ];
    const r = computeTagPatterns(drinks);
    expect(r).toHaveLength(1);
    expect(r[0]?.tag).toBe('stressed');
    expect(r[0]?.count).toBe(3);
    expect(r[0]?.avgStd).toBeCloseTo(5.49, 1);
  });

  it('reports deltaVsOverall as the divergence from overall mean', () => {
    // 3 stressed drinks at 5+ std + 3 untagged drinks at ~1 std.
    // Overall avg = (3 * ~5.5 + 3 * 1) / 6 = ~3.25.
    // Stressed avg = ~5.5, delta = ~+2.25.
    const drinks: Drink[] = [
      drink({ ts: 0, tags: ['stressed'], volumeMl: 750, abvPct: 13 }),
      drink({ ts: 1, tags: ['stressed'], volumeMl: 750, abvPct: 13 }),
      drink({ ts: 2, tags: ['stressed'], volumeMl: 750, abvPct: 13 }),
      drink({ ts: 3 }),
      drink({ ts: 4 }),
      drink({ ts: 5 }),
    ];
    const r = computeTagPatterns(drinks);
    expect(r).toHaveLength(1);
    expect(r[0]?.tag).toBe('stressed');
    expect(r[0]?.deltaVsOverall).toBeGreaterThan(2);
    expect(r[0]?.deltaVsOverall).toBeLessThan(3);
  });

  it('sorts by absolute deltaVsOverall (most divergent first)', () => {
    // tag-A: 4 entries all at 6 std (very high)
    // tag-B: 3 entries all at 0.3 std (very low — tiny drinks)
    // tag-C: 3 entries all at ~1 std (matches overall closely)
    const drinks: Drink[] = [
      ...Array.from({ length: 4 }, (_, i) =>
        drink({ ts: i, tags: ['celebrate'], volumeMl: 750, abvPct: 14 }),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        drink({ ts: 100 + i, tags: ['lunch'], volumeMl: 100, abvPct: 4 }),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        drink({ ts: 200 + i, tags: ['neutral'] }),
      ),
    ];
    const r = computeTagPatterns(drinks);
    expect(r.length).toBeGreaterThanOrEqual(2);
    // celebrate should be first or near-first (huge positive delta)
    expect(r[0]?.tag).toBe('celebrate');
  });

  it('honors a custom minOccurrences threshold', () => {
    const drinks = [
      drink({ ts: 0, tags: ['x'], volumeMl: 750, abvPct: 13 }),
      drink({ ts: 1, tags: ['x'], volumeMl: 750, abvPct: 13 }),
    ];
    expect(computeTagPatterns(drinks, { minOccurrences: 3 })).toHaveLength(0);
    expect(computeTagPatterns(drinks, { minOccurrences: 2 })).toHaveLength(1);
  });

  it('honors a custom limit', () => {
    const drinks: Drink[] = [];
    for (let tag = 0; tag < 8; tag++) {
      for (let i = 0; i < 3; i++) {
        drinks.push(
          drink({
            ts: tag * 10 + i,
            tags: [`t${tag}`],
            volumeMl: 350 + tag * 100,
            abvPct: 5,
          }),
        );
      }
    }
    expect(computeTagPatterns(drinks, { limit: 3 })).toHaveLength(3);
  });

  it('counts tags appearing on the same drink independently', () => {
    const drinks: Drink[] = [
      drink({ ts: 0, tags: ['stressed', 'work'], volumeMl: 750, abvPct: 13 }),
      drink({ ts: 1, tags: ['stressed', 'work'], volumeMl: 750, abvPct: 13 }),
      drink({ ts: 2, tags: ['stressed', 'work'], volumeMl: 750, abvPct: 13 }),
    ];
    const r = computeTagPatterns(drinks);
    expect(r).toHaveLength(2);
    const stressed = r.find((p) => p.tag === 'stressed');
    const work = r.find((p) => p.tag === 'work');
    expect(stressed?.count).toBe(3);
    expect(work?.count).toBe(3);
  });

  it('returns empty when no tag meets threshold even though tags exist', () => {
    const drinks = [
      drink({ ts: 0, tags: ['a'] }),
      drink({ ts: 1, tags: ['b'] }),
      drink({ ts: 2, tags: ['c'] }),
    ];
    expect(computeTagPatterns(drinks)).toEqual([]);
  });
});
