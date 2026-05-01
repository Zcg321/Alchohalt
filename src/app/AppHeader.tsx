import React from 'react';
import { useLanguage } from '../i18n';

interface Props {
  /** Open the always-on crisis resources page. Wired in AlcoholCoachApp. */
  onOpenCrisis?: () => void;
}

export default function AppHeader({ onOpenCrisis }: Props) {
  const { t } = useLanguage();

  return (
    <header className="safe-top mx-auto w-full max-w-3xl px-4 pt-6 pb-4 sm:pt-8 sm:pb-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-h2 sm:text-h1 tracking-tight text-ink">
            {t('appName')}
          </h1>
        </div>
        {/*
         * [VOICE-3] / [IA-1] - recolored from red to muted indigo. Red
         * is reserved for crisis surfaces, not entry points. The pill
         * signals "support is here" rather than "alarm." The crisis
         * modal itself stays as-is per the locked crisis surface.
         */}
        {onOpenCrisis ? (
          <button
            type="button"
            onClick={onOpenCrisis}
            aria-label="Open crisis resources"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-pill border border-indigo-100 bg-indigo-50 px-3.5 py-2 text-caption font-medium text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors min-h-[44px]"
          >
            <span aria-hidden className="h-2 w-2 rounded-pill bg-indigo-500" />
            Need help?
          </button>
        ) : null}
      </div>
    </header>
  );
}
