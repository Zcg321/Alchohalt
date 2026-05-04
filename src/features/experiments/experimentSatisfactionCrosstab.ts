/**
 * [R27-2] Cross-tab device-local A/B exposures with per-surface
 * satisfaction signals. Pure module — no React, no IO.
 *
 * Why this matters
 * ----------------
 * R14-R16 wired the on-device A/B infrastructure. R21 surfaced
 * exposure counts (how many times the device saw a variant). R26-1
 * added per-surface satisfaction signals. R27-2 stitches them: for
 * each experiment the device has been exposed to, what is the
 * satisfaction signal for entries logged AFTER first exposure?
 *
 * On a single device this is N=1 per arm by definition (the device
 * sees one variant per experiment). The dashboard surface still has
 * value: it lets the owner of THIS device see, over time, how the
 * variant they're in is performing — and the same shape would
 * scale if a hypothetical multi-bucket aggregation surface were
 * later wired up. We deliberately do NOT transmit any of this.
 *
 * Aggregation rule
 * ----------------
 * The cross-tab counts only signals timestamped AFTER the first
 * exposure to the experiment. A signal logged a week before the
 * variant was even seen tells us nothing about the variant.
 */

import type { Experiment } from './registry';
import type { ExposureRecord } from './bucket';
import type {
  SatisfactionSignal,
  SatisfactionSurface,
} from '../satisfaction/satisfaction';

export interface ExperimentSatisfactionCell {
  experimentKey: string;
  variant: string;
  /** First-exposure timestamp for this experiment on this device. */
  firstExposureTs: number;
  /** How many exposure events (surface render or assignment recordings). */
  exposureCount: number;
  /** Satisfaction signals timestamped after firstExposureTs. */
  signalsAfterExposure: SatisfactionSignal[];
  up: number;
  down: number;
  /** Percent of post-exposure signals that were thumb-up; null if none. */
  positivePct: number | null;
}

/**
 * For each ACTIVE or ARCHIVED experiment in the registry, return one
 * row summarizing the device's exposure + post-exposure satisfaction.
 * Experiments with status:'draft' are skipped — they have no real
 * assignments yet.
 */
export function buildExperimentSatisfactionCrosstab(
  registry: readonly Experiment[],
  exposures: ExposureRecord[],
  signals: SatisfactionSignal[] | undefined,
  /** Optional surface allow-list. Omit to include every surface. */
  surfaces?: ReadonlyArray<SatisfactionSurface>,
): ExperimentSatisfactionCell[] {
  const sigs = signals ?? [];
  const out: ExperimentSatisfactionCell[] = [];

  for (const exp of registry) {
    if (exp.status === 'draft') continue;
    const matching = exposures.filter((e) => e.key === exp.key);
    if (matching.length === 0) continue;
    // First exposure is the earliest ts; same-variant assumption
    // because the device bucket is stable.
    const firstExposureTs = Math.min(...matching.map((m) => m.ts));
    const variant = matching[0]!.variant;
    const filtered = sigs.filter((s) => {
      if (s.ts < firstExposureTs) return false;
      if (surfaces && !surfaces.includes(s.surface)) return false;
      return true;
    });
    const up = filtered.filter((s) => s.response === 'up').length;
    const down = filtered.filter((s) => s.response === 'down').length;
    const total = up + down;
    out.push({
      experimentKey: exp.key,
      variant,
      firstExposureTs,
      exposureCount: matching.length,
      signalsAfterExposure: filtered,
      up,
      down,
      positivePct: total === 0 ? null : Math.round((up / total) * 100),
    });
  }
  return out;
}
