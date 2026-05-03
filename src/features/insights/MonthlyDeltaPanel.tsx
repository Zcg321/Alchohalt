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
        <div className="grid grid-cols-2 gap-4" data-testid="monthly-delta-grid">
          <Metric
            label={t('monthlyDelta.totalDrinks', 'Total drinks')}
            value={delta.current.totalStdDrinks.toFixed(0)}
            priorLabel={t('monthlyDelta.priorTotal', 'Prior: {{n}}').replace(
              '{{n}}',
              delta.prior.totalStdDrinks.toFixed(0),
            )}
            pct={delta.totalChangePct}
            lowerIsBetter
            testid="metric-total"
            fmtPct={fmtPct}
            directionClass={directionClass}
          />
          <Metric
            label={t('monthlyDelta.afDays', 'AF days')}
            value={String(delta.current.afDays)}
            priorLabel={t('monthlyDelta.priorAf', 'Prior: {{n}}').replace(
              '{{n}}',
              String(delta.prior.afDays),
            )}
            pct={delta.afDaysChangePct}
            lowerIsBetter={false}
            testid="metric-af"
            fmtPct={fmtPct}
            directionClass={directionClass}
          />
          {/* [R15-1] Drinking-day count + per-drinking-day average. */}
          <Metric
            label={t('monthlyDelta.drinkingDays', 'Drinking days')}
            value={String(delta.current.drinkingDays)}
            priorLabel={t('monthlyDelta.priorDrinkingDays', 'Prior: {{n}}').replace(
              '{{n}}',
              String(delta.prior.drinkingDays),
            )}
            pct={delta.drinkingDaysChangePct}
            lowerIsBetter
            testid="metric-drinking-days"
            fmtPct={fmtPct}
            directionClass={directionClass}
          />
          <Metric
            label={t('monthlyDelta.avgPerDrinkingDay', 'Avg per drinking day')}
            value={delta.current.avgPerDrinkingDay.toFixed(1)}
            priorLabel={t('monthlyDelta.priorAvgPerDrinkingDay', 'Prior: {{n}}').replace(
              '{{n}}',
              delta.prior.avgPerDrinkingDay.toFixed(1),
            )}
            pct={delta.avgPerDrinkingDayChangePct}
            lowerIsBetter
            testid="metric-avg-drinking-day"
            fmtPct={fmtPct}
            directionClass={directionClass}
          />
        </div>
      </div>
    </section>
  );
}

interface MetricProps {
  label: string;
  value: string;
  priorLabel: string;
  pct: number | null;
  lowerIsBetter: boolean;
  testid: string;
  fmtPct: (n: number | null) => string;
  directionClass: (n: number | null, lowerIsBetter: boolean) => string;
}
function Metric({ label, value, priorLabel, pct, lowerIsBetter, testid, fmtPct, directionClass }: MetricProps) {
  return (
    <div data-testid={testid}>
      <div className="text-xs uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-ink-soft tabular-nums">{priorLabel}</div>
      <div className={`text-sm font-medium ${directionClass(pct, lowerIsBetter)}`}>
        {fmtPct(pct)}
      </div>
    </div>
  );
}
