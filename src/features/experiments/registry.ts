/**
 * [R14-4] A/B experiment registry. Dormant by default.
 *
 * The R14-4 contract is "wire the infrastructure, enable nothing."
 * This file is the single place an owner edits to start an
 * experiment: change `status: 'draft'` to `status: 'active'` and the
 * `useExperiment` hook starts assigning variants to users.
 *
 * Why a static module-scope registry (vs. a remote-config server):
 *   - On-device telemetry only (per R14-4). No fetch, no network
 *     bucketing — the assignment must be deterministic from local
 *     inputs alone.
 *   - The app is privacy-first; we never want experiment metadata
 *     transiting servers.
 *   - For an app at this scale, "edit a code file and ship a build"
 *     is a reasonable cadence for changing experiment status. If we
 *     ever need faster iteration, this module is the swap point.
 *
 * To activate an experiment:
 *   1. Add an entry to REGISTRY with status 'active'.
 *   2. Branch on `useExperiment(key)` in the consumer component.
 *   3. After the test, change status to 'archived' to preserve the
 *      historical variant assignments without continuing to bucket
 *      new users.
 *
 * Variant determinism: a user's bucket-id (random nanoid stored in
 * localStorage) hashes deterministically with the experiment key into
 * a stable variant choice. A user always sees the same variant for a
 * given key as long as they keep the same browser storage.
 */

export type ExperimentStatus = 'draft' | 'active' | 'archived';

export interface Experiment {
  /** Unique key. Rename = new test (existing assignments don't carry). */
  key: string;
  /** Variant identifiers. Order matters: first variant is the implicit control. */
  variants: readonly string[];
  /**
   * Optional weight per variant. If omitted, weights are uniform.
   * Sum doesn't need to be 1.0 — internal code normalizes it.
   */
  weights?: readonly number[];
  /**
   * draft     — registry knows about it; useExperiment returns null.
   * active    — useExperiment buckets users; exposures recorded.
   * archived  — useExperiment returns null; existing exposures kept.
   */
  status: ExperimentStatus;
  /**
   * Free-text description for the audit panel + DEVTOOLS surface.
   * Helps owner remember the hypothesis when reviewing exposures.
   */
  description: string;
}

/**
 * The registry. R14-4 ships empty (no active or draft experiments).
 *
 * To add a draft experiment for later activation, add it here:
 *
 *   {
 *     key: 'onboarding-tone-2026Q3',
 *     variants: ['warm', 'crisp'] as const,
 *     status: 'draft',
 *     description: 'Tone test on the day-1 onboarding hero copy.',
 *   },
 */
export const REGISTRY: readonly Experiment[] = [];

export function findExperiment(key: string): Experiment | undefined {
  return REGISTRY.find((e) => e.key === key);
}
