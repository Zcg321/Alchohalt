import React from 'react';
import { stdDrinks } from '../lib/calc';
import GoalSettings from '../features/goals/GoalSettings';
import AdvancedGoalSetting from '../features/goals/AdvancedGoalSetting';
import type { Drink } from '../features/drinks/DrinkForm';
import type { Goals } from '../types/common';

interface Props {
  drinks: Drink[];
  goals: Goals;
  onGoalsChange: (goals: Goals) => void;
  id?: string;
}

export default function StatsAndGoals({ drinks, goals, onGoalsChange, id }: Props) {
  const totalStd = drinks.reduce(
    (sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct),
    0
  );

  return (
    <section id={id} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="card text-center lg:col-span-1">
        <div className="card-content">
          <div className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">
            {totalStd.toFixed(1)}
          </div>
          <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Total Standard Drinks
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-2 space-y-4">
        <div id="settings-section">
          <GoalSettings goals={goals} onChange={onGoalsChange} />
        </div>
        <AdvancedGoalSetting goals={goals} onChange={onGoalsChange} />
      </div>
    </section>
  );
}