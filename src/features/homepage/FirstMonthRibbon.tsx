// @no-smoke
import React from 'react';
import type { Drink } from '../../types/common';

/**
 * First-month-user activity ribbon — countdown to the next milestone.
 *
 * Round-12 R12-1. Companion to LongTermActivityRibbon. The 30+ day
 * ribbon answers "did this week go the way I meant it to?" — but a
 * user in week 2 doesn't have a meaningful weekly shape yet, and
 * surfacing one risks reading as judgement of an unfinished month.
 *
 * The first-month variant instead surfaces a quiet, factual line:
 *   "5 days of logging — first milestone in 2 days."
 *
 * What it does NOT do (intentionally):
 *   - No streak emoji. Recovery isn't a video game.
 *   - No celebration on milestone cross. The Milestones panel handles
 *     dated-entry celebration; this ribbon is just an orientation
 *     line.
 *   - No nag voice on "drink today". A user who logs a drink today
 *     gets the same factual ribbon — only the milestone-day count
 *     resets if the drink ended their AF streak.
 *
 * Render rules:
 *   - drinks.length >= 1               (skip Day-0 — TodayPanel hero
 *                                       already covers the fresh-start
 *                                       state better than this)
 *   - daysSinceFirstEntry < 30         (long-term ribbon takes over)
 *   - daysSinceFirstEntry >= 1         (first day is hero territory)
 *
 * Otherwise null. Voice matches LongTermActivityRibbon: factual,
 * no exclamation marks, no second-person commands.
 */

const DAY_MS = 86_400_000;
const FIRST_MONTH_THRESHOLD_DAYS = 30;
const MIN_DAYS = 1;

/**
 * Milestone tiers in days. First three only — past 30 days the
 * long-term ribbon takes over, so the 90/365 milestones aren't this
 * ribbon's job. Aligned with features/milestones/Milestones.tsx —
 * if those tiers change there, change here too.
 */
const FIRST_MONTH_MILESTONES = [1, 7, 30] as const;

export interface FirstMonthState {
  daysOfLogging: number;
  /** Current consecutive AF days right now (today inclusive). */
  currentAfStreak: number;
  /** Next milestone the user is approaching, or null if past 30. */
  nextMilestone: number | null;
  /** Days until the next milestone. >= 0; 0 means today reaches it. */
  daysUntilNext: number | null;
}

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function computeCurrentAfStreak(drinks: Drink[], now: number): number {
  // Walk backwards from today. End on the first day with any drink
  // entry (std > 0 OR std = 0 — explicit AF still counts as AF).
  // Mirror calc.daysSinceLastDrink but ignoring std=0 entries (those
  // are AF marks, not drinks).
  const drinkDays = new Set<string>();
  for (const d of drinks) {
    const std = (d.volumeMl * (d.abvPct / 100) * 0.789) / 14;
    if (std > 0) drinkDays.add(dayKey(d.ts));
  }
  let streak = 0;
  const cursor = new Date(now);
  cursor.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const k = cursor.toISOString().slice(0, 10);
    if (drinkDays.has(k)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function computeFirstMonthState(
  drinks: Drink[],
  now: number = Date.now(),
): FirstMonthState | null {
  if (drinks.length === 0) return null;
  const earliestTs = Math.min(...drinks.map((d) => d.ts));
  const daysOfLogging = Math.floor((now - earliestTs) / DAY_MS);
  if (daysOfLogging < MIN_DAYS) return null;
  if (daysOfLogging >= FIRST_MONTH_THRESHOLD_DAYS) return null;

  const currentAfStreak = computeCurrentAfStreak(drinks, now);
  let nextMilestone: number | null = null;
  for (const m of FIRST_MONTH_MILESTONES) {
    if (m > currentAfStreak) {
      nextMilestone = m;
      break;
    }
  }
  const daysUntilNext = nextMilestone === null ? null : nextMilestone - currentAfStreak;

  return {
    daysOfLogging,
    currentAfStreak,
    nextMilestone,
    daysUntilNext,
  };
}

interface Props {
  drinks: Drink[];
  className?: string | undefined;
}

export default function FirstMonthRibbon({ drinks, className = '' }: Props) {
  const state = computeFirstMonthState(drinks);
  if (!state) return null;

  // Compose the line. Two halves:
  //   "N days of logging" (always)
  //   "— first milestone in K days." (when within reach)
  // If nextMilestone is null, the user is already past all the
  // first-month tiers; we don't show a confusing "you're done"
  // string — the long-term ribbon will take over the next day.
  const loggingFragment = `${state.daysOfLogging} day${state.daysOfLogging === 1 ? '' : 's'} of logging`;
  const milestoneFragment =
    state.nextMilestone === null || state.daysUntilNext === null
      ? null
      : state.daysUntilNext === 0
      ? `you reach a ${state.nextMilestone}-day milestone today`
      : `next milestone in ${state.daysUntilNext} day${state.daysUntilNext === 1 ? '' : 's'}`;

  return (
    <section
      aria-labelledby="first-month-ribbon-heading"
      data-testid="first-month-ribbon"
      className={`mx-auto w-full max-w-2xl px-4 ${className}`}
    >
      <div className="rounded-2xl border-l-4 border-neutral-300 dark:border-neutral-700 bg-surface-elevated px-4 py-3 text-sm text-ink-soft">
        <h2 id="first-month-ribbon-heading" className="sr-only">
          Your first month at a glance
        </h2>
        <span className="font-medium text-ink dark:text-neutral-200 tabular-nums">
          {loggingFragment}
        </span>
        {milestoneFragment ? <span> — {milestoneFragment}.</span> : <span>.</span>}
      </div>
    </section>
  );
}
