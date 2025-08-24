import { useMemo } from 'react';
import { stdDrinks, computeStreak, computeLongestStreak, computePoints } from '../../../lib/calc';
import type { Drink, Halt } from '../../drinks/DrinkForm';
import type { Goals } from '../../goals/GoalSettings';

export interface StatsData {
  streak: number;
  longest: number;
  points: number;
  weekStd: number;
  lastWeekStd: number;
  monthStd: number;
  prevMonthStd: number;
  avgCraving30: number;
  haltCounts: Record<Halt, number>;
  altEvents30: number;
  afDays30: number;
  drinks30: number;
  daysSinceLast: number | null;
  avgPerDrinkDay30: number;
}

export function useStats(drinks: Drink[], goals: Goals): StatsData {
  return useMemo(() => {
    const byDayStd: Record<string, number> = {};
    const byDayDetail: Record<string, { std: number; coping: number }> = {};
    const now = Date.now();
    let altEvents30 = 0;
    let cravingSum30 = 0;
    let drinks30 = 0;
    let lastDrinkTs = 0;
    const haltCounts: Record<Halt, number> = { hungry: 0, angry: 0, lonely: 0, tired: 0 };
    for (const d of drinks) {
      const day = new Date(d.ts).toISOString().slice(0, 10);
      const std = stdDrinks(d.volumeMl, d.abvPct);
      byDayStd[day] = (byDayStd[day] || 0) + std;
      const detail = byDayDetail[day] || { std: 0, coping: 0 };
      detail.std += std;
      if (d.intention === 'cope') detail.coping += 1;
      byDayDetail[day] = detail;
      if (d.ts > lastDrinkTs) lastDrinkTs = d.ts;
      if (now - d.ts <= 30 * 24 * 60 * 60 * 1000) {
        if (d.alt) altEvents30 += 1;
        cravingSum30 += d.craving;
        drinks30 += 1;
        for (const h of d.halt) haltCounts[h] += 1;
      }
    }
    const streak = computeStreak(byDayStd);
    const longest = computeLongestStreak(byDayStd);
    const points = computePoints(byDayDetail, goals.dailyCap, altEvents30);
    const nowDate = new Date();
    let weekStd = 0;
    let lastWeekStd = 0;
    let monthStd = 0;
    let prevMonthStd = 0;
    const msDay = 24 * 60 * 60 * 1000;
    for (const [day, amt] of Object.entries(byDayStd)) {
      const diffDays = Math.floor((nowDate.getTime() - new Date(day).getTime()) / msDay);
      if (diffDays < 7) weekStd += amt;
      else if (diffDays < 14) lastWeekStd += amt;
      if (diffDays < 30) monthStd += amt;
      else if (diffDays < 60) prevMonthStd += amt;
    }
    const avgCraving30 = drinks30 ? cravingSum30 / drinks30 : 0;
    let afDays30 = 0;
    let drinkingDays30 = 0;
    for (let i = 0; i < 30; i++) {
      const day = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (!byDayStd[day]) afDays30 += 1; else drinkingDays30 += 1;
    }
    const avgPerDrinkDay30 = drinkingDays30 ? monthStd / drinkingDays30 : 0;
    const daysSinceLast = lastDrinkTs ? Math.floor((now - lastDrinkTs) / (24 * 60 * 60 * 1000)) : null;
    return { streak, longest, points, weekStd, lastWeekStd, monthStd, prevMonthStd, avgCraving30,
      haltCounts, altEvents30, afDays30, drinks30, daysSinceLast, avgPerDrinkDay30 };
  }, [drinks, goals]);
}

export function useFormatters() {
  const nf1 = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }), []);
  const cf = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }), []);
  return { nf1, cf };
}
