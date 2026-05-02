/**
 * TodayPanel — the calm above-the-fold home view.
 * ================================================
 *
 * Replaces the 26-section single-scroll dump that previously lived on
 * home. Per the Sprint 1 design lock and `[IA-1]`:
 *
 *   - Big calm Day-N number for alcohol-free days.
 *   - ONE context-aware primary action:
 *       * No check-in today  → "How are you today?"
 *       * Checked in, no log → "Log a drink or mark today AF"
 *       * Fully logged       → "Today: <summary>. See progress."
 *   - Subtle streak badge + next milestone hint (only when there's a
 *     streak — never on Day 0).
 *   - Below the fold: ONE quick stats strip (today / week / month)
 *     and a "What's next" prompts card if relevant.
 *
 * Day 0 framing for brand-new users: "Today is a fresh start." Never
 * shame, never zero-day-resets.
 */

import React from 'react';
import type { Drink, Goals } from '../../types/common';
import { stdDrinks, daysSinceLastDrink, getStreakStatus, computeTotalAFDays } from '../../lib/calc';

interface Props {
  drinks: Drink[];
  goals: Goals;
  /** Open the brief mood / check-in flow. */
  onCheckIn?: () => void;
  /** Focus the drink-log entry surface. */
  onLogDrink?: () => void;
  /** Mark today as alcohol-free (logs a 0-std entry). */
  onMarkAF?: () => void;
  /** Navigate to the Insights tab / progress view. */
  onSeeProgress?: () => void;
  /**
   * One-tap exit to crisis resources. Surfaces a tertiary "Having a
   * hard time?" link beneath the primary CTA so a user who already
   * knows they need help doesn't have to hunt the AppHeader pill.
   * The AppHeader chip stays — it's the calm-affordance entry; this
   * is the one for the moments that aren't calm.
   */
  onRoughNight?: () => void;
  /**
   * [HARD-TIME-ROUND-4] Quiet mode. When true, the Day-N hero stays
   * visible but everything else (CTAs, streak badge, stats strip,
   * what's-next card) hides. Set by the "stop tracking until
   * tomorrow" action in HardTimePanel; auto-clears at next-day
   * rollover via the `Date.now() < quietUntilTs` check upstream.
   * The "Having a hard time?" link still renders — a user who's
   * back in this state should not have to hunt the support entry.
   */
  quiet?: boolean;
}

const NEXT_MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365];

function nextMilestone(currentDays: number): number | null {
  for (const m of NEXT_MILESTONES) {
    if (m > currentDays) return m;
  }
  return null;
}

function buildDrinksByDay(drinks: Drink[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const d of drinks) {
    const key = new Date(d.ts).toISOString().slice(0, 10);
    const std = stdDrinks(d.volumeMl, d.abvPct);
    map[key] = (map[key] ?? 0) + std;
  }
  return map;
}

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeekMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 7);
  return d.getTime();
}

function startOfMonthMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 30);
  return d.getTime();
}

export default function TodayPanel({
  drinks,
  goals,
  onCheckIn,
  onLogDrink,
  onMarkAF,
  onSeeProgress,
  onRoughNight,
  quiet = false,
}: Props) {
  const drinksByDay = buildDrinksByDay(drinks);
  const totalAF = computeTotalAFDays(drinksByDay);
  // Brand-new user (no entries ever) starts at Day 0.
  const dayCount = drinks.length === 0 ? 0 : daysSinceLastDrink(drinksByDay);
  const status = getStreakStatus(dayCount, totalAF);

  const todayStart = startOfTodayMs();
  const todayDrinks = drinks.filter((d) => d.ts >= todayStart);
  const todayStd = todayDrinks.reduce((s, d) => s + stdDrinks(d.volumeMl, d.abvPct), 0);

  // "Checked in" is approximated as: any entry today with a mood
  // field set, OR an explicit AF-mark (std === 0). The codebase has
  // no separate check-in state today; this maps to the closest
  // observable signal.
  const checkedInToday = todayDrinks.some((d) => Boolean((d as Drink & { mood?: string }).mood) || stdDrinks(d.volumeMl, d.abvPct) === 0);
  const loggedDrinkToday = todayDrinks.some((d) => stdDrinks(d.volumeMl, d.abvPct) > 0);

  const cta = ((): { label: string; onClick: () => void; secondary?: { label: string; onClick: () => void } } => {
    if (loggedDrinkToday) {
      return {
        label: 'See progress',
        onClick: () => onSeeProgress?.(),
      };
    }
    if (checkedInToday) {
      return {
        label: 'Log a drink',
        onClick: () => onLogDrink?.(),
        secondary: { label: 'Mark today AF', onClick: () => onMarkAF?.() },
      };
    }
    return {
      label: 'How are you today?',
      onClick: () => onCheckIn?.(),
    };
  })();

  const milestone = nextMilestone(dayCount);

  // ------- Below-fold stats strip -------
  const weekStart = startOfWeekMs();
  const monthStart = startOfMonthMs();
  const weekStd = drinks
    .filter((d) => d.ts >= weekStart)
    .reduce((s, d) => s + stdDrinks(d.volumeMl, d.abvPct), 0);
  const monthStd = drinks
    .filter((d) => d.ts >= monthStart)
    .reduce((s, d) => s + stdDrinks(d.volumeMl, d.abvPct), 0);
  const pricePerStd = Number.isFinite(goals.pricePerStd) ? goals.pricePerStd : 0;
  const monthSpent = monthStd * pricePerStd;

  // ------- Copy -------
  // Day 0 framing: "fresh start," never "you have 0 days."
  const heroLabel =
    status.kind === 'starting'
      ? 'Today is a fresh start'
      : status.kind === 'restart'
      ? 'You’re back'
      : 'Days alcohol-free';
  const heroSubcopy =
    status.kind === 'starting'
      ? 'Calm tracking. No leaderboards. Real help if you need it.'
      : status.kind === 'restart'
      ? `${totalAF} alcohol-free days in your record so far`
      : milestone
      ? `${milestone - dayCount} day${milestone - dayCount === 1 ? '' : 's'} to ${milestone}`
      : null;

  /* [HARD-TIME-ROUND-4] In quiet mode, the hero subcopy reads as a
   * literal "we'll be here tomorrow" so the user knows the dashboard
   * isn't broken. Action-first, no consoling filler. */
  const quietSubcopy = quiet ? 'Resting until midnight. The dashboard comes back tomorrow.' : null;

  return (
    <section
      data-testid="today-panel"
      className="mx-auto w-full max-w-3xl px-4 py-section-y-mobile lg:py-section-y-desktop space-y-12"
    >
      {/* Above the fold */}
      <div className="text-center">
        <p className="text-micro uppercase tracking-wide text-ink-subtle">{heroLabel}</p>
        <p
          className="stat-num text-display sm:text-display text-ink mt-2 leading-none"
          aria-live="polite"
          aria-label={`Day ${dayCount}`}
        >
          {status.kind === 'starting' ? 'Day 0' : `Day ${dayCount}`}
        </p>
        {quietSubcopy ? (
          <p className="mt-3 text-caption text-ink-soft max-w-md mx-auto">{quietSubcopy}</p>
        ) : heroSubcopy ? (
          <p className="mt-3 text-caption text-ink-soft max-w-md mx-auto">{heroSubcopy}</p>
        ) : null}

        {/* Primary action — hidden in quiet mode */}
        {!quiet ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={cta.onClick}
              className="inline-flex items-center justify-center rounded-pill bg-sage-700 px-6 py-3 text-base font-medium text-white shadow-card hover:bg-sage-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 transition-colors min-h-[48px] min-w-[180px]"
            >
              {cta.label}
            </button>
            {cta.secondary ? (
              <button
                type="button"
                onClick={cta.secondary.onClick}
                className="text-caption text-ink-soft underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {cta.secondary.label}
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Subtle streak badge — only when on a streak >= 1 (and not quiet) */}
        {!quiet && status.kind === 'building' && totalAF > dayCount ? (
          <p className="mt-4 text-caption text-ink-subtle">
            <span className="stat-num">{totalAF}</span> alcohol-free days lifetime
          </p>
        ) : null}

        {/* Tertiary rough-night entry — quiet, one tap to the Hard-Time
            panel. Renders even in quiet mode: a user who's back in this
            state should not have to hunt the support entry. The link
            reads as a question, not an alarm. */}
        {onRoughNight ? (
          <p className="mt-6 text-caption">
            <button
              type="button"
              onClick={onRoughNight}
              data-testid="rough-night-link"
              className="text-ink-soft underline-offset-4 hover:underline hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 rounded"
            >
              Having a hard time?
            </button>
          </p>
        ) : null}
      </div>

      {!quiet ? (
        <>
          {/* Below-fold stats strip */}
          {drinks.length === 0 ? (
            <div
              className="rounded-lg border border-border-soft bg-surface-elevated px-5 py-6 text-center"
              data-testid="day-zero-empty-stats"
            >
              <p className="text-body text-ink">
                Log your first to see your week shape up.
              </p>
              <p className="mt-1 text-caption text-ink-soft">
                Today, 7 days, and 30 days will fill in as you log.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Today" value={todayStd.toFixed(1)} unit="std" />
              <Stat label="7 days" value={weekStd.toFixed(1)} unit="std" />
              <Stat
                label="30 days"
                value={pricePerStd > 0 ? `$${monthSpent.toFixed(0)}` : `${monthStd.toFixed(0)}`}
                unit={pricePerStd > 0 ? 'spent' : 'std'}
              />
            </div>
          )}

          {/* Optional "What's next" prompt card. Only shows if there's a
              concrete next-step worth surfacing. Quiet by default. */}
          {status.kind !== 'starting' && goals.dailyCap > 0 && todayStd > 0 ? (
            <WhatsNextCard todayStd={todayStd} dailyCap={goals.dailyCap} />
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg border border-border-soft bg-surface-elevated px-3 py-3">
      <p className="text-micro uppercase tracking-wide text-ink-subtle">{label}</p>
      <p className="mt-1 stat-num text-h2 text-ink leading-none">{value}</p>
      <p className="text-micro text-ink-subtle mt-1">{unit}</p>
    </div>
  );
}

function WhatsNextCard({ todayStd, dailyCap }: { todayStd: number; dailyCap: number }) {
  const remaining = Math.max(0, dailyCap - todayStd);
  const overCap = todayStd > dailyCap;
  return (
    <div
      className={`rounded-xl border p-card text-caption ${
        overCap
          ? 'border-amber-300 bg-amber-50 text-charcoal-900'
          : 'border-border-soft bg-surface-elevated text-ink-soft'
      }`}
      data-testid="whats-next"
    >
      {overCap ? (
        <p>
          You’re past your daily cap of {dailyCap}. No judgment — the rest of the
          day is still yours.
        </p>
      ) : (
        <p>
          <span className="stat-num font-medium text-ink">{remaining.toFixed(1)}</span> standard
          drinks left in your daily cap of {dailyCap}.
        </p>
      )}
    </div>
  );
}
