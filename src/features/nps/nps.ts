/**
 * [R24-3] On-device NPS pulse.
 *
 * Once every 30 days, after the user has at least 14 days of usage,
 * show a calm one-question prompt: "Would you tell a friend about
 * Alchohalt? 0 = not at all, 10 = definitely." Optional one-line
 * reason (capped at 240 chars). Stored locally in
 * settings.npsResponses[]. Visible to the owner via DiagnosticsAudit.
 * Never transmitted.
 *
 * Voice: factual question, two anchor points (0 / 10), no leading
 * language, no emoji, no marketing. Skip is a first-class action.
 *
 * The 14-day usage floor exists because asking a brand-new user how
 * likely they are to recommend the app is noise. The 30-day cadence
 * matches what real on-device pulses do (Sunnyside / a few wellness
 * apps): infrequent enough that it doesn't feel like nagging,
 * frequent enough to catch shifts.
 */

const NPS_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;
const NPS_FIRST_RUN_FLOOR_MS = 14 * 24 * 60 * 60 * 1000;
const NPS_REASON_MAX = 240;

export interface NpsResponse {
  ts: number;
  score: number;
  reason?: string;
}

interface ShouldShowInputs {
  /** Earliest entry timestamp the user has on device. undefined → no entries. */
  firstEntryTs: number | undefined;
  responses: NpsResponse[] | undefined;
  dismissedAt: number | undefined;
  now: number;
}

/**
 * Pure gate: returns true when the prompt may surface.
 *
 *   - Floor: at least 14 days of usage (oldest entry stamp).
 *   - Cadence: 30 days since the last response OR last dismissal.
 *
 * Single source of truth so the host (any banner placement) stays in
 * sync with the settings panel toggle and the DiagnosticsAudit row.
 */
export function shouldShowNpsPrompt(inputs: ShouldShowInputs): boolean {
  const { firstEntryTs, responses, dismissedAt, now } = inputs;
  if (firstEntryTs === undefined) return false;
  if (now - firstEntryTs < NPS_FIRST_RUN_FLOOR_MS) return false;

  const lastResponseTs = responses && responses.length > 0
    ? Math.max(...responses.map((r) => r.ts))
    : 0;
  const lastSeenTs = Math.max(lastResponseTs, dismissedAt ?? 0);

  if (lastSeenTs === 0) return true;
  return now - lastSeenTs >= NPS_INTERVAL_MS;
}

/**
 * Validate a score for storage. The UI uses a slider, but defense-
 * in-depth: clamp + reject NaN at the boundary.
 */
export function clampScore(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  if (raw < 0) return 0;
  if (raw > 10) return 10;
  return Math.round(raw);
}

/**
 * Trim and bound the optional reason. Empty after trim → undefined,
 * because we'd rather store nothing than an empty string.
 */
export function normalizeReason(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().slice(0, NPS_REASON_MAX);
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * NPS bucket per the canonical 0-6 / 7-8 / 9-10 split. We don't
 * surface this in the UI — the user just sees their score — but
 * the DiagnosticsAudit + owner read uses it.
 */
export type NpsBucket = 'detractor' | 'passive' | 'promoter';

export function bucketForScore(score: number): NpsBucket {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

export {
  NPS_INTERVAL_MS,
  NPS_FIRST_RUN_FLOOR_MS,
  NPS_REASON_MAX,
};
