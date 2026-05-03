import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  configureCrashReporter,
  parseDsn,
  parseStack,
  __resetCrashReporterForTests,
} from '../crashReporter';
import {
  installGlobalErrorReporter,
  __resetErrorReporterForTests,
} from '../errorReporter';

/**
 * [R19-4] Crash reporter — privacy invariants.
 *
 * These tests pin the contract:
 *   - reporter is a no-op when DSN is unset (default)
 *   - reporter is a no-op when user has not opted in (default)
 *   - reporter only POSTs when BOTH DSN is set AND user opted in
 *   - the wire payload contains stack + os + release; nothing else
 *   - DSN parser handles malformed input gracefully (no throw)
 */

beforeEach(() => {
  __resetCrashReporterForTests();
  __resetErrorReporterForTests();
  /* The global error/unhandledrejection listeners get torn down by
   * the reset above. Tests that fire window.dispatchEvent need them
   * re-attached so the configured Reporter callback runs. */
  installGlobalErrorReporter();
});

describe('parseDsn', () => {
  it('parses a valid Sentry DSN', () => {
    const result = parseDsn('https://abc123@o12345.ingest.sentry.io/1234');
    expect(result).toEqual({
      endpoint: 'https://o12345.ingest.sentry.io/api/1234/store/',
      publicKey: 'abc123',
    });
  });

  it('returns null for malformed DSN', () => {
    expect(parseDsn('not a url')).toBeNull();
    expect(parseDsn('https://no-key.sentry.io/1234')).toBeNull();
    expect(parseDsn('https://key@host')).toBeNull();
  });
});

describe('parseStack', () => {
  it('extracts file/line/col from V8-style stack frames', () => {
    const stack = `Error: boom
    at foo (/app/src/foo.ts:10:5)
    at bar (/app/src/bar.ts:20:15)`;
    const frames = parseStack(stack);
    expect(frames).toHaveLength(2);
    expect(frames[0]).toEqual({
      filename: '/app/src/foo.ts',
      lineno: 10,
      colno: 5,
    });
    expect(frames[1]).toEqual({
      filename: '/app/src/bar.ts',
      lineno: 20,
      colno: 15,
    });
  });

  it('skips lines that do not match the frame pattern', () => {
    const stack = `Error: thrown
    bare line with no location
    at foo (/app/x.ts:1:2)`;
    const frames = parseStack(stack);
    expect(frames).toHaveLength(1);
    expect(frames[0]?.filename).toBe('/app/x.ts');
  });
});

describe('configureCrashReporter — no-op modes', () => {
  it('does NOT POST when DSN is unset', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()));
    configureCrashReporter({
      dsn: undefined,
      release: '1.0.0',
      enabled: true,
      fetchImpl: fetchSpy as unknown as typeof globalThis.fetch,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new ErrorEvent('error', {
          error: new Error('no-dsn'),
          message: 'no-dsn',
        }),
      );
    }
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does NOT POST when user has not opted in (enabled=false)', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()));
    configureCrashReporter({
      dsn: 'https://abc@host.io/1',
      release: '1.0.0',
      enabled: false,
      fetchImpl: fetchSpy as unknown as typeof globalThis.fetch,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new ErrorEvent('error', {
          error: new Error('opted-out'),
          message: 'opted-out',
        }),
      );
    }
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('configureCrashReporter — active mode', () => {
  it('POSTs envelope when DSN set AND user opted in', async () => {
    let posted: { url: string; init: RequestInit } | null = null;
    const fetchImpl = ((url: string, init: RequestInit) => {
      posted = { url, init };
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as unknown as typeof globalThis.fetch;
    configureCrashReporter({
      dsn: 'https://pubkey@o1.ingest.sentry.io/2',
      release: '2.0.0',
      enabled: true,
      fetchImpl,
    });
    window.dispatchEvent(
      new ErrorEvent('error', {
        error: new Error('boom'),
        message: 'boom',
      }),
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(posted).not.toBeNull();
    expect(posted!.url).toBe('https://o1.ingest.sentry.io/api/2/store/');
    expect(posted!.init.method).toBe('POST');
    const headers = posted!.init.headers as Record<string, string>;
    expect(headers['x-sentry-auth']).toContain('sentry_key=pubkey');
    const body = JSON.parse(posted!.init.body as string);
    expect(body.message).toBe('boom');
    expect(body.release).toBe('2.0.0');
    /* Privacy invariants — no breadcrumbs, no user, no tags */
    expect(body.breadcrumbs).toEqual([]);
    expect(body.user).toBeUndefined();
    expect(body.tags).toBeUndefined();
  });
});

describe('configureCrashReporter — privacy invariants on payload shape', () => {
  it('payload contains ONLY message + stack + os + runtime + release', async () => {
    let posted: { init: RequestInit } | null = null;
    const fetchImpl = ((_url: string, init: RequestInit) => {
      posted = { init };
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as unknown as typeof globalThis.fetch;
    configureCrashReporter({
      dsn: 'https://k@h.io/1',
      release: '1.0.0',
      enabled: true,
      fetchImpl,
    });
    window.dispatchEvent(
      new ErrorEvent('error', {
        error: new Error('shape-check'),
        message: 'shape-check',
      }),
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(posted).not.toBeNull();
    const body = JSON.parse(posted!.init.body as string);

    const allowedKeys = new Set([
      'event_id',
      'timestamp',
      'platform',
      'level',
      'message',
      'exception',
      'release',
      'contexts',
      'breadcrumbs',
    ]);
    for (const key of Object.keys(body)) {
      expect(allowedKeys.has(key)).toBe(true);
    }

    /* Contexts allowlist */
    expect(Object.keys(body.contexts).sort()).toEqual(['os', 'runtime']);
  });
});
