import { describe, expect, it } from 'vitest';
import { PLANS } from '../config/plans';

/**
 * Pricing regression — pins the displayed/billed values for each tier.
 *
 * Per Wend+Alchohalt competitive research 2026-04-27: monthly moved from
 * $3.99 to $4.99 because $3.99 reads as side-project pricing. Yearly and
 * lifetime stay defensible against DrinkControl's $24.99 lifetime via the
 * non-encryption wedge (calm, no gamification, real crisis support).
 */
describe('PLANS pricing pins', () => {
  it('monthly is $4.99 / month (499 cents)', () => {
    expect(PLANS.premium_monthly.priceLabel).toBe('$4.99 / month');
    expect(PLANS.premium_monthly.amountCents).toBe(499);
  });

  it('yearly is $24.99 / year (2499 cents)', () => {
    expect(PLANS.premium_yearly.priceLabel).toBe('$24.99 / year');
    expect(PLANS.premium_yearly.amountCents).toBe(2499);
  });

  it('lifetime is $69 once (6900 cents)', () => {
    expect(PLANS.premium_lifetime.priceLabel).toBe('$69 once');
    expect(PLANS.premium_lifetime.amountCents).toBe(6900);
  });

  it('free tier remains free', () => {
    expect(PLANS.free.priceLabel).toBe('$0');
    expect(PLANS.free.amountCents).toBe(0);
  });

  it('cents and label agree (cents/100 reads back into the label)', () => {
    for (const id of ['premium_monthly', 'premium_yearly', 'premium_lifetime'] as const) {
      const plan = PLANS[id];
      const dollars = (plan.amountCents / 100).toFixed(2).replace(/\.00$/, '');
      // $69 once vs $4.99 / month — only check the dollars-with-cents form
      // matches when the cents are non-zero
      if (plan.amountCents % 100 !== 0) {
        expect(plan.priceLabel).toContain(`$${dollars}`);
      }
    }
  });
});
