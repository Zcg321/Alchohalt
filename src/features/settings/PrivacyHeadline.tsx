/**
 * [R26-B] Pinned 1-line privacy summary at the top of Settings →
 * Privacy & data.
 *
 * Round 25 audit observation P1: privacy claims are spread across
 * five+ surfaces (PrivacyStatus rows, TrustReceipt sections, Sharing
 * panel, Sync panel, AI panel). A user who wants the headline answer
 * — "is anything leaving my device?" — has to skim all of them to
 * confirm.
 *
 * Round 26 fix: a single canonical 1-line claim at the top, with an
 * expand for the full Trust Receipt detail. The 1-liner is the same
 * line we use in the App Store description and the tagline so the
 * three surfaces line up — easier to maintain, easier for the user
 * to recognize. The expand wraps `PrivacyStatus` + a link to the
 * (lazily-mounted) Trust Receipt section below, so we don't duplicate
 * machinery — this is a navigation/orientation surface, not new data.
 */
import React from 'react';
import { useLanguage } from '../../i18n';
import { useDB } from '../../store/db';

export default function PrivacyHeadline() {
  const { t } = useLanguage();
  const dismissedAt = useDB(
    (s) => s.db.settings.firstLaunchPrivacyCardDismissedAt,
  );
  const setSettings = useDB((s) => s.setSettings);
  return (
    <section
      data-testid="privacy-headline"
      aria-labelledby="privacy-headline-heading"
      className="rounded-2xl border-2 border-sage-300 bg-sage-50/70 p-card dark:border-sage-700 dark:bg-sage-950/30"
    >
      <h3
        id="privacy-headline-heading"
        className="text-base font-semibold tracking-tight text-sage-900 dark:text-sage-100"
      >
        {t('settings.privacy.headline.title', 'Your data. On this device. Period.')}
      </h3>
      <p
        className="mt-2 text-sm text-sage-800 dark:text-sage-200"
        data-testid="privacy-headline-claim"
      >
        {t(
          'settings.privacy.headline.claim',
          'Nothing leaves your device. Backup is end-to-end encrypted. No analytics, no ads.',
        )}
      </p>
      <details className="mt-3" data-testid="privacy-headline-expand">
        <summary className="cursor-pointer text-xs font-medium text-sage-700 underline-offset-2 hover:underline dark:text-sage-300">
          {t('settings.privacy.headline.expand', 'How can I verify this?')}
        </summary>
        <div className="mt-2 space-y-2 text-xs text-sage-800 dark:text-sage-200">
          <p>
            {t(
              'settings.privacy.headline.verifyIntro',
              'Three checks anyone can run:',
            )}
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              {t(
                'settings.privacy.headline.verify1',
                'Open browser devtools → Network tab → reload. With every optional feature off, only the static app bundle loads.',
              )}
            </li>
            <li>
              {t(
                'settings.privacy.headline.verify2',
                'Read the per-feature breakdown below: which optional things can call out, and whether they are on right now.',
              )}
            </li>
            <li>
              {t(
                'settings.privacy.headline.verify3',
                'Open the Trust Receipt at the bottom of this section: print-ready summary of every claim and the file that backs it up.',
              )}
            </li>
          </ol>
        </div>
      </details>
      {dismissedAt ? (
        <button
          type="button"
          data-testid="privacy-headline-show-first-launch"
          onClick={() =>
            setSettings({ firstLaunchPrivacyCardDismissedAt: undefined as never })
          }
          className="mt-3 text-xs font-medium text-sage-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 dark:text-sage-300"
        >
          {t(
            'settings.privacy.headline.showFirstLaunchAgain',
            'Show the first-launch privacy card again',
          )}
        </button>
      ) : null}
    </section>
  );
}
