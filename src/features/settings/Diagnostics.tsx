import React, { useState } from 'react';
import { useDB } from '../../store/db';
import { useLanguage } from '../../i18n';
import IntentRevisionModal from '../onboarding/IntentRevisionModal';

/**
 * [R9-2] Diagnostics card — surfaces local-only state that helps the
 * owner / a self-experimenter see how the onboarding flow is being
 * used WITHOUT shipping any telemetry.
 *
 * The point isn't to track users. The point is to make sure the
 * onboarding flow is itself measurable so we can iterate on it. None
 * of this leaves the device. The whole card is a read-out of what
 * already lives in `db.settings.onboardingDiagnostics`.
 *
 * [R10-C] Adds an "Update my intent" button that re-prompts step 1 of
 * onboarding. The original answer is preserved in
 * `onboardingDiagnosticsHistory`; the latest answer drives display.
 */
export default function Diagnostics() {
  const { t } = useLanguage();
  const diag = useDB((s) => s.db.settings.onboardingDiagnostics);
  const history = useDB((s) => s.db.settings.onboardingDiagnosticsHistory) ?? [];
  const [editing, setEditing] = useState(false);

  const status = diag?.status ?? 'not-started';
  const statusLabel =
    status === 'completed'
      ? t('diagnostics.onboardingCompleted', 'Completed')
      : status === 'skipped'
      ? t('diagnostics.onboardingSkipped', 'Skipped')
      : t('diagnostics.onboardingNotStarted', 'Not started');

  const completedAt = diag?.completedAt
    ? new Date(diag.completedAt).toLocaleString()
    : t('diagnostics.noChoice', '—');

  return (
    <section
      className="card"
      aria-labelledby="diagnostics-heading"
      data-testid="diagnostics-card"
    >
      <div className="card-header">
        <h2
          id="diagnostics-heading"
          className="text-lg font-semibold tracking-tight"
        >
          {t('diagnostics.title', 'Diagnostics')}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          {t(
            'diagnostics.description',
            'Self-experiment view. None of this leaves your phone.',
          )}
        </p>
      </div>
      <div className="card-content">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div className="flex flex-col">
            <dt className="text-xs uppercase tracking-wider text-ink-soft">
              {t('diagnostics.onboarding', 'Onboarding')}
            </dt>
            <dd className="font-medium" data-testid="diagnostics-status">
              {statusLabel}
              {diag?.skipPath && (
                <span className="ml-2 text-xs text-ink-soft">({diag.skipPath})</span>
              )}
            </dd>
          </div>

          <div className="flex flex-col">
            <dt className="text-xs uppercase tracking-wider text-ink-soft">
              {t('diagnostics.intentChosen', 'Intent chosen')}
            </dt>
            <dd className="font-medium" data-testid="diagnostics-intent">
              {diag?.intent ?? t('diagnostics.noChoice', '—')}
            </dd>
          </div>

          <div className="flex flex-col">
            <dt className="text-xs uppercase tracking-wider text-ink-soft">
              {t('diagnostics.trackStyleChosen', 'Tracking style chosen')}
            </dt>
            <dd className="font-medium" data-testid="diagnostics-trackstyle">
              {diag?.trackStyle ?? t('diagnostics.noChoice', '—')}
            </dd>
          </div>

          <div className="flex flex-col">
            <dt className="text-xs uppercase tracking-wider text-ink-soft">
              {t('diagnostics.completedAt', 'Completed at')}
            </dt>
            <dd className="font-medium" data-testid="diagnostics-completedat">
              {completedAt}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setEditing(true)}
            data-testid="diagnostics-update-intent"
            className="text-sm font-medium text-primary-700 dark:text-primary-300 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 rounded"
          >
            {t('diagnostics.updateIntent', 'Update my intent')}
          </button>
          {history.length > 0 && (
            <span className="text-xs text-ink-soft">
              {t('diagnostics.historyCount', '{{n}} prior answer{{s}}')
                .replace('{{n}}', String(history.length))
                .replace('{{s}}', history.length === 1 ? '' : 's')}
            </span>
          )}
        </div>

        {history.length > 0 && (
          <details className="mt-3" data-testid="diagnostics-history">
            <summary className="text-xs text-ink-soft cursor-pointer">
              {t('diagnostics.historyTitle', 'Prior answers')}
            </summary>
            <ul className="mt-2 space-y-1 text-xs">
              {history
                .slice()
                .reverse()
                .map((row) => (
                  <li key={row.revisedAt} className="text-ink-soft">
                    <span className="font-medium text-ink">{row.intent ?? '—'}</span>
                    <span className="ml-2">
                      {new Date(row.revisedAt).toLocaleString()}
                    </span>
                  </li>
                ))}
            </ul>
          </details>
        )}

        <IntentRevisionModal open={editing} onClose={() => setEditing(false)} />
      </div>
    </section>
  );
}
