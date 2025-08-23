import React, { useMemo } from 'react';
import {
  computePoints,
  computeStreak,
  computeLongestStreak,
  stdDrinks,
} from '../../lib/calc';
import type { Drink, Halt } from '../drinks/DrinkForm';
import { haltOptions } from '../drinks/DrinkForm';
import type { Goals } from '../goals/GoalSettings';
import WeeklyChart from './WeeklyChart';
import MonthlyTrend from './MonthlyTrend';
import { Badge } from '../../components/ui/Badge';

interface Props {
  drinks: Drink[];
  goals: Goals;
}

export function Stats({ drinks, goals }: Props) {
  const {
    streak,
    longest,
    points,
    weekStd,
    monthStd,
    avgCraving30,
    haltCounts,
  } = useMemo(() => {
    const byDayStd: Record<string, number> = {};
    const byDayDetail: Record<string, { std: number; coping: number }> = {};
    const now = Date.now();
    let altEvents30 = 0;
    let cravingSum30 = 0;
    let drinks30 = 0;
    const haltCounts: Record<Halt, number> = {
      hungry: 0,
      angry: 0,
      lonely: 0,
      tired: 0,
    };
    for (const d of drinks) {
      const day = new Date(d.ts).toISOString().slice(0, 10);
      const std = stdDrinks(d.volumeMl, d.abvPct);
      byDayStd[day] = (byDayStd[day] || 0) + std;
      const detail = byDayDetail[day] || { std: 0, coping: 0 };
      detail.std += std;
      if (d.intention === 'cope') detail.coping += 1;
      byDayDetail[day] = detail;
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
    let monthStd = 0;
    for (const [day, amt] of Object.entries(byDayStd)) {
      const diff = nowDate.getTime() - new Date(day).getTime();
      if (diff <= 7 * 24 * 60 * 60 * 1000) weekStd += amt;
      if (diff <= 30 * 24 * 60 * 60 * 1000) monthStd += amt;
    }
    const avgCraving30 = drinks30 ? cravingSum30 / drinks30 : 0;
    return { streak, longest, points, weekStd, monthStd, avgCraving30, haltCounts };
  }, [drinks, goals]);

  const actualSpend = monthStd * goals.pricePerStd;
  const delta = goals.baselineMonthlySpend - actualSpend;
  const savingsColor = delta >= 0 ? 'text-green-700' : 'text-red-700';
  const savingsLabel =
    delta >= 0
      ? `Saved $${delta.toFixed(2)} vs baseline`
      : `Over baseline by $${(-delta).toFixed(2)}`;

  const weekPct = goals.weeklyGoal ? weekStd / goals.weeklyGoal : 0;
  const barColor = weekPct <= 1 ? 'bg-blue-600' : 'bg-red-600';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Badge color="bg-green-100 text-green-800">
          {streak} day{streak === 1 ? '' : 's'} AF
        </Badge>
        <span className="text-sm text-gray-600">Best: {longest}</span>
      </div>
      <div>Points: {points}</div>
      <div>
        Week total: {weekStd.toFixed(1)} / {goals.weeklyGoal} ({
          (weekPct * 100).toFixed(0)
        }%)
        <div
          className="mt-1 w-full bg-gray-200 h-2 rounded"
          aria-label="Weekly goal progress"
        >
          <div
            className={`${barColor} h-2 rounded`}
            style={{ width: `${Math.min(1, weekPct) * 100}%` }}
          />
        </div>
      </div>
      <WeeklyChart />
      <MonthlyTrend />
      <div>Avg craving (30d): {avgCraving30.toFixed(1)}</div>
      <div className="flex flex-wrap gap-1 text-xs">
        {haltOptions.map((h) => (
          <span key={h} className="px-2 py-0.5 bg-gray-200 rounded">
            {h[0].toUpperCase()}: {haltCounts[h]}
          </span>
        ))}
      </div>
      <div>Monthly spend: ${actualSpend.toFixed(2)}</div>
      <div className={savingsColor}>{savingsLabel}</div>
    </div>
  );
}
