import { describe, expect, it } from 'vitest';
import { computeMoneyStats } from '../MoneySavedWidget';

describe('computeMoneyStats — money saved math (free feature)', () => {
  it('empty costs + no budget → spent=0, mode=spent-only', () => {
    expect(computeMoneyStats([], 0)).toEqual({
      spent: 0,
      saved: 0,
      mode: 'spent-only',
    });
  });

  it('costs sum + no budget → just spent in spent-only mode', () => {
    expect(computeMoneyStats([5, 10, 15.5], 0)).toEqual({
      spent: 30.5,
      saved: 0,
      mode: 'spent-only',
    });
  });

  it('budget set → saved = max(0, budget - spent), budget mode', () => {
    expect(computeMoneyStats([100, 50], 200)).toEqual({
      spent: 150,
      saved: 50,
      mode: 'budget',
    });
  });

  it('over budget → saved clamps to 0, never negative', () => {
    expect(computeMoneyStats([100, 50, 100], 200)).toEqual({
      spent: 250,
      saved: 0,
      mode: 'budget',
    });
  });

  it('NaN / undefined / null in costs → treated as 0 (no NaN propagation)', () => {
    const dirty = [10, NaN, 5, undefined as unknown as number, 20, null as unknown as number];
    expect(computeMoneyStats(dirty, 0).spent).toBe(35);
  });
});
