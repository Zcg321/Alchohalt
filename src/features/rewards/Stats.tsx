import React, { useMemo } from 'react';
import { computePoints, computeStreak, stdDrinks } from '../../lib/calc';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../goals/GoalSettings';

interface Props {
  drinks: Drink[];
  goals: Goals;
}

export function Stats({ drinks, goals }: Props) {
  const { streak, points, weekStd, monthStd } = useMemo(() => {
    const byDayStd: Record<string, number> = {};
    const byDayDetail: Record<string, { std: number; coping: number }> = {};
    const now = Date.now();
    let altEvents30 = 0;
    for (const d of drinks) {
      const day = new Date(d.ts).toISOString().slice(0, 10);
      const std = stdDrinks(d.volumeMl, d.abvPct);
      byDayStd[day] = (byDayStd[day] || 0) + std;
      const detail = byDayDetail[day] || { std: 0, coping: 0 };
      detail.std += std;
      if (d.intention === 'cope') detail.coping += 1;
      byDayDetail[day] = detail;
      if (d.alt && now - d.ts <= 30 * 24 * 60 * 60 * 1000) altEvents30 += 1;
    }
    const streak = computeStreak(byDayStd);
    const points = computePoints(byDayDetail, goals.dailyCap, altEvents30);
    const nowDate = new Date();
    let weekStd = 0;
    let monthStd = 0;
    for (const [day, amt] of Object.entries(byDayStd)) {
      const diff = nowDate.getTime() - new Date(day).getTime();
      if (diff <= 7 * 24 * 60 * 60 * 1000) weekStd += amt;
      if (diff <= 30 * 24 * 60 * 60 * 1000) monthStd += amt;
    }
    return { streak, points, weekStd, monthStd };
  }, [drinks, goals]);

  const actualSpend = monthStd * goals.pricePerStd;
  const savings = goals.baselineMonthlySpend - actualSpend;

  return (
    <div className="space-y-1">
      <div>AF streak: {streak} days</div>
      <div>Points: {points}</div>
      <div>Week total: {weekStd.toFixed(1)} / {goals.weeklyGoal}</div>
      <div>Monthly spend: ${actualSpend.toFixed(2)}</div>
      <div>Savings vs baseline: ${savings.toFixed(2)}</div>
    </div>
  );
}
