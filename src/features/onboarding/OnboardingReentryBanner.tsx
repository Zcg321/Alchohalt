/**
 * [R17-4] Gentle re-entry banner for users who skipped onboarding.
 *
 * Pre-R17, "Skip and explore" lands a user on the Today tab with no
 * thread back to the setup flow. Some users want exactly that — they
 * skipped on purpose and don't want to be nagged. Some skipped because
 * they were curious, didn't grok what onboarding was for, and never
 * realized they could finish later.
 *
 * This banner lives at the top of the app shell when the user's
 * onboarding diagnostics say `status === 'skipped'`. One tap re-opens
 * the onboarding flow. Self-dismisses for the rest of the session.
 *
 * Display rules:
 *   - Renders only when status === 'skipped'.
 *   - Hidden after the user dismisses or taps "Set up now" (session
 *     state, not persisted — a returning user gets it back, gently).
 *   - Voice: invitation, not nag. "Takes 30 seconds." earns the right
 *     to ask by surfacing the cost up front.
 */

import React, { useState } from 'react';
import { useDB } from '../../store/db';

export default function OnboardingReentryBanner() {
  const status = useDB((s) => s.db.settings.onboardingDiagnostics?.status);
  const setSettings = useDB((s) => s.setSettings);
  const [dismissed, setDismissed] = useState(false);

  if (status !== 'skipped' || dismissed) return null;

  function onResume() {
    /* Flips hasCompletedOnboarding back to false so OnboardingFlow's
     * mount effect re-shows the modal on the next render. Same wiring
     * as ReplayOnboardingButton — no entries/goals/presets touched. */
    setSettings({ hasCompletedOnboarding: false });
  }

  return (
    <div
      role="status"
      data-testid="onboarding-reentry-banner"
      className="mx-auto mt-3 max-w-2xl rounded-2xl border border-sage-200 bg-sage-50 px-4 py-3 text-caption text-ink dark:border-sage-800 dark:bg-sage-950/40 dark:text-ink-soft"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sage-900 dark:text-sage-100">
            Want to set up your tracking?
          </p>
          <p className="mt-0.5 text-sage-700 dark:text-sage-300">
            Takes 30 seconds. Pick how you want to track and what you&rsquo;re hoping for.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => { onResume(); }}
            data-testid="onboarding-reentry-resume"
            className="inline-flex items-center justify-center rounded-pill bg-sage-700 px-3 py-1.5 text-caption font-medium text-white hover:bg-sage-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[36px]"
          >
            Set up now
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            data-testid="onboarding-reentry-dismiss"
            aria-label="Dismiss"
            className="inline-flex h-8 w-8 items-center justify-center rounded-pill text-sage-700 hover:bg-sage-100 hover:text-sage-900 dark:text-sage-300 dark:hover:bg-sage-900 transition-colors"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
