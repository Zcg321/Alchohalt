import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useSubscriptionStore } from './subscriptionStore';
import { PLANS, type PlanId } from '../../config/plans';
import { useAnalytics } from '../analytics/analytics';
import { getIAPProvider, type ProductId } from '../iap/IAPProvider';

/**
 * 4-tier pricing UI: Free + Monthly + Annual + Lifetime.
 *
 * Owner-locked spec (2026-04-26):
 *   - Free covers ~75% of value
 *   - Monthly $4.99 — still on the value end vs I Am Sober ($9.99) + Sunnyside ($9.99); reads "real product" not "side project"
 *   - Annual $24.99 — 48% discount vs monthly; below Sunnyside annual ($74.99)
 *   - Lifetime $69 — undercuts Reframe lifetime ($199) by 65%; the wedge
 *
 * Lead positioning per plan:
 *   - Annual: "Most Popular" (recurring revenue + best margin)
 *   - Lifetime: "No subscription trap" (the differentiator vs competitors)
 */

interface Props {
  /**
   * Wire to the IAP provider's purchase() in [ALCH-IAP-REAL]. If omitted,
   * the buttons no-op (used in dev / preview).
   */
  onSubscribe?: (planId: PlanId) => Promise<void>;
  className?: string;
}

const ORDER: PlanId[] = ['free', 'premium_monthly', 'premium_yearly', 'premium_lifetime'];

const HIGHLIGHTS: Partial<Record<PlanId, { label: string; tone: 'primary' | 'success' }>> = {
  premium_yearly: { label: 'Most Popular', tone: 'primary' },
  premium_lifetime: { label: 'No subscription trap', tone: 'success' },
};

const PER_PLAN_PERKS: Record<PlanId, string[]> = {
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
  premium_yearly: [
    'Everything in Monthly',
    'Save 48% vs paying monthly',
  ],
  premium_lifetime: [
    'Everything in Yearly',
    'Pay once. Yours forever.',
    'No renewal. No surprise charges.',
  ],
};

export default function SubscriptionManager({ onSubscribe, className }: Props) {
  const { trackSubscriptionEvent } = useAnalytics();
  const { subscription, setSubscription } = useSubscriptionStore();
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (planId: PlanId) => {
    if (pendingPlan) return;
    if (planId === 'free') return;
    setError(null);
    setPendingPlan(planId);
    try {
      if (onSubscribe) {
        await onSubscribe(planId);
        trackSubscriptionEvent('subscribed', planId);
      } else {
        // Default path: drive the IAP provider directly.
        const provider = getIAPProvider();
        const productId = planId as ProductId; // PlanId paid tiers ⊆ ProductId
        const purchase = await provider.purchase(productId);
        if (purchase.state === 'approved') {
          // Pull authoritative entitlement back from the provider so
          // expiry/trial flags are accurate.
          const state = await provider.getEntitlementState();
          setSubscription({
            plan: planId,
            verifiedAt: Date.now(),
            periodEndAt: state.expiryDate ? state.expiryDate.getTime() : null,
            trialActive: !!state.isTrialActive,
          });
          trackSubscriptionEvent('subscribed', planId);
        } else if (purchase.state === 'cancelled') {
          // Silent — user changed their mind.
        } else {
          setError('Purchase did not complete. Try again or restore prior purchases.');
        }
      }
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? 'Purchase failed. Please try again.');
    } finally {
      setPendingPlan(null);
    }
  };

  return (
    <div className={`mx-auto max-w-5xl ${className ?? ''}`}>
      <header className="mb-10 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">A simple price.</h2>
        <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
          More insights, same calm. Never gamified.
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          Free covers the essentials forever. Premium adds analytics,
          multi-reminders, exports, and encrypted backup. AI Insights is
          opt-in and controlled in Settings → AI.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {ORDER.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = subscription.plan === planId;
          const highlight = HIGHLIGHTS[planId];
          const isWorking = pendingPlan === planId;

          return (
            <article
              key={planId}
              className={`relative flex flex-col rounded-xl border p-5 transition ${
                highlight
                  ? 'border-blue-400 ring-1 ring-blue-200 dark:border-blue-500 dark:ring-blue-900/40'
                  : 'border-gray-200 dark:border-gray-700'
              } ${
                isCurrent ? 'ring-2 ring-green-500' : 'hover:-translate-y-0.5 hover:shadow-md'
              } bg-white dark:bg-gray-900`}
            >
              {highlight ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant={highlight.tone} size="sm">
                    {highlight.label}
                  </Badge>
                </div>
              ) : null}
              {isCurrent ? (
                <div className="absolute -top-3 right-3">
                  <Badge variant="success" size="sm">Current</Badge>
                </div>
              ) : null}

              <div className="text-center">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {plan.priceLabel}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {plan.subtitle}
                </p>
              </div>

              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {PER_PLAN_PERKS[planId].map((perk, i) => (
                  <li key={i} className="flex items-start">
                    <svg
                      className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{perk}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {planId === 'free' ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={isCurrent}
                  >
                    {isCurrent ? 'Your current plan' : 'Switch to free'}
                  </Button>
                ) : isCurrent ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Active
                  </Button>
                ) : (
                  <Button
                    onClick={() => void handleSubscribe(planId)}
                    disabled={isWorking}
                    className="w-full"
                  >
                    {isWorking ? 'Processing…' : `Get ${plan.name}`}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100"
        >
          {error}
        </p>
      ) : null}

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-500">
        Payments handled by Apple / Google. Cancel any time from your
        device&apos;s subscription settings. Your data is yours — we
        cryptographically cannot read it. Opt-in AI features can change
        this; see Settings → AI.
      </p>
    </div>
  );
}

/** Soft-paywall wrapper used by premium feature surfaces. */
export function PremiumFeatureGate({
  children,
  fallback,
  isPremium,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
  isPremium: boolean;
}) {
  return isPremium ? <>{children}</> : <>{fallback}</>;
}
