/**
 * useDrinkActions — extracted from AlcoholCoachAppInner as part of
 * the [R17-A] long-function lint sweep. Bundles per-drink mutations
 * (add / save / delete / undo / startEdit / cancelEdit) and the
 * three bulk ops (bulkDelete, bulkShiftTime, bulkScaleStd), each
 * with the haptic + SR-announcement side-effects they had inline.
 *
 * Behavior is unchanged. The only difference is the handlers now
 * live in one hook the parent component calls once per render.
 */

import { useRef, useState } from 'react';
import type { Drink } from '../../types/common';
import {
  entryToLegacyDrink,
  legacyDrinkToEntry,
} from '../../lib/data-bridge';
import { hapticForEvent } from '../../shared/haptics';
import type { Store } from '../../store/db';

type DBHandle = Store;

export function useDrinkActions(dbHandle: DBHandle) {
  const { db, addEntry, editEntry, deleteEntry, undo } = dbHandle;
  const [editing, setEditing] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Drink | null>(null);
  const [logAnnouncement, setLogAnnouncement] = useState('');
  const undoTimer = useRef<number>();

  function announce(msg: string) {
    setLogAnnouncement(msg);
    setTimeout(() => setLogAnnouncement(''), 1500);
  }

  function addDrink(drink: Drink) {
    const entry = legacyDrinkToEntry(drink);
    addEntry(entry);
    const isAFMark = drink.volumeMl === 0 && drink.abvPct === 0;
    announce(isAFMark ? 'Marked alcohol-free.' : 'Added.');
    hapticForEvent(isAFMark ? 'af-day-marked' : 'drink-logged');
    if (isAFMark) {
      const sevenAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const drinks = db.entries.map(entryToLegacyDrink);
      const after = [...drinks, drink];
      const afCount = after.filter(
        (d) => d.ts >= sevenAgo && d.volumeMl === 0 && d.abvPct === 0,
      ).length;
      if (afCount > 0 && afCount % 7 === 0) hapticForEvent('goal-hit');
    }
  }

  function saveDrink(drink: Drink) {
    if (!editing) return;
    editEntry(editing, legacyDrinkToEntry(drink));
    setEditing(null);
    hapticForEvent('drink-logged');
    announce('Saved.');
  }

  function deleteDrink(drink: Drink) {
    const entry = db.entries.find((e) => e.ts === drink.ts);
    if (!entry) return;
    setLastDeleted(drink);
    deleteEntry(entry.id);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setLastDeleted(null), 5000);
  }

  function undoDelete() {
    if (!lastDeleted) return;
    undo();
    setLastDeleted(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    hapticForEvent('drink-undo');
  }

  function startEdit(drink: Drink) {
    const entry = db.entries.find((e) => e.ts === drink.ts);
    if (entry) setEditing(entry.id);
  }
  function cancelEdit() { setEditing(null); }

  function resolveIds(tsList: number[]): string[] {
    return tsList
      .map((ts) => db.entries.find((e) => e.ts === ts)?.id)
      .filter((id): id is string => id !== undefined);
  }

  function bulkDelete(tsList: number[]) {
    const ids = resolveIds(tsList);
    for (const id of ids) deleteEntry(id);
    if (ids.length > 0) {
      hapticForEvent('drink-undo');
      announce(`${ids.length} ${ids.length === 1 ? 'drink' : 'drinks'} deleted.`);
    }
  }

  function bulkShiftTime(tsList: number[], deltaMinutes: number) {
    const deltaMs = deltaMinutes * 60_000;
    const updates = tsList
      .map((ts) => {
        const entry = db.entries.find((e) => e.ts === ts);
        return entry ? { id: entry.id, newTs: entry.ts + deltaMs } : null;
      })
      .filter((u): u is { id: string; newTs: number } => u !== null);
    for (const u of updates) editEntry(u.id, { ts: u.newTs });
    if (updates.length > 0) {
      hapticForEvent('drink-logged');
      const sign = deltaMinutes >= 0 ? '+' : '';
      announce(`${updates.length} drink time${updates.length === 1 ? '' : 's'} shifted ${sign}${deltaMinutes}m.`);
    }
  }

  function bulkScaleStd(tsList: number[], factor: number) {
    const updates = tsList
      .map((ts) => {
        const entry = db.entries.find((e) => e.ts === ts);
        return entry ? { id: entry.id, newStd: entry.stdDrinks * factor } : null;
      })
      .filter((u): u is { id: string; newStd: number } => u !== null);
    for (const u of updates) editEntry(u.id, { stdDrinks: u.newStd });
    if (updates.length > 0) {
      hapticForEvent('drink-logged');
      announce(`${updates.length} drink${updates.length === 1 ? '' : 's'} rescaled.`);
    }
  }

  const editingDrink = editing
    ? entryToLegacyDrink(db.entries.find((e) => e.id === editing)!)
    : null;

  return {
    editing, editingDrink,
    lastDeleted, logAnnouncement,
    addDrink, saveDrink, deleteDrink, undoDelete,
    startEdit, cancelEdit,
    bulkDelete, bulkShiftTime, bulkScaleStd,
  };
}
