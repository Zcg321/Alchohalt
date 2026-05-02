// @no-smoke
import React, { createContext, useContext } from 'react';

/**
 * Shared selection state for the bulk-edit flow.
 *
 * Why a context: DrinkList → DayGroup → DrinkItem is a 3-level tree
 * with cross-cutting selection state, plus the BulkActionBar at the
 * top needs to read/write the same set. Prop-drilling four hooks in
 * three places hides the model; a context keeps it in one place and
 * keeps DrinkItem leaf-rendering simple (it just asks "am I selected,
 * what happens when I'm clicked?").
 *
 * Selection is keyed by drink.ts (existing convention — ts is the
 * unique identifier in the Drink type). Components that pass a Drink
 * to onClick already convert; we keep ts here for cheap Set lookups.
 */
export interface BulkSelectionState {
  active: boolean;
  selected: ReadonlySet<number>;
  toggle: (ts: number) => void;
  selectAll: (timestamps: number[]) => void;
  deselectAll: (timestamps: number[]) => void;
  clear: () => void;
}

const BulkSelectionCtx = createContext<BulkSelectionState | null>(null);

export function BulkSelectionProvider({
  value,
  children,
}: {
  value: BulkSelectionState;
  children: React.ReactNode;
}) {
  return (
    <BulkSelectionCtx.Provider value={value}>
      {children}
    </BulkSelectionCtx.Provider>
  );
}

/** Returns the active selection state, or null when not in bulk mode. */
export function useBulkSelection(): BulkSelectionState | null {
  return useContext(BulkSelectionCtx);
}
