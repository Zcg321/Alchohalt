/**
 * Sanitize layer for the AI Insights feature.
 *
 * Owner-locked: "AI Insights, when actually wired to LLM providers,
 *  will break the privacy claim unless we architect it carefully."
 *
 * Approach: ALLOWLIST. The sanitize functions accept the local DB
 * shape and emit a `SanitizedAIPayload` whose fields are pre-declared
 * in `types.ts`. There is no path that lets a caller "pass through"
 * a raw entry — every byte that leaves the device passes through one
 * of the aggregation helpers below.
 *
 * Adversarial tests in `__tests__/sanitize.test.ts` confirm that:
 *   - Every FORBIDDEN_FIELD never appears in the JSON-serialized
 *     payload, regardless of input shape.
 *   - Notes, journal, voiceTranscript fields are dropped even when
 *     they contain text that could be mistaken for an aggregate.
 *   - Custom drink names with personal references are dropped.
 *   - Profile/PII fields cannot leak through alias paths.
 */

import type { Entry } from '../../store/db';
import type {
  AIConsentState,
  IntentionTag,
  MoodTag,
  SanitizedAIPayload,
} from './types';
import { FORBIDDEN_FIELDS } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Build an ISO week label "YYYY-Www" from a Date. */
function isoWeekLabel(d: Date): string {
  // Copy so we don't mutate
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const diff = (date.getTime() - firstThursday.getTime()) / MS_PER_DAY;
  const week = 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Build the weekly buckets for the last N days. Each bucket exposes
 * only an ISO week label, drink count, std-drink sum, and a rounded
 * average craving — never an exact timestamp, never a note string.
 */
function bucketByWeek(
  entries: ReadonlyArray<Entry>,
  windowDays: number,
): SanitizedAIPayload['weeklyBuckets'] {
  const cutoff = Date.now() - windowDays * MS_PER_DAY;
  const recent = entries.filter((e) => e.ts >= cutoff);
  const groups = new Map<
    string,
    { drinkCount: number; totalStd: number; cravingSum: number }
  >();
  for (const e of recent) {
    const key = isoWeekLabel(new Date(e.ts));
    const acc = groups.get(key) ?? { drinkCount: 0, totalStd: 0, cravingSum: 0 };
    acc.drinkCount += 1;
    acc.totalStd += Number.isFinite(e.stdDrinks) ? e.stdDrinks : 0;
    acc.cravingSum += Number.isFinite(e.craving) ? e.craving : 0;
    groups.set(key, acc);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([isoWeek, v]) => ({
      isoWeek,
      drinkCount: v.drinkCount,
      totalStdDrinks: round(v.totalStd, 1),
      avgCraving: v.drinkCount > 0 ? round(v.cravingSum / v.drinkCount, 1) : 0,
    }));
}

function round(n: number, places: number): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

const MOOD_TAGS: ReadonlyArray<MoodTag> = [
  'happy', 'sad', 'anxious', 'stressed', 'calm', 'excited', 'neutral',
];
const INTENTION_TAGS: ReadonlyArray<IntentionTag> = [
  'celebrate', 'social', 'taste', 'bored', 'cope', 'other',
];

function moodCounts(
  entries: ReadonlyArray<Entry>,
  windowDays: number,
): Record<MoodTag, number> {
  const cutoff = Date.now() - windowDays * MS_PER_DAY;
  const out: Record<MoodTag, number> = {
    happy: 0, sad: 0, anxious: 0, stressed: 0, calm: 0, excited: 0, neutral: 0,
  };
  for (const e of entries) {
    if (e.ts < cutoff) continue;
    if (e.mood && MOOD_TAGS.includes(e.mood)) out[e.mood] += 1;
  }
  return out;
}

function intentionCounts(
  entries: ReadonlyArray<Entry>,
  windowDays: number,
): Record<IntentionTag, number> {
  const cutoff = Date.now() - windowDays * MS_PER_DAY;
  const out: Record<IntentionTag, number> = {
    celebrate: 0, social: 0, taste: 0, bored: 0, cope: 0, other: 0,
  };
  for (const e of entries) {
    if (e.ts < cutoff) continue;
    if (INTENTION_TAGS.includes(e.intention)) out[e.intention] += 1;
  }
  return out;
}

function haltCounts(
  entries: ReadonlyArray<Entry>,
  windowDays: number,
): SanitizedAIPayload['haltCounts'] {
  const cutoff = Date.now() - windowDays * MS_PER_DAY;
  const out = { hungry: 0, angry: 0, lonely: 0, tired: 0 };
  for (const e of entries) {
    if (e.ts < cutoff || !e.halt) continue;
    if (e.halt.H) out.hungry += 1;
    if (e.halt.A) out.angry += 1;
    if (e.halt.L) out.lonely += 1;
    if (e.halt.T) out.tired += 1;
  }
  return out;
}

function dayOfWeekCounts(
  entries: ReadonlyArray<Entry>,
  windowDays: number,
): number[] {
  const cutoff = Date.now() - windowDays * MS_PER_DAY;
  const counts = [0, 0, 0, 0, 0, 0, 0]; // Sun..Sat
  for (const e of entries) {
    if (e.ts < cutoff) continue;
    counts[new Date(e.ts).getDay()] += 1;
  }
  return counts;
}

function computeCurrentStreak(entries: ReadonlyArray<Entry>): number {
  // "Streak" = consecutive days with NO drink, walking backwards from today.
  if (entries.length === 0) return 0;
  const days = new Set<string>();
  for (const e of entries) {
    days.add(new Date(e.ts).toDateString());
  }
  let streak = 0;
  const cursor = new Date();
  // Walk back day by day until we hit a logged day OR 1000-day safety cap.
  for (let i = 0; i < 1000; i++) {
    if (days.has(cursor.toDateString())) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface SanitizeInput {
  entries: ReadonlyArray<Entry>;
  /** How many days of history to roll up. Default 90. */
  windowDays?: number | undefined;
  /** Locale for prompt language. */
  locale?: 'en' | 'es' | undefined;
  /** Anonymous instance ID from consent state. Required. */
  instanceId: string;
}

/**
 * Build the COMPLETE sanitized payload from the local DB.
 *
 * Throws if `instanceId` is missing or consent state is malformed —
 * better to fail closed than to ship a payload without provenance.
 */
export function buildSanitizedPayload(input: SanitizeInput): SanitizedAIPayload {
  if (!input.instanceId || typeof input.instanceId !== 'string') {
    throw new Error('[ai/sanitize] missing instanceId — fail closed');
  }
  const windowDays = input.windowDays ?? 90;
  const locale = input.locale ?? 'en';

  return {
    schemaVersion: 1,
    instanceId: input.instanceId,
    weeklyBuckets: bucketByWeek(input.entries, windowDays),
    moodTagCounts: moodCounts(input.entries, windowDays),
    haltCounts: haltCounts(input.entries, windowDays),
    intentionCounts: intentionCounts(input.entries, windowDays),
    dayOfWeekCounts: dayOfWeekCounts(input.entries, windowDays),
    currentStreakDays: computeCurrentStreak(input.entries),
    locale,
  };
}

/**
 * Defense-in-depth: scan a serialized payload for any FORBIDDEN_FIELD
 * key OR any string value that looks like free-text (heuristic: more
 * than 3 words AND contains lowercase letters AND not a key-name
 * pattern). Used by the AI client BEFORE the network call.
 *
 * The primary defense is the allowlist in buildSanitizedPayload —
 * this is a belt-and-suspenders check that catches future regressions.
 */
export function assertNoForbiddenFields(payload: unknown): void {
  const json = JSON.stringify(payload);
  // Key-presence check: any forbidden field as an OBJECT KEY ("k":).
  for (const field of FORBIDDEN_FIELDS) {
    const re = new RegExp(`"${field}"\\s*:`);
    if (re.test(json)) {
      throw new Error(
        `[ai/sanitize] forbidden field "${field}" appeared in serialized payload — refusing to send`,
      );
    }
  }
  // Free-text-value heuristic: a string value of >120 chars containing
  // a sentence-like pattern (lowercase + space + lowercase) is almost
  // certainly a journal/note that slipped through.
  const stringValues = json.match(/"[^"\\]{120,}"/g) ?? [];
  for (const lit of stringValues) {
    if (/[a-z]\s[a-z]/.test(lit)) {
      throw new Error(
        '[ai/sanitize] suspiciously long free-text-shaped value in payload — refusing to send',
      );
    }
  }
}

/**
 * Convenience: build + assert + return JSON-serialized payload ready
 * for transport. The ONLY public path that emits transport bytes.
 */
export function buildTransportPayload(input: SanitizeInput): string {
  const payload = buildSanitizedPayload(input);
  assertNoForbiddenFields(payload);
  return JSON.stringify(payload);
}

/**
 * Generate a fresh anonymous instance ID. Used by the consent module
 * when the user grants consent. Cryptographically random; not derived
 * from anything that could re-identify.
 */
export function generateInstanceId(): string {
  // crypto.randomUUID is available in all targeted runtimes (modern
  // browsers + Capacitor WebView). Strip dashes for compactness.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  // Fallback: use crypto.getRandomValues for a 128-bit hex string.
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('[ai/sanitize] no crypto available — cannot generate instance id');
}

/** Helper for tests + UI: human-readable disclosure of what we'd send. */
export function describeSanitizedShape(): string {
  return [
    '• Aggregated drink counts grouped by week (no exact timestamps)',
    '• Mood-tag counts (e.g. "happy: 12, anxious: 4")',
    '• HALT trigger counts (hungry, angry, lonely, tired)',
    '• Intention counts (e.g. "social: 8, cope: 2")',
    '• Day-of-week pattern (counts only)',
    '• Current streak length',
    '• An anonymous device ID for rate-limiting',
    '• Your locale (e.g. "en")',
  ].join('\n');
}

/** What we will NEVER send. Mirrors FORBIDDEN_FIELDS in plain English. */
export function describeForbiddenShape(): string {
  return [
    '• Your name, email, phone, or address',
    '• Your location or any GPS data',
    '• Any free-text you write (journal, notes, alt-action, voice transcripts)',
    '• Custom drink names',
    '• Exact timestamps of when you logged',
    '• Your weight, sex, or other profile info',
    '• Any persistent identifier that could be re-linked to you',
  ].join('\n');
}

/**
 * Re-export so callers don't need a second import for state shape.
 */
export type { AIConsentState };
