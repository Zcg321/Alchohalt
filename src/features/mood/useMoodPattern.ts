import React from 'react';
import type { EmotionalState, MoodPattern } from './moodConstants';

const DAY_MS = 24 * 60 * 60 * 1000;

export function useMoodPattern(recentEntries: EmotionalState[]): MoodPattern | null {
  return React.useMemo(() => {
    if (recentEntries.length < 3) return null;

    const now = Date.now();
    const last7Days = recentEntries.filter((entry) => entry.timestamp > now - 7 * DAY_MS);

    const triggerCounts = countOccurrences(last7Days, (e) => e.triggers);
    const copingCounts = countOccurrences(last7Days, (e) => e.copingStrategies);

    const avgCraving =
      last7Days.reduce((sum, entry) => sum + entry.cravingLevel, 0) / Math.max(last7Days.length, 1);
    const previousWeek = recentEntries.filter(
      (entry) => entry.timestamp > now - 14 * DAY_MS && entry.timestamp <= now - 7 * DAY_MS,
    );
    const previousWeekAvg =
      previousWeek.reduce((sum, entry) => sum + entry.cravingLevel, 0) /
      Math.max(previousWeek.length, 1);

    return {
      commonTriggers: topN(triggerCounts, 3),
      riskTimes: [],
      effectiveCoping: topN(copingCounts, 3),
      trendDirection:
        avgCraving < previousWeekAvg ? 'improving' : avgCraving === previousWeekAvg ? 'stable' : 'concerning',
    };
  }, [recentEntries]);
}

function countOccurrences(
  entries: EmotionalState[],
  pick: (e: EmotionalState) => string[],
): Record<string, number> {
  return entries.reduce<Record<string, number>>((acc, entry) => {
    pick(entry).forEach((item) => {
      acc[item] = (acc[item] || 0) + 1;
    });
    return acc;
  }, {});
}

function topN(counts: Record<string, number>, n: number): string[] {
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([key]) => key);
}
