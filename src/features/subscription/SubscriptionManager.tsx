import React from 'react';
import { useSubscriptionStore } from './subscriptionStore';
import { PLANS, type PlanId } from '../../config/plans';
import { ORDER } from './subscriptionPlans';
import { PlanCard } from './PlanCard';
import { useSubscriptionPurchase } from './useSubscriptionPurchase';

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

function PricingHeader() {
  return (
    <header className="mb-10 text-center">
      <h2 id="pricing-heading" className="text-3xl font-semibold tracking-tight">A simple price.</h2>
      <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
        More insights, same calm. Never gamified.
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
        On any plan, your data stays on your device — we can&rsquo;t read it. AI Insights is opt-in
        (Settings → AI).
      </p>
    </header>
  );
}

function PricingFooter() {
  return (
    <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-500">
      Payments handled by Apple / Google. Cancel any time from your device&apos;s subscription
      settings. Your data stays on your device — we can&apos;t read it. AI Insights is opt-in
      (Settings → AI).
    </p>
  );
}

export default function SubscriptionManager({ onSubscribe, className }: Props) {
  const { subscription } = useSubscriptionStore();
  const { pendingPlan, error, handleSubscribe } = useSubscriptionPurchase(onSubscribe);

  const currentPlanName = PLANS[subscription.plan]?.name ?? 'Free';

  return (
    <div className={`mx-auto max-w-5xl ${className ?? ''}`}>
      <PricingHeader />
      <div
        className="mx-auto mb-6 inline-flex w-full justify-center"
        aria-live="polite"
      >
        <span className="rounded-full border border-border-soft bg-surface-elevated px-3 py-1 text-xs text-ink-soft">
          You&rsquo;re on {currentPlanName}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {ORDER.map((planId) => (
          <PlanCard
            key={planId}
            planId={planId}
            isCurrent={subscription.plan === planId}
            isWorking={pendingPlan === planId}
            onSubscribe={(id) => void handleSubscribe(id)}
          />
        ))}
      </div>
      {error && (
        <p
          role="alert"
          className="mt-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100"
        >
          {error}
        </p>
      )}
      <PricingFooter />
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
