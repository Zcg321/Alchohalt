/**
 * [R8-C] Trust Receipt — provenance log for storage + network events.
 *
 * Evolution of PrivacyStatus. Where PrivacyStatus answers "what
 * features could send data, and are they on?", Trust Receipt answers
 * "show me, right now, every storage write and every outbound
 * request, with timestamp and source." It is opt-in: invisible by
 * default, exposed through Settings → Privacy → Show trust receipt.
 *
 * Voice: technical, factual. No marketing copy. The point is for the
 * inspecting user (developer, security-curious owner, journalist
 * verifying a privacy claim) to confirm the app's behavior matches
 * its stated promises. We never claim a perfect picture — the
 * browser DevTools network tab remains authoritative — but inside
 * our own surface we can capture every storage call and every fetch
 * we initiate.
 *
 * Capture layers:
 *
 *   1. Storage:  src/lib/storage.ts publishes set/get events here
 *      via recordStorageEvent(). Captures every Capacitor Preferences
 *      and localStorage write the app makes.
 *
 *   2. Network:  installFetchWrap() patches window.fetch once at
 *      startup. Records the URL, method, status, and timing of
 *      every request initiated from JS. Does not capture sub-
 *      resource loads (HTML <script>, <link>, <img>) — those are
 *      visible in DevTools but invisible to JS.
 *
 *   3. Cleartext-in-memory:  recordCleartextRead() lets specific
 *      surfaces (sync passphrase derivation, AI consent payload)
 *      announce that they're holding a sensitive value briefly.
 *      Voluntary annotation; not an automatic capture.
 *
 * The buffer is bounded at MAX_EVENTS to keep memory cost predictable
 * — old events drop off once the window is full. Subscribers are
 * notified on every push.
 *
 * IMPORTANT: this module never persists its log. The whole point is
 * an in-memory window into what the app is doing right now;
 * persisting it would itself be a privacy concern.
 */

export type TrustEventType = 'storage-set' | 'storage-get' | 'fetch' | 'cleartext';

export interface TrustEvent {
  /** Monotonic id; a wall-clock ts is fine for ordering inside one process. */
  id: number;
  ts: number;
  type: TrustEventType;
  /** Short label: which subsystem produced the event ("storage", "fetch", "sync.passphrase"). */
  source: string;
  /** One-line summary safe to display verbatim. */
  summary: string;
  /** Optional structured detail; rendered in expand-on-click cells. */
  detail?: Record<string, unknown>;
}

const MAX_EVENTS = 200;
const buffer: TrustEvent[] = [];
let nextId = 1;
type Listener = (events: readonly TrustEvent[]) => void;
const listeners = new Set<Listener>();

function push(event: Omit<TrustEvent, 'id' | 'ts'>): void {
  const full: TrustEvent = { ...event, id: nextId++, ts: Date.now() };
  buffer.push(full);
  if (buffer.length > MAX_EVENTS) buffer.splice(0, buffer.length - MAX_EVENTS);
  for (const l of listeners) l(buffer);
}

export function getTrustEvents(): readonly TrustEvent[] {
  return buffer;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearTrustEvents(): void {
  buffer.length = 0;
  for (const l of listeners) l(buffer);
}

export function recordStorageEvent(
  op: 'set' | 'get',
  key: string,
  detail?: Record<string, unknown>,
): void {
  push({
    type: op === 'set' ? 'storage-set' : 'storage-get',
    source: 'storage',
    summary: `${op.toUpperCase()} ${key}`,
    ...(detail ? { detail } : {}),
  });
}

export function recordCleartextRead(source: string, summary: string): void {
  push({ type: 'cleartext', source, summary });
}

interface FetchInstallOptions {
  /** The fetch implementation to wrap. Defaults to globalThis.fetch. */
  fetchImpl?: typeof fetch;
}

let fetchInstalled = false;

/**
 * Install a thin wrapper around window.fetch that publishes one event
 * per request. Idempotent — calling twice is a no-op.
 *
 * The wrap is in line with the original fetch's behavior (returns the
 * same Response, throws the same errors). On error we still publish
 * an event with the failure summary so the trust log is complete.
 */
export function installFetchWrap(options: FetchInstallOptions = {}): void {
  if (fetchInstalled) return;
  if (typeof globalThis === 'undefined') return;
  const original = options.fetchImpl ?? globalThis.fetch;
  if (typeof original !== 'function') return;
  fetchInstalled = true;
  globalThis.fetch = async function trustWrappedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.href
        : input.url;
    /* [R8-C-FIX Copilot] When callers pass a Request object without an
     * init.method, defaulting to GET would mis-log POST/PUT/etc. Read
     * the method from the Request when present; init.method overrides. */
    const requestMethod =
      typeof input !== 'string' && !(input instanceof URL) ? input.method : undefined;
    const method = (init?.method ?? requestMethod ?? 'GET').toUpperCase();
    const start = performance.now();
    try {
      const res = await original.call(globalThis, input, init);
      push({
        type: 'fetch',
        source: 'fetch',
        summary: `${method} ${url} → ${res.status}`,
        detail: { ms: Math.round(performance.now() - start), ok: res.ok },
      });
      return res;
    } catch (err) {
      push({
        type: 'fetch',
        source: 'fetch',
        summary: `${method} ${url} → error`,
        detail: { ms: Math.round(performance.now() - start), error: String(err) },
      });
      throw err;
    }
  };
}

/** Test-only: reset internal install flag + buffer. Not exported in prod paths. */
export function __resetForTests(): void {
  fetchInstalled = false;
  buffer.length = 0;
  nextId = 1;
  listeners.clear();
}
