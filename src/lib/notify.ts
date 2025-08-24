import { getLocalNotifications } from "@/shared/capacitor";
/**
 * Notifications: Native (Capacitor LocalNotifications) + Web fallback.
 * - No top-level await (build-safe for ES2020).
 * - Lazy dynamic import for native module inside functions.
 * - Idempotent scheduling based on settings.reminders.times ["HH:mm"].
 */
import { useDB } from '../store/db';

type AnyLN = {
  requestPermissions: () => Promise<{ display?: 'granted'|'denied' }>;
  checkPermissions: () => Promise<{ display?: 'granted'|'denied' }>;
  schedule: (opts: unknown) => Promise<unknown>;
  cancel: (opts: unknown) => Promise<unknown>;
  createChannel?: (opts: unknown) => Promise<unknown>;
} | null;

let _lnCache: AnyLN | undefined;

/** Lazy-load LocalNotifications at call time; cache result. */
async function getLN(): Promise<AnyLN> {
  if (_lnCache !== undefined) return _lnCache;
  try {
    // Dynamic import only in native builds; on web this may still resolve but won't be used.
    // We 'as any' to avoid type resolution issues when module isn't present at dev time.
    const mod = await import('@capacitor/local-notifications');
    _lnCache = (mod as { LocalNotifications?: AnyLN }).LocalNotifications ?? null;
  } catch {
    _lnCache = null;
  }
  return _lnCache;
}

function hhmmToNextDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(n => parseInt(n, 10));
  const now = new Date();
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

export async function scheduleNative(times: string[]) {
  const LN = await getLN();
  if (!LN) return; // no-op on web
  try {
    if (LN.createChannel) {
      await LN.createChannel({
        id: 'alchohalt-reminders',
        name: 'Alchohalt Reminders',
        importance: 5
      });
    }
    const perm = await LN.requestPermissions();
    if ((perm.display ?? 'denied') !== 'granted') return;

    // Cancel previous (ids 100..)
    await LN.cancel({ notifications: times.map((_, i) => ({ id: 100 + i })) });

    const notifications = times.map((t, i) => {
      const at = hhmmToNextDate(t);
      return {
        id: 100 + i,
        title: 'Alchohalt',
        body: 'Reminder: log your day?',
        schedule: { at, repeats: true, every: 'day' },
        channelId: 'alchohalt-reminders'
      };
    });
    await LN.schedule({ notifications });
  } catch {
    // ignore native scheduling errors to avoid crashing the app
  }
}

export async function cancelNative(timesLen: number) {
  const LN = await getLN();
  if (!LN) return;
  try {
    await LN.cancel({
      notifications: Array.from({ length: timesLen }).map((_, i) => ({ id: 100 + i }))
    });
  } catch {
    /* ignore */
  }
}

/** Web fallback: ask permission if needed; actual "scheduling" is via in-app banner logic. */
export async function scheduleWeb() {
  if (typeof Notification === 'undefined') return;
  try {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  } catch {
    /* ignore */
  }
}

/** True if within ±30m of any reminder time and user hasn't logged today. */
export function isReminderWindowDue(now: number, times: string[], lastLogAt: number | undefined): boolean {
  if (!times.length) return false;
  const thirty = 30 * 60 * 1000;
  const today0 = new Date(now); today0.setHours(0, 0, 0, 0);
  if (lastLogAt && lastLogAt >= today0.getTime()) return false;
  return times.some(t => {
    const [h, m] = t.split(':').map(n => parseInt(n, 10));
    const tgt = new Date(now); tgt.setHours(h, m, 0, 0);
    return Math.abs(tgt.getTime() - now) <= thirty;
  });
}

/** Idempotent resync used after settings changes. Safe to call without await. */
export async function resyncNotifications() {
  const s = useDB.getState();
  const { enabled, times } = s.db.settings.reminders;
  if (!enabled) {
    await cancelNative(8);
    return;
  }
  await scheduleNative(times);
  await scheduleWeb();
}
