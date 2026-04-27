/**
 * [BUG-6] Regression: getPreferences() must return a working store on
 * web (jsdom). Previously the @capacitor/preferences plugin was being
 * imported directly and threw "not implemented on web", which broke
 * onboarding-skip persistence.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __resetPreferencesCacheForTests, getPreferences } from '../capacitor';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});
afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('getPreferences() on web', () => {
  it('round-trips a value via set/get', async () => {
    const prefs = await getPreferences();
    await prefs.set({ key: 'onboarding_completed', value: 'true' });
    const { value } = await prefs.get({ key: 'onboarding_completed' });
    expect(value).toBe('true');
  });

  it('persists across getPreferences() calls (via localStorage)', async () => {
    const prefs1 = await getPreferences();
    await prefs1.set({ key: 'k', value: 'v' });
    __resetPreferencesCacheForTests();
    const prefs2 = await getPreferences();
    const { value } = await prefs2.get({ key: 'k' });
    expect(value).toBe('v');
  });

  it('returns null for missing keys (not throw)', async () => {
    const prefs = await getPreferences();
    const { value } = await prefs.get({ key: 'never-set' });
    expect(value).toBeNull();
  });

  it('remove deletes', async () => {
    const prefs = await getPreferences();
    await prefs.set({ key: 'x', value: 'y' });
    await prefs.remove({ key: 'x' });
    const { value } = await prefs.get({ key: 'x' });
    expect(value).toBeNull();
  });

  it('clear() only wipes alchohalt-prefixed keys', async () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('unrelated-app-key', 'should-survive');
    const prefs = await getPreferences();
    await prefs.set({ key: 'wipe-me', value: '1' });
    await prefs.clear();
    expect((await prefs.get({ key: 'wipe-me' })).value).toBeNull();
    expect(window.localStorage.getItem('unrelated-app-key')).toBe('should-survive');
  });
});
