/**
 * Weekly Patterns Tile (Premium)
 * Shows day-of-week patterns
 */

import React from 'react';
import { useDB } from '../../../store/db';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeeklyPatternsTile({ onToggle }: { onToggle?: () => void }) {
  const entries = useDB(state => state.db.entries);

  // Calculate average drinks per day of week
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];

  entries.forEach(entry => {
    const day = new Date(entry.ts).getDay();
    dayTotals[day] += entry.stdDrinks;
    dayCounts[day]++;
  });

  const dayAverages = dayTotals.map((total, i) => 
    dayCounts[i] > 0 ? total / dayCounts[i] : 0
  );

  const maxAvg = Math.max(...dayAverages, 1);

  return (
    <div className="p-4 border border-default rounded-xl bg-surface">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-primary">Weekly Patterns</h3>
          <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            Premium
          </span>
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-sm text-secondary hover:text-primary"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-2">
        {DAYS.map((day, i) => (
          <div key={day} className="flex items-center gap-3">
            <div className="w-10 text-sm text-secondary">{day}</div>
            <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
              <div
                className="bg-primary-600 h-full flex items-center justify-end px-2 text-white text-xs font-medium transition-all"
                style={{ width: `${(dayAverages[i] / maxAvg) * 100}%` }}
              >
                {dayAverages[i] > 0 && dayAverages[i].toFixed(1)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <p className="text-center text-secondary text-sm mt-4">
          No data yet. Start logging to see patterns.
        </p>
      )}
    </div>
  );
}
