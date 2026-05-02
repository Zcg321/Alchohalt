import type { Drink } from '../drinks/DrinkForm';
import { stdDrinks } from '../../lib/calc';

export interface ProgressData {
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

const DAY_MS = 24 * 60 * 60 * 1000;

export function getCurrentStreak(drinks: Drink[]): number {
  const byDay: Record<string, number> = {};
  drinks.forEach((d) => {
    const day = new Date(d.ts).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + stdDrinks(d.volumeMl, d.abvPct);
  });

  let streak = 0;
  const current = new Date();
  while (streak <= 365) {
    const key = current.toISOString().slice(0, 10);
    if ((byDay[key] ?? 0) > 0) break;
    streak++;
    current.setDate(current.getDate() - 1);
  }
  return streak;
}

export function getNextMilestone(currentStreak: number): number {
  const milestones = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365];
  return milestones.find((m) => m > currentStreak) || currentStreak + 30;
}

export function getAlcoholFreeDaysInMonth(drinks: Drink[]): number {
  const monthStart = Date.now() - 30 * DAY_MS;
  const daySet = new Set<string>();
  drinks
    .filter((d) => d.ts >= monthStart)
    .forEach((d) => daySet.add(new Date(d.ts).toISOString().slice(0, 10)));
  return 30 - daySet.size;
}

export function calculateImprovementTrend(drinks: Drink[]): 'improving' | 'stable' | 'declining' {
  const now = Date.now();
  const twoWeeksAgo = now - 14 * DAY_MS;
  const monthAgo = now - 30 * DAY_MS;

  const recent = drinks.filter((d) => d.ts >= twoWeeksAgo);
  const older = drinks.filter((d) => d.ts >= monthAgo && d.ts < twoWeeksAgo);

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

export function computeProgressData(
  drinks: Drink[],
  goals: {
    dailyCap: number;
    weeklyGoal: number;
    pricePerStd: number;
    baselineMonthlySpend: number;
  },
): ProgressData {
  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const weekStart = now - 7 * DAY_MS;
  const monthStart = now - 30 * DAY_MS;

  const todayDrinks = drinks.filter((d) => d.ts >= todayStart);
  const weekDrinks = drinks.filter((d) => d.ts >= weekStart);
  const monthDrinks = drinks.filter((d) => d.ts >= monthStart);

  const todayStd = todayDrinks.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
  const weekStd = weekDrinks.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);

  const dailyProgress = goals.dailyCap > 0 ? (todayStd / goals.dailyCap) * 100 : -1;
  const weeklyProgress = goals.weeklyGoal > 0 ? (weekStd / goals.weeklyGoal) * 100 : -1;

  const monthlyActual = monthDrinks.reduce(
    (sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct) * goals.pricePerStd,
    0,
  );
  const alcoholFreeDays = getAlcoholFreeDaysInMonth(drinks);
  const potentialSavings = (alcoholFreeDays * goals.baselineMonthlySpend) / 30;

  const currentStreak = getCurrentStreak(drinks);
  const nextMilestone = getNextMilestone(currentStreak);
  const streakProgress = nextMilestone > 0 ? ((currentStreak % nextMilestone) / nextMilestone) * 100 : 0;

  const avgCraving =
    monthDrinks.length > 0 ? monthDrinks.reduce((sum, d) => sum + d.craving, 0) / monthDrinks.length : 0;

  return {
    dailyProgress,
    weeklyProgress,
    monthlySpending: {
      actual: monthlyActual,
      budget: goals.baselineMonthlySpend,
      savings: Math.max(0, potentialSavings - monthlyActual),
    },
    streakMilestones: {
      current: currentStreak,
      next: nextMilestone,
      progress: streakProgress,
    },
    healthMetrics: {
      alcoholFreeDays,
      averageCraving: avgCraving,
      improvementTrend: calculateImprovementTrend(drinks),
    },
  };
}
