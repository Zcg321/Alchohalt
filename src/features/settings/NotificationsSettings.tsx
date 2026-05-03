import React from 'react';
import { useDB } from '../../store/db';
import {
  APP_QUIET_HOURS,
  DEFAULT_CALM_CONFIG,
  type NotificationType,
} from '../../lib/notifications/calmConfig';
import { hapticForEvent } from '../../shared/haptics';

/**
 * [R12-4] Granular per-type notification toggles + quiet-hours window
 * + daily-cap counter.
 *
 * Defaults are calm: dailyCheckin on, everything else off, max
 * 2/day, never 23:00-07:00. The user can narrow the quiet window
 * but cannot widen past the app's hard 23:00-07:00 floor — that's
 * a posture the app holds. See lib/notifications/calmConfig for
 * the rule semantics.
 *
 * Toggling a type off is *permanent* until the user toggles it back
 * on. There's no temporary mute / dismiss-to-snooze logic — the only
 * dismiss state we persist is "off forever, until you say otherwise."
 */

const TYPE_LABELS: Record<NotificationType, { title: string; description: string }> = {
  dailyCheckin: {
    title: 'Daily check-in',
    description: 'Reminders at the times you picked above.',
  },
  goalMilestone: {
    title: 'Goal milestones',
    description: 'When a streak crosses 7 / 30 / 90 days.',
  },
  retrospective: {
    title: 'Monthly retrospective',
    description: "After a month: 'How did this go?' Off by default.",
  },
  backupVerification: {
    title: 'Backup verification',
    description:
      'Periodic nudge to verify your last encrypted backup still unlocks.',
  },
  /* [R13-2] Weekly recap. Off by default. Body is generated locally
   * from your own drink log — never transmitted. Same calm rules
   * apply (quiet hours, daily cap). */
  weeklyRecap: {
    title: 'Weekly recap',
    description:
      'Once a week: AF days, logged drinks, over-cap days, and how this week compared to the prior one. Off by default.',
  },
};

export default function NotificationsSettings() {
  const { settings, setSettings } = useDB((s) => ({
    settings: s.db.settings,
    setSettings: s.setSettings,
  }));

  const stored = settings.calmNotifications ?? {};
  const types = { ...DEFAULT_CALM_CONFIG.types, ...(stored.types ?? {}) };
  const quietHours = stored.quietHours ?? DEFAULT_CALM_CONFIG.quietHours;
  const dailyCap = stored.dailyCap ?? DEFAULT_CALM_CONFIG.dailyCap;

  function setType(type: NotificationType, on: boolean) {
    hapticForEvent('settings-toggle');
    setSettings?.({
      calmNotifications: {
        ...stored,
        types: { ...types, [type]: on },
      },
    });
  }

  function setQuiet(field: 'startHour' | 'endHour', hour: number) {
    setSettings?.({
      calmNotifications: {
        ...stored,
        quietHours: { ...quietHours, [field]: hour },
      },
    });
  }

  function setCap(cap: number) {
    setSettings?.({
      calmNotifications: {
        ...stored,
        dailyCap: cap,
      },
    });
  }

  return (
    <section className="card" data-testid="notifications-settings">
      <div className="card-header">
        <h3 className="text-base font-semibold tracking-tight">
          Notification types
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Off by default except daily check-in. Each type is permanent
          until you toggle it back — no snooze, no nudges to re-enable.
        </p>
      </div>
      <div className="card-content space-y-4">
        <div className="space-y-2">
          {(Object.keys(TYPE_LABELS) as NotificationType[]).map((type) => {
            const meta = TYPE_LABELS[type];
            const checked = types[type] === true;
            return (
              <label
                key={type}
                className="flex items-start gap-3 cursor-pointer rounded-lg p-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setType(type, e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
                  data-testid={`notif-type-${type}`}
                  aria-label={meta.title}
                />
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">
                    {meta.title}
                  </span>
                  <span className="block text-xs text-neutral-600 dark:text-neutral-400">
                    {meta.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <fieldset className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 space-y-3">
          <legend className="px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Quiet hours
          </legend>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            No notifications during this window. App enforces a floor
            of {APP_QUIET_HOURS.startHour}:00–{APP_QUIET_HOURS.endHour}:00
            local — you can extend but not narrow past it.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="label">Quiet from</span>
              <select
                value={quietHours.startHour}
                onChange={(e) => setQuiet('startHour', Number(e.target.value))}
                className="input cursor-pointer"
                data-testid="quiet-start"
                aria-label="Quiet hours start"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="label">Resume at</span>
              <select
                value={quietHours.endHour}
                onChange={(e) => setQuiet('endHour', Number(e.target.value))}
                className="input cursor-pointer"
                data-testid="quiet-end"
                aria-label="Quiet hours end"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 space-y-2">
          <legend className="px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Daily cap
          </legend>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            At most this many notifications per calendar day. Default
            2 &mdash; even if you set six reminder times, you&rsquo;ll see two.
          </p>
          <label className="flex items-center gap-3">
            <span className="text-sm">Max per day</span>
            <input
              type="number"
              min={0}
              max={6}
              value={dailyCap}
              onChange={(e) =>
                setCap(Math.min(6, Math.max(0, Number(e.target.value) || 0)))
              }
              className="input w-20"
              data-testid="daily-cap"
              aria-label="Daily notification cap"
            />
          </label>
        </fieldset>
      </div>
    </section>
  );
}
