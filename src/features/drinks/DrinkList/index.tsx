// @no-smoke
import React, { useCallback, useMemo, useState } from 'react';
import type { Drink } from '../DrinkForm';
import DayGroup from './DayGroup';
import { useLanguage } from '../../../i18n';
import { stdDrinks } from '../../../lib/calc';
import {
  BulkSelectionProvider,
  type BulkSelectionState,
} from './BulkSelectionContext';
import BulkActionBar from './BulkActionBar';

interface Props {
  drinks: Drink[];
  onDelete?: ((ts: number) => void) | undefined;
  onEdit?: ((drink: Drink) => void) | undefined;
  dailyCap?: number | undefined;
  /**
   * [R12-2] Bulk-edit ops, all keyed by ts:
   *   - onBulkDelete: delete every selected drink in one pass
   *   - onBulkShiftTime: add deltaMinutes to ts on every selected drink
   *   - onBulkScaleStd: multiply volumeMl by factor on every selected
   *     drink (abv stays — scaling volume is the cleanest way to scale
   *     std, since std = vol × abv × 0.789 / 14)
   *
   * If a host doesn't pass these, bulk mode falls back to per-drink
   * deletes via onDelete and disables the modifier rows. The R12 host
   * (TrackTab) wires all four.
   */
  onBulkDelete?: ((tsList: number[]) => void) | undefined;
  onBulkShiftTime?: ((tsList: number[], deltaMinutes: number) => void) | undefined;
  onBulkScaleStd?: ((tsList: number[], factor: number) => void) | undefined;
}

const DAY_MS = 86_400_000;

function dayKeyOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function DrinkList({
  drinks,
  onDelete,
  onEdit,
  dailyCap,
  onBulkDelete,
  onBulkShiftTime,
  onBulkScaleStd,
}: Props) {
  const { t } = useLanguage();

  // Bulk-edit state. Lives here so the DayGroup "select day" button
  // and the BulkActionBar can read/write the same set.
  const [bulkActive, setBulkActive] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());

  const grouped = useMemo(() => {
    const sorted = [...drinks].sort((a, b) => b.ts - a.ts);
    const map: Record<string, Drink[]> = {};
    for (const d of sorted) {
      const day = dayKeyOf(d.ts);
      (map[day] ||= []).push(d);
    }
    return map;
  }, [drinks]);

  const exitBulk = useCallback(() => {
    setBulkActive(false);
    setSelected(new Set());
  }, []);

  const toggle = useCallback((ts: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ts)) next.delete(ts);
      else next.add(ts);
      return next;
    });
  }, []);

  const selectAll = useCallback((tsList: number[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const ts of tsList) next.add(ts);
      return next;
    });
  }, []);

  const deselectAll = useCallback((tsList: number[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const ts of tsList) next.delete(ts);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleSelectToday = useCallback(() => {
    const cutoff = startOfTodayMs();
    selectAll(drinks.filter((d) => d.ts >= cutoff).map((d) => d.ts));
  }, [drinks, selectAll]);

  const handleSelectThisWeek = useCallback(() => {
    const cutoff = Date.now() - 7 * DAY_MS;
    selectAll(drinks.filter((d) => d.ts >= cutoff).map((d) => d.ts));
  }, [drinks, selectAll]);

  const handleBulkDelete = useCallback(() => {
    const tsList = Array.from(selected);
    if (tsList.length === 0) return;
    /* [R13-C] Localized + count-aware confirm. Bulk delete cannot be
     * undone (the per-row UndoToast is single-entry only) — the prompt
     * must surface the count + finality without scaring the user. */
    const message = (
      tsList.length === 1
        ? t('bulk.deleteConfirm.one', "Delete this drink? This can't be undone.")
        : t('bulk.deleteConfirm.many', "Delete {{n}} drinks? This can't be undone.")
    ).replace('{{n}}', String(tsList.length));
    if (!window.confirm(message)) return;
    if (onBulkDelete) onBulkDelete(tsList);
    else if (onDelete) for (const ts of tsList) onDelete(ts);
    exitBulk();
  }, [selected, onBulkDelete, onDelete, exitBulk, t]);

  const handleBulkShiftTime = useCallback(
    (deltaMinutes: number) => {
      const tsList = Array.from(selected);
      if (tsList.length === 0 || !onBulkShiftTime) return;
      onBulkShiftTime(tsList, deltaMinutes);
      // Selection follows the new ts values — the host should re-emit
      // updated drinks with shifted ts. Clearing here keeps the user in
      // bulk mode but unselected so the next operation starts clean.
      setSelected(new Set());
    },
    [selected, onBulkShiftTime],
  );

  const handleBulkScaleStd = useCallback(
    (factor: number) => {
      const tsList = Array.from(selected);
      if (tsList.length === 0 || !onBulkScaleStd) return;
      onBulkScaleStd(tsList, factor);
      setSelected(new Set());
    },
    [selected, onBulkScaleStd],
  );

  const bulkState: BulkSelectionState = {
    active: bulkActive,
    selected,
    toggle,
    selectAll,
    deselectAll,
    clear,
  };

  if (drinks.length === 0) {
    return (
      <div className="card text-center">
        <div className="card-content py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg aria-hidden="true" className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            {t('noDrinksTitle')}
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            {t('noDrinks')}
          </p>
        </div>
      </div>
    );
  }

  // Compute a couple of read-only helpers for the bulk bar.
  const totalStdSelected = drinks
    .filter((d) => selected.has(d.ts))
    .reduce((s, d) => s + stdDrinks(d.volumeMl, d.abvPct), 0);

  return (
    <BulkSelectionProvider value={bulkState}>
      <div className="card">
        <div className="card-header flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold flex items-center">
              <span className="w-2 h-2 bg-primary-500 rounded-full me-3"></span>
              {t('drinkHistory')}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {drinks.length} {drinks.length === 1 ? t('entry') : t('entries')} total
              {bulkActive && selected.size > 0 ? (
                <>
                  {' '}— {totalStdSelected.toFixed(2)} std selected
                </>
              ) : null}
            </p>
          </div>
          {!bulkActive ? (
            <button
              type="button"
              onClick={() => setBulkActive(true)}
              data-testid="bulk-enter"
              className="rounded-pill bg-cream-50 px-3 py-1.5 text-caption text-ink hover:bg-cream-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 transition-colors"
            >
              Bulk edit
            </button>
          ) : null}
        </div>

        {bulkActive ? (
          <div className="card-content">
            <BulkActionBar
              drinks={drinks}
              selectedCount={selected.size}
              onSelectToday={handleSelectToday}
              onSelectThisWeek={handleSelectThisWeek}
              onClear={clear}
              onDeleteSelected={handleBulkDelete}
              onShiftTimeSelected={handleBulkShiftTime}
              onScaleStdSelected={handleBulkScaleStd}
              onExit={exitBulk}
            />
          </div>
        ) : null}

        <div className="card-content space-y-4">
          {Object.entries(grouped).map(([day, list]) => (
            <DayGroup key={day} day={day} drinks={list} dailyCap={dailyCap} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </div>
    </BulkSelectionProvider>
  );
}

export type { Drink } from '../DrinkForm';
