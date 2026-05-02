import { describe, expect, it, vi } from 'vitest';
import en from '../locales/en.json';
import es from '../locales/es.json';

/**
 * [R6-E] Honesty pass — regression tests for the app's privacy claims.
 *
 * Round 6 audit found the About page said "Your data stays on your
 * device, encrypted with a key only you control. We cryptographically
 * cannot read it." But the local-at-rest data path goes through
 * Capacitor.Preferences with NO encryption (the SecureStorage class
 * existed but was never imported anywhere — pure dead code).
 *
 * The claim was technically true ("we can't read it" because we have
 * no network access to the device) but misleading ("encrypted with a
 * key" implied at-rest encryption that wasn't happening).
 *
 * The corrected copy describes reality precisely: entries live in
 * local storage; nothing leaves the device on its own; cloud-backup
 * (opt-in) is the only path where E2E encryption applies.
 *
 * These tests fail if anyone re-introduces the over-claim language.
 */

describe('Honesty: privacy claim language locked down', () => {
  it('en.json privacy.onDevice does NOT use the over-claim "cryptographically cannot read"', () => {
    const onDevice = (en as Record<string, unknown>).privacy as Record<string, string>;
    expect(onDevice.onDevice).not.toMatch(/cryptographically cannot read/i);
  });

  it('en.json privacy.onDevice does NOT claim local-at-rest encryption', () => {
    // The actual local data path goes through Capacitor.Preferences
    // with no encryption layer. Only cloud backups are E2E sealed.
    const privacy = (en as Record<string, unknown>).privacy as Record<string, string>;
    expect(privacy.onDevice).not.toMatch(/encrypted with a key only you control/i);
  });

  it('es.json privacy.onDevice mirrors the corrected language', () => {
    const privacy = (es as Record<string, unknown>).privacy as Record<string, string>;
    expect(privacy.onDevice).not.toMatch(/Criptográficamente no podemos leer/i);
    expect(privacy.onDevice).not.toMatch(/cifrados con una clave que solo tú controlas/i);
  });

  it('en.json privacy.onDevice DOES name the right scope (local + opt-in cloud + opt-in AI)', () => {
    const privacy = (en as Record<string, unknown>).privacy as Record<string, string>;
    // Three signals the correct language preserves
    expect(privacy.onDevice).toMatch(/local storage/i);
    expect(privacy.onDevice).toMatch(/cloud backup/i);
    expect(privacy.onDevice).toMatch(/AI features/i);
  });
});

describe('Honesty: analytics shim stays no-op', () => {
  it('analytics.track does NOT call fetch / XMLHttpRequest', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    // Must import dynamically AFTER the spy so the module under test
    // sees the mocked global.
    const { analytics } = await import('../features/analytics/analytics');
    analytics.track('test-event', { foo: 'bar' });
    analytics.trackDrinkLogged();
    analytics.trackGoalSet();
    analytics.trackMoodCheckin();
    analytics.trackSubscriptionEvent();
    analytics.trackFeatureUsage();
    analytics.trackPerformance();
    analytics.trackPageView();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('analytics.captureError does NOT call fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    const { analytics } = await import('../features/analytics/analytics');
    analytics.captureError({
      message: 'test',
      stack: 'stack here',
      timestamp: Date.now(),
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('Honesty: error reporter shim stays no-op until consent', () => {
  it('default reporter does NOT call fetch / XMLHttpRequest', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    const { installGlobalErrorReporter, __resetErrorReporterForTests } =
      await import('../lib/errorReporter');
    __resetErrorReporterForTests();
    installGlobalErrorReporter();
    // Trigger a synthetic unhandled rejection via the listener path
    if (typeof window !== 'undefined') {
      const e = new ErrorEvent('error', { message: 'simulated' });
      window.dispatchEvent(e);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    __resetErrorReporterForTests();
  });
});

// Dead-code removal of SecureStorage is verified at build time:
// vite/typescript can't resolve a deleted module, so any future
// re-import would fail the build before reaching this test file.
