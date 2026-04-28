/**
 * Goals tab — limits, milestones, advanced goals.
 *
 * Sprint 2A `[IA-2]`. Surfaces the goal-setting widgets that used to
 * live on home in StatsAndGoals. Settings panel has its own surface.
 *
 * Empty state: "No goals yet. Pick a daily limit you'd feel good
 * about — you can change it anytime."
 */
import React, { Suspense } from 'react';
import type { Goals } from '../../types/common';
import { Skeleton } from '../../components/ui/Skeleton';

const GoalSettings = React.lazy(() => import('../../features/goals/GoalSettings'));
const AdvancedGoalSetting = React.lazy(() => import('../../features/goals/AdvancedGoalSetting'));

interface Props {
  goals: Goals;
  onGoalsChange: (g: Goals) => void;
}

export default function GoalsTab({ goals, onGoalsChange }: Props) {
  const hasGoals = goals.dailyCap > 0 || goals.weeklyGoal > 0;
  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-section-y-mobile lg:py-section-y-desktop space-y-8">
      <header className="text-center">
        <h2 className="text-h2 text-ink">Goals</h2>
        <p className="mt-1 text-caption text-ink-soft">
          Set the limits and milestones that feel right. You can change them anytime.
        </p>
      </header>

      {!hasGoals ? (
        <div className="rounded-2xl border border-border-soft bg-surface-elevated p-card text-center">
          <p className="text-body text-ink">No goals yet.</p>
          <p className="mt-1 text-caption text-ink-soft">Start with a daily limit you'd feel good about.</p>
        </div>
      ) : null}

      <section aria-labelledby="goals-settings" className="space-y-3">
        <h3 id="goals-settings" className="text-h3 text-ink">Daily limit & weekly goal</h3>
        <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
          <GoalSettings goals={goals} onChange={onGoalsChange} />
        </Suspense>
      </section>

      <section aria-labelledby="goals-advanced" className="space-y-3">
        <h3 id="goals-advanced" className="text-h3 text-ink">Advanced goals</h3>
        <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
          <AdvancedGoalSetting goals={goals} onChange={onGoalsChange} />
        </Suspense>
      </section>
    </main>
  );
}
