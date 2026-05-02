/**
 * Error reporter — privacy-respecting no-op shim.
 *
 * Why this exists: rounds 1–4 added per-tile + top-level
 * `<ErrorBoundary>` coverage for React render errors. But errors
 * thrown in event handlers, in `setTimeout` callbacks, in async
 * code paths whose promise rejection is never `.catch()`d — those
 * escape React entirely and land on `window.onerror` /
 * `window.addEventListener('unhandledrejection')`. With no
 * listener, the user sees nothing and we get no signal.
 *
 * This module installs the listeners. By default it logs to the
 * console only (privacy invariant — no PII, no event details, no
 * network call). When the native build is ready to ship a real
 * crash reporter (Sentry, Bugsnag, an Apple/Google native channel,
 * a self-hosted endpoint), set `setReporter(fn)` once at boot —
 * and only after the user has explicitly opted in. The shim never
 * sends anything on its own.
 *
 * Owner-locked privacy: the default-mode privacy claim is
 * "Nobody else, including us, can see what you log." A crash
 * reporter that calls home undermines that claim. Install only
 * with explicit consent.
 */

export interface ReporterEvent {
  /** Best-effort error string. May be undefined if the source was
   * `unhandledrejection` with a non-Error reason. */
  message?: string;
  /** Stack trace if available. */
  stack?: string;
  /** Where it came from. */
  source: 'window.onerror' | 'unhandledrejection';
  /** ISO timestamp. */
  ts: string;
}

type Reporter = (e: ReporterEvent) => void;

let reporter: Reporter = (e) => {
  // Default: console only. NEVER include user data — the message
  // and stack come from system code, but we still avoid emitting
  // beyond what the developer console already shows.
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('[errorReporter]', e.source, e.message ?? '(no message)');
  }
};

export function setReporter(fn: Reporter) {
  reporter = fn;
}

let installed = false;
let onError: ((event: ErrorEvent) => void) | null = null;
let onRejection: ((event: PromiseRejectionEvent) => void) | null = null;

export function installGlobalErrorReporter() {
  if (installed) return;
  if (typeof window === 'undefined') return;
  installed = true;

  onError = (event) => {
    const err = event.error as Error | undefined;
    reporter({
      message: err?.message ?? event.message,
      stack: err?.stack,
      source: 'window.onerror',
      ts: new Date().toISOString(),
    });
  };

  onRejection = (event) => {
    const reason = event.reason;
    let message: string | undefined;
    let stack: string | undefined;
    if (reason instanceof Error) {
      message = reason.message;
      stack = reason.stack;
    } else if (typeof reason === 'string') {
      message = reason;
    } else if (reason && typeof reason === 'object' && 'message' in reason) {
      message = String((reason as { message: unknown }).message);
    }
    reporter({
      message,
      stack,
      source: 'unhandledrejection',
      ts: new Date().toISOString(),
    });
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
}

/** Test-only reset — removes listeners so tests don't leak. */
export function __resetErrorReporterForTests() {
  if (typeof window !== 'undefined') {
    if (onError) window.removeEventListener('error', onError);
    if (onRejection) window.removeEventListener('unhandledrejection', onRejection);
  }
  onError = null;
  onRejection = null;
  installed = false;
  reporter = (e) => {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[errorReporter]', e.source, e.message ?? '(no message)');
    }
  };
}
