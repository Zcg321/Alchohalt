import React, { useMemo } from 'react';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../../types/common';
import { computeProgressData } from './progressMath';
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

export default function ProgressVisualization({ drinks, goals }: Props) {
  const progressData = useMemo(() => computeProgressData(drinks, goals), [drinks, goals]);

  return (
    <div className="space-y-6">
      <GoalProgressCard data={progressData} goals={goals} />
      <StreakMilestoneCard data={progressData} />
      <MonthlySpendingCard data={progressData} />
      <HealthInsightsCard data={progressData} />
    </div>
  );
}
