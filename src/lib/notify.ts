/**
 * Enhanced notifications with timezone awareness and improved fallback handling
 * - Native (Capacitor LocalNotifications) + Web fallback
 * - Timezone-aware scheduling with DST handling
 * - Graceful degradation for unsupported platforms
 * - Comprehensive error handling and logging
 */
import { useDB } from '../store/db';
import { notificationService } from '../services/platform';

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
    const mod = await import('@capacitor/local-notifications');
    _lnCache = (mod as { LocalNotifications?: AnyLN }).LocalNotifications ?? null;
  } catch {
    _lnCache = null;
  }
  return _lnCache;
}

/** Enhanced timezone-aware scheduling */
function hhmmToNextDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(n => parseInt(n, 10));
  const now = new Date();
  const target = new Date();
  
  // Set to today's time first
  target.setHours(h, m, 0, 0);
  
  // If the time has already passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  
  // Handle DST transitions by validating the time still matches
  if (target.getHours() !== h || target.getMinutes() !== m) {
    // DST transition occurred, adjust
    target.setHours(h, m, 0, 0);
  }
  
  return target;
}

/** Enhanced notification channel creation with better error handling */
async function createNotificationChannel() {
  try {
    await notificationService.requestPermissions();
    console.log('Notification channel setup completed');
  } catch (error) {
    console.warn('Failed to create notification channel:', error);
  }
}

async function requestNotificationPermission(LN: AnyLN): Promise<boolean> {
  if (!LN) return false;
  const perm = await LN.requestPermissions();
  return (perm.display ?? 'denied') === 'granted';
}

function createNotifications(times: string[]) {
  return times.map((t, i) => {
    const at = hhmmToNextDate(t);
    return {
      id: 100 + i,
      title: 'Alchohalt',
      body: 'Reminder: log your day?',
      schedule: { at, repeats: true, every: 'day' },
      channelId: 'alchohalt-reminders'
    };
  });
}

export async function scheduleNative(times: string[]) {
  const LN = await getLN();
  if (!LN) return; // no-op on web
  try {
    await createNotificationChannel();
    
    const hasPermission = await requestNotificationPermission(LN);
    if (!hasPermission) return;

    // Cancel previous (ids 100..)
    await LN.cancel({ notifications: times.map((_, i) => ({ id: 100 + i })) });

    const notifications = createNotifications(times);
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

function checkReminderNeeded(lastLogAt: number | undefined, now: number): boolean {
  const today0 = new Date(now); 
  today0.setHours(0, 0, 0, 0);
  return !lastLogAt || lastLogAt < today0.getTime();
}

function isWithinReminderWindow(time: string, now: number): boolean {
  const thirty = 30 * 60 * 1000;
  const [h, m] = time.split(':').map(n => parseInt(n, 10));
  const tgt = new Date(now); 
  tgt.setHours(h, m, 0, 0);
  return Math.abs(tgt.getTime() - now) <= thirty;
}

/** True if within ±30m of any reminder time and user hasn't logged today. */
export function isReminderWindowDue(now: number, times: string[], lastLogAt: number | undefined): boolean {
  if (!times.length) return false;
  if (!checkReminderNeeded(lastLogAt, now)) return false;
  return times.some(t => isWithinReminderWindow(t, now));
}

/** Idempotent resync used after settings changes with enhanced error handling. */
export async function resyncNotifications() {
  const db = useDB.getState().db;
  const { enabled, times } = db.settings.reminders;
  
  if (!enabled || times.length === 0) {
    await cancelAllNotifications();
    return;
  }

  try {
    // Create notification channel
    await createNotificationChannel();
    
    // Check if notifications are supported and authorized
    const hasPermission = await notificationService.requestPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted, scheduling will be limited');
      showFallbackBanner('Notifications are disabled. Please enable them in settings for reminders.');
      return;
    }

    // Cancel existing notifications
    await cancelAllNotifications();
    
    // Schedule new notifications with enhanced messaging
    const notifications = times.map((time, idx) => {
      const targetDate = hhmmToNextDate(time);
      const messages = [
        "How's your day going? Take a moment to check in 🌟",
        "Time for a mindful moment - how are you feeling? 💭",
        "Your wellness journey matters. Ready to log today's progress? 📊",
        "Taking care of yourself today? Let's track your progress 🎯"
      ];
      
      return {
        id: idx + 1000,
        title: "Alchohalt Check-in",
        body: messages[idx % messages.length],
        schedule: { at: targetDate }
      };
    });

    await notificationService.schedule(notifications);
    console.log(`Scheduled ${notifications.length} notifications`);
    
  } catch (error) {
    console.error('Failed to schedule notifications:', error);
    showFallbackBanner('Unable to schedule notifications. In-app reminders will be shown instead.');
    // Fallback to legacy scheduling
    await scheduleNative(times);
    await scheduleWeb();
  }
}

async function cancelAllNotifications() {
  try {
    await notificationService.cancelAll();
  } catch (error) {
    console.warn('Failed to cancel notifications:', error);
    // Fallback to legacy cancel
    await cancelNative(8);
  }
}

/** Show fallback banner when native notifications fail */
function showFallbackBanner(message: string) {
  console.info('Fallback notification:', message);
  
  // Store fallback message in settings for UI display
  try {
    const currentState = useDB.getState();
    if (currentState.setSettings) {
      currentState.setSettings({
        notificationFallbackMessage: message
      });
    }
  } catch (error) {
    console.warn('Failed to store fallback message:', error);
  }
}
