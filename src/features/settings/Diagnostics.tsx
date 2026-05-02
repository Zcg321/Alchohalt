import React from 'react';
import { useDB } from '../../store/db';
import { useLanguage } from '../../i18n';

/**
 * [R9-2] Diagnostics card — surfaces local-only state that helps the
 * owner / a self-experimenter see how the onboarding flow is being
 * used WITHOUT shipping any telemetry.
 *
 * The point isn't to track users. The point is to make sure the
 * onboarding flow is itself measurable so we can iterate on it. None
 * of this leaves the device. The whole card is a read-out of what
 * already lives in `db.settings.onboardingDiagnostics`.
 */
export default function Diagnostics() {
  const { t } = useLanguage();
  const diag = useDB((s) => s.db.settings.onboardingDiagnostics);

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
      </div>
    </section>
  );
}
