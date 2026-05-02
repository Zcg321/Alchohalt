import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installGlobalErrorReporter,
  setReporter,
  __resetErrorReporterForTests,
} from '../errorReporter';

describe('errorReporter — global handler shim', () => {
  beforeEach(() => {
    __resetErrorReporterForTests();
  });
  afterEach(() => {
    __resetErrorReporterForTests();
  });

  it('captures unhandledrejection (Error reason)', () => {
    const captured: Array<{ message?: string | undefined; source: string }> = [];
    setReporter((e) => captured.push({ message: e.message, source: e.source }));
    installGlobalErrorReporter();
    const err = new Error('boom from a promise');
    window.dispatchEvent(
      new (class extends Event {
        constructor(public readonly reason: Error) {
          super('unhandledrejection');
        }
      })(err) as unknown as Event,
    );
    expect(captured.length).toBe(1);
    expect(captured[0]!.source).toBe('unhandledrejection');
    expect(captured[0]!.message).toBe('boom from a promise');
  });

  it('captures unhandledrejection (string reason)', () => {
    const captured: Array<{ message?: string | undefined }> = [];
    setReporter((e) => captured.push({ message: e.message }));
    installGlobalErrorReporter();
    window.dispatchEvent(
      new (class extends Event {
        constructor(public readonly reason: string) {
          super('unhandledrejection');
        }
      })('string-reason') as unknown as Event,
    );
    expect(captured[0]!.message).toBe('string-reason');
  });

  it('captures window.onerror', () => {
    const captured: Array<{ message?: string | undefined; source: string }> = [];
    setReporter((e) => captured.push({ message: e.message, source: e.source }));
    installGlobalErrorReporter();
    const err = new Error('event-handler boom');
    window.dispatchEvent(
      new (class extends ErrorEvent {
        constructor() {
          super('error', { message: err.message, error: err });
        }
      })(),
    );
    expect(captured[0]!.source).toBe('window.onerror');
    expect(captured[0]!.message).toBe('event-handler boom');
  });

  it('install is idempotent', () => {
    const captured: string[] = [];
    setReporter((e) => captured.push(e.source));
    installGlobalErrorReporter();
    installGlobalErrorReporter(); // second install must not double-bind
    window.dispatchEvent(
      new (class extends Event {
        constructor(public readonly reason: string) {
          super('unhandledrejection');
        }
      })('once') as unknown as Event,
    );
    expect(captured.length).toBe(1);
  });

  it('default reporter is no-op (no throw, no network)', () => {
    // Default reporter exists and only logs to console; spy on console.warn.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    installGlobalErrorReporter();
    window.dispatchEvent(
      new (class extends Event {
        constructor(public readonly reason: string) {
          super('unhandledrejection');
        }
      })('default-test') as unknown as Event,
    );
    expect(warnSpy).toHaveBeenCalled();
    const arg = warnSpy.mock.calls[0]?.[0];
    expect(String(arg)).toMatch(/errorReporter/);
    warnSpy.mockRestore();
  });
});
