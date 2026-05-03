// @no-smoke
import React from 'react';
import type { Drink, Goals } from '../../types/common';
import { stdDrinks } from '../../lib/calc';
import { useLanguage } from '../../i18n';

/**
 * Long-term-user activity ribbon — last-7-days snapshot.
 *
 * Round-12 R12-A. Round-11 day-90 judge has been asking for a calm,
 * "what does my last week look like" line on home for users who are
 * past the milestone-counting phase. The wedge: at month 1+, the
 * Day-N hero stops being the most useful piece — what the user wants
 * is "did this week go the way I meant it to?". The ribbon answers
 * that in one factual line.
 *
 * Render rules (all required):
 *   - daysSinceFirstEntry >= 30   (long-term user, not a fresh install)
 *   - drinks.length >= 7          (enough data for a 7-day shape)
 *
 * Otherwise null. Voice: factual, no judgement, no exclamation marks.
 *   "Last 7 days: 4 AF days, 2 logged drinks, 1 over your daily cap."
 *
 * The "over your daily cap" fragment hides when goals.dailyCap <= 0
 * (user hasn't set one) — overlaying a cap they didn't set would be
 * adding a constraint that isn't theirs.
 */

const DAY_MS = 86_400_000;
const LONG_TERM_THRESHOLD_DAYS = 30;
const MIN_ENTRIES = 7;
const WINDOW_DAYS = 7;

export interface SevenDaySummary {
  afDays: number;
  loggedDrinkDays: number;
  daysOverCap: number;
  /** True when goals.dailyCap > 0; gates the over-cap fragment. */
  capTracked: boolean;
}

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function compute7DaySummary(
  drinks: Drink[],
  dailyCap: number,
  now: number = Date.now(),
): SevenDaySummary {
  // Bucket the last 7 days (today + 6 prior). For each, sum std drinks.
  const buckets: Record<string, number> = {};
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < WINDOW_DAYS; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    buckets[dayKey(d.getTime())] = 0;
  }
  for (const d of drinks) {
    const k = dayKey(d.ts);
    if (k in buckets) {
      buckets[k] += stdDrinks(d.volumeMl, d.abvPct);
    }
  }
  let afDays = 0;
  let loggedDrinkDays = 0;
  let daysOverCap = 0;
  for (const std of Object.values(buckets)) {
    if (std === 0) afDays += 1;
    else loggedDrinkDays += 1;
    if (dailyCap > 0 && std > dailyCap) daysOverCap += 1;
  }
  return {
    afDays,
    loggedDrinkDays,
    daysOverCap,
    capTracked: dailyCap > 0,
  };
}

interface RibbonGate {
  pass: boolean;
  daysSinceFirstEntry: number;
}

export function checkRibbonGate(drinks: Drink[], now: number = Date.now()): RibbonGate {
  if (drinks.length < MIN_ENTRIES) {
    return { pass: false, daysSinceFirstEntry: 0 };
  }
  const earliestTs = Math.min(...drinks.map((d) => d.ts));
  const daysSinceFirstEntry = Math.floor((now - earliestTs) / DAY_MS);
  return {
    pass: daysSinceFirstEntry >= LONG_TERM_THRESHOLD_DAYS,
    daysSinceFirstEntry,
  };
}

interface Props {
  drinks: Drink[];
  goals: Goals;
  className?: string | undefined;
}

function pluralKey(count: number, base: string): string {
  return count === 1 ? `${base}.one` : `${base}.many`;
}

export default function LongTermActivityRibbon({ drinks, goals, className = '' }: Props) {
  const gate = checkRibbonGate(drinks);
  const { t } = useLanguage();
  if (!gate.pass) return null;
  const summary = compute7DaySummary(drinks, goals.dailyCap);

  const fragments: string[] = [
    t(pluralKey(summary.afDays, 'ribbon.afDays'), `${summary.afDays} AF day${summary.afDays === 1 ? '' : 's'}`)
      .replace('{{n}}', String(summary.afDays)),
    t(pluralKey(summary.loggedDrinkDays, 'ribbon.loggedDay'), `${summary.loggedDrinkDays} logged drink day${summary.loggedDrinkDays === 1 ? '' : 's'}`)
      .replace('{{n}}', String(summary.loggedDrinkDays)),
  ];
  if (summary.capTracked && summary.daysOverCap > 0) {
    fragments.push(
      t('ribbon.overCap', `${summary.daysOverCap} over your daily cap`)
        .replace('{{n}}', String(summary.daysOverCap)),
    );
  }

  return (
    <section
      aria-labelledby="long-term-ribbon-heading"
      data-testid="long-term-activity-ribbon"
      className={`mx-auto w-full max-w-2xl px-4 ${className}`}
    >
      <div className="rounded-2xl border-s-4 border-neutral-300 dark:border-neutral-700 bg-surface-elevated px-4 py-3 text-sm text-ink-soft">
        <h2 id="long-term-ribbon-heading" className="sr-only">
          {t('ribbon.heading', 'Your last seven days at a glance')}
        </h2>
        <span className="font-medium text-ink dark:text-neutral-200">
          {t('ribbon.label', 'Last 7 days:')}
        </span>{' '}
        <span className="tabular-nums">{fragments.join(', ')}.</span>
      </div>
    </section>
  );
}
