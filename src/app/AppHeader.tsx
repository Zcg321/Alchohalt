import React from 'react';
import { useLanguage } from '../i18n';

interface Props {
  /** Open the always-on crisis resources page. Wired in AlcoholCoachApp. */
  onOpenCrisis?: () => void;
}

export default function AppHeader({ onOpenCrisis }: Props) {
  const { t } = useLanguage();

  return (
    <header className="mx-auto w-full max-w-4xl px-4 pt-6 pb-4 sm:pt-8 sm:pb-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {t('appName')}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
            Track your journey towards healthier habits
          </p>
        </div>
        {/* Always-on crisis resources link. Never gated. Owner-locked. */}
        {onOpenCrisis ? (
          <button
            type="button"
            onClick={onOpenCrisis}
            aria-label="Open crisis resources"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3.5 py-2 text-xs sm:text-sm font-medium text-red-700 hover:bg-red-100 hover:border-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60 transition-colors min-h-[40px]"
          >
            <span aria-hidden className="h-2 w-2 rounded-full bg-red-500 animate-pulse-soft" />
            Need help?
          </button>
        ) : null}
      </div>
    </header>
  );
}
