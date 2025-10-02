/**
 * HALT Correlations Tile
 * Shows correlations between HALT triggers and drinking
 */

import React from 'react';
import { useDB } from '../../../store/db';

export function HALTCorrelationsTile({ onToggle }: { onToggle?: () => void }) {
  const entries = useDB(state => state.db.entries);

  // Calculate HALT trigger frequencies
  const haltCounts = {
    H: 0, // Hungry
    A: 0, // Angry
    L: 0, // Lonely
    T: 0  // Tired
  };

  const haltWithHighCraving = {
    H: 0,
    A: 0,
    L: 0,
    T: 0
  };

  entries.forEach(entry => {
    const isHighCraving = entry.craving >= 4;
    
    if (entry.halt && entry.halt.H) {
      haltCounts.H++;
      if (isHighCraving) haltWithHighCraving.H++;
    }
    if (entry.halt && entry.halt.A) {
      haltCounts.A++;
      if (isHighCraving) haltWithHighCraving.A++;
    }
    if (entry.halt && entry.halt.L) {
      haltCounts.L++;
      if (isHighCraving) haltWithHighCraving.L++;
    }
    if (entry.halt && entry.halt.T) {
      haltCounts.T++;
      if (isHighCraving) haltWithHighCraving.T++;
    }
  });

  const haltData = [
    {
      label: 'Hungry',
      key: 'H' as const,
      count: haltCounts.H,
      correlation: haltCounts.H > 0 ? (haltWithHighCraving.H / haltCounts.H) * 100 : 0
    },
    {
      label: 'Angry',
      key: 'A' as const,
      count: haltCounts.A,
      correlation: haltCounts.A > 0 ? (haltWithHighCraving.A / haltCounts.A) * 100 : 0
    },
    {
      label: 'Lonely',
      key: 'L' as const,
      count: haltCounts.L,
      correlation: haltCounts.L > 0 ? (haltWithHighCraving.L / haltCounts.L) * 100 : 0
    },
    {
      label: 'Tired',
      key: 'T' as const,
      count: haltCounts.T,
      correlation: haltCounts.T > 0 ? (haltWithHighCraving.T / haltCounts.T) * 100 : 0
    }
  ].sort((a, b) => b.correlation - a.correlation);

  return (
    <div className="p-4 border border-default rounded-xl bg-surface">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-primary">HALT Correlations</h3>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-sm text-secondary hover:text-primary"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-3">
        {haltData.map(item => (
          <div key={item.key}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-primary">{item.label}</span>
              <span className="text-secondary">
                {item.count} times ({item.correlation.toFixed(0)}% high craving)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(item.correlation, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <p className="text-center text-secondary text-sm mt-4">
          No data yet. Start logging to see correlations.
        </p>
      )}
    </div>
  );
}
