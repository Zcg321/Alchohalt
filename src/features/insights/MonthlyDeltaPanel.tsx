import React from 'react';
import { useLanguage } from '../../i18n';
import { useDB } from '../../store/db';
import { computeMonthlyDelta, formatMonth } from './monthlyDelta';

/**
 * [R10-B] Renders a 2-row delta panel comparing this month to the prior
 * calendar month. Shows total drinks + AF days + percent deltas. Empty
 * state for the first month.
 *
 * Voice rule: numbers only, no encouragement / shame text. The data
 * speaks for itself; the user reads the trend on their own.
 */
export default function MonthlyDeltaPanel() {
  const { t, lang } = useLanguage();
  const { db } = useDB();

  const delta = React.useMemo(() => computeMonthlyDelta(db.entries), [db.entries]);

  if (delta.prior === null) {
    return (
      <section
        aria-labelledby="monthly-delta-heading"
        className="card"
      >
        <div className="card-header">
          <h3 id="monthly-delta-heading" className="text-lg font-semibold">
            {t('monthlyDelta.title', 'Month over month')}
          </h3>
          <p className="text-sm text-ink-soft mt-1">
            {t('monthlyDelta.subtitle', 'How this month compares to the one before.')}
          </p>
        </div>
        <div className="card-content">
          <p className="text-sm text-ink-soft">
            {t(
              'monthlyDelta.empty',
              'Not enough history yet. Comes back next month.'
            )}
          </p>
        </div>
      </section>
    );
  }

  const fmtPct = (n: number | null): string => {
    if (n === null) return '—';
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(0)}%`;
  };

  const directionClass = (n: number | null, lowerIsBetter: boolean): string => {
    if (n === null || n === 0) return 'text-ink-soft';
    const better = lowerIsBetter ? n < 0 : n > 0;
    return better
      ? 'text-emerald-700 dark:text-emerald-300'
      : 'text-rose-700 dark:text-rose-300';
  };

  return (
    <section
      aria-labelledby="monthly-delta-heading"
      className="card"
    >
      <div className="card-header">
        <h3 id="monthly-delta-heading" className="text-lg font-semibold">
          {t('monthlyDelta.title', 'Month over month')}
        </h3>
        <p className="text-sm text-ink-soft mt-1">
          {formatMonth(delta.current.monthStartTs, lang)} {t('monthlyDelta.versus', 'vs')}{' '}
          {formatMonth(delta.prior.monthStartTs, lang)}
        </p>
      </div>
      <div className="card-content space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-soft">
              {t('monthlyDelta.totalDrinks', 'Total drinks')}
            </div>
            <div className="text-2xl font-semibold tabular-nums">
              {delta.current.totalStdDrinks.toFixed(0)}
            </div>
            <div className="text-xs text-ink-soft tabular-nums">
              {t('monthlyDelta.priorTotal', 'Prior: {{n}}').replace(
                '{{n}}',
                delta.prior.totalStdDrinks.toFixed(0)
              )}
            </div>
            <div className={`text-sm font-medium ${directionClass(delta.totalChangePct, true)}`}>
              {fmtPct(delta.totalChangePct)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-soft">
              {t('monthlyDelta.afDays', 'AF days')}
            </div>
            <div className="text-2xl font-semibold tabular-nums">{delta.current.afDays}</div>
            <div className="text-xs text-ink-soft tabular-nums">
              {t('monthlyDelta.priorAf', 'Prior: {{n}}').replace(
                '{{n}}',
                String(delta.prior.afDays)
              )}
            </div>
            <div className={`text-sm font-medium ${directionClass(delta.afDaysChangePct, false)}`}>
              {fmtPct(delta.afDaysChangePct)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
