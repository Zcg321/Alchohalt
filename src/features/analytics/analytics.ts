/**
 * Analytics shim — Alchohalt collects no telemetry.
 *
 * This was previously a development stub that silently appended events
 * (drink type / volume / mood / page views) and a generated user-id to
 * localStorage on every call, with no upload destination and no UI to
 * view, export, or clear the resulting record. That contradicts the
 * "data stays on device" promise and accumulated unbounded PII on
 * user devices forever — see [AUDIT-2026-05-01-C].
 *
 * The public API is preserved so existing call sites compile, but
 * every method is a no-op in production. In development we log to
 * `console.debug` so devs can still see event names while iterating.
 *
 * If real analytics ever ship, route them through
 * `lib/storage.ts → setJSON` (which uses the Capacitor Preferences
 * shim), gate on explicit user opt-in, expose a "view & clear" UI,
 * and put a TTL on the stored events.
 */

const isDev = process.env.NODE_ENV !== 'production';

function debug(label: string, ...args: unknown[]): void {
  if (isDev) console.debug(label, ...args);
}

interface ErrorReport {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

const noop = (..._args: unknown[]): void => {};

export const analytics = {
  track: (eventName: string, properties?: Record<string, unknown>) =>
    debug(`[analytics] ${eventName}`, properties),
  trackDrinkLogged: noop,
  trackGoalSet: noop,
  trackMoodCheckin: noop,
  trackSubscriptionEvent: noop,
  trackFeatureUsage: noop,
  trackPerformance: noop,
  trackPageView: noop,
  captureError: (error: ErrorReport) => {
    if (isDev) console.error('[analytics] captured error', error);
  },
};

export function useAnalytics() {
  return analytics;
}

/** Wraps a function and times it. The duration is logged in dev only. */
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  if (typeof fn !== 'function') {
    throw new Error(`measurePerformance: function required for "${name}"`);
  }
  if (!isDev) return fn();

  const start = performance.now();
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.finally(() =>
        debug(`[perf] ${name}: ${(performance.now() - start).toFixed(1)}ms`),
      );
    }
    debug(`[perf] ${name}: ${(performance.now() - start).toFixed(1)}ms`);
    return result;
  } catch (error) {
    debug(`[perf] ${name} threw after ${(performance.now() - start).toFixed(1)}ms`);
    throw error;
  }
}

export default analytics;
