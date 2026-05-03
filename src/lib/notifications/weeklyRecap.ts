/**
 * [R13-2] Weekly-recap notification body composer.
 *
 * Pure function. Given the user's drink log + daily cap + a "now"
 * timestamp, returns the body text for the local notification:
 *
 *   "Last week: 5 AF days, 6 logged drinks, 1 over cap.
 *    Down 20% from prior week."
 *
 * No I/O, no analytics, no fetch — input drinks come from the device
 * store, output text is handed to the OS notification channel and
 * never seen by us.
 *
 * Two windows: the most recent 7 days vs the prior 7. Delta is
 * computed against total std drinks. We surface the delta only when
 * BOTH windows have any drinks logged — comparing zero to anything
 * gives nonsense percentages.
 *
 * Voice rules:
 *   - Calm-factual, no exclamation marks.
 *   - "Up X%" / "Down X%" / "Same as last week".
 *   - "Over cap" fragment hides if dailyCap <= 0 (user hasn't set one).
 *   - 100% precision suppressed: rounded to nearest 5%.
 */

import type { Drink } from '../../types/common';
import { stdDrinks } from '../calc';

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 7;

export interface WeeklyRecapStats {
  afDays: number;
  loggedDrinkDays: number;
  daysOverCap: number;
  totalStd: number;
  priorTotalStd: number;
  /** True when goals.dailyCap > 0; gates the "over cap" fragment. */
  capTracked: boolean;
}

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function bucketWindow(
  drinks: Drink[],
  startMs: number,
  windowDays: number,
): Record<string, number> {
  const buckets: Record<string, number> = {};
  const start = new Date(startMs);
  start.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() - i);
    buckets[dayKey(d.getTime())] = 0;
  }
  const earliest = Math.min(...Object.keys(buckets).map((k) => new Date(k).getTime()));
  const latest = start.getTime();
  for (const d of drinks) {
    if (d.ts < earliest || d.ts > latest + DAY_MS - 1) continue;
    const k = dayKey(d.ts);
    if (k in buckets) {
      buckets[k] = (buckets[k] ?? 0) + stdDrinks(d.volumeMl, d.abvPct);
    }
  }
  return buckets;
}

export function computeWeeklyRecapStats(
  drinks: Drink[],
  dailyCap: number,
  now: number = Date.now(),
): WeeklyRecapStats {
  const lastWeek = bucketWindow(drinks, now, WINDOW_DAYS);
  const priorWeekStart = now - WINDOW_DAYS * DAY_MS;
  const priorWeek = bucketWindow(drinks, priorWeekStart, WINDOW_DAYS);

  let afDays = 0;
  let loggedDrinkDays = 0;
  let daysOverCap = 0;
  let totalStd = 0;
  for (const std of Object.values(lastWeek)) {
    totalStd += std;
    if (std === 0) afDays += 1;
    else loggedDrinkDays += 1;
    if (dailyCap > 0 && std > dailyCap) daysOverCap += 1;
  }
  const priorTotalStd = Object.values(priorWeek).reduce((a, b) => a + b, 0);

  return {
    afDays,
    loggedDrinkDays,
    daysOverCap,
    totalStd,
    priorTotalStd,
    capTracked: dailyCap > 0,
  };
}

export interface ComposeOptions {
  /** Include the "X% from prior week" delta line. Defaults to true. */
  includeDelta?: boolean;
}

/**
 * Render the recap stats into a notification body. Pure function.
 * Returns an empty string if there's nothing meaningful to report
 * (no drinks logged in either window AND zero AF days — the user
 * hasn't been engaging with the app this period).
 */
export function composeWeeklyRecapBody(
  stats: WeeklyRecapStats,
  options: ComposeOptions = {},
): string {
  const { includeDelta = true } = options;
  const fragments: string[] = [];
  fragments.push(`${stats.afDays} AF day${stats.afDays === 1 ? '' : 's'}`);
  fragments.push(
    `${stats.loggedDrinkDays} logged drink day${stats.loggedDrinkDays === 1 ? '' : 's'}`,
  );
  if (stats.capTracked && stats.daysOverCap > 0) {
    fragments.push(
      `${stats.daysOverCap} over cap`,
    );
  }

  let line2 = '';
  if (
    includeDelta &&
    stats.priorTotalStd > 0 &&
    stats.totalStd > 0
  ) {
    const ratio = stats.totalStd / stats.priorTotalStd;
    const pct = Math.round(((ratio - 1) * 100) / 5) * 5;
    if (pct === 0) line2 = 'Same as last week.';
    else if (pct > 0) line2 = `Up ${pct}% from prior week.`;
    else line2 = `Down ${Math.abs(pct)}% from prior week.`;
  } else if (
    includeDelta &&
    stats.priorTotalStd > 0 &&
    stats.totalStd === 0
  ) {
    line2 = 'No drinks this week.';
  }

  const body = `Last week: ${fragments.join(', ')}.${line2 ? ` ${line2}` : ''}`;
  return body;
}

/**
 * One-shot convenience for callers that have raw drinks + cap. The
 * notification scheduler in lib/notify.ts uses this; tests use the
 * lower-level computeWeeklyRecapStats + composeWeeklyRecapBody so
 * each piece is testable independently.
 */
export function buildWeeklyRecap(
  drinks: Drink[],
  dailyCap: number,
  now: number = Date.now(),
): { title: string; body: string } {
  const stats = computeWeeklyRecapStats(drinks, dailyCap, now);
  return {
    title: 'Weekly recap',
    body: composeWeeklyRecapBody(stats),
  };
}
