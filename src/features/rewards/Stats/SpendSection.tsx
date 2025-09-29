// @no-smoke
import React from 'react';
import { Progress } from '../../../components/ui/Progress';
import { StatRow } from '../../../components/ui/StatRow';
import type { StatsData } from './lib';
import type { Goals } from '../../../types/common';

interface Props {
  data: StatsData;
  goals: Goals;
  cf: Intl.NumberFormat;
  t: (key: string) => string;
}

export default function SpendSection({ data, goals, cf, t }: Props) {
  const actualSpend = data.monthStd * goals.pricePerStd;
  const delta = goals.baselineMonthlySpend - actualSpend;
  const savingsColor = delta >= 0 ? 'text-green-700' : 'text-red-700';
  const spendVariant = delta >= 0 ? 'success' : 'danger';
  return (
    <>
      <StatRow label={t('stats.monthlySpend')}>
        {cf.format(actualSpend)}
        {goals.baselineMonthlySpend > 0 && (
          <>
            {' '}/ {cf.format(goals.baselineMonthlySpend)} ({(
              (actualSpend / goals.baselineMonthlySpend) * 100
            ).toFixed(0)}%)
            <Progress
              value={actualSpend}
              max={goals.baselineMonthlySpend}
              label={t('stats.monthlySpendVsBaseline')}
              valueText={`${(
                (actualSpend / goals.baselineMonthlySpend) * 100
              ).toFixed(0)} percent of baseline`}
              variant={spendVariant}
            />
          </>
        )}
      </StatRow>
      <StatRow label={t('stats.savings')}>
        <span className={savingsColor}>
          {delta >= 0
            ? `${t('stats.saved')} ${cf.format(delta)} ${t('stats.vsBaseline')}`
            : `${t('stats.overBaseline')} ${cf.format(-delta)} ${t('stats.vsBaseline')}`}
        </span>
      </StatRow>
    </>
  );
}
