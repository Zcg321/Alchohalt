/**
 * [R23-5] Behavioral-economist judge regression guard.
 *
 * Pins the R23-5 fix: the yearly-tier highlight is value-framed
 * ("Best per-month value"), not social-proof-framed ("Most
 * popular"). If a future change reintroduces the social-proof
 * label, this test fails.
 */
import { describe, it, expect } from 'vitest';
import { HIGHLIGHTS } from '../subscriptionPlans';

describe('[R23-5] subscription highlight labels — no social-proof framing', () => {
  it('yearly tier label is value-framed (per-month value), not social-proof', () => {
    const yearly = HIGHLIGHTS.premium_yearly;
    expect(yearly).toBeTruthy();
    expect(yearly?.label).toBe('Best per-month value');
    /* Negative: ensure we don't slide back into "Most popular" or
     * variants. Same nudge family — peer pressure substituting for
     * a real value claim. */
    expect(yearly?.label.toLowerCase()).not.toContain('popular');
    expect(yearly?.label.toLowerCase()).not.toMatch(/most chosen|trending|top pick/);
  });

  it('lifetime tier label remains a product claim, not a behavioral nudge', () => {
    /* "No subscription trap" is a value claim about the product
     * (no recurring billing). It's not loss-aversion ("Don't get
     * trapped!") because it's structural — describes what the
     * product does, not what the user fears. */
    expect(HIGHLIGHTS.premium_lifetime?.label).toBe('No subscription trap');
  });
});
