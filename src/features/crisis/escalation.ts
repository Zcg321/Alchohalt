/**
 * [R10-4] Crisis escalation logic.
 *
 * Threshold: 3+ HardTimePanel opens in a rolling 24-hour window.
 * Once crossed, the panel surfaces a soft prompt: "Want to talk to
 * someone right now?" with counselor-service links.
 *
 * Design choice: the prompt is the SOFTER option after repeat opens,
 * not the HARDER one. Repeat 988 is the hardest door. The middle
 * door (a chat-with-a-counselor service) opens between 988 and
 * "log this and move on".
 *
 * Provider list is OWNER-CONFIGURABLE — the constant below ships
 * with placeholder direct-search URLs (BetterHelp, Talkspace,
 * Modern Health). Owner picks the canonical provider list before
 * launch and replaces the URLs. We do NOT ship affiliate codes,
 * partnerships, or pre-paid promotions of any kind without explicit
 * owner sign-off (see ethics judge in the round-10 report).
 */

export const ESCALATION_THRESHOLD = 3;
export const ESCALATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface CounselorProvider {
  id: 'betterhelp' | 'talkspace' | 'modernhealth' | 'samhsa-locator';
  label: string;
  /** What the user is signing up for. Plain language. */
  description: string;
  /** Direct URL. No affiliate parameters, no UTM, no tracking. */
  url: string;
  /** True if this is a free / no-paywall option (e.g. SAMHSA locator). */
  free: boolean;
}

/**
 * Default placeholder list. Owner replaces / curates before launch.
 * The SAMHSA locator is included as the always-free option that
 * doesn't require signup — it's the universal fallback.
 */
export const DEFAULT_PROVIDERS: CounselorProvider[] = [
  {
    id: 'samhsa-locator',
    label: 'SAMHSA Treatment Locator',
    description:
      'Free, government-run locator for substance-use treatment. No signup, no payment.',
    url: 'https://findtreatment.gov/',
    free: true,
  },
  {
    id: 'betterhelp',
    label: 'BetterHelp',
    description:
      'Online therapy. Subscription, scheduling, video/text/audio sessions. Owner: review pricing + ethics before linking.',
    url: 'https://www.betterhelp.com/',
    free: false,
  },
  {
    id: 'talkspace',
    label: 'Talkspace',
    description:
      'Online therapy. Insurance-friendly. Owner: review coverage + ethics before linking.',
    url: 'https://www.talkspace.com/',
    free: false,
  },
  {
    id: 'modernhealth',
    label: 'Modern Health',
    description:
      'Workplace-benefit therapy. Often covered by employer. Owner: review eligibility before linking.',
    url: 'https://www.joinmodernhealth.com/',
    free: false,
  },
];

/**
 * Returns true if the recent open log indicates the user has crossed
 * the threshold for escalation in the rolling 24h window.
 */
export function shouldEscalate(openLog: number[] | undefined, now: number = Date.now()): boolean {
  if (!openLog || openLog.length === 0) return false;
  const cutoff = now - ESCALATION_WINDOW_MS;
  const recent = openLog.filter((ts) => ts >= cutoff);
  return recent.length >= ESCALATION_THRESHOLD;
}

/**
 * Append a new open timestamp + prune entries older than 7 days
 * (long enough to keep some history for diagnostics, short enough
 * to bound storage).
 */
export function recordHardTimeOpen(
  openLog: number[] | undefined,
  now: number = Date.now()
): number[] {
  const cutoff = now - 7 * 24 * 60 * 60 * 1000;
  return [...(openLog ?? []).filter((ts) => ts >= cutoff), now];
}

export function recentOpenCount(
  openLog: number[] | undefined,
  now: number = Date.now()
): number {
  if (!openLog) return 0;
  const cutoff = now - ESCALATION_WINDOW_MS;
  return openLog.filter((ts) => ts >= cutoff).length;
}
