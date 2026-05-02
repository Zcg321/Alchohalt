// @no-smoke
import React from 'react';
import { useDB } from '../../store/db';
import { computeOnboardingFunnel } from '../onboarding/funnel';

/**
 * [R11-1] Local-only onboarding funnel view.
 *
 * Renders ONLY from local state. Never transmitted, never logged to
 * the device's debugger. The owner can self-experiment with the
 * onboarding flow (clear data → run through → check funnel) without
 * shipping any analytics infra.
 */
export default function OnboardingFunnelView() {
  const diag = useDB((s) => s.db.settings.onboardingDiagnostics);
  const history = useDB((s) => s.db.settings.onboardingDiagnosticsHistory);
  const funnel = computeOnboardingFunnel(diag, history);

  if (funnel.totalAttempts === 0) {
    return (
      <section
        className="card"
        aria-labelledby="funnel-heading"
        data-testid="onboarding-funnel-empty"
      >
        <div className="card-header">
          <h3 id="funnel-heading" className="text-base font-semibold tracking-tight">
            Onboarding funnel
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            No attempts recorded yet. Clear data and re-run onboarding to populate.
          </p>
        </div>
      </section>
    );
  }

  const ratePct =
    funnel.completionRate === null ? '—' : `${Math.round(funnel.completionRate * 100)}%`;

  return (
    <section
      className="card"
      aria-labelledby="funnel-heading"
      data-testid="onboarding-funnel"
    >
      <div className="card-header">
        <h3 id="funnel-heading" className="text-base font-semibold tracking-tight">
          Onboarding funnel
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          On-device counts across {funnel.totalAttempts} attempt
          {funnel.totalAttempts === 1 ? '' : 's'}. Never transmitted.
        </p>
      </div>
      <div className="card-content space-y-3">
        <dl className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-soft">Attempts</dt>
            <dd className="font-medium" data-testid="funnel-total">
              {funnel.totalAttempts}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-soft">Completed</dt>
            <dd className="font-medium" data-testid="funnel-completed">
              {funnel.totalCompleted}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-soft">Completion</dt>
            <dd className="font-medium tabular-nums" data-testid="funnel-rate">
              {ratePct}
            </dd>
          </div>
        </dl>

        <div className="space-y-2">
          {funnel.steps.map((s) => {
            const reachRate =
              funnel.totalAttempts === 0 ? 0 : s.reached / funnel.totalAttempts;
            const dropRate =
              s.reached === 0 ? 0 : s.droppedHere / s.reached;
            const paths = Object.entries(s.byPath);
            return (
              <div
                key={s.step}
                className="rounded-lg border border-neutral-200/70 dark:border-neutral-700/60 p-3"
                data-testid={`funnel-step-${s.step}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-sm">{s.label}</span>
                  <span className="text-xs text-ink-soft tabular-nums">
                    {s.reached} reached ({Math.round(reachRate * 100)}%)
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2 text-xs text-ink-soft">
                  <span>
                    Dropped here:{' '}
                    <span className="font-medium text-ink dark:text-neutral-200 tabular-nums">
                      {s.droppedHere}
                    </span>{' '}
                    ({Math.round(dropRate * 100)}%)
                  </span>
                  {paths.length > 0 && (
                    <span className="tabular-nums">
                      {paths.map(([path, n]) => `${path}: ${n}`).join(' · ')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
