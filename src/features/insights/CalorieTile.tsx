/**
 * [R25-B] Derived calorie tile.
 *
 * Renders the trailing-7-day ethanol-only kcal estimate plus two
 * neutral equivalences (walking minutes, bread slices). Voice rule:
 * factual observation, no gamification, no "you burned this off
 * with a workout," no donuts/cookies framing.
 *
 * Gate: opt-in via Settings → "Show calorie tile in Insights." The
 * default is OFF per the round-24 competitive matrix recommendation
 * — recovery surfaces should not push body-image metrics on users
 * who didn't ask for them.
 *
 * Self-hides when:
 *   - settings.showCalorieTile !== true (opt-out by default)
 *   - 0 drinks in the trailing 7 days (no number to show)
 *
 * The tile is read-only. No CTA. No "set a kcal goal." We stay
 * out of the diet-tracker lane intentionally — we're a sobriety
 * tool that surfaces a data point, not a calorie counter.
 */

import React from 'react';
import type { Drink } from '../../types/common';
import { useDB } from '../../store/db';
import { trailing7DayKcal, calorieEquivalence } from './calorieEstimate';

interface Props {
  drinks: Drink[];
}

export default function CalorieTile({ drinks }: Props) {
  const enabled = useDB((s) => s.db.settings.showCalorieTile === true);
  if (!enabled) return null;

  const kcal = trailing7DayKcal(drinks);
  if (kcal === 0) return null;

  const eq = calorieEquivalence(kcal);

  return (
    <section
      className="rounded-2xl border border-border-soft bg-surface-elevated p-card"
      data-testid="calorie-tile"
      aria-labelledby="calorie-tile-heading"
    >
      <h3 id="calorie-tile-heading" className="text-h3 text-ink">
        Trailing 7 days
      </h3>
      <p className="mt-1 text-caption text-ink-soft">
        Estimated calories from ethanol only. Mixers and residual carbs
        add more — this is a defensible floor, not an averaged guess.
      </p>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="stat-num text-display text-ink leading-none" data-testid="calorie-tile-kcal">
          {kcal.toLocaleString()}
        </span>
        <span className="text-caption text-ink-soft">ethanol kcal</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wider text-ink-soft">
            Walking equivalent
          </dt>
          <dd className="mt-1 font-medium text-ink" data-testid="calorie-tile-walking">
            ~{eq.walkingMinutes.toLocaleString()} min
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-ink-soft">
            Bread equivalent
          </dt>
          <dd className="mt-1 font-medium text-ink" data-testid="calorie-tile-bread">
            ~{eq.breadSlices.toLocaleString()} {eq.breadSlices === 1 ? 'slice' : 'slices'}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-micro text-ink-subtle">
        7 kcal × grams of ethanol. Walking: 4 kcal/min at moderate pace.
        Bread: 75 kcal per slice.
      </p>
    </section>
  );
}
