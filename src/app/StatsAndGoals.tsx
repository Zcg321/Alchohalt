import React from 'react';
import { stdDrinks } from '../lib/calc';
import GoalSettings from '../features/goals/GoalSettings';
import AdvancedGoalSetting from '../features/goals/AdvancedGoalSetting';
import MoneySavedWidget from '../features/money/MoneySavedWidget';
import type { Drink } from '../features/drinks/DrinkForm';
import type { Goals } from '../types/common';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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

  // Last 30 days of costs for the money-saved widget. Pure local calc.
  // Cost = standard drinks × user's price-per-std (from Goals settings).
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  const pricePerStd = Number.isFinite(goals.pricePerStd) ? goals.pricePerStd : 0;
  const last30Costs = drinks
    .filter((d) => d.ts >= cutoff)
    .map((d) => stdDrinks(d.volumeMl, d.abvPct) * pricePerStd);

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

      <div className="lg:col-span-1">
        <MoneySavedWidget
          costs={last30Costs}
          monthlyBudget={goals.baselineMonthlySpend ?? 0}
        />
      </div>

      <div className="lg:col-span-1 space-y-4">
        <div id="settings-section">
          <GoalSettings goals={goals} onChange={onGoalsChange} />
        </div>
        <AdvancedGoalSetting goals={goals} onChange={onGoalsChange} />
      </div>
    </section>
  );
}
