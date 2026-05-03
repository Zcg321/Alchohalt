// @no-smoke
import React from 'react';
import type { Drink } from '../../types/common';
import { useLanguage } from '../../i18n';
import { pluralNoun } from '../../i18n/plural';

/**
 * First-month-user activity ribbon — phase-aware orientation line.
 *
 * Round-12 R12-1. Round-14 R14-1 split the under-30-day window into
 * two phases:
 *
 *   week-one (days 1-7):
 *     "5 days of logging — next milestone in 2 days."
 *     The week-1 milestones (1, 7, 30) are visible, useful, and
 *     close enough that the countdown doesn't feel grindy.
 *
 *   building-pattern (days 8-29):
 *     "12 days of logging — building a pattern."
 *     Past the day-7 milestone, the next stop is day 30 — a 22-day
 *     gap that shouldn't be a grind. The phase line names the work
 *     instead of counting toward another goalpost. Voice:
 *     matter-of-fact, no second-person commands, no exclamation.
 *
 * Round-12+R14-1 reasoning: the 30+ day ribbon answers "did this
 * week go the way I meant it to?" — but a user in week 2 doesn't
 * have a meaningful weekly shape yet, and a user in week 3 doesn't
 * need a milestone countdown to feel productive. They need a calm
 * acknowledgement that pattern-building is the work.
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
const BUILDING_PATTERN_THRESHOLD_DAYS = 8;
const MIN_DAYS = 1;

/**
 * Milestone tiers in days. First three only — past 30 days the
 * long-term ribbon takes over, so the 90/365 milestones aren't this
 * ribbon's job. Aligned with features/milestones/Milestones.tsx —
 * if those tiers change there, change here too.
 */
const FIRST_MONTH_MILESTONES = [1, 7, 30] as const;

export type FirstMonthPhase = 'week-one' | 'building-pattern';

export interface FirstMonthState {
  daysOfLogging: number;
  /** Current consecutive AF days right now (today inclusive). */
  currentAfStreak: number;
  /** Next milestone the user is approaching, or null if past 30. */
  nextMilestone: number | null;
  /** Days until the next milestone. >= 0; 0 means today reaches it. */
  daysUntilNext: number | null;
  /**
   * R14-1: which sub-phase of the first-month window the user is in.
   * Drives whether the ribbon shows a milestone countdown (week-one)
   * or a "building a pattern" line (days 8-29).
   */
  phase: FirstMonthPhase;
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
  const phase: FirstMonthPhase =
    daysOfLogging >= BUILDING_PATTERN_THRESHOLD_DAYS ? 'building-pattern' : 'week-one';

  return {
    daysOfLogging,
    currentAfStreak,
    nextMilestone,
    daysUntilNext,
    phase,
  };
}

interface Props {
  drinks: Drink[];
  className?: string | undefined;
}

export default function FirstMonthRibbon({ drinks, className = '' }: Props) {
  const { t, lang } = useLanguage();
  const state = computeFirstMonthState(drinks);
  if (!state) return null;

  // Compose the line based on phase.
  //   week-one (days 1-7):   "N days of logging — next milestone in K days."
  //   building-pattern (8-29): "N days of logging — building a pattern."
  //
  // Building-pattern intentionally drops the milestone countdown:
  // the next stop after day 7 is day 30, a 22-day gap that reads as
  // grindy when surfaced as a countdown. Naming the phase honors the
  // work without inventing a goalpost.
  const dayWordLogging = pluralNoun(t, lang, 'unit.day', state.daysOfLogging, 'day', 'days');
  const loggingFragment = `${state.daysOfLogging} ${dayWordLogging} of logging`;
  let secondHalf: string;
  if (state.phase === 'building-pattern') {
    secondHalf = ' — building a pattern.';
  } else if (state.nextMilestone !== null && state.daysUntilNext !== null) {
    const dayWordNext = pluralNoun(t, lang, 'unit.day', state.daysUntilNext, 'day', 'days');
    const milestoneFragment =
      state.daysUntilNext === 0
        ? `you reach a ${state.nextMilestone}-day milestone today`
        : `next milestone in ${state.daysUntilNext} ${dayWordNext}`;
    secondHalf = ` — ${milestoneFragment}.`;
  } else {
    // No milestone in reach AND not yet in building-pattern phase.
    // Defensive — current logic always picks one of the two above for
    // daysOfLogging in 1..29, but keep a graceful fallback.
    secondHalf = '.';
  }

  return (
    <section
      aria-labelledby="first-month-ribbon-heading"
      data-testid="first-month-ribbon"
      data-phase={state.phase}
      className={`mx-auto w-full max-w-2xl px-4 ${className}`}
    >
      <div className="rounded-2xl border-s-4 border-neutral-300 dark:border-neutral-700 bg-surface-elevated px-4 py-3 text-sm text-ink-soft">
        <h2 id="first-month-ribbon-heading" className="sr-only">
          Your first month at a glance
        </h2>
        <span className="font-medium text-ink dark:text-neutral-200 tabular-nums">
          {loggingFragment}
        </span>
        <span>{secondHalf}</span>
      </div>
    </section>
  );
}
