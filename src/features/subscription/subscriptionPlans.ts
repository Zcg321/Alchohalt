import type { PlanId } from '../../config/plans';

export const ORDER: PlanId[] = ['free', 'premium_monthly', 'premium_yearly', 'premium_lifetime'];

export const HIGHLIGHTS: Partial<Record<PlanId, { label: string; tone: 'primary' | 'success' }>> = {
  premium_yearly: { label: 'Most popular', tone: 'primary' },
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
    'JSON export + import',
    'One reminder',
    'Dark mode + EN/ES',
  ],
  premium_monthly: [
    'Everything in Free',
    'Mood ↔ drink correlation analytics',
    'Multiple custom reminders',
    'CSV / PDF export',
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
