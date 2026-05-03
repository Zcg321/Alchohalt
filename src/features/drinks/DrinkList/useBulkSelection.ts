/**
 * useBulkSelection — bulk-edit selection logic extracted from
 * DrinkList as part of the [R17-A] long-function lint sweep. Owns
 * `selected`, the toggle/select-all/select-today/select-week helpers,
 * and the three bulk action handlers (delete / shiftTime / scaleStd).
 */

import { useCallback, useState } from 'react';
import type { Drink } from '../DrinkForm';
import { useLanguage } from '../../../i18n';

const DAY_MS = 86_400_000;

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

interface Args {
  drinks: Drink[];
  onDelete?: ((ts: number) => void) | undefined;
  onBulkDelete?: ((tsList: number[]) => void) | undefined;
  onBulkShiftTime?: ((tsList: number[], deltaMinutes: number) => void) | undefined;
  onBulkScaleStd?: ((tsList: number[], factor: number) => void) | undefined;
}

export function useBulkSelection({ drinks, onDelete, onBulkDelete, onBulkShiftTime, onBulkScaleStd }: Args) {
  const { t } = useLanguage();
  const [bulkActive, setBulkActive] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());

  const exitBulk = useCallback(() => { setBulkActive(false); setSelected(new Set()); }, []);
  const toggle = useCallback((ts: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ts)) next.delete(ts); else next.add(ts);
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
  const clear = useCallback(() => setSelected(new Set()), []);

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

  const handleBulkShiftTime = useCallback((deltaMinutes: number) => {
    const tsList = Array.from(selected);
    if (tsList.length === 0 || !onBulkShiftTime) return;
    onBulkShiftTime(tsList, deltaMinutes);
    setSelected(new Set());
  }, [selected, onBulkShiftTime]);

  const handleBulkScaleStd = useCallback((factor: number) => {
    const tsList = Array.from(selected);
    if (tsList.length === 0 || !onBulkScaleStd) return;
    onBulkScaleStd(tsList, factor);
    setSelected(new Set());
  }, [selected, onBulkScaleStd]);

  return {
    bulkActive, setBulkActive, selected, toggle, selectAll, deselectAll, clear, exitBulk,
    handleSelectToday, handleSelectThisWeek,
    handleBulkDelete, handleBulkShiftTime, handleBulkScaleStd,
  };
}
