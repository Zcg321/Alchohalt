/**
 * [R28-B] A/B winner readout — pure module.
 *
 * Why this exists
 * ---------------
 * R27-2 wired a per-arm satisfaction cross-tab. R28-B turns that
 * into an actionable readout: one row per experiment showing the
 * declared winner (parsed from the registry description), the
 * device's current arm, and whether the experiment is "ready to
 * archive losers" (status === 'active' and a winner is declared).
 *
 * On a single device we cannot compute "winning by Npp" across
 * arms — the device only sees its own arm. So the readout shows
 * the COMBINATION of:
 *   1. Declared winner (an owner-stamped fact in registry text)
 *   2. Device-local positive% for the arm this device sees
 *   3. Runtime-archived state (settings.archivedExperimentKeys)
 *
 * The "Archive losers" UI then writes the experiment key into the
 * runtime archive list. useExperiment honors the runtime archive
 * by returning null (consumer falls back to production default).
 *
 * Pure module — no React, no IO. Testable on its own.
 */

import type { Experiment } from './registry';
import type { ExposureRecord } from './bucket';
import { buildExperimentSatisfactionCrosstab } from './experimentSatisfactionCrosstab';
import type { SatisfactionSignal } from '../satisfaction/satisfaction';

/**
 * Pattern matches the marker the team writes into a winning
 * experiment's description after the read-out round, e.g.:
 *
 *   "[R25-G winner: first-person-trying] Onboarding intent chips ..."
 *   "[winner: softer] Goal-nudge banner ..."
 *
 * Both forms are accepted. If multiple matches exist, the first
 * wins (the team's convention is to lead with the most recent).
 */
const WINNER_PATTERN = /\[(?:R[\w-]+\s+)?winner:\s*([a-z0-9-]+)\]/i;

export function parseWinnerFromDescription(description: string): string | null {
  const m = WINNER_PATTERN.exec(description);
  return m?.[1] ?? null;
}

export interface ExperimentWinnerSummary {
  /** Registry experiment key. */
  experimentKey: string;
  /** Registry status at read time (not the runtime override). */
  registryStatus: Experiment['status'];
  /** True iff key is in settings.archivedExperimentKeys. */
  runtimeArchived: boolean;
  /**
   * Effective status: 'archived' if registry says so or runtime
   * override is set; otherwise the registry status.
   */
  effectiveStatus: Experiment['status'];
  /** Winner arm parsed from description, or null. */
  declaredWinner: string | null;
  /** Arm this device is bucketed into (from exposures). */
  deviceArm: string | null;
  /** Number of post-exposure thumbs up for the device's arm. */
  deviceUp: number;
  /** Number of post-exposure thumbs down for the device's arm. */
  deviceDown: number;
  /**
   * Device-local positive% for the device's arm.
   * null when the device has no signals after first exposure.
   */
  devicePositivePct: number | null;
  /**
   * True iff a one-tap "Archive losers" button should render:
   * - registry says active (so bucketing is currently happening)
   * - declaredWinner is non-null (so the action has a meaning)
   * - not already runtime-archived (so the button does work)
   */
  canArchiveLosers: boolean;
  /**
   * Short human-readable summary line:
   *   "Winner: arm-X (declared). You're on arm-Y (4 up · 1 down · 80%)."
   *   "Winner: arm-X (declared). Already archived."
   *   "No declared winner yet — needs more data + an owner judgment call."
   */
  readoutLine: string;
}

function formatDeviceLine(
  deviceArm: string | null,
  up: number,
  down: number,
  pct: number | null,
): string {
  if (deviceArm === null) return 'no exposures recorded on this device';
  if (pct === null) {
    return `you're on arm '${deviceArm}' (no signals after exposure)`;
  }
  return `you're on arm '${deviceArm}' (${up} up · ${down} down · ${pct}%)`;
}

function buildReadoutLine(
  declaredWinner: string | null,
  effectiveStatus: Experiment['status'],
  deviceArm: string | null,
  up: number,
  down: number,
  pct: number | null,
  runtimeArchived: boolean,
): string {
  if (declaredWinner === null) {
    return 'No declared winner yet — needs more data + an owner judgment call.';
  }
  const deviceLine = formatDeviceLine(deviceArm, up, down, pct);
  if (effectiveStatus === 'archived') {
    const archivedNote = runtimeArchived
      ? 'archived via runtime override'
      : 'archived in registry';
    return `Winner: '${declaredWinner}' (declared, ${archivedNote}). ${deviceLine}.`;
  }
  return `Winner: '${declaredWinner}' (declared). ${deviceLine}. Ready to archive losers.`;
}

export function summarizeExperimentWinners(
  registry: readonly Experiment[],
  exposures: ExposureRecord[],
  signals: SatisfactionSignal[] | undefined,
  archivedKeys: readonly string[] | undefined,
): ExperimentWinnerSummary[] {
  const archived = new Set(archivedKeys ?? []);
  const crosstab = buildExperimentSatisfactionCrosstab(registry, exposures, signals);
  const crosstabByKey = new Map(crosstab.map((c) => [c.experimentKey, c]));

  const out: ExperimentWinnerSummary[] = [];
  for (const exp of registry) {
    if (exp.status === 'draft') continue;
    const runtimeArchived = archived.has(exp.key);
    const parsedWinner = parseWinnerFromDescription(exp.description);
    /* [R28-B fix per Codex review] A winner marker like
     * `[winner: soFtr]` parses successfully but doesn't refer to
     * any real arm. Treat such typo-winners as "no winner declared"
     * so the Archive Losers button never fires off an invalid
     * archive that would pin users to a default for no real reason.
     * The variant set is the source of truth. */
    const declaredWinner =
      parsedWinner !== null && exp.variants.includes(parsedWinner)
        ? parsedWinner
        : null;
    const cell = crosstabByKey.get(exp.key);
    const deviceArm = cell?.variant ?? null;
    const deviceUp = cell?.up ?? 0;
    const deviceDown = cell?.down ?? 0;
    const devicePositivePct = cell?.positivePct ?? null;
    const effectiveStatus: Experiment['status'] =
      exp.status === 'archived' || runtimeArchived ? 'archived' : exp.status;
    const canArchiveLosers =
      exp.status === 'active' && declaredWinner !== null && !runtimeArchived;

    out.push({
      experimentKey: exp.key,
      registryStatus: exp.status,
      runtimeArchived,
      effectiveStatus,
      declaredWinner,
      deviceArm,
      deviceUp,
      deviceDown,
      devicePositivePct,
      canArchiveLosers,
      readoutLine: buildReadoutLine(
        declaredWinner,
        effectiveStatus,
        deviceArm,
        deviceUp,
        deviceDown,
        devicePositivePct,
        runtimeArchived,
      ),
    });
  }
  return out;
}
