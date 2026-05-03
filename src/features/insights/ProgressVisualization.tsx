import React, { useCallback } from 'react';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../../types/common';
import { runProgressData } from '../../workers/insightsWorkerClient';
import { useInsightWorker } from './useInsightWorker';
import {
  GoalProgressCard,
  HealthInsightsCard,
  MonthlySpendingCard,
  StreakMilestoneCard,
} from './progressCards';

interface Props {
  drinks: Drink[];
  goals: Goals;
}

/* [R21-1] computeProgressData runs off-thread via insights worker. In
 * jsdom (tests) the client falls back to sync execution; the loading
 * placeholder still renders for one tick before data resolves. The
 * placeholder is a card-shaped skeleton so layout doesn't shift. */
export default function ProgressVisualization({ drinks, goals }: Props) {
  const fn = useCallback(() => runProgressData(drinks, goals), [drinks, goals]);
  const { data: progressData, error } = useInsightWorker(fn, [fn]);

  if (error) {
    /* Worker spawn failed AND sync fallback also threw — render a
     * tiny diagnostic so the user sees something rather than a
     * mysteriously empty Insights tab. */
    return (
      <div className="text-caption text-ink-soft" data-testid="progress-error">
        Insights compute failed: {error.message}
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="space-y-6" aria-busy="true" data-testid="progress-loading">
        <div className="rounded-2xl border border-border-soft bg-surface-elevated h-32 animate-pulse" />
        <div className="rounded-2xl border border-border-soft bg-surface-elevated h-24 animate-pulse" />
        <div className="rounded-2xl border border-border-soft bg-surface-elevated h-24 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GoalProgressCard data={progressData} goals={goals} />
      <StreakMilestoneCard data={progressData} />
      <MonthlySpendingCard data={progressData} />
      <HealthInsightsCard data={progressData} />
    </div>
  );
}
