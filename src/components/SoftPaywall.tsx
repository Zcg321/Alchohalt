import React from 'react';
import { useLanguage } from '../i18n';
import { usePremiumFeatures } from '../features/subscription/subscriptionStore';
import type { FeatureKey } from '../config/plans';

/**
 * Soft-paywall wrapper for premium features.
 *
 * Owner-locked spec: "soft-paywall (preview + 'Unlock with Premium' CTA),
 * not hard-block at module load."
 *
 * Behavior:
 *   - If user has the feature → render children unchanged.
 *   - If they don't → render a non-interactive PREVIEW (children dimmed +
 *     non-clickable + ARIA-hidden) overlaid with an "Unlock" CTA.
 *
 * The preview matters: it teases the value of the feature without
 * holding the page hostage. User sees what they'd get + can opt in.
 *
 * onUnlock prop wires to the global subscription page; if not supplied,
 * the component emits a CustomEvent('alch:open-subscription') the host
 * app can listen to.
 */

interface Props {
  feature: FeatureKey;
  /** Children rendered unchanged for premium users; dimmed preview otherwise. */
  children: React.ReactNode;
  /** Optional explicit handler. Otherwise dispatches alch:open-subscription. */
  onUnlock?: () => void;
  /** Optional descriptive label rendered next to the unlock CTA. */
  label?: string;
  className?: string;
}

const DEFAULT_OPEN_EVENT = 'alch:open-subscription';

function fireOpenSubscription() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(DEFAULT_OPEN_EVENT, { bubbles: true }),
  );
}

export default function SoftPaywall({
  feature,
  children,
  onUnlock,
  label,
  className = '',
}: Props) {
  const { hasFeature } = usePremiumFeatures();
  const { t } = useLanguage();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  const handleUnlock = onUnlock ?? fireOpenSubscription;
  const unlockText =
    label ?? t('paywall.unlock');

  return (
    <div
      className={`relative rounded-md border border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20 ${className}`}
      data-soft-paywall={feature}
    >
      {/* Dimmed, non-interactive preview — user sees the shape of the
          feature so they understand what they'd unlock. */}
      <div
        aria-hidden
        className="pointer-events-none select-none opacity-40 [filter:blur(0.5px)]"
      >
        {children}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
          ✨ {unlockText}
        </p>
        <button
          type="button"
          onClick={handleUnlock}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        >
          {t('paywall.cta')}
        </button>
      </div>
    </div>
  );
}
