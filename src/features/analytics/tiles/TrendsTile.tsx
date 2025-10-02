/**
 * 30-Day Trends Tile
 * Shows trends in drinking patterns over the last 30 days
 */

import React from 'react';
import { useDB } from '../../../store/db';

export function TrendsTile({ onToggle }: { onToggle?: () => void }) {
  const entries = useDB(state => state.db.entries);

  // Calculate 30-day stats
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentEntries = entries.filter(e => e.ts >= thirtyDaysAgo);

  const totalDrinks = recentEntries.reduce((sum, e) => sum + e.stdDrinks, 0);
  const averagePerDay = recentEntries.length > 0 ? totalDrinks / 30 : 0;
  const averageCraving = recentEntries.length > 0
    ? recentEntries.reduce((sum, e) => sum + e.craving, 0) / recentEntries.length
    : 0;

  // Calculate trend (compare first 15 days to last 15 days)
  const midPoint = thirtyDaysAgo + (15 * 24 * 60 * 60 * 1000);
  const firstHalf = recentEntries.filter(e => e.ts < midPoint);
  const secondHalf = recentEntries.filter(e => e.ts >= midPoint);

  const firstHalfAvg = firstHalf.length > 0
    ? firstHalf.reduce((sum, e) => sum + e.stdDrinks, 0) / 15
    : 0;
  const secondHalfAvg = secondHalf.length > 0
    ? secondHalf.reduce((sum, e) => sum + e.stdDrinks, 0) / 15
    : 0;

  const trendPercent = firstHalfAvg > 0
    ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
    : 0;

  const isImproving = trendPercent < 0;

  return (
    <div className="p-4 border border-default rounded-xl bg-surface">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-primary">30-Day Trends</h3>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-sm text-secondary hover:text-primary"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold text-primary">
            {averagePerDay.toFixed(1)}
          </div>
          <div className="text-sm text-secondary">Avg drinks/day</div>
        </div>

        <div>
          <div className="text-2xl font-bold text-primary">
            {averageCraving.toFixed(1)}
          </div>
          <div className="text-sm text-secondary">Avg craving</div>
        </div>

        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold ${
                isImproving
                  ? 'text-success-600 dark:text-success-400'
                  : 'text-warning-600 dark:text-warning-400'
              }`}
            >
              {isImproving ? '↓' : '↑'} {Math.abs(trendPercent).toFixed(0)}%
            </span>
            <span className="text-sm text-secondary">
              {isImproving ? 'decrease' : 'increase'} vs. 2 weeks ago
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
