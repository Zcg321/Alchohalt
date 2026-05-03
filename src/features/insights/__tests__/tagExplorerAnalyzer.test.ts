import { describe, it, expect } from 'vitest';
import { buildTagDetail } from '../tagExplorerAnalyzer';
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

describe('[R15-A] tagExplorer', () => {
  it('returns null when tag has no matches', () => {
    const drinks: Drink[] = [drink({ ts: 0, tags: ['other'] })];
    expect(buildTagDetail(drinks, 'absent')).toBeNull();
  });

  it('returns null on empty drinks', () => {
    expect(buildTagDetail([], 'anything')).toBeNull();
  });

  it('counts only drinks carrying the requested tag', () => {
    const drinks: Drink[] = [
      drink({ ts: 1, tags: ['stressed'] }),
      drink({ ts: 2, tags: ['social'] }),
      drink({ ts: 3, tags: ['stressed', 'social'] }),
    ];
    const detail = buildTagDetail(drinks, 'stressed');
    expect(detail).not.toBeNull();
    expect(detail!.count).toBe(2);
  });

  it('computes avgStd and totalStd correctly', () => {
    const drinks: Drink[] = [
      drink({ ts: 1, tags: ['x'], volumeMl: 750, abvPct: 14 }),
      drink({ ts: 2, tags: ['x'], volumeMl: 750, abvPct: 14 }),
    ];
    const detail = buildTagDetail(drinks, 'x')!;
    expect(detail.totalStd).toBeGreaterThan(0);
    expect(detail.avgStd).toBeCloseTo(detail.totalStd / 2);
  });

  it('records earliest and latest timestamps', () => {
    const drinks: Drink[] = [
      drink({ ts: 100, tags: ['x'] }),
      drink({ ts: 50, tags: ['x'] }),
      drink({ ts: 200, tags: ['x'] }),
    ];
    const detail = buildTagDetail(drinks, 'x')!;
    expect(detail.earliestTs).toBe(50);
    expect(detail.latestTs).toBe(200);
  });

  it('buckets entries by hour-of-day', () => {
    // Build entries pinned to specific local hours.
    const t = (h: number) => {
      const d = new Date(2025, 0, 15, h, 30, 0, 0);
      return d.getTime();
    };
    const drinks: Drink[] = [
      drink({ ts: t(8), tags: ['morning'] }),
      drink({ ts: t(8), tags: ['morning'] }),
      drink({ ts: t(20), tags: ['morning'] }),
    ];
    const detail = buildTagDetail(drinks, 'morning')!;
    expect(detail.hourBuckets).toHaveLength(24);
    expect(detail.hourBuckets[8]).toBe(2);
    expect(detail.hourBuckets[20]).toBe(1);
    const sum = detail.hourBuckets.reduce((a, b) => a + b, 0);
    expect(sum).toBe(3);
  });

  it('buckets entries by weekday', () => {
    // Sunday Jan 19 2025 is dow 0. Monday is 1, etc.
    const sun = new Date(2025, 0, 19, 12).getTime();
    const mon = new Date(2025, 0, 20, 12).getTime();
    const drinks: Drink[] = [
      drink({ ts: sun, tags: ['x'] }),
      drink({ ts: mon, tags: ['x'] }),
      drink({ ts: mon, tags: ['x'] }),
    ];
    const detail = buildTagDetail(drinks, 'x')!;
    expect(detail.weekdayBuckets).toHaveLength(7);
    expect(detail.weekdayBuckets[0]).toBe(1);
    expect(detail.weekdayBuckets[1]).toBe(2);
  });

  it('returns up to 10 most recent entries, newest first', () => {
    const drinks: Drink[] = [];
    for (let i = 0; i < 15; i++) {
      drinks.push(drink({ ts: i * 1000, tags: ['x'] }));
    }
    const detail = buildTagDetail(drinks, 'x')!;
    expect(detail.recent).toHaveLength(10);
    expect(detail.recent[0]?.ts).toBe(14000);
    expect(detail.recent[9]?.ts).toBe(5000);
  });

  it('treats undefined tags as empty list', () => {
    const drinks: Drink[] = [
      { volumeMl: 350, abvPct: 5, intention: 'social', craving: 0, halt: [], alt: '', ts: 1 },
    ];
    expect(buildTagDetail(drinks, 'anything')).toBeNull();
  });
});
