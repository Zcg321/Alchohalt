// @no-smoke
import React, { useMemo } from 'react';
import type { Drink } from '../DrinkForm';
import DayGroup from './DayGroup';
import { useLanguage } from '../../../i18n';
import { stdDrinks } from '../../../lib/calc';
import {
  BulkSelectionProvider,
  type BulkSelectionState,
} from './BulkSelectionContext';
import BulkActionBar from './BulkActionBar';
import { useBulkSelection } from './useBulkSelection';

interface Props {
  drinks: Drink[];
  onDelete?: ((ts: number) => void) | undefined;
  onEdit?: ((drink: Drink) => void) | undefined;
  dailyCap?: number | undefined;
  onBulkDelete?: ((tsList: number[]) => void) | undefined;
  onBulkShiftTime?: ((tsList: number[], deltaMinutes: number) => void) | undefined;
  onBulkScaleStd?: ((tsList: number[], factor: number) => void) | undefined;
}

function dayKeyOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function EmptyState() {
  const { t } = useLanguage();
  return (
    <div className="card text-center">
      <div className="card-content py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <svg aria-hidden="true" className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">{t('noDrinksTitle')}</h3>
        <p className="text-neutral-600 dark:text-neutral-400">{t('noDrinks')}</p>
      </div>
    </div>
  );
}

function DrinkListHeader({ totalCount, bulkActive, selectedCount, totalStdSelected, onEnterBulk }: {
  totalCount: number; bulkActive: boolean; selectedCount: number;
  totalStdSelected: number; onEnterBulk: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="card-header flex items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold flex items-center">
          <span className="w-2 h-2 bg-primary-500 rounded-full me-3"></span>
          {t('drinkHistory')}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          {totalCount} {totalCount === 1 ? t('entry') : t('entries')} total
          {bulkActive && selectedCount > 0 ? <> — {totalStdSelected.toFixed(2)} std selected</> : null}
        </p>
      </div>
      {!bulkActive ? (
        <button
          type="button" onClick={onEnterBulk} data-testid="bulk-enter"
          className="rounded-pill bg-cream-50 px-3 py-1.5 text-caption text-ink hover:bg-cream-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 transition-colors"
        >
          Bulk edit
        </button>
      ) : null}
    </div>
  );
}

export default function DrinkList({
  drinks, onDelete, onEdit, dailyCap, onBulkDelete, onBulkShiftTime, onBulkScaleStd,
}: Props) {
  const bulk = useBulkSelection({ drinks, onDelete, onBulkDelete, onBulkShiftTime, onBulkScaleStd });

  const grouped = useMemo(() => {
    const sorted = [...drinks].sort((a, b) => b.ts - a.ts);
    const map: Record<string, Drink[]> = {};
    for (const d of sorted) {
      const day = dayKeyOf(d.ts);
      (map[day] ||= []).push(d);
    }
    return map;
  }, [drinks]);

  if (drinks.length === 0) return <EmptyState />;

  const totalStdSelected = drinks
    .filter((d) => bulk.selected.has(d.ts))
    .reduce((s, d) => s + stdDrinks(d.volumeMl, d.abvPct), 0);

  const bulkState: BulkSelectionState = {
    active: bulk.bulkActive, selected: bulk.selected,
    toggle: bulk.toggle, selectAll: bulk.selectAll, deselectAll: bulk.deselectAll, clear: bulk.clear,
  };

  return (
    <BulkSelectionProvider value={bulkState}>
      <div className="card">
        <DrinkListHeader
          totalCount={drinks.length} bulkActive={bulk.bulkActive}
          selectedCount={bulk.selected.size} totalStdSelected={totalStdSelected}
          onEnterBulk={() => bulk.setBulkActive(true)}
        />
        {bulk.bulkActive ? (
          <div className="card-content">
            <BulkActionBar
              drinks={drinks} selectedCount={bulk.selected.size}
              onSelectToday={bulk.handleSelectToday} onSelectThisWeek={bulk.handleSelectThisWeek}
              onClear={bulk.clear} onDeleteSelected={bulk.handleBulkDelete}
              onShiftTimeSelected={bulk.handleBulkShiftTime} onScaleStdSelected={bulk.handleBulkScaleStd}
              onExit={bulk.exitBulk}
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
