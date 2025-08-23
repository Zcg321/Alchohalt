import { describe, it, expect } from 'vitest';
import { monthlyBreakdown } from '../src/lib/stats';
import type { Entry } from '../src/store/db';

describe('monthly breakdown', () => {
  it('orders top days', () => {
    const now = Date.now();
    const mk = (offset:number, cost:number): Entry => ({ id: String(offset), ts: now+offset*86400000, stdDrinks:1, kind:'beer', intention:'taste', craving:1, halt:{H:false,A:false,L:false,T:false}, cost });
    const entries: Entry[] = [mk(0,5), mk(1,10), mk(2,3)];
    const top = monthlyBreakdown(entries);
    expect(top[0].cost).toBe(10);
  });
});
