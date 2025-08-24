// @no-smoke
import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { StatRow } from '../../../components/ui/StatRow';
import type { StatsData } from './lib';
import { haltOptions } from '../../drinks/DrinkForm';

interface Props {
  data: StatsData;
  t: (key: string) => string;
}

export default function BehaviorSection({ data, t }: Props) {
  const afPct = data.afDays30 / 30;
  const copingPct = data.drinks30 ? data.altEvents30 / data.drinks30 : 0;
  const maxHalt = Math.max(...Object.values(data.haltCounts));
  const topHaltEntry =
    maxHalt > 0
      ? (Object.entries(data.haltCounts).find(([, v]) => v === maxHalt)! as [keyof typeof data.haltCounts, number])
      : null;
  const streakVariant = data.streak >= 30 ? 'success' : 'primary';
  return (
    <>
      <StatRow label={t('stats.coping30d')}>
        {data.altEvents30}
        {data.drinks30 > 0 && (
          <>
            {' '}/ {data.drinks30} ({(copingPct * 100).toFixed(0)}%)
            <Progress
              value={data.altEvents30}
              max={data.drinks30}
              label={t('stats.copingRatio')}
              valueText={`${(copingPct * 100).toFixed(0)} percent coping`}
              variant={copingPct >= 1 ? 'success' : 'primary'}
            />
          </>
        )}
      </StatRow>
      <StatRow label={t('stats.afDays30d')}>
        {data.afDays30}
        <Progress
          value={data.afDays30}
          max={30}
          label={t('stats.afDaysLabel')}
          valueText={`${(afPct * 100).toFixed(0)} percent alcohol free`}
          variant={afPct >= 0.8 ? 'success' : afPct >= 0.5 ? 'warning' : 'danger'}
        />
      </StatRow>
      <StatRow label={t('stats.streakTo30d')}>
        {data.streak}
        <Progress
          value={data.streak}
          max={30}
          label={t('stats.streakProgressLabel')}
          valueText={`${data.streak} of 30 days`}
          variant={streakVariant}
        />
      </StatRow>
      <StatRow label={t('stats.longestTo100d')}>
        {data.longest}
        <Progress
          value={data.longest}
          max={100}
          label={t('stats.longestStreakProgressLabel')}
          valueText={`${data.longest} ${t('stats.of100days')}`}
          variant={data.longest >= 100 ? 'success' : 'primary'}
        />
      </StatRow>
      {topHaltEntry && (
        <StatRow label={t('stats.mostFrequentHalt')}>
          <Badge variant="danger" aria-label={`${t(`halt_${topHaltEntry[0]}`)}: ${topHaltEntry[1]}`}>
            {t(`halt_${topHaltEntry[0]}`)}: {topHaltEntry[1]}
          </Badge>
        </StatRow>
      )}
      <StatRow label={t('stats.haltCounts')}>
        <div className="flex flex-wrap gap-1">
          {haltOptions.map((h) => {
            const label = t(`halt_${h}`);
            const abbr = label.charAt(0).toUpperCase();
            const v = data.haltCounts[h];
            const variant: 'danger' | 'neutral' =
              v > 0 && v === maxHalt ? 'danger' : 'neutral';
            return (
              <Badge key={h} variant={variant} aria-label={`${label}: ${v}`}>
                <abbr title={label} className="no-underline">
                  {abbr}
                </abbr>
                : {v}
              </Badge>
            );
          })}
        </div>
      </StatRow>
    </>
  );
}
