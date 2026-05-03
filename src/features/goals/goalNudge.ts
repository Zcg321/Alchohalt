/**
 * [R15-2] Goal-nudge analyzer.
 *
 * Returns a Nudge object when the user is exceeding their daily-cap
 * goal across the trailing 7 days, has opted in, and hasn't dismissed
 * within the last 7 days. Returns null otherwise.
 *
 * Voice contract: factual numbers + a question. The consuming banner
 * names the average vs the goal, asks if the user wants to revisit
 * the goal. No "you're failing", no urgency, no streaks-broken
 * framing.
 *
 * Pure function. No side effects, no React.
 */
import type { Entry } from '../../store/db';

const SEVEN_DAYS_MS = 7 * 86400000;

export interface GoalNudge {
  /** User's current dailyCap goal. */
  goalPerDay: number;
  /** Trailing-7-day average std-drinks per day, rounded to one decimal. */
  avgPerDay: number;
}

interface Inputs {
  entries: Entry[];
  /** dailyCap goal value. ≤0 means unset → no nudge. */
  dailyCap: number;
  /** db.settings.goalNudgesEnabled. */
  enabled: boolean;
  /** db.settings.goalNudgeDismissedAt. undefined === never dismissed. */
  dismissedAt: number | undefined;
  now: number;
}

export function computeGoalNudge(inputs: Inputs): GoalNudge | null {
  const { entries, dailyCap, enabled, dismissedAt, now } = inputs;
  if (!enabled) return null;
  if (!Number.isFinite(dailyCap) || dailyCap <= 0) return null;
  if (dismissedAt !== undefined && now - dismissedAt < SEVEN_DAYS_MS) {
    return null;
  }

  const cutoff = now - SEVEN_DAYS_MS;
  const recent = entries.filter((e) => e.ts >= cutoff && e.ts <= now);
  if (recent.length === 0) return null;

  const totalStd = recent.reduce((s, e) => s + (e.stdDrinks ?? 0), 0);
  const avgPerDay = totalStd / 7;

  if (avgPerDay <= dailyCap) return null;

  return {
    goalPerDay: dailyCap,
    avgPerDay: Number(avgPerDay.toFixed(1)),
  };
}
