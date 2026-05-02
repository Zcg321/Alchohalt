import { afterEach, describe, expect, it } from 'vitest';
import {
  MockIAPProvider,
  RevenueCatIAPProvider,
  _resetIAPProvider,
  getIAPProvider,
  setIAPProvider,
  type IAPProvider,
} from '../IAPProvider';

afterEach(() => {
  _resetIAPProvider();
});

describe('getIAPProvider — production safety', () => {
  it('falls back to MockIAPProvider when ENABLE_IAP is unset', () => {
    expect(getIAPProvider()).toBeInstanceOf(MockIAPProvider);
  });

  it('returns the same instance across calls (singleton)', () => {
    const a = getIAPProvider();
    const b = getIAPProvider();
    expect(a).toBe(b);
  });

  it('setIAPProvider overrides the singleton (test seam)', () => {
    const fake: IAPProvider = {
      initialize: async () => undefined,
      getProducts: async () => [],
      purchase: async () => ({
        productId: 'premium_monthly',
        transactionId: 'x',
        purchaseDate: new Date(),
        state: 'approved',
      }),
      restore: async () => [],
      getEntitlementState: async () => ({ isPremium: false }),
      ownsProduct: async () => false,
    };
    setIAPProvider(fake);
    expect(getIAPProvider()).toBe(fake);
  });
});

describe('MockIAPProvider — round-trip', () => {
  it('lists 3 products with the canonical PlanId set', async () => {
    const p = new MockIAPProvider();
    const products = await p.getProducts();
    expect(products.map((x) => x.id).sort()).toEqual([
      'premium_lifetime',
      'premium_monthly',
      'premium_yearly',
    ]);
  });

  it('purchase + restore round-trips', async () => {
    const p = new MockIAPProvider();
    await p.initialize();
    const purchase = await p.purchase('premium_lifetime');
    expect(purchase.state).toBe('approved');
    expect(purchase.productId).toBe('premium_lifetime');
    const restored = await p.restore();
    expect(restored).toHaveLength(1);
    expect(restored[0]!.productId).toBe('premium_lifetime');
  });

  it('getEntitlementState reflects approved purchase', async () => {
    const p = new MockIAPProvider();
    expect((await p.getEntitlementState()).isPremium).toBe(false);
    await p.purchase('premium_yearly');
    const state = await p.getEntitlementState();
    expect(state.isPremium).toBe(true);
    expect(state.productId).toBe('premium_yearly');
  });

  it('ownsProduct is per-product specific', async () => {
    const p = new MockIAPProvider();
    await p.purchase('premium_monthly');
    expect(await p.ownsProduct('premium_monthly')).toBe(true);
    expect(await p.ownsProduct('premium_yearly')).toBe(false);
  });
});

describe('RevenueCatIAPProvider — initialize without API key throws clearly', () => {
  it('throws a clear error when no key is configured', async () => {
    const p = new RevenueCatIAPProvider();
    await expect(p.initialize()).rejects.toThrow(/API key not configured/i);
  });
});
