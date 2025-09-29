import React, { useMemo } from 'react';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../../types/common';
import { stdDrinks } from '../../lib/calc';
import { useLanguage } from '../../i18n';

interface Props {
  drinks: Drink[];
  goals: Goals;
}

interface ProgressData {
  dailyProgress: number;
  weeklyProgress: number;
  monthlySpending: {
    actual: number;
    budget: number;
    savings: number;
  };
  streakMilestones: {
    current: number;
    next: number;
    progress: number;
  };
  healthMetrics: {
    alcoholFreeDays: number;
    averageCraving: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
  };
}

export default function ProgressVisualization({ 
  drinks = [], 
  goals = { dailyCap: 2, weeklyGoal: 10, pricePerStd: 3, baselineMonthlySpend: 150 } 
}: Props) {
  const { t } = useLanguage();

  const progressData = useMemo((): ProgressData => {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;
    const monthStart = now - 30 * 24 * 60 * 60 * 1000;

    // Calculate daily and weekly progress
    const todayDrinks = drinks.filter(d => d.ts >= todayStart);
    const weekDrinks = drinks.filter(d => d.ts >= weekStart);
    const monthDrinks = drinks.filter(d => d.ts >= monthStart);

    const todayStd = todayDrinks.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
    const weekStd = weekDrinks.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);

    const dailyProgress = Math.min((todayStd / goals.dailyCap) * 100, 100);
    const weeklyProgress = Math.min((weekStd / goals.weeklyGoal) * 100, 100);

    // Calculate spending
    const monthlyActual = monthDrinks.reduce((sum, d) => 
      sum + (stdDrinks(d.volumeMl, d.abvPct) * goals.pricePerStd), 0
    );
    const alcoholFreeDays = getAlcoholFreeDaysInMonth(drinks);
    const potentialSavings = (alcoholFreeDays * goals.baselineMonthlySpend) / 30;

    // Calculate streak and milestones
    const currentStreak = getCurrentStreak(drinks);
    const nextMilestone = getNextMilestone(currentStreak);
    const streakProgress = ((currentStreak % nextMilestone) / nextMilestone) * 100;

    // Calculate health metrics
    const avgCraving = monthDrinks.length > 0 
      ? monthDrinks.reduce((sum, d) => sum + d.craving, 0) / monthDrinks.length 
      : 0;
    
    const improvementTrend = calculateImprovementTrend(drinks);

    return {
      dailyProgress,
      weeklyProgress,
      monthlySpending: {
        actual: monthlyActual,
        budget: goals.baselineMonthlySpend,
        savings: Math.max(0, potentialSavings - monthlyActual)
      },
      streakMilestones: {
        current: currentStreak,
        next: nextMilestone,
        progress: streakProgress
      },
      healthMetrics: {
        alcoholFreeDays,
        averageCraving: avgCraving,
        improvementTrend
      }
    };
  }, [drinks, goals]);

  return (
    <div className="space-y-6">
      {/* Daily & Weekly Progress */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">{t('progressVisualization.goalProgress')}</h2>
        </div>
        <div className="card-content space-y-6">
          {/* Daily Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{t('progressVisualization.dailyLimit')}</span>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {progressData.dailyProgress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  progressData.dailyProgress > 100 
                    ? 'bg-red-500' 
                    : progressData.dailyProgress > 80 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(progressData.dailyProgress, 100)}%` }}
              />
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {progressData.dailyProgress <= 100
                ? t('progressVisualization.dailyRemaining', {
                    count: (goals.dailyCap - (goals.dailyCap * progressData.dailyProgress / 100)).toFixed(1)
                  })
                : t('progressVisualization.dailyExceeded', {
                    percent: (progressData.dailyProgress - 100).toFixed(0)
                  })
              }
            </div>
          </div>

          {/* Weekly Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{t('progressVisualization.weeklyGoal')}</span>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {progressData.weeklyProgress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  progressData.weeklyProgress > 100 
                    ? 'bg-red-500' 
                    : progressData.weeklyProgress > 80 
                    ? 'bg-yellow-500' 
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progressData.weeklyProgress, 100)}%` }}
              />
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {progressData.weeklyProgress <= 100
                ? t('progressVisualization.weeklyRemaining', {
                    count: (goals.weeklyGoal - (goals.weeklyGoal * progressData.weeklyProgress / 100)).toFixed(1)
                  })
                : t('progressVisualization.weeklyExceeded', {
                    percent: (progressData.weeklyProgress - 100).toFixed(0)
                  })
              }
            </div>
          </div>
        </div>
      </div>

      {/* Streak Milestone */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">{t('progressVisualization.streakMilestone')}</h2>
        </div>
        <div className="card-content">
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {progressData.streakMilestones.current}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('progressVisualization.daysAlcoholFree')}
            </div>
          </div>

          <div className="mb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">
                {t('progressVisualization.nextMilestone', {
                  days: progressData.streakMilestones.next
                })}
              </span>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {Math.round(progressData.streakMilestones.progress)}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                style={{ width: `${progressData.streakMilestones.progress}%` }}
              />
            </div>
          </div>

          <div className="text-xs text-center text-neutral-500 dark:text-neutral-400">
            {t('progressVisualization.daysToGo', {
              count: progressData.streakMilestones.next - progressData.streakMilestones.current
            })}
          </div>
        </div>
      </div>

      {/* Spending Analysis */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">{t('progressVisualization.monthlySpending')}</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                ${progressData.monthlySpending.actual.toFixed(0)}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('progressVisualization.spentThisMonth')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${progressData.monthlySpending.savings.toFixed(0)}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('progressVisualization.potentialSavings')}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">{t('progressVisualization.budgetUsage')}</span>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {((progressData.monthlySpending.actual / progressData.monthlySpending.budget) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  progressData.monthlySpending.actual > progressData.monthlySpending.budget
                    ? 'bg-red-500' 
                    : progressData.monthlySpending.actual > progressData.monthlySpending.budget * 0.8
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min((progressData.monthlySpending.actual / progressData.monthlySpending.budget) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">{t('progressVisualization.healthInsights')}</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {progressData.healthMetrics.alcoholFreeDays}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('progressVisualization.afDaysThisMonth')}
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {progressData.healthMetrics.averageCraving.toFixed(1)}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('progressVisualization.avgCravingLevel')}
              </div>
            </div>

            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${
                progressData.healthMetrics.improvementTrend === 'improving'
                  ? 'text-green-600 dark:text-green-400'
                  : progressData.healthMetrics.improvementTrend === 'declining'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                {progressData.healthMetrics.improvementTrend === 'improving' ? '📈' :
                 progressData.healthMetrics.improvementTrend === 'declining' ? '📉' : '➡️'}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('progressVisualization.overallTrend')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getCurrentStreak(drinks: Drink[]): number {
  const byDay: Record<string, number> = {};
  drinks.forEach(d => {
    const day = new Date(d.ts).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + stdDrinks(d.volumeMl, d.abvPct);
  });

  let streak = 0;
  const current = new Date();
  let continueChecking = true;
  while (continueChecking) {
    const key = current.toISOString().slice(0, 10);
    if (byDay[key] > 0) {
      continueChecking = false;
      break;
    }
    streak++;
    current.setDate(current.getDate() - 1);
    if (streak > 365) {
      continueChecking = false;
      break;
    }
  }

  return streak;
}

function getNextMilestone(currentStreak: number): number {
  const milestones = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365];
  return milestones.find(m => m > currentStreak) || currentStreak + 30;
}

function getAlcoholFreeDaysInMonth(drinks: Drink[]): number {
  const now = Date.now();
  const monthStart = now - 30 * 24 * 60 * 60 * 1000;
  
  const daySet = new Set();
  drinks.filter(d => d.ts >= monthStart).forEach(d => {
    const day = new Date(d.ts).toISOString().slice(0, 10);
    daySet.add(day);
  });
  
  return 30 - daySet.size;
}

function calculateImprovementTrend(drinks: Drink[]): 'improving' | 'stable' | 'declining' {
  const now = Date.now();
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
  
  const recent = drinks.filter(d => d.ts >= twoWeeksAgo);
  const older = drinks.filter(d => d.ts >= monthAgo && d.ts < twoWeeksAgo);
  
  if (recent.length === 0 || older.length === 0) return 'stable';
  
  const recentAvgCraving = recent.reduce((sum, d) => sum + d.craving, 0) / recent.length;
  const olderAvgCraving = older.reduce((sum, d) => sum + d.craving, 0) / older.length;
  
  const recentStd = recent.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0) / 14;
  const olderStd = older.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0) / 14;
  
  const cravingImprovement = olderAvgCraving - recentAvgCraving;
  const consumptionImprovement = olderStd - recentStd;
  
  if (cravingImprovement > 0.5 || consumptionImprovement > 0.2) return 'improving';
  if (cravingImprovement < -0.5 || consumptionImprovement < -0.2) return 'declining';
  return 'stable';
}