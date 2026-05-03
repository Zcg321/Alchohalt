/**
 * [R16-3] Date-range filtering for exports.
 *
 * The R12 backup-restore + R15-3 auto-verify path round-trips the FULL
 * DB through createExport. That's still the right behavior for backups
 * — round-trip identity is the contract. Round 16 adds an alternate
 * "send my therapist the last 90 days" path that filters entries to a
 * user-chosen window before export.
 *
 * Two callers:
 *   - JSON range export: builds a DB clone with `entries` restricted
 *     to [fromMs, toMs], passes to createExport. The export payload
 *     itself is still self-verifying; round-trip identity holds against
 *     the filtered DB rather than the source DB. This is intentional —
 *     a partial export should restore to a partial DB.
 *   - CSV range export: filters entries by ts and passes to
 *     entriesToCSV. Same `Date,Time,Beverage,...` schema as the
 *     full-DB CSV path.
 *
 * Boundary semantics: `[fromMs, toMs]` is INCLUSIVE on both ends. The
 * UI passes day boundaries (00:00 local on `from`, 23:59:59.999 local
 * on `to`) so a user picking "Apr 1 to Apr 30" gets every entry
 * timestamped on those days regardless of time-of-day.
 *
 * Defaults — for a user opening the picker for the first time:
 *   from = 30 days before today (00:00 local)
 *   to   = today (23:59:59.999 local)
 *
 * Returns the filtered DB clone or filtered Entry[] depending on the
 * caller's needs. Settings/presets/etc. are preserved as-is — only
 * `entries` is filtered. (Trash is also dropped from a range export
 * so an exported window doesn't drag in undeleted-but-trashed rows.)
 */
import type { DB, Entry } from '../store/db';

export interface DateRange {
  /** Inclusive start, ms-since-epoch. */
  fromMs: number;
  /** Inclusive end, ms-since-epoch. */
  toMs: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Build a default range: last 30 days, inclusive of today and the day
 * 30 days back. UI uses this when no prior range is set.
 */
export function defaultLast30DaysRange(now: number = Date.now()): DateRange {
  const today = new Date(now);
  const fromDay = new Date(now - 29 * DAY_MS);
  const fromMs = startOfDayLocal(fromDay).getTime();
  const toMs = endOfDayLocal(today).getTime();
  return { fromMs, toMs };
}

/** Set time to 00:00:00.000 local. Mutates and returns. */
export function startOfDayLocal(date: Date): Date {
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Set time to 23:59:59.999 local. Mutates and returns. */
export function endOfDayLocal(date: Date): Date {
  date.setHours(23, 59, 59, 999);
  return date;
}

/**
 * Filter entries to the given inclusive ms range.
 */
export function filterEntriesByRange(entries: Entry[], range: DateRange): Entry[] {
  return entries.filter((e) => e.ts >= range.fromMs && e.ts <= range.toMs);
}

/**
 * Build a DB clone with `entries` restricted to the given range and
 * trash dropped. Settings, presets, advancedGoals, healthMetrics, meta
 * are preserved as-is — those reflect the user's CURRENT state, not the
 * window of entries.
 */
export function dbForExportRange(db: DB, range: DateRange): DB {
  return {
    ...db,
    entries: filterEntriesByRange(db.entries, range),
    trash: [],
    healthMetrics: db.healthMetrics
      ? db.healthMetrics.filter((m) => {
          const dayMs = new Date(m.date + 'T00:00:00').getTime();
          return Number.isFinite(dayMs) && dayMs >= range.fromMs && dayMs <= range.toMs;
        })
      : db.healthMetrics,
  };
}

/**
 * Validate a range. Returns null when valid, otherwise a short
 * user-readable string the UI can render. Used to disable the export
 * button when the range is unusable.
 */
export function validateRange(range: { fromMs: number; toMs: number }): string | null {
  if (!Number.isFinite(range.fromMs) || !Number.isFinite(range.toMs)) {
    return 'Pick both a from and a to date.';
  }
  if (range.fromMs > range.toMs) {
    return "From date can't be after the To date.";
  }
  return null;
}

/** YYYY-MM-DD local-date string for use as <input type="date"> value. */
export function dateInputValue(ms: number): string {
  if (!Number.isFinite(ms)) return '';
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse a YYYY-MM-DD <input type="date"> string into a local-day ms
 * boundary. `mode === 'start'` returns 00:00:00.000; `mode === 'end'`
 * returns 23:59:59.999. Returns NaN for empty/invalid input.
 */
export function parseDateInputValue(value: string, mode: 'start' | 'end'): number {
  if (!value) return NaN;
  const parts = value.split('-');
  if (parts.length !== 3) return NaN;
  const [y, m, d] = parts.map((p) => Number(p));
  if (!y || !m || !d) return NaN;
  const date = new Date(y, m - 1, d);
  return mode === 'start'
    ? startOfDayLocal(date).getTime()
    : endOfDayLocal(date).getTime();
}
