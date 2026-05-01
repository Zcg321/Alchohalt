/**
 * Native chrome shims — StatusBar + Haptics with web no-op fallbacks.
 *
 * Both surfaces are gated behind feature flags
 * (ENABLE_NATIVE_STATUS_BAR / ENABLE_NATIVE_HAPTICS) which default off
 * pending hardware verification on iOS + Android. Web platform always
 * gets the no-op path; turning the flag on in a web build is safe.
 *
 * Pattern mirrors src/shared/capacitor.ts (preferences shim) and
 * lib/notify.ts (lazy LocalNotifications): the native Capacitor
 * plugin is dynamic-imported only on native + only when the flag is
 * on, so the web bundle never pulls in the native code paths.
 */

import { Capacitor } from '@capacitor/core';
import { FEATURE_FLAGS } from '../config/features';

type StatusBarStyle = 'light' | 'dark' | 'default';

export interface StatusBarShim {
  setStyle: (style: StatusBarStyle) => Promise<void>;
  setBackgroundColor: (color: string) => Promise<void>;
}

export interface HapticsShim {
  /** Light tactile bump — confirmation for non-destructive actions. */
  selectionFeedback: () => Promise<void>;
  /** Stronger bump — warnings, undo dismissals, milestone reaches. */
  notificationFeedback: () => Promise<void>;
  /** Two short bumps — errors, denied actions. */
  errorFeedback: () => Promise<void>;
}

const noopStatusBar: StatusBarShim = {
  async setStyle() { /* web no-op */ },
  async setBackgroundColor() { /* web no-op */ },
};

const noopHaptics: HapticsShim = {
  async selectionFeedback() { /* web no-op */ },
  async notificationFeedback() { /* web no-op */ },
  async errorFeedback() { /* web no-op */ },
};

let _statusBarCache: StatusBarShim | null = null;
let _hapticsCache: HapticsShim | null = null;

export async function getStatusBar(): Promise<StatusBarShim> {
  if (_statusBarCache) return _statusBarCache;
  if (!FEATURE_FLAGS.ENABLE_NATIVE_STATUS_BAR || !Capacitor.isNativePlatform()) {
    _statusBarCache = noopStatusBar;
    return _statusBarCache;
  }
  try {
    const mod = await import('@capacitor/status-bar');
    const native = mod.StatusBar;
    _statusBarCache = {
      async setStyle(style: StatusBarStyle) {
        const styleMap = {
          light: mod.Style.Light,
          dark: mod.Style.Dark,
          default: mod.Style.Default,
        } as const;
        await native.setStyle({ style: styleMap[style] });
      },
      async setBackgroundColor(color: string) {
        await native.setBackgroundColor({ color });
      },
    };
  } catch {
    /* Plugin missing or platform doesn't support it — fall back silently. */
    _statusBarCache = noopStatusBar;
  }
  return _statusBarCache;
}

export async function getHaptics(): Promise<HapticsShim> {
  if (_hapticsCache) return _hapticsCache;
  if (!FEATURE_FLAGS.ENABLE_NATIVE_HAPTICS || !Capacitor.isNativePlatform()) {
    _hapticsCache = noopHaptics;
    return _hapticsCache;
  }
  try {
    const mod = await import('@capacitor/haptics');
    const native = mod.Haptics;
    _hapticsCache = {
      async selectionFeedback() {
        await native.impact({ style: mod.ImpactStyle.Light });
      },
      async notificationFeedback() {
        await native.notification({ type: mod.NotificationType.Success });
      },
      async errorFeedback() {
        await native.notification({ type: mod.NotificationType.Error });
      },
    };
  } catch {
    _hapticsCache = noopHaptics;
  }
  return _hapticsCache;
}

/** Test-only escape hatches. */
export function __resetNativeChromeCacheForTests() {
  _statusBarCache = null;
  _hapticsCache = null;
}
