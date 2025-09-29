// @no-smoke
import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { StatRow } from '../../../components/ui/StatRow';
import type { StatsData } from './lib';
import type { Goals } from '../../../types/common';
interface Props {
  data: StatsData;
  goals: Goals;
  nf1: Intl.NumberFormat;
  t: (key: string) => string;
}

export default function TopSection({ data, goals, nf1, t }: Props) {
  const weekPct = goals.weeklyGoal ? data.weekStd / goals.weeklyGoal : 0;
  const weekChange = data.weekStd - data.lastWeekStd;
  const changeColor =
    weekChange > 0 ? 'text-red-700' : weekChange < 0 ? 'text-green-700' : 'text-gray-700';
  const changeArrow = weekChange > 0 ? '↑' : weekChange < 0 ? '↓' : '→';
  const avgStd30 = data.monthStd / 30;
  const avgStdPrev30 = data.prevMonthStd / 30;
  const avgChange = avgStd30 - avgStdPrev30;
  const avgChangeColor =
    avgChange > 0 ? 'text-red-700' : avgChange < 0 ? 'text-green-700' : 'text-gray-700';
  const avgChangeArrow = avgChange > 0 ? '↑' : avgChange < 0 ? '↓' : '→';
  return (
    <>
      <StatRow label={t('stats.afStreak')}>
        <div className="flex items-center gap-2">
          <Badge variant="success">{data.streak}</Badge>
          <span className="text-sm text-gray-600">
            {t('stats.best')}: {data.longest}
          </span>
        </div>
      </StatRow>
      <StatRow label={t('stats.points')}>{data.points}</StatRow>
      <StatRow label={t('stats.weekTotal')}>
        {nf1.format(data.weekStd)}
        {goals.weeklyGoal > 0 && (
          <>
            {' '}/ {goals.weeklyGoal} ({(weekPct * 100).toFixed(0)}%)
            <Progress
              value={data.weekStd}
              max={goals.weeklyGoal}
              label={t('stats.weeklyGoalProgress')}
              valueText={`${(weekPct * 100).toFixed(0)}% ${t('stats.ofGoal')}`}
              variant={weekPct <= 1 ? 'primary' : 'danger'}
            />
          </>
        )}
      </StatRow>
      {goals.weeklyGoal > 0 && (
        <StatRow label={t('stats.vsLastWeek')}>
          <span className={`text-sm ${changeColor}`}>
            <span aria-hidden>{changeArrow}</span>
            <span className="sr-only">
              {weekChange > 0
                ? t('stats.increase')
                : weekChange < 0
                ? t('stats.decrease')
                : t('stats.noChange')}
            </span>{' '}
            {weekChange >= 0 ? '+' : ''}
            {weekChange.toFixed(1)} std
          </span>
        </StatRow>
      )}
      <StatRow label={t('stats.avgCraving30d')}>{nf1.format(data.avgCraving30)}</StatRow>
      <StatRow label={t('stats.avgPerDay30d')}>
        {nf1.format(avgStd30)}
        <span className={`ml-2 text-sm ${avgChangeColor}`}>
          <span aria-hidden>{avgChangeArrow}</span>
          <span className="sr-only">
            {avgChange > 0
              ? t('stats.increase')
              : avgChange < 0
              ? t('stats.decrease')
              : t('stats.noChange')}
          </span>{' '}
          {avgChange >= 0 ? '+' : ''}
          {avgChange.toFixed(1)} {t('stats.vsPrev30d')}
        </span>
      </StatRow>
      <StatRow label={t('stats.avgPerDrinkDay30d')}>
        {nf1.format(data.avgPerDrinkDay30)}
      </StatRow>
      <StatRow label={t('stats.daysSinceLast')}>
        {data.daysSinceLast ?? '–'}
      </StatRow>
    </>
  );
}
