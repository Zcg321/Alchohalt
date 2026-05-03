/**
 * [R14-5] Peak-hour analyzer.
 *
 * Some users drink heavily across a fragmented hour (e.g. three drinks
 * spread between 8-9 PM). The pattern is invisible in a daily total
 * but becomes obvious when you bin by hour. R14-5 finds the user's
 * most-frequent hour-of-day for real drinks and surfaces it
 * factually:
 *
 *   "Peak hour: 8 PM. On those days you average 2.3 drinks."
 *
 * Voice contract: factual. No pathologizing, no "consider cutting
 * back". The user does the interpretation; we just point at the data.
 *
 * Day-keying uses LOCAL time. A drink logged at 11 PM Tuesday should
 * count as Tuesday, not "Wednesday in UTC". Hour-of-day uses local
 * time too — that's what the user perceives.
 *
 * Pure function; no React, no side effects.
 */
import type { Drink } from '../../types/common';
import { stdDrinks } from '../../lib/calc';

export interface PeakHourStats {
  /** Hour 0-23 in user's local time. */
  peakHour: number;
  /** Count of drink entries logged in the peak hour, all-time. */
  drinksInPeakHour: number;
  /** Count of distinct days that had at least one drink in the peak hour. */
  daysWithPeakHour: number;
  /** Average drinks per day on the days that had a peak-hour entry. */
  avgDrinksOnThoseDays: number;
}

interface Options {
  /** Minimum total real-drink entries required to surface a pattern. */
  minDrinks?: number;
  /** Minimum distinct days at peak hour required to surface a pattern. */
  minDaysWithPeak?: number;
}

const DEFAULT_MIN_DRINKS = 7;
const DEFAULT_MIN_DAYS = 3;

function localDayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computePeakHour(
  drinks: Drink[],
  opts: Options = {},
): PeakHourStats | null {
  const minDrinks = opts.minDrinks ?? DEFAULT_MIN_DRINKS;
  const minDays = opts.minDaysWithPeak ?? DEFAULT_MIN_DAYS;

  // Real drinks only. AF entries (std=0) don't have a meaningful
  // peak hour and would skew the bin if the user logs an AF marker
  // at noon every day.
  const real = drinks.filter((d) => stdDrinks(d.volumeMl, d.abvPct) > 0);
  if (real.length < minDrinks) return null;

  // Bin entries by hour-of-day; track distinct days per hour.
  const hourCounts = new Array(24).fill(0) as number[];
  const hourDays: Map<number, Set<string>> = new Map();
  const drinksByDay: Map<string, number> = new Map();

  for (const d of real) {
    const dt = new Date(d.ts);
    const hour = dt.getHours();
    const day = localDayKey(d.ts);
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    let set = hourDays.get(hour);
    if (!set) {
      set = new Set();
      hourDays.set(hour, set);
    }
    set.add(day);
    drinksByDay.set(day, (drinksByDay.get(day) ?? 0) + 1);
  }

  // Pick the highest-count hour. Ties resolve by lowest hour number
  // (deterministic for tests).
  let peakHour = -1;
  let peakCount = 0;
  for (let h = 0; h < 24; h++) {
    if ((hourCounts[h] ?? 0) > peakCount) {
      peakCount = hourCounts[h] ?? 0;
      peakHour = h;
    }
  }
  if (peakHour === -1) return null;

  const peakDays = hourDays.get(peakHour);
  if (!peakDays || peakDays.size < minDays) return null;

  let totalDrinksOnPeakDays = 0;
  for (const day of peakDays) {
    totalDrinksOnPeakDays += drinksByDay.get(day) ?? 0;
  }
  const avgDrinksOnThoseDays = totalDrinksOnPeakDays / peakDays.size;

  return {
    peakHour,
    drinksInPeakHour: peakCount,
    daysWithPeakHour: peakDays.size,
    avgDrinksOnThoseDays,
  };
}

/**
 * Format an hour 0-23 as "8 PM" / "12 AM" / "3 AM".
 *
 * Future locale work could swap this for an Intl.DateTimeFormat call
 * to honor 24-hour locales, but the round-14 voice ships in en-US
 * style consistent with the rest of the strings in TagPatternsCard
 * and FirstMonthRibbon.
 */
export function formatHour12(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}
