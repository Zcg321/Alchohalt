/**
 * [R10-3] Caregiver/partner read-only share payload.
 *
 * Privacy posture: the URL fragment NEVER hits a server. The user
 * generates a link, sends it (text/email/whatever), the recipient
 * opens it, the page reads the fragment client-side, decodes the
 * payload, and renders a read-only summary.
 *
 * Strict opt-in:
 *   - The user picks fields explicitly. Default everything off.
 *   - No drink-by-drink history is ever shared (only aggregates).
 *   - 24-hour TTL baked into the payload. After expiry the viewer
 *     refuses to render and shows "this link has expired".
 *
 * Encoding: JSON → UTF-8 → base64url. No encryption — the user is
 * voluntarily sharing this; encryption would imply protection
 * against the recipient, which isn't the threat model. The TTL
 * exists to limit how long an accidentally-shared screenshot stays
 * useful, not to block a determined recipient.
 */

export interface ShareSelection {
  /** Days alcohol-free in current streak. */
  currentStreak: boolean;
  /** Total alcohol-free days ever. */
  totalAfDays: boolean;
  /** Current weekly drink goal (the number, not entries). */
  weeklyGoal: boolean;
  /** Recent 30-day window total. */
  last30dTotal: boolean;
  /** Active streak goal title + progress (no targets/dates not chosen). */
  activeGoalSummary: boolean;
  /** Optional free-text message from the user (max 280 chars). */
  message: string;
}

export interface SharePayload {
  v: 1;
  /** Issued-at, ms epoch. */
  iat: number;
  /** Expires-at, ms epoch. */
  exp: number;
  /** Selected fields and their values. Only fields the user chose are present. */
  data: {
    currentStreak?: number;
    totalAfDays?: number;
    weeklyGoal?: number;
    last30dTotal?: number;
    activeGoalSummary?: { title: string; current: number; target: number };
  };
  message?: string;
}

export const SHARE_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_MESSAGE_LEN = 280;

export function buildPayload(
  selection: ShareSelection,
  source: {
    currentStreak: number;
    totalAfDays: number;
    weeklyGoal: number;
    last30dTotal: number;
    activeGoal: { title: string; current: number; target: number } | null;
  },
  now: number = Date.now(),
): SharePayload {
  const data: SharePayload['data'] = {};
  if (selection.currentStreak) data.currentStreak = source.currentStreak;
  if (selection.totalAfDays) data.totalAfDays = source.totalAfDays;
  if (selection.weeklyGoal) data.weeklyGoal = source.weeklyGoal;
  if (selection.last30dTotal) data.last30dTotal = source.last30dTotal;
  if (selection.activeGoalSummary && source.activeGoal) {
    data.activeGoalSummary = source.activeGoal;
  }
  const trimmed = selection.message.trim().slice(0, MAX_MESSAGE_LEN);
  const result: SharePayload = {
    v: 1,
    iat: now,
    exp: now + SHARE_TTL_MS,
    data,
  };
  if (trimmed.length > 0) result.message = trimmed;
  return result;
}

function base64urlEncode(s: string): string {
  // Use btoa with UTF-8 fallback.
  const utf8 =
    typeof TextEncoder !== 'undefined'
      ? Array.from(new TextEncoder().encode(s))
          .map((b) => String.fromCharCode(b))
          .join('')
      : unescape(encodeURIComponent(s));
  return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(padded);
  if (typeof TextDecoder !== 'undefined') {
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  return decodeURIComponent(escape(bin));
}

export function encodePayload(payload: SharePayload): string {
  return base64urlEncode(JSON.stringify(payload));
}

export interface DecodeResult {
  ok: true;
  payload: SharePayload;
  expired: boolean;
}
export interface DecodeError {
  ok: false;
  reason: 'malformed' | 'unsupported-version';
}

export function decodePayload(encoded: string, now: number = Date.now()): DecodeResult | DecodeError {
  let parsed: unknown;
  try {
    const json = base64urlDecode(encoded);
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'malformed' };
  const p = parsed as Record<string, unknown>;
  if (p.v !== 1) return { ok: false, reason: 'unsupported-version' };
  if (typeof p.iat !== 'number' || typeof p.exp !== 'number') {
    return { ok: false, reason: 'malformed' };
  }
  if (!p.data || typeof p.data !== 'object') return { ok: false, reason: 'malformed' };

  return {
    ok: true,
    payload: parsed as SharePayload,
    expired: now >= (p.exp as number),
  };
}

export function buildShareUrl(encoded: string, base: string = ''): string {
  const origin = base || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}/share#p=${encoded}`;
}
