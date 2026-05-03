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
      className={`relative overflow-hidden rounded-2xl border border-accent-200/70 bg-gradient-to-br from-accent-50/80 via-white to-white shadow-[0_0_0_1px_rgb(204_135_68_/_0.06),0_1px_2px_0_rgb(15_23_42_/_0.04)] dark:border-accent-900/50 dark:from-accent-950/40 dark:via-neutral-900 dark:to-neutral-900 ${className}`}
      data-soft-paywall={feature}
    >
      {/* Dimmed, non-interactive preview — user sees the shape of the
          feature so they understand what they'd unlock. Slight blur
          + saturation drop reads as "preview" instead of "broken". */}
      <div
        aria-hidden
        className="pointer-events-none select-none opacity-30 [filter:blur(1px)_saturate(0.6)]"
      >
        {children}
      </div>

      {/* Soft fade so the preview blends into the CTA card rather than
          ending in a hard horizontal line. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white/85 dark:via-neutral-900/40 dark:to-neutral-900/85"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-100/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="h-3 w-3"
            fill="currentColor"
          >
            <path d="M8 1.5l1.6 4 4.2.4-3.2 2.9 1 4.2L8 11l-3.6 1.9 1-4.2L2.2 5.9l4.2-.4z" />
          </svg>
          Premium
        </span>
        <p className="max-w-xs text-sm font-medium text-neutral-800 dark:text-neutral-100">
          {unlockText}
        </p>
        <button
          type="button"
          onClick={handleUnlock}
          className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors min-h-[44px]"
        >
          {t('paywall.cta')}
        </button>
      </div>
    </div>
  );
}
