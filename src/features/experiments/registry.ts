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
 * The registry. R14-4 shipped this empty. R15-B activated the first
 * variant. R16-A widens that test to three arms so the data shows
 * whether "I'm trying" lands gentler than the more declarative
 * "I want".
 *
 * `onboarding-chip-copy-2026Q2`
 *   - control: third-person framing ("Trying to drink less", "Trying
 *     to stop", "Not sure yet"). The copy that's been in the build
 *     since the conversational-onboarding rewrite.
 *   - first-person: declarative framing ("I want to drink less",
 *     "I'm stopping for now", "I'm here to learn"). Hypothesis is
 *     that first-person framing reads as commitment rather than
 *     description.
 *   - first-person-trying: gentler middle ground ("I'm trying to
 *     drink less", "I'm pausing alcohol for now", "I'm just looking
 *     around"). [R16-A] Designer-judge in the 15-judge gate flagged
 *     `first-person` as more declarative than the control's hedged
 *     "trying"; this third arm preserves the first-person voice while
 *     restoring the trying / pausing / looking hedge.
 *
 * `goal-nudge-copy-2026Q2`
 *   - control: comparison-then-question ("You've been at X std/day
 *     this week. Your goal is Y/day. Want to revisit it?"). The R15-2
 *     nudge that shipped after recovery-counselor + designer judges
 *     both flagged shame-framing risk and approved ship-with-mitigation.
 *   - softer: goal-first reframe ("Your goal is Y/day. This week's
 *     been around X/day. Some weeks land different — adjust if it's
 *     helpful."). [R16-B] Removes the comparative opener; surfaces the
 *     goal as the anchor and treats the actual as observation. "Some
 *     weeks land different" defuses the should-have-done implication
 *     of a 7-day rolling read.
 *
 * Exposure data is local-only (per R14-4 contract). The owner reads
 * exposures via Settings → Diagnostics → A/B audit; no telemetry
 * leaves the device.
 */
export const REGISTRY: readonly Experiment[] = [
  {
    key: 'onboarding-chip-copy-2026Q2',
    variants: ['control', 'first-person', 'first-person-trying'] as const,
    status: 'active',
    description:
      'Onboarding intent chips: third-person ("Trying to drink less") vs declarative first-person ("I want to drink less") vs gentler first-person ("I\'m trying to drink less").',
  },
  {
    key: 'goal-nudge-copy-2026Q2',
    variants: ['control', 'softer'] as const,
    status: 'active',
    description:
      'Goal-nudge banner copy: comparison-then-question (control) vs goal-first observation (softer).',
  },
];

export function findExperiment(key: string): Experiment | undefined {
  return REGISTRY.find((e) => e.key === key);
}
