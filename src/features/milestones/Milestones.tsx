/**
 * Milestones — quiet, dated entries.
 *
 * Sprint 2B `[IA-5]` replacement for the stripped Levels/Points
 * gamification framework. No XP, no leaderboard, no progress-bar-to-
 * next-level. Just the user's actual milestones (1 week, 30 days,
 * 90 days, 1 year) shown as gentle dated entries: a quiet check + the
 * date when reached, a faint "—" when not.
 *
 * Date a milestone was reached = the day a current run of consecutive
 * AF days first hit that count. Computed from the by-day index. If the
 * user has restarted, reached milestones are still listed (we credit
 * the lifetime achievement, not the current streak), but only IF the
 * window of consecutive AF days before the streak break was long
 * enough — i.e. a 30-day milestone shows the date the user first ever
 * passed 30 consecutive AF days, regardless of subsequent restarts.
 *
 * This component is intentionally minimal and read-only. No actions,
 * no upsells. It exists to remind the user of real wins.
 */

import React from 'react';
import type { Drink } from '../../types/common';

interface Milestone {
  id: string;
  label: string;
  days: number;
}

const MILESTONES: Milestone[] = [
  { id: 'first-day',  label: 'First alcohol-free day', days: 1 },
  { id: 'one-week',   label: '1 week alcohol-free',    days: 7 },
  { id: 'thirty-day', label: '30 days alcohol-free',   days: 30 },
  { id: 'ninety-day', label: '90 days alcohol-free',   days: 90 },
  { id: 'one-year',   label: '1 year alcohol-free',    days: 365 },
];

interface Props {
  drinks: Drink[];
  className?: string;
}

interface Reached {
  reached: boolean;
  reachedAt?: number;
}

function dateKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * For each milestone, find the earliest UTC midnight at which the user
 * had `days` consecutive AF days ending on that midnight. Returns
 * timestamp or undefined.
 */
function computeReachedAt(drinks: Drink[], targetDays: number): number | undefined {
  if (drinks.length === 0 && targetDays > 0) return undefined;

  const byDay = new Set<string>();
  for (const d of drinks) byDay.add(dateKey(d.ts));

  // Walk every day from the user's first known activity to today.
  // The first activity could be a drink OR the install (we only have
  // drinks here — first day with any data). If no drinks, no history.
  if (drinks.length === 0) return undefined;

  const firstTs = Math.min(...drinks.map((d) => d.ts));
  const start = new Date(firstTs);
  start.setUTCHours(0, 0, 0, 0);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let consec = 0;
  const cursor = new Date(start);
  while (cursor.getTime() <= today.getTime()) {
    const k = cursor.toISOString().slice(0, 10);
    if (byDay.has(k)) {
      consec = 0;
    } else {
      consec += 1;
      if (consec >= targetDays) {
        return cursor.getTime();
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return undefined;
}

export function getMilestoneStates(drinks: Drink[]): (Milestone & Reached)[] {
  return MILESTONES.map((m) => {
    const reachedAt = computeReachedAt(drinks, m.days);
    return { ...m, reached: reachedAt !== undefined, reachedAt };
  });
}

export default function Milestones({ drinks, className = '' }: Props) {
  const states = getMilestoneStates(drinks);
  const dateFmt = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <section className={`card ${className}`} aria-labelledby="milestones-heading">
      <header className="card-header">
        <h3 id="milestones-heading" className="text-h4 text-ink">
          Milestones
        </h3>
        <p className="mt-1 text-caption text-ink-soft">
          Quiet markers. Dates are when each milestone was first reached.
        </p>
      </header>
      <ul className="card-content space-y-2" role="list">
        {states.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-3 py-2 border-b border-border-soft last:border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* [POLISH] Subtle scale-up celebration on the
                  reached-state glyph. animate-scale-up is keyframed
                  in styles/theme.css and is opt-out under
                  prefers-reduced-motion via the @media block in
                  index.css. No confetti — quiet acknowledgement. */}
              <span
                aria-hidden
                className={`inline-flex h-6 w-6 items-center justify-center rounded-pill text-caption transition-colors ${
                  m.reached
                    ? 'bg-sage-100 text-sage-700 animate-scale-up'
                    : 'bg-cream-50 text-ink-subtle'
                }`}
              >
                {m.reached ? '✓' : '—'}
              </span>
              <span className="truncate text-body text-ink">{m.label}</span>
            </div>
            <span className="text-caption text-ink-soft tabular-nums">
              {m.reached && m.reachedAt
                ? dateFmt.format(new Date(m.reachedAt))
                : '—'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
