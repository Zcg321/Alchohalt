/**
 * Analytics Tile Host (Task 21)
 * Modular, pluggable analytics tiles
 * Can toggle tiles in settings
 */

import React, { useState } from 'react';
import { TrendsTile } from './tiles/TrendsTile';
import { HALTCorrelationsTile } from './tiles/HALTCorrelationsTile';
import { WeeklyPatternsTile } from './tiles/WeeklyPatternsTile';

export interface TileConfig {
  id: string;
  name: string;
  component: React.ComponentType<{ onToggle?: () => void }>;
  enabled: boolean;
  premium?: boolean;
}

interface TileHostProps {
  tiles?: TileConfig[];
  onTileToggle?: (tileId: string, enabled: boolean) => void;
}

const DEFAULT_TILES: TileConfig[] = [
  {
    id: 'trends-30day',
    name: '30-Day Trends',
    component: TrendsTile,
    enabled: true,
    premium: false
  },
  {
    id: 'halt-correlations',
    name: 'HALT Correlations',
    component: HALTCorrelationsTile,
    enabled: true,
    premium: false
  },
  {
    id: 'weekly-patterns',
    name: 'Weekly Patterns',
    component: WeeklyPatternsTile,
    enabled: false,
    premium: true
  }
];

/**
 * TileHost component - Loads and displays analytics tiles
 */
export function TileHost({ tiles = DEFAULT_TILES, onTileToggle }: TileHostProps) {
  const [tileConfigs, setTileConfigs] = useState<TileConfig[]>(tiles);

  const handleTileToggle = (tileId: string) => {
    const newConfigs = tileConfigs.map(tile =>
      tile.id === tileId ? { ...tile, enabled: !tile.enabled } : tile
    );
    setTileConfigs(newConfigs);
    
    const tile = newConfigs.find(t => t.id === tileId);
    if (tile && onTileToggle) {
      onTileToggle(tileId, tile.enabled);
    }
  };

  const enabledTiles = tileConfigs.filter(tile => tile.enabled);

  return (
    <div className="space-y-4">
      {enabledTiles.length === 0 ? (
        <div className="p-8 text-center text-secondary">
          <p>No analytics tiles enabled.</p>
          <p className="text-sm mt-2">Enable tiles in settings to see your insights.</p>
        </div>
      ) : (
        enabledTiles.map(tile => {
          const TileComponent = tile.component;
          return (
            <div key={tile.id}>
              <TileComponent onToggle={() => handleTileToggle(tile.id)} />
            </div>
          );
        })
      )}
    </div>
  );
}

/**
 * Tile Settings Component
 */
export function TileSettings({ tiles = DEFAULT_TILES, onTileToggle }: TileHostProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-primary">Analytics Tiles</h3>
      <p className="text-sm text-secondary">
        Choose which analytics to display on your dashboard
      </p>
      
      {tiles.map(tile => (
        <div
          key={tile.id}
          className="flex items-center justify-between p-3 border border-default rounded-lg bg-surface"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-primary">{tile.name}</span>
              {tile.premium && (
                <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  Premium
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onTileToggle && onTileToggle(tile.id, !tile.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              tile.enabled ? 'bg-primary-600' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                tile.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
