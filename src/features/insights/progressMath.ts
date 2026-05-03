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

/* [R20-1] Trend from already-accumulated sums (no second pass over drinks). */
function trendFromSums(sums: {
  recentCount: number; recentCravingSum: number; recentStdSum: number;
  olderCount: number; olderCravingSum: number; olderStdSum: number;
}): 'improving' | 'stable' | 'declining' {
  const { recentCount, recentCravingSum, recentStdSum,
    olderCount, olderCravingSum, olderStdSum } = sums;
  if (recentCount === 0 || olderCount === 0) return 'stable';
  const cravingImprovement = (olderCravingSum / olderCount) - (recentCravingSum / recentCount);
  const consumptionImprovement = (olderStdSum / 14) - (recentStdSum / 14);
  if (cravingImprovement > 0.5 || consumptionImprovement > 0.2) return 'improving';
  if (cravingImprovement < -0.5 || consumptionImprovement < -0.2) return 'declining';
  return 'stable';
}

/* [R20-1] Walk backwards from `now` over the streakByDay map,
 * counting consecutive days with no drinks. */
function streakFromDayMap(streakByDay: Map<number, number>, now: number): number {
  let currentStreak = 0;
  let cursorDay = Math.floor(now / DAY_MS);
  while (currentStreak <= 365) {
    if ((streakByDay.get(cursorDay) ?? 0) > 0) break;
    currentStreak++;
    cursorDay -= 1;
  }
  return currentStreak;
}

/* [R20-1] Single-pass aggregator.
 *
 * Previously this function did 8+ separate filter/reduce passes
 * over `drinks` (today, week, month, monthly-actual, alcohol-free
 * days, current streak, recent-vs-older trend, monthly avg craving).
 * Each pass was O(n) and on a 250K-row power-user history that
 * exceeded the 200ms main-thread budget on CI.
 *
 * The new implementation walks `drinks` exactly once, accumulating
 * every bucket inline. The API and return shape are unchanged;
 * tested end-to-end against the same 250K fixture to verify
 * identical results within float-precision tolerance.
 */
interface AggregatedDrinks {
  todayStd: number; weekStd: number; monthlyActual: number;
  monthCount: number; monthCravingSum: number;
  recentCount: number; recentCravingSum: number; recentStdSum: number;
  olderCount: number; olderCravingSum: number; olderStdSum: number;
  monthDaySet: Set<number>; streakByDay: Map<number, number>;
}

/* [R20-1] Single-pass aggregator. Numeric UTC-day key (not ISO string)
 * to skip 250K Date+toISOString allocations on power-user histories. */
function aggregateDrinks(
  drinks: Drink[],
  bounds: { todayStart: number; weekStart: number; monthStart: number; twoWeeksAgo: number },
  pricePerStd: number,
): AggregatedDrinks {
  const acc: AggregatedDrinks = {
    todayStd: 0, weekStd: 0, monthlyActual: 0,
    monthCount: 0, monthCravingSum: 0,
    recentCount: 0, recentCravingSum: 0, recentStdSum: 0,
    olderCount: 0, olderCravingSum: 0, olderStdSum: 0,
    monthDaySet: new Set<number>(), streakByDay: new Map<number, number>(),
  };
  for (const d of drinks) {
    const std = stdDrinks(d.volumeMl, d.abvPct);
    const dayKey = Math.floor(d.ts / DAY_MS);
    acc.streakByDay.set(dayKey, (acc.streakByDay.get(dayKey) ?? 0) + std);
    if (d.ts >= bounds.todayStart) acc.todayStd += std;
    if (d.ts >= bounds.weekStart) acc.weekStd += std;
    if (d.ts >= bounds.monthStart) {
      acc.monthCount += 1;
      acc.monthCravingSum += d.craving;
      acc.monthlyActual += std * pricePerStd;
      acc.monthDaySet.add(dayKey);
      if (d.ts >= bounds.twoWeeksAgo) {
        acc.recentCount += 1;
        acc.recentCravingSum += d.craving;
        acc.recentStdSum += std;
      } else {
        acc.olderCount += 1;
        acc.olderCravingSum += d.craving;
        acc.olderStdSum += std;
      }
    }
  }
  return acc;
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
  const bounds = {
    todayStart: new Date().setHours(0, 0, 0, 0),
    weekStart: now - 7 * DAY_MS,
    monthStart: now - 30 * DAY_MS,
    twoWeeksAgo: now - 14 * DAY_MS,
  };
  const a = aggregateDrinks(drinks, bounds, goals.pricePerStd);
  const { todayStd, weekStd, monthlyActual, monthCount, monthCravingSum, monthDaySet, streakByDay } = a;

  const dailyProgress = goals.dailyCap > 0 ? (todayStd / goals.dailyCap) * 100 : -1;
  const weeklyProgress = goals.weeklyGoal > 0 ? (weekStd / goals.weeklyGoal) * 100 : -1;

  const alcoholFreeDays = 30 - monthDaySet.size;
  const potentialSavings = (alcoholFreeDays * goals.baselineMonthlySpend) / 30;

  const currentStreak = streakFromDayMap(streakByDay, now);
  const nextMilestone = getNextMilestone(currentStreak);
  const streakProgress = nextMilestone > 0 ? ((currentStreak % nextMilestone) / nextMilestone) * 100 : 0;

  const avgCraving = monthCount > 0 ? monthCravingSum / monthCount : 0;
  const improvementTrend = trendFromSums(a);

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
      improvementTrend,
    },
  };
}
