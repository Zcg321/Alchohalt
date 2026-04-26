/**
 * Shared types for the AI Insights privacy + sanitization layer.
 *
 * Owner-locked invariant (2026-04-26):
 *   "Your raw data stays on your phone by default; opt-in AI features
 *    can send anonymized patterns to AI providers — see Settings → AI
 *    to control."
 *
 * The shape of `SanitizedAIPayload` IS the contract: only fields
 * defined in this type may ever leave the device. The sanitize layer
 * is allowlist-based — it constructs an instance of this type from
 * the local DB and explicitly cannot add ad-hoc fields.
 */

export type AIProviderId = 'anthropic';

/**
 * The COMPLETE set of fields that may leave the device after consent.
 *
 * If a contributor wants to add a field to the LLM prompt, they MUST
 * add it here AND update the sanitize tests AND update the consent
 * disclosure copy. Three barriers are intentional.
 */
export interface SanitizedAIPayload {
  /** Schema version for forward-compat. Bump when shape changes. */
  schemaVersion: 1;

  /**
   * Anonymous in-app instance ID. NOT a user identity. Generated
   * locally on first AI consent; rotates on `revoke + re-consent`
   * cycle. Used only by the proxy backend (when one exists) for
   * rate-limiting per device. NEVER linked to email/name/anything.
   */
  instanceId: string;

  /** ISO weekly buckets only — never exact timestamps. */
  weeklyBuckets: ReadonlyArray<{
    /** ISO week label, e.g. "2026-W17". */
    isoWeek: string;
    drinkCount: number;
    totalStdDrinks: number;
    /** Bucketed average craving (1-10), rounded to 1 decimal. */
    avgCraving: number;
  }>;

  /** Mood-tag counts over the requested window. One-hot, not text. */
  moodTagCounts: Readonly<Record<MoodTag, number>>;

  /** HALT-trigger counts over the window. */
  haltCounts: Readonly<{
    hungry: number;
    angry: number;
    lonely: number;
    tired: number;
  }>;

  /** Intention counts over the window. */
  intentionCounts: Readonly<Record<IntentionTag, number>>;

  /** Day-of-week pattern (Sun=0..Sat=6). Counts only. */
  dayOfWeekCounts: ReadonlyArray<number>;

  /** Current streak length, integer days. */
  currentStreakDays: number;

  /** Locale of the requesting client (en / es / etc.). For prompt language. */
  locale: 'en' | 'es';
}

export type MoodTag = 'happy' | 'sad' | 'anxious' | 'stressed' | 'calm' | 'excited' | 'neutral';
export type IntentionTag = 'celebrate' | 'social' | 'taste' | 'bored' | 'cope' | 'other';

/**
 * The list of fields that MUST NEVER appear in any sanitized payload,
 * regardless of caller. Enforced by adversarial tests.
 *
 * If you add a sensitive field to `Entry` or `Settings`, add it here
 * so the test suite can assert it never leaks.
 */
export const FORBIDDEN_FIELDS = [
  // Free-text from the user's own writing
  'notes',
  'journal',
  'voiceTranscript',
  'altAction',
  // Profile / PII-adjacent
  'profile',
  'weightKg',
  'sex',
  'name',
  'email',
  'phone',
  'phoneNumber',
  'address',
  'location',
  'gpsCoordinates',
  // Custom drink names — could include personal references like
  // "Dad's favorite IPA" — too leaky to ship.
  'customDrinkName',
  'presetName',
  'label',
  // Raw timestamps
  'ts',
  'timestamp',
  'editedAt',
  // Identifiers we never want re-tied to identity
  'id',
  'uuid',
  'deviceId',
  'userId',
  'email',
] as const;

export interface AIConsentState {
  /** Has the user ever granted AI Insights consent? */
  granted: boolean;
  /** When consent was given (ms epoch). null if never. */
  grantedAt: number | null;
  /** When consent was last revoked (ms epoch). null if never revoked. */
  revokedAt: number | null;
  /** Disclosure version the user agreed to. Bump when copy materially changes. */
  disclosureVersion: number;
  /**
   * Anonymous instance ID generated at consent time. Rotates on
   * revoke + re-consent. Empty string if no consent yet.
   */
  instanceId: string;
  /** Provider the user consented to. */
  provider: AIProviderId | null;
}

export const CURRENT_DISCLOSURE_VERSION = 1;
