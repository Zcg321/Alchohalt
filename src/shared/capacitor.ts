/**
 * Runtime-only accessors to keep Capacitor plugins out of initial bundle.
 *
 * [BUG-6] On web, the @capacitor/preferences plugin throws
 * "Preferences.X() is not implemented on web", which broke onboarding
 * persistence (Skip would write to a broken store and re-fire the
 * modal on every reload). The getPreferences() helper now returns a
 * localStorage-backed shim with the same API surface on web, and
 * delegates to the real Capacitor plugin on native.
 *
 * The shim mirrors the subset of Preferences our app uses:
 *   get, set, remove, clear, keys, migrate (no-op), removeOld (no-op).
 */

import { Capacitor } from "@capacitor/core";

interface PreferencesLike {
  get: (opts: { key: string }) => Promise<{ value: string | null }>;
  set: (opts: { key: string; value: string }) => Promise<void>;
  remove: (opts: { key: string }) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<{ keys: string[] }>;
  migrate?: () => Promise<{ migrated: string[]; existing: string[] }>;
  removeOld?: () => Promise<void>;
}

const PREFIX = 'alchohalt:';

const webPreferences: PreferencesLike = {
  async get({ key }) {
    if (typeof window === 'undefined') return { value: null };
    return { value: window.localStorage.getItem(PREFIX + key) };
  },
  async set({ key, value }) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PREFIX + key, value);
  },
  async remove({ key }) {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(PREFIX + key);
  },
  async clear() {
    if (typeof window === 'undefined') return;
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k));
  },
  async keys() {
    if (typeof window === 'undefined') return { keys: [] };
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k.slice(PREFIX.length));
    }
    return { keys };
  },
  async migrate() {
    return { migrated: [], existing: [] };
  },
  async removeOld() {
    /* no-op */
  },
};

export async function getLocalNotifications(){
  return (await import("@capacitor/local-notifications")).LocalNotifications;
}

let cachedPreferences: PreferencesLike | null = null;

export async function getPreferences(): Promise<PreferencesLike> {
  if (cachedPreferences) return cachedPreferences;
  if (Capacitor.isNativePlatform()) {
    const mod = await import("@capacitor/preferences");
    cachedPreferences = mod.Preferences as unknown as PreferencesLike;
  } else {
    cachedPreferences = webPreferences;
  }
  return cachedPreferences;
}

/** Test-only escape hatch. */
export function __resetPreferencesCacheForTests() {
  cachedPreferences = null;
}
