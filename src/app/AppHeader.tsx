import React from 'react';
import { useLanguage } from '../i18n';

interface Props {
  /** Open the always-on crisis resources page. Wired in AlcoholCoachApp. */
  onOpenCrisis?: () => void;
}

export default function AppHeader({ onOpenCrisis }: Props) {
  const { t } = useLanguage();

  return (
    <header className="mb-6 sm:mb-8 animate-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
            {t('appName')}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto px-4">
            Track your journey towards healthier habits
          </p>
        </div>
        {/* Always-on crisis resources link. Never gated. Owner-locked. */}
        {onOpenCrisis ? (
          <button
            type="button"
            onClick={onOpenCrisis}
            aria-label="Open crisis resources"
            className="shrink-0 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60"
          >
            Need help?
          </button>
        ) : null}
      </div>
    </header>
  );
}
