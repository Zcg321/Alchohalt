/**
 * App Lock Store
 * Manages PIN storage and app lock state
 * Uses Capacitor Preferences for secure storage
 */

import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';

interface AppLockState {
  isEnabled: boolean;
  isUnlocked: boolean;
  enable: (pin: string) => Promise<void>;
  disable: () => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  requiresUnlock: () => void;
}

const APP_LOCK_ENABLED_KEY = 'alchohalt.appLock.enabled';
const APP_LOCK_PIN_KEY = 'alchohalt.appLock.pin';

// Simple hash function for PIN (not cryptographically secure, but good enough for basic protection)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'alchohalt-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const useAppLockStore = create<AppLockState>((set) => ({
  isEnabled: false,
  isUnlocked: true,

  enable: async (pin: string) => {
    if (pin.length !== 4) {
      throw new Error('PIN must be 4 digits');
    }

    const hashedPin = await hashPin(pin);
    await Preferences.set({ key: APP_LOCK_PIN_KEY, value: hashedPin });
    await Preferences.set({ key: APP_LOCK_ENABLED_KEY, value: 'true' });
    
    set({ isEnabled: true, isUnlocked: true });
  },

  disable: async () => {
    await Preferences.remove({ key: APP_LOCK_PIN_KEY });
    await Preferences.remove({ key: APP_LOCK_ENABLED_KEY });
    
    set({ isEnabled: false, isUnlocked: true });
  },

  unlock: async (pin: string) => {
    const storedPin = await Preferences.get({ key: APP_LOCK_PIN_KEY });
    
    if (!storedPin.value) {
      return false;
    }

    const hashedPin = await hashPin(pin);
    const isCorrect = hashedPin === storedPin.value;
    
    if (isCorrect) {
      set({ isUnlocked: true });
    }
    
    return isCorrect;
  },

  lock: () => {
    set({ isUnlocked: false });
  },

  requiresUnlock: async () => {
    const enabled = await Preferences.get({ key: APP_LOCK_ENABLED_KEY });
    const isEnabled = enabled.value === 'true';
    
    if (isEnabled) {
      set({ isEnabled: true, isUnlocked: false });
    }
  }
}));

// Initialize app lock state on app load
export async function initializeAppLock() {
  const store = useAppLockStore.getState();
  await store.requiresUnlock();
}
