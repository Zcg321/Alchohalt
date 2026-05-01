import React from 'react';
import type { Goals } from '../../types/common';
import type { ProgressData } from './progressMath';

function progressBarColor(percent: number, palette: 'green' | 'blue'): string {
  if (percent > 100) return 'bg-red-500';
  if (percent > 80) return 'bg-yellow-500';
  return palette === 'green' ? 'bg-green-500' : 'bg-blue-500';
}

function GoalRow({
  label,
  percent,
  goalValue,
  unitLabel,
  palette,
  emptyHint,
}: {
  label: string;
  percent: number;
  goalValue: number;
  unitLabel: string;
  palette: 'green' | 'blue';
  emptyHint: string;
}) {
  if (percent < 0) return <p className="text-xs text-ink-subtle">{emptyHint}</p>;
  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-ink-soft stat-num">{percent.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-cream-100 dark:bg-charcoal-700 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${progressBarColor(percent, palette)}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="text-xs text-ink-subtle mt-1">
        {percent <= 100
          ? `${(goalValue - (goalValue * percent) / 100).toFixed(1)} ${unitLabel}`
          : `Exceeded by ${(percent - 100).toFixed(0)}%`}
      </div>
    </>
  );
}

export function GoalProgressCard({ data, goals }: { data: ProgressData; goals: Goals }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">Goal Progress</h2>
      </div>
      <div className="card-content space-y-6">
        <div>
          <GoalRow
            label="Daily limit"
            percent={data.dailyProgress}
            goalValue={goals.dailyCap}
            unitLabel="drinks remaining"
            palette="green"
            emptyHint="Set a daily limit in Settings to track progress."
          />
        </div>
        <div>
          <GoalRow
            label="Weekly goal"
            percent={data.weeklyProgress}
            goalValue={goals.weeklyGoal}
            unitLabel="drinks remaining this week"
            palette="blue"
            emptyHint="Set a weekly goal in Settings to track progress."
          />
        </div>
      </div>
    </div>
  );
}

export function StreakMilestoneCard({ data }: { data: ProgressData }) {
  const { current, next, progress } = data.streakMilestones;
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">Streak Milestone</h2>
      </div>
      <div className="card-content">
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">{current}</div>
          <div className="text-sm text-ink-soft">Days alcohol-free</div>
        </div>
        <div className="mb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Next milestone: {next} days</span>
            <span className="text-sm text-ink-soft">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-cream-100 dark:bg-charcoal-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="text-xs text-center text-ink-subtle">{next - current} days to go!</div>
      </div>
    </div>
  );
}

function budgetBarColor(actual: number, budget: number): string {
  if (actual > budget) return 'bg-red-500';
  if (actual > budget * 0.8) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function MonthlySpendingCard({ data }: { data: ProgressData }) {
  const { actual, budget, savings } = data.monthlySpending;
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">Monthly Spending</h2>
      </div>
      <div className="card-content">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-ink">${actual.toFixed(0)}</div>
            <div className="text-sm text-ink-soft">Spent this month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">${savings.toFixed(0)}</div>
            <div className="text-sm text-ink-soft">Potential savings</div>
          </div>
        </div>
        {budget > 0 ? (
          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Budget usage</span>
              <span className="text-sm text-ink-soft stat-num">{((actual / budget) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-cream-100 dark:bg-charcoal-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${budgetBarColor(actual, budget)}`}
                style={{ width: `${Math.min((actual / budget) * 100, 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink-subtle">Set a monthly budget in Settings to track usage.</p>
        )}
      </div>
    </div>
  );
}

const TREND_ICON: Record<ProgressData['healthMetrics']['improvementTrend'], string> = {
  improving: '↗',
  declining: '↘',
  stable: '→',
};

const TREND_COLOR: Record<ProgressData['healthMetrics']['improvementTrend'], string> = {
  improving: 'text-green-600 dark:text-green-400',
  declining: 'text-red-600 dark:text-red-400',
  stable: 'text-yellow-600 dark:text-yellow-400',
};

export function HealthInsightsCard({ data }: { data: ProgressData }) {
  const { alcoholFreeDays, averageCraving, improvementTrend } = data.healthMetrics;
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">Health Insights</h2>
      </div>
      <div className="card-content">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{alcoholFreeDays}</div>
            <div className="text-sm text-ink-soft">AF days this month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              {averageCraving.toFixed(1)}
            </div>
            <div className="text-sm text-ink-soft">Avg. craving level</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${TREND_COLOR[improvementTrend]}`} aria-hidden="true">
              {TREND_ICON[improvementTrend]}
            </div>
            <div className="text-sm text-ink-soft">Overall trend</div>
          </div>
        </div>
      </div>
    </div>
  );
}
