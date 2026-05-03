/**
 * [R15-3] Backup auto-verification ribbon.
 *
 * Renders a small dismissible ribbon at the top of the app when the
 * most-recent automatic backup verification failed. Tapping the link
 * navigates the user to Settings → Diagnostics so they can see the
 * details and re-run the manual verifier.
 *
 * The ribbon is suppressed for the same verification run after a
 * dismiss; the next backup will clear the dismiss stamp and (if it
 * also fails) raise the ribbon again.
 *
 * Voice: factual, brief. "Last backup couldn't verify." Not
 * alarming, not minimizing. The user can act on it now or later.
 */
import React from 'react';
import { useDB } from '../../store/db';

export default function BackupAutoVerifyRibbon() {
  const lastVerification = useDB((s) => s.db.settings.lastBackupAutoVerification);
  const dismissedTs = useDB((s) => s.db.settings.lastBackupRibbonDismissedTs);
  const setSettings = useDB((s) => s.setSettings);

  if (!lastVerification) return null;
  if (lastVerification.ok) return null;
  if (dismissedTs !== undefined && dismissedTs >= lastVerification.ts) return null;

  function handleDismiss() {
    if (lastVerification) {
      setSettings({ lastBackupRibbonDismissedTs: lastVerification.ts });
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="backup-auto-verify-ribbon"
      className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800/60 px-4 py-2 text-sm flex items-center justify-between gap-3"
    >
      <div className="text-amber-900 dark:text-amber-200">
        <span className="font-medium">Last backup couldn&apos;t verify.</span>{' '}
        <a
          href="#diagnostics-card"
          className="underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-100"
          data-testid="backup-auto-verify-ribbon-link"
        >
          Tap for details
        </a>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss backup verification warning"
        data-testid="backup-auto-verify-ribbon-dismiss"
        className="text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100"
      >
        Dismiss
      </button>
    </div>
  );
}
