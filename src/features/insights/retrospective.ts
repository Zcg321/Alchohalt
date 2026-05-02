import type { Entry } from '../../store/db';

/**
 * [R10-2] Long-term retrospectives — 30, 90, 180, 365 day windows.
 *
 * The data model: every 30 days, the app prompts "It's been a month
 * since your last retrospective. Want to see what's changed?". The
 * prompt is dismissible. Dismissing sets `nextPromptTs` 30 days into
 * the future so we don't re-bug the user.
 *
 * The retrospective itself is a comparison of two adjacent windows:
 * the most recent N days vs. the prior N days. N = 30 / 90 / 180 / 365.
 *
 * Voice: factual, no judgement (matches MonthlyDeltaPanel from R10-B).
 */

export interface RetrospectiveWindow {
  days: number;
  label: '30-day' | '90-day' | '6-month' | '12-month';
}

export const RETROSPECTIVE_WINDOWS: RetrospectiveWindow[] = [
  { days: 30, label: '30-day' },
  { days: 90, label: '90-day' },
  { days: 180, label: '6-month' },
  { days: 365, label: '12-month' },
];

export interface WindowSummary {
  startTs: number;
  endTs: number;
  totalStdDrinks: number;
  drinkingDays: number;
  afDays: number;
  daysCovered: number;
  topMood: Entry['mood'] | undefined;
  avgCraving: number;
}

export interface Retrospective {
  window: RetrospectiveWindow;
  recent: WindowSummary;
  prior: WindowSummary | null;
  totalDelta: { absolute: number; pct: number | null };
  afDelta: { absolute: number; pct: number | null };
  cravingDelta: { absolute: number; pct: number | null };
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function summarize(entries: Entry[], startTs: number, endTs: number): WindowSummary {
  const inWindow = entries.filter((e) => e.ts >= startTs && e.ts < endTs);
  const days = new Set<number>();
  let totalStdDrinks = 0;
  let totalCraving = 0;
  const moodCounts = new Map<NonNullable<Entry['mood']>, number>();
  for (const e of inWindow) {
    days.add(startOfDay(e.ts));
    totalStdDrinks += e.stdDrinks;
    totalCraving += e.craving;
    if (e.mood) moodCounts.set(e.mood, (moodCounts.get(e.mood) ?? 0) + 1);
  }
  const daysCovered = Math.max(1, Math.round((endTs - startTs) / 86400000));
  let topMood: Entry['mood'] | undefined;
  let topMoodCount = 0;
  for (const [mood, count] of moodCounts.entries()) {
    if (count > topMoodCount) {
      topMood = mood;
      topMoodCount = count;
    }
  }
  return {
    startTs,
    endTs,
    totalStdDrinks: Number(totalStdDrinks.toFixed(2)),
    drinkingDays: days.size,
    afDays: Math.max(0, daysCovered - days.size),
    daysCovered,
    topMood,
    avgCraving: inWindow.length > 0 ? Number((totalCraving / inWindow.length).toFixed(2)) : 0,
  };
}

function pct(curr: number, prior: number): number | null {
  if (prior === 0) return null;
  return Number((((curr - prior) / prior) * 100).toFixed(1));
}

export function computeRetrospective(
  entries: Entry[],
  window: RetrospectiveWindow,
  now: number = Date.now()
): Retrospective {
  const dayMs = 86400000;
  const recentEnd = now;
  const recentStart = now - window.days * dayMs;
  const priorEnd = recentStart;
  const priorStart = priorEnd - window.days * dayMs;

  const recent = summarize(entries, recentStart, recentEnd);
  const hasPriorData = entries.some((e) => e.ts >= priorStart && e.ts < priorEnd);
  const prior = hasPriorData ? summarize(entries, priorStart, priorEnd) : null;

  const totalDelta = {
    absolute: prior ? Number((recent.totalStdDrinks - prior.totalStdDrinks).toFixed(2)) : 0,
    pct: prior ? pct(recent.totalStdDrinks, prior.totalStdDrinks) : null,
  };
  const afDelta = {
    absolute: prior ? recent.afDays - prior.afDays : 0,
    pct: prior ? pct(recent.afDays, prior.afDays) : null,
  };
  const cravingDelta = {
    absolute: prior ? Number((recent.avgCraving - prior.avgCraving).toFixed(2)) : 0,
    pct: prior ? pct(recent.avgCraving, prior.avgCraving) : null,
  };

  return { window, recent, prior, totalDelta, afDelta, cravingDelta };
}

/**
 * Pick the largest window with prior-window data available. So a
 * 90-day-old user sees the 90-day retrospective, a 365-day-old user
 * sees the 12-month one.
 */
export function pickRetrospectiveWindow(
  entries: Entry[],
  now: number = Date.now()
): RetrospectiveWindow | null {
  const dayMs = 86400000;
  for (const w of [...RETROSPECTIVE_WINDOWS].reverse()) {
    const priorStart = now - 2 * w.days * dayMs;
    const priorEnd = now - w.days * dayMs;
    const hasPriorData = entries.some((e) => e.ts >= priorStart && e.ts < priorEnd);
    if (hasPriorData) return w;
  }
  return null;
}

export const RETRO_PROMPT_INTERVAL_DAYS = 30;

export function shouldShowRetrospectivePrompt(
  lastShownTs: number | undefined,
  now: number = Date.now()
): boolean {
  if (lastShownTs === undefined) return true;
  return now - lastShownTs >= RETRO_PROMPT_INTERVAL_DAYS * 86400000;
}
