/**
 * [R12-4] Calm-defaults config for local notifications.
 *
 * The default app posture is "quiet". A user who has reminders on
 * should be reminded *gently* — never woken up at 03:00, never piled
 * with 5 notifications in a row, never silently re-spammed after they
 * dismissed.
 *
 * Three knobs:
 *   1. Quiet hours    — never fire 23:00 - 07:00 user-local. The user
 *                       can narrow this further but cannot widen the
 *                       app's quiet window (we still hard-cap at the
 *                       night range).
 *   2. Daily cap      — at most 2 notifications per calendar day per
 *                       device, regardless of how many times the user
 *                       added or how many notification types are on.
 *   3. Per-type toggle — every notification type has a separate
 *                       boolean. Off → that type never schedules,
 *                       even if the user wired times for it. "Off"
 *                       persists until the user explicitly turns it
 *                       back on (i.e. dismiss-to-mute is permanent).
 *
 * Pure functions only — no I/O, no platform calls. Wired into
 * scheduleNative + scheduleWeb in lib/notify.ts at compose time.
 */

export type NotificationType =
  | 'dailyCheckin'
  | 'goalMilestone'
  | 'retrospective'
  | 'backupVerification'
  /* [R13-2] Weekly recap. Opt-in. Same calm rules apply (quiet
   * hours, daily cap). Body is generated locally from the user's
   * own drink log — never transmitted, never stored anywhere
   * outside the device. */
  | 'weeklyRecap';

export interface QuietHours {
  /** First hour (0-23) when notifications are suppressed. e.g. 23 = 11pm */
  startHour: number;
  /** First hour (0-23) when notifications resume. e.g. 7 = 7am */
  endHour: number;
}

export interface CalmConfig {
  quietHours: QuietHours;
  /** Hard upper bound per calendar day. Default 2. */
  dailyCap: number;
  /** Per-type opt-in. Anything missing reads as "off". */
  types: Partial<Record<NotificationType, boolean>>;
}

/** App-wide quiet hours that the user cannot widen past. */
export const APP_QUIET_HOURS: QuietHours = { startHour: 23, endHour: 7 };

export const DEFAULT_CALM_CONFIG: CalmConfig = {
  quietHours: APP_QUIET_HOURS,
  dailyCap: 2,
  types: {
    dailyCheckin: true,
    goalMilestone: false,
    retrospective: false,
    backupVerification: false,
    /* [R13-2] Weekly recap defaults to OFF. Opt-in only. */
    weeklyRecap: false,
  },
};

export interface ScheduledNotification {
  /** Stable id for cancellation. Different types use different id ranges. */
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  /** Unix ms timestamp the OS should fire at. */
  fireAt: number;
}

/**
 * True if `date` falls inside the quiet-hours window. Handles wrap
 * (start=23, end=7 means 23:00-23:59 + 00:00-06:59).
 */
export function inQuietHours(date: Date, quietHours: QuietHours): boolean {
  const hour = date.getHours();
  const { startHour, endHour } = quietHours;
  if (startHour === endHour) return false;
  if (startHour < endHour) {
    // Same-day window, e.g. 12-14
    return hour >= startHour && hour < endHour;
  }
  // Wrap window, e.g. 23-7
  return hour >= startHour || hour < endHour;
}

/**
 * Effective quiet-hours = intersection of user's window and the app's
 * hard-coded night window. We never let a user disable the app's
 * 23:00-07:00 quiet hours by setting their window to 0-0.
 */
export function effectiveQuietHours(userQuietHours?: QuietHours): QuietHours {
  if (!userQuietHours) return APP_QUIET_HOURS;
  // If user provides a wider window than the app default, use theirs.
  // Otherwise enforce the app default. Simplest correct rule: union
  // by treating an instant as quiet if EITHER window contains it.
  // For computation we expose two inQuietHours checks via the
  // wrapper below, since arbitrary unions don't fit one window.
  return userQuietHours;
}

/**
 * Convenience: is `date` quiet given the user's window OR the app's
 * hard quiet hours? If either says yes, it's quiet.
 */
export function isInAnyQuietWindow(
  date: Date,
  userQuietHours: QuietHours | undefined,
): boolean {
  if (inQuietHours(date, APP_QUIET_HOURS)) return true;
  if (userQuietHours && inQuietHours(date, userQuietHours)) return true;
  return false;
}

/**
 * Drop notifications scheduled inside any quiet window. Read-only —
 * does NOT shift them to a non-quiet time. Skipping is intentional:
 * a 03:00 reminder shifted to 07:00 means we picked the wake-up time
 * for the user, which is the kind of thing a calm app does not do.
 */
export function dropQuietNotifications<T extends ScheduledNotification>(
  notifications: T[],
  userQuietHours: QuietHours | undefined,
): T[] {
  return notifications.filter(
    (n) => !isInAnyQuietWindow(new Date(n.fireAt), userQuietHours),
  );
}

/**
 * Limit notifications to at most `cap` per calendar day (user-local).
 * Stable order: keeps the EARLIEST `cap` per day. A user who set 4
 * reminder times will see the first two; the rest don't fire.
 */
export function applyDailyCap<T extends ScheduledNotification>(
  notifications: T[],
  cap: number,
): T[] {
  if (cap < 0) return [];
  const sorted = [...notifications].sort((a, b) => a.fireAt - b.fireAt);
  const perDayCount = new Map<string, number>();
  const out: T[] = [];
  for (const n of sorted) {
    const dayKey = dayKeyForFireAt(n.fireAt);
    const count = perDayCount.get(dayKey) ?? 0;
    if (count >= cap) continue;
    perDayCount.set(dayKey, count + 1);
    out.push(n);
  }
  return out;
}

function dayKeyForFireAt(fireAt: number): string {
  const d = new Date(fireAt);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Drop notifications whose type is toggled off in the calm config. */
export function dropOffTypes<T extends ScheduledNotification>(
  notifications: T[],
  types: CalmConfig['types'],
): T[] {
  return notifications.filter((n) => types[n.type] === true);
}

/**
 * Apply all calm rules in order: type filter → quiet-hours filter →
 * daily cap. Returns the surviving notifications, ready for the OS
 * scheduler.
 */
export function applyCalmRules<T extends ScheduledNotification>(
  notifications: T[],
  config: CalmConfig,
): T[] {
  const byType = dropOffTypes(notifications, config.types);
  const byQuiet = dropQuietNotifications(byType, config.quietHours);
  return applyDailyCap(byQuiet, config.dailyCap);
}
