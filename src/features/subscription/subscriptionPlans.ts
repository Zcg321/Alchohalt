import type { PlanId } from '../../config/plans';

export const ORDER: PlanId[] = ['free', 'premium_monthly', 'premium_yearly', 'premium_lifetime'];

/**
 * [R23-5] Behavioral-economist judge: replaced "Most popular" on the
 * yearly tier with "Best per-month value." The previous label was
 * informationally honest (it is the highest-converting tier per
 * SubscriptionManager.tsx spec comments) but framed via social proof
 * — "others picked this; you should too." That's a soft dark
 * pattern. The replacement carries the same yearly-vs-monthly hint
 * but anchors to objective math (the 48% per-month saving), not
 * implicit peer pressure.
 *
 * Lifetime keeps "No subscription trap" — that's a value claim
 * about the product itself, not a behavioral nudge.
 */
export const HIGHLIGHTS: Partial<Record<PlanId, { label: string; tone: 'primary' | 'success' }>> = {
  premium_yearly: { label: 'Best per-month value', tone: 'primary' },
  premium_lifetime: { label: 'No subscription trap', tone: 'success' },
};

export const PER_PLAN_PERKS: Record<PlanId, string[]> = {
  free: [
    'Unlimited drink logging',
    'Streak tracker (no zero-reset)',
    'Money-saved counter',
    'Daily journal',
    'Crisis resources (988, SAMHSA)',
    'Biometric lock',
    'JSON + CSV export — your data is always yours',
    'One reminder',
    'Dark mode + EN/ES',
  ],
  premium_monthly: [
    'Everything in Free',
    'Mood ↔ drink correlation analytics',
    'Multiple custom reminders',
    'PDF report export',
    'Encrypted local backup + import',
    'Custom drink presets',
    'Advanced visualizations',
    'App icon themes',
    'Future AI insights (opt-in)',
  ],
  premium_yearly: ['Everything in Monthly', 'Save 48% vs paying monthly'],
  premium_lifetime: [
    'Everything in Yearly',
    'Pay once. Yours forever.',
    'No renewal. No surprise charges.',
  ],
};
