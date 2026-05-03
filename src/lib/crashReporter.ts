/**
 * [R19-4] Crash reporter — privacy-first, opt-in, no PII.
 *
 * Wires the global error/unhandledrejection capture (already installed
 * by `installGlobalErrorReporter`) to a Sentry-compatible endpoint
 * IF AND ONLY IF:
 *
 *   1. Build env defines a Sentry DSN
 *      (`VITE_SENTRY_DSN`); when undefined, the reporter is a no-op.
 *   2. The user has opted in via `settings.crashReportsEnabled`
 *      (default: undefined === off).
 *
 * What we send:
 *   - error message
 *   - stack trace (filename + line + col)
 *   - source ('window.onerror' | 'unhandledrejection')
 *   - user-agent string + platform (OS family)
 *   - app version (build-time constant)
 *   - timestamp
 *
 * What we EXPLICITLY DO NOT send:
 *   - any drink entry, goal, mood, note, tag, intention
 *   - user passphrase, sync session, or anything from
 *     `db.entries` / `db.settings.userCrisisLine`
 *   - breadcrumbs (Sentry default ON; we send `breadcrumbs: []`)
 *   - cookies, request bodies, console history, query params
 *   - IP address (Sentry server-side scrubs per
 *     `send_default_pii: false` in the project config — caller's
 *     responsibility to set this Sentry-side; we don't pass an IP
 *     header from the client)
 *
 * Architecture:
 *   - We DO NOT bundle the @sentry/browser SDK. The SDK is large
 *     (~50 KB gz) and brings in a default-on breadcrumb capture
 *     that's exactly the surface we don't want. Instead, this
 *     module hand-rolls the Sentry "envelope" wire format — a
 *     stable public API that's a few-hundred-byte POST.
 *   - `__resetCrashReporterForTests()` lets tests stub the fetch
 *     impl + reset opt-in state.
 *
 * Owner-locked privacy: any future addition to the wire payload
 * MUST be reviewed against the "what we explicitly do not send"
 * list above. If it's not on the allow list, it doesn't ship.
 */

import { setReporter, type ReporterEvent } from './errorReporter';

interface StackFrame {
  filename: string;
  lineno: number | undefined;
  colno: number | undefined;
}

interface SentryEnvelope {
  event_id: string;
  timestamp: number;
  platform: 'javascript';
  level: 'error';
  message: string;
  exception: {
    values: [
      {
        type: string;
        value: string;
        stacktrace: { frames: StackFrame[] } | undefined;
      },
    ];
  };
  release: string | undefined;
  contexts: {
    os: { name: string };
    runtime: { name: string };
  };
  /** Always empty — we deliberately strip Sentry's default breadcrumb capture. */
  breadcrumbs: [];
  /** Never set — Sentry will infer IP server-side; we ensure no
   *  user-identifying field reaches the wire. */
  user?: never;
  /** Never set — no analytics tags. */
  tags?: never;
}

interface ReporterConfig {
  /** Sentry DSN: `https://<key>@<host>/<project>`. */
  dsn: string | undefined;
  /** App version, e.g. "1.0.0". Sent as `release` for Sentry grouping. */
  release: string;
  /** True when the user has opted in via settings. */
  enabled: boolean;
  /** Test escape hatch — replace fetch impl. */
  fetchImpl?: typeof globalThis.fetch;
}

let activeConfig: ReporterConfig = {
  dsn: undefined,
  release: 'unknown',
  enabled: false,
};

/**
 * Set or update the reporter configuration. Idempotent — calling
 * with the same config is safe. Calling with `enabled: false`
 * effectively disables the reporter (the wired callback short-circuits).
 */
export function configureCrashReporter(cfg: Partial<ReporterConfig>): void {
  activeConfig = {
    ...activeConfig,
    ...cfg,
  };
  setReporter(deliverIfEnabled);
}

function deliverIfEnabled(event: ReporterEvent): void {
  // Always log to console — preserves the pre-R19 behavior of the
  // shim. The user opt-in only gates the network leg.
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('[crashReporter]', event.source, event.message ?? '(no message)');
  }
  if (!activeConfig.enabled) return;
  if (!activeConfig.dsn) return;
  void postSentryEnvelope(event, activeConfig).catch(() => {
    // Swallow network errors — we never want a crash-reporter
    // failure to itself become a logged error. Silent is correct.
  });
}

function buildEnvelope(event: ReporterEvent, cfg: ReporterConfig): SentryEnvelope {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  const os = inferOS(ua);
  return {
    event_id: makeEventId(),
    timestamp: Date.parse(event.ts) / 1000,
    platform: 'javascript',
    level: 'error',
    message: event.message ?? '(no message)',
    exception: {
      values: [
        {
          type: event.source,
          value: event.message ?? '(no message)',
          stacktrace: event.stack ? { frames: parseStack(event.stack) } : undefined,
        },
      ],
    },
    release: cfg.release,
    contexts: {
      os: { name: os },
      runtime: { name: 'browser' },
    },
    breadcrumbs: [],
  };
}

function inferOS(ua: string): string {
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Mac OS/.test(ua)) return 'macos';
  if (/Windows/.test(ua)) return 'windows';
  if (/Linux/.test(ua)) return 'linux';
  return 'unknown';
}

function makeEventId(): string {
  // 32-char hex, like Sentry expects. Crypto-random so two crashes
  // a millisecond apart don't collide.
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    return Array.from(buf)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return Date.now().toString(16).padStart(32, '0');
}

const STACK_FRAME_RE = /at\s+(?:[^(]+\()?(.+?):(\d+):(\d+)\)?/;

export function parseStack(stack: string): StackFrame[] {
  const out: StackFrame[] = [];
  for (const raw of stack.split('\n')) {
    const m = raw.match(STACK_FRAME_RE);
    if (!m) continue;
    const filename = m[1];
    const lineno = Number(m[2]);
    const colno = Number(m[3]);
    if (typeof filename !== 'string') continue;
    out.push({
      filename,
      lineno: Number.isFinite(lineno) ? lineno : undefined,
      colno: Number.isFinite(colno) ? colno : undefined,
    });
  }
  return out;
}

interface ParsedDsn {
  endpoint: string;
  publicKey: string;
}

export function parseDsn(dsn: string): ParsedDsn | null {
  // Sentry DSN format: https://<publicKey>@<host>/<projectId>
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    if (!publicKey) return null;
    const projectId = url.pathname.replace(/^\//, '');
    if (!projectId) return null;
    const endpoint = `${url.protocol}//${url.host}/api/${projectId}/store/`;
    return { endpoint, publicKey };
  } catch {
    return null;
  }
}

async function postSentryEnvelope(event: ReporterEvent, cfg: ReporterConfig): Promise<void> {
  if (!cfg.dsn) return;
  const parsed = parseDsn(cfg.dsn);
  if (!parsed) return;
  const envelope = buildEnvelope(event, cfg);
  const body = JSON.stringify(envelope);
  const auth = [
    `Sentry sentry_version=7`,
    `sentry_client=alchohalt-handrolled/1.0`,
    `sentry_key=${parsed.publicKey}`,
  ].join(', ');
  const fetchFn = cfg.fetchImpl ?? globalThis.fetch;
  if (typeof fetchFn !== 'function') return;
  await fetchFn(parsed.endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-sentry-auth': auth,
    },
    body,
  });
}

/** Test escape hatch — drop config back to defaults. */
export function __resetCrashReporterForTests(): void {
  activeConfig = {
    dsn: undefined,
    release: 'unknown',
    enabled: false,
  };
}

/** Test introspection — read the current config. */
export function __getCrashReporterConfigForTests(): ReporterConfig {
  return { ...activeConfig };
}
