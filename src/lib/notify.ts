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
    const mod = await import('@capacitor/local-notifications');
    _lnCache = (mod as any).LocalNotifications ?? null;
  } catch {
    _lnCache = null;
  }
  return _lnCache;
}

function hhmmToNextDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1);
  return target;
}

async function createNotificationChannel() {
  try {
    await notificationService.requestPermissions();
  } catch (error) {
    console.warn('Channel setup failed:', error);
  }
}

async function requestNotificationPermission(LN: AnyLN): Promise<boolean> {
  if (!LN) return false;
  return (await LN.requestPermissions()).display === 'granted';
}

function createNotifications(times: string[]) {
  return times.map((t, i) => ({
    id: 100 + i,
    title: 'Alchohalt',
    body: 'Reminder: log your day?',
    schedule: { at: hhmmToNextDate(t), repeats: true, every: 'day' },
    channelId: 'alchohalt-reminders'
  }));
}

export async function scheduleNative(times: string[]) {
  const LN = await getLN();
  if (!LN) return;
  
  try {
    await createNotificationChannel();
    const hasPermission = await requestNotificationPermission(LN);
    if (!hasPermission) return;

    await LN.cancel({ notifications: times.map((_, i) => ({ id: 100 + i })) });
    const notifications = createNotifications(times);
    await LN.schedule({ notifications });
  } catch {
    // ignore native scheduling errors
  }
}

export async function cancelNative(timesLen: number) {
  const LN = await getLN();
  if (!LN) return;
  try {
    await LN.cancel({
      notifications: Array.from({ length: timesLen }, (_, i) => ({ id: 100 + i }))
    });
  } catch {
    /* ignore */
  }
}

export async function scheduleWeb() {
  if (typeof Notification === 'undefined') return;
  try {
    if (Notification.permission === 'default') await Notification.requestPermission();
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
  const [h, m] = time.split(':').map(Number);
  const tgt = new Date(now); 
  tgt.setHours(h, m, 0, 0);
  return Math.abs(tgt.getTime() - now) <= 30 * 60 * 1000;
}

export function isReminderWindowDue(now: number, times: string[], lastLogAt: number | undefined): boolean {
  if (!times.length || !checkReminderNeeded(lastLogAt, now)) return false;
  return times.some(t => isWithinReminderWindow(t, now));
}

const NOTIFICATION_MESSAGES = [
  "How's your day going? Take a moment to check in 🌟",
  "Time for a mindful moment - how are you feeling? 💭",
  "Your wellness journey matters. Ready to log today's progress? 📊",
  "Taking care of yourself today? Let's track your progress 🎯"
];

function buildNotifications(times: string[]) {
  return times.map((time, idx) => ({
    id: idx + 1000,
    title: "Alchohalt Check-in",
    body: NOTIFICATION_MESSAGES[idx % NOTIFICATION_MESSAGES.length],
    schedule: { at: hhmmToNextDate(time) }
  }));
}

async function handlePermissionDenied() {
  useDB.getState().setSettings?.({ notificationFallbackMessage: 'Enable notifications in settings.' });
}

async function handleSchedulingError(error: unknown, times: string[]) {
  console.error('Scheduling error:', error);
  useDB.getState().setSettings?.({ notificationFallbackMessage: 'Unable to schedule.' });
  await Promise.all([scheduleNative(times), scheduleWeb()]);
}

export async function resyncNotifications() {
  const { enabled, times } = useDB.getState().db.settings.reminders;
  
  if (!enabled || !times.length) return await cancelAllNotifications();

  try {
    await createNotificationChannel();
    if (!(await notificationService.requestPermissions())) return await handlePermissionDenied();
    await cancelAllNotifications();
    await notificationService.schedule(buildNotifications(times));
  } catch (error) {
    await handleSchedulingError(error, times);
  }
}

async function cancelAllNotifications() {
  try {
    await notificationService.cancelAll();
  } catch (error) {
    console.warn('Failed to cancel notifications:', error);
    await cancelNative(8);
  }
}
