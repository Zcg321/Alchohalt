import type { Entry } from '../../store/db';

/**
 * [R10-B] Longitudinal "vs prior month" surface.
 *
 * Given a list of entries and a "now" timestamp, computes summary stats for
 * the calendar month containing `now` and the immediately prior calendar
 * month. Returns nulls for prior month if there are no entries earlier than
 * the start of the current month (first-month empty state).
 *
 * Voice: factual numbers only. Voice/no-judgment is rendered by the
 * component, not this helper.
 */
export interface MonthSummary {
  /** Full ISO start of the calendar month (UTC-naive, anchored to local time) */
  monthStartTs: number;
  /** Number of entries in the month */
  drinkCount: number;
  /** Sum of stdDrinks in the month */
  totalStdDrinks: number;
  /** Distinct days with at least one entry */
  drinkingDays: number;
  /** Days in the month with zero entries (alcohol-free days) */
  afDays: number;
  /** Total days in the month, capped at "now" for current month */
  daysCounted: number;
  /** [R15-1] Avg std-drinks per drinking day. 0 if no drinking days. */
  avgPerDrinkingDay: number;
}

export interface MonthlyDelta {
  current: MonthSummary;
  prior: MonthSummary | null;
  /**
   * Percent change in totalStdDrinks (current vs prior). null when prior is
   * null or prior had zero drinks (avoid +∞).
   */
  totalChangePct: number | null;
  /** Same shape for AF days. */
  afDaysChangePct: number | null;
  /** [R15-1] Same shape for drinking days. */
  drinkingDaysChangePct: number | null;
  /** [R15-1] Same shape for avg per drinking day. */
  avgPerDrinkingDayChangePct: number | null;
}

function startOfMonth(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d.getTime();
}

function endOfMonth(ts: number): number {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return d.getTime();
}

function startOfDayLocal(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function summarize(entries: Entry[], monthStartTs: number, monthEndTs: number, capTs: number): MonthSummary {
  const inMonth = entries.filter((e) => e.ts >= monthStartTs && e.ts <= monthEndTs && e.ts <= capTs);
  const dayBuckets = new Set<number>();
  let totalStdDrinks = 0;
  for (const e of inMonth) {
    dayBuckets.add(startOfDayLocal(e.ts));
    totalStdDrinks += e.stdDrinks;
  }
  const cappedEnd = Math.min(monthEndTs, capTs);
  const daysCounted = Math.max(
    1,
    Math.round((startOfDayLocal(cappedEnd) - monthStartTs) / 86400000) + 1
  );
  const drinkingDays = dayBuckets.size;
  const avgPerDrinkingDay = drinkingDays > 0 ? totalStdDrinks / drinkingDays : 0;
  return {
    monthStartTs,
    drinkCount: inMonth.length,
    totalStdDrinks: Number(totalStdDrinks.toFixed(2)),
    drinkingDays,
    afDays: Math.max(0, daysCounted - drinkingDays),
    daysCounted,
    avgPerDrinkingDay: Number(avgPerDrinkingDay.toFixed(2)),
  };
}

function pct(current: number, prior: number): number | null {
  if (prior <= 0) return null;
  return Number((((current - prior) / prior) * 100).toFixed(1));
}

export function computeMonthlyDelta(entries: Entry[], now: number = Date.now()): MonthlyDelta {
  const currentStart = startOfMonth(now);
  const currentEnd = endOfMonth(now);
  const current = summarize(entries, currentStart, currentEnd, now);

  // Prior month: 1 ms before currentStart anchors us into the prior month.
  const priorAnchor = currentStart - 1;
  const priorStart = startOfMonth(priorAnchor);
  const priorEnd = endOfMonth(priorAnchor);
  const hasPriorData = entries.some((e) => e.ts >= priorStart && e.ts <= priorEnd);

  if (!hasPriorData) {
    return {
      current,
      prior: null,
      totalChangePct: null,
      afDaysChangePct: null,
      drinkingDaysChangePct: null,
      avgPerDrinkingDayChangePct: null,
    };
  }

  const prior = summarize(entries, priorStart, priorEnd, priorEnd);

  return {
    current,
    prior,
    totalChangePct: pct(current.totalStdDrinks, prior.totalStdDrinks),
    afDaysChangePct: pct(current.afDays, prior.afDays),
    drinkingDaysChangePct: pct(current.drinkingDays, prior.drinkingDays),
    avgPerDrinkingDayChangePct: pct(current.avgPerDrinkingDay, prior.avgPerDrinkingDay),
  };
}

export function formatMonth(ts: number, lang: string = 'en'): string {
  return new Date(ts).toLocaleDateString(lang, { month: 'long', year: 'numeric' });
}
