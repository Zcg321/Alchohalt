import { describe, it, expect } from 'vitest';
import { computeStats } from '../src/lib/stats';
import type { Entry, Settings } from '../src/store/db';

describe('chart series', () => {
  it('produces weekly bins and 30-day series', () => {
    const now = Date.now();
    const mk = (days:number, std:number, cost:number): Entry => ({ id: String(days), ts: now - days*86400000, stdDrinks: std, cost, kind:'beer', intention:'taste', craving:1, halt:{H:false,A:false,L:false,T:false} });
    const entries: Entry[] = [mk(1,1,5), mk(3,2,7), mk(10,1,2)];
    const stats = computeStats(entries, {} as Settings);
    expect(stats.weekly.length).toBeGreaterThan(0);
    expect(stats.line30.length).toBe(30);
  });
});
