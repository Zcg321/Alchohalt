// @no-smoke
import React from 'react';
import type { Drink } from '../DrinkForm';

interface Props {
  drinks: Drink[];
  selectedCount: number;
  onSelectToday: () => void;
  onSelectThisWeek: () => void;
  onClear: () => void;
  onDeleteSelected: () => void;
  onShiftTimeSelected: (deltaMinutes: number) => void;
  onScaleStdSelected: (factor: number) => void;
  onExit: () => void;
}

const TIME_PRESETS: Array<{ label: string; minutes: number }> = [
  { label: '−2h', minutes: -120 },
  { label: '−1h', minutes: -60 },
  { label: '−30m', minutes: -30 },
  { label: '+30m', minutes: 30 },
  { label: '+1h', minutes: 60 },
  { label: '+2h', minutes: 120 },
];

const STD_PRESETS: Array<{ label: string; factor: number }> = [
  { label: '½', factor: 0.5 },
  { label: '¾', factor: 0.75 },
  { label: '×1.25', factor: 1.25 },
  { label: '×1.5', factor: 1.5 },
];

/**
 * Bulk-mode action bar.
 *
 * Visible only when the parent DrinkList is in bulk-edit mode. Three
 * groups, in order of likely use:
 *   1. Quick-select scopes (today, this week, clear)
 *   2. Bulk modifiers (delete, time-shift, std-scale)
 *   3. "Done" exit
 *
 * Selection-required actions disable when nothing is selected. We
 * intentionally don't auto-confirm destructive operations from this
 * bar — Delete prompts via window.confirm with the count first, same
 * pattern as DrinkItem's delete.
 */
export default function BulkActionBar({
  drinks,
  selectedCount,
  onSelectToday,
  onSelectThisWeek,
  onClear,
  onDeleteSelected,
  onShiftTimeSelected,
  onScaleStdSelected,
  onExit,
}: Props) {
  const hasSelection = selectedCount > 0;

  return (
    <div
      data-testid="bulk-action-bar"
      className="rounded-2xl border border-border-soft bg-surface-elevated p-card shadow-card space-y-4"
      aria-label="Bulk edit actions"
      role="region"
    >
      {/* Header: selection count + done */}
      <div className="flex items-center justify-between">
        <p
          className="text-body text-ink stat-num"
          data-testid="bulk-selection-count"
        >
          {`${selectedCount} ${selectedCount === 1 ? 'drink' : 'drinks'} selected`}
        </p>
        <button
          type="button"
          onClick={onExit}
          data-testid="bulk-exit"
          className="text-caption text-ink-soft hover:text-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 rounded"
        >
          Done
        </button>
      </div>

      {/* Quick-select scopes */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-caption text-ink-subtle me-1">Select:</span>
        <ScopeButton
          label="Today"
          testid="bulk-select-today"
          onClick={onSelectToday}
          disabled={drinks.length === 0}
        />
        <ScopeButton
          label="This week"
          testid="bulk-select-week"
          onClick={onSelectThisWeek}
          disabled={drinks.length === 0}
        />
        <ScopeButton
          label="Clear"
          testid="bulk-clear"
          onClick={onClear}
          disabled={!hasSelection}
        />
      </div>

      {/* Modifier row: delete + time + std */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          data-testid="bulk-delete"
          className="rounded-pill bg-red-50 px-3 py-1.5 text-caption text-red-700 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Delete selected
        </button>
        <details className="inline-flex">
          <summary
            className={`rounded-pill bg-cream-50 px-3 py-1.5 text-caption text-ink-soft hover:bg-cream-100 cursor-pointer ${
              !hasSelection ? 'opacity-40 pointer-events-none' : ''
            }`}
            aria-disabled={!hasSelection}
          >
            Shift time…
          </summary>
          <div className="mt-2 flex flex-wrap gap-1">
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onShiftTimeSelected(preset.minutes)}
                disabled={!hasSelection}
                data-testid={`bulk-time-${preset.minutes}`}
                className="rounded-pill bg-cream-50 px-2 py-1 text-micro text-ink-soft hover:bg-cream-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 disabled:opacity-40 transition-colors tabular-nums"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </details>
        <details className="inline-flex">
          <summary
            className={`rounded-pill bg-cream-50 px-3 py-1.5 text-caption text-ink-soft hover:bg-cream-100 cursor-pointer ${
              !hasSelection ? 'opacity-40 pointer-events-none' : ''
            }`}
            aria-disabled={!hasSelection}
          >
            Scale std…
          </summary>
          <div className="mt-2 flex flex-wrap gap-1">
            {STD_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onScaleStdSelected(preset.factor)}
                disabled={!hasSelection}
                data-testid={`bulk-std-${preset.factor}`}
                className="rounded-pill bg-cream-50 px-2 py-1 text-micro text-ink-soft hover:bg-cream-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 disabled:opacity-40 transition-colors tabular-nums"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

function ScopeButton({
  label,
  testid,
  onClick,
  disabled,
}: {
  label: string;
  testid: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testid}
      className="rounded-pill bg-cream-50 px-3 py-1.5 text-caption text-ink hover:bg-cream-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}
