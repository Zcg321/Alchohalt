/**
 * [R25-B] Derived calorie estimate from drink history.
 *
 * Pure function. No side effects, no DOM, no settings access. Takes
 * raw drinks and returns the floor-estimate in ethanol-only kilocalories.
 *
 * Why ethanol-only:
 *   - Pure ethanol = 7.1 kcal/g (NIH BREMER, USDA reference). We round
 *     to 7 for owner-trust: the picker already says "estimate," and
 *     a single-decimal-of-precision claim invites pushback.
 *   - Mixers (tonic, juice, syrup) and residual carbs vary 0–250 kcal
 *     per drink. Including them requires drink-type tagging we don't
 *     ask for. Excluding them yields a defensible LOWER bound.
 *
 * The tile labels its number "ethanol calories" and notes mixers add
 * more, so we never over-claim.
 *
 * Why not 7.1:
 *   - Two extra digits of precision on a known approximation invites
 *     a researcher to ask "where's your sucrose component?" The
 *     answer is "we don't have one — that's why this is the floor."
 *
 * Equivalence helpers (walking, slices of bread) are intentionally
 * neutral. Per the voice guidelines: no donuts, no "guilt trips,"
 * no "your weekend cost you 8 cookies." Bread + walking are factual.
 */

import { gramsAlcohol } from '../../lib/calc';

interface DrinkLike {
  ts: number;
  volumeMl: number;
  abvPct: number;
}

/** kcal per gram of pure ethanol — NIH/USDA reference value. */
export const KCAL_PER_GRAM_ETHANOL = 7;

/**
 * Sum the ethanol-only kcal across a window of drinks. Bounds-safe;
 * NaN inputs filtered out by gramsAlcohol upstream (we just multiply).
 */
export function estimateEthanolKcal(drinks: DrinkLike[], sinceTs?: number): number {
  const cutoff = sinceTs ?? -Infinity;
  let totalGrams = 0;
  for (const d of drinks) {
    if (d.ts < cutoff) continue;
    const g = gramsAlcohol(d.volumeMl, d.abvPct);
    if (Number.isFinite(g)) totalGrams += g;
  }
  return Math.round(totalGrams * KCAL_PER_GRAM_ETHANOL);
}

/**
 * Trailing-7-day window. Uses Date.now() at call time; tests pass
 * an explicit `nowTs` to pin the window.
 */
export function trailing7DayKcal(drinks: DrinkLike[], nowTs?: number): number {
  const now = nowTs ?? Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return estimateEthanolKcal(drinks, now - sevenDays);
}

/**
 * Neutral equivalences. Body-image-safe: no foods that pattern-match
 * to "indulgent treat," no "burned this many calories" framing.
 *
 *   - Walking: ~4 kcal/min for a 70kg adult at moderate pace
 *     (Compendium of Physical Activities, Ainsworth 2011).
 *   - Bread: ~75 kcal per typical white-bread slice. Neutral staple.
 *
 * Returns whole numbers. Floors below 1 produce 0 — the caller can
 * skip rendering the equivalence row when both are 0.
 */
export interface CalorieEquivalence {
  /** Minutes of moderate-pace walking equivalent to the kcal load. */
  walkingMinutes: number;
  /** Slices of typical bread equivalent to the kcal load. */
  breadSlices: number;
}

const KCAL_PER_WALKING_MINUTE = 4;
const KCAL_PER_BREAD_SLICE = 75;

export function calorieEquivalence(kcal: number): CalorieEquivalence {
  return {
    walkingMinutes: Math.floor(kcal / KCAL_PER_WALKING_MINUTE),
    breadSlices: Math.floor(kcal / KCAL_PER_BREAD_SLICE),
  };
}
