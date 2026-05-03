// @no-smoke
import React from 'react';
import { useDB } from '../../store/db';
import { useLanguage } from '../../i18n';
import {
  APP_QUIET_HOURS,
  DEFAULT_CALM_CONFIG,
  type NotificationType,
} from '../../lib/notifications/calmConfig';
import { REGISTRY } from '../experiments/registry';
import { readExposures } from '../experiments/bucket';

/**
 * [R13-4] Diagnostics audit panel — "this is what your app is doing
 * right now."
 *
 * Round-11 added the on-device onboarding funnel diagnostic. Round 13
 * expands to cover three more dimensions the user / owner can audit
 * without telemetry:
 *
 *   1. Notifications  — which calm-config types are on, quiet-hours
 *                       window, daily cap
 *   2. Accessibility  — system prefers-reduced-motion + prefers-contrast,
 *                       current theme mode
 *   3. Locale         — active language, total translation keys loaded
 *   4. Backup health  — last verified backup time (R12-3 verifier)
 *
 * Read-only. No actions, no telemetry, no fetch — every value comes
 * from local state or a CSS media query already evaluated client-side.
 */

interface AuditRowProps {
  label: string;
  value: string;
  testid?: string;
}

function AuditRow({ label, value, testid }: AuditRowProps) {
  return (
    <div className="flex flex-col" data-testid={testid}>
      <dt className="text-xs uppercase tracking-wider text-ink-soft">{label}</dt>
      <dd className="font-medium text-sm">{value}</dd>
    </div>
  );
}

const TYPE_LABELS: Record<NotificationType, string> = {
  dailyCheckin: 'Daily check-in',
  goalMilestone: 'Goal milestones',
  retrospective: 'Monthly retrospective',
  backupVerification: 'Backup verification',
  weeklyRecap: 'Weekly recap',
};

function readMediaQuery(query: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

const FIELDSET_CLASS = 'space-y-2';
const LEGEND_CLASS =
  'text-xs font-semibold uppercase tracking-[0.12em] text-ink-subtle';
const GRID_CLASS = 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3';

function NotificationsFieldset() {
  const settings = useDB((s) => s.db.settings);
  const calm = settings.calmNotifications ?? {};
  const types = { ...DEFAULT_CALM_CONFIG.types, ...(calm.types ?? {}) };
  const quiet = calm.quietHours ?? DEFAULT_CALM_CONFIG.quietHours;
  const dailyCap = calm.dailyCap ?? DEFAULT_CALM_CONFIG.dailyCap;
  const enabledTypes = (Object.keys(TYPE_LABELS) as NotificationType[])
    .filter((k) => types[k] === true)
    .map((k) => TYPE_LABELS[k]);
  const formatHour = (h: number) => `${String(h).padStart(2, '0')}:00`;

  return (
    <fieldset className={FIELDSET_CLASS}>
      <legend className={LEGEND_CLASS}>Notifications</legend>
      <dl className={GRID_CLASS}>
        <AuditRow
          label="Enabled types"
          value={enabledTypes.length > 0 ? enabledTypes.join(', ') : 'none'}
          testid="audit-notif-types"
        />
        <AuditRow
          label="Quiet hours"
          value={`${formatHour(quiet.startHour)} → ${formatHour(quiet.endHour)}`}
          testid="audit-notif-quiet"
        />
        <AuditRow label="Daily cap" value={String(dailyCap)} testid="audit-notif-cap" />
        <AuditRow
          label="App-wide floor"
          value={`${formatHour(APP_QUIET_HOURS.startHour)} → ${formatHour(APP_QUIET_HOURS.endHour)} (cannot widen past)`}
          testid="audit-notif-floor"
        />
      </dl>
    </fieldset>
  );
}

function AccessibilityFieldset() {
  const theme = useDB((s) => s.db.settings.theme ?? 'system');
  const reducedMotion = readMediaQuery('(prefers-reduced-motion: reduce)');
  const highContrast =
    readMediaQuery('(prefers-contrast: more)') ||
    readMediaQuery('(prefers-contrast: high)');

  return (
    <fieldset className={FIELDSET_CLASS}>
      <legend className={LEGEND_CLASS}>Accessibility</legend>
      <dl className={GRID_CLASS}>
        <AuditRow label="Theme mode" value={theme} testid="audit-a11y-theme" />
        <AuditRow
          label="Reduced motion"
          value={reducedMotion ? 'on (system)' : 'off'}
          testid="audit-a11y-motion"
        />
        <AuditRow
          label="High contrast"
          value={highContrast ? 'on (system)' : 'off'}
          testid="audit-a11y-contrast"
        />
      </dl>
    </fieldset>
  );
}

function LocaleFieldset() {
  const { lang } = useLanguage();
  const stored = useDB((s) => s.db.settings.language ?? 'en');

  return (
    <fieldset className={FIELDSET_CLASS}>
      <legend className={LEGEND_CLASS}>Locale</legend>
      <dl className={GRID_CLASS}>
        <AuditRow label="Active language" value={lang} testid="audit-locale-lang" />
        <AuditRow label="Stored language" value={stored} testid="audit-locale-stored" />
      </dl>
    </fieldset>
  );
}

function BackupFieldset() {
  /* Round-12 BackupVerifier does NOT persist the verifiedAt timestamp
   * to settings — it stays in component state and is lost on reload.
   * Honestly report "not tracked" rather than silently lying with a
   * stale value. Persisting verifier-ts is R14 work. */
  return (
    <fieldset className={FIELDSET_CLASS}>
      <legend className={LEGEND_CLASS}>Backup</legend>
      <dl className={GRID_CLASS}>
        <AuditRow
          label="Last verified backup"
          value="not tracked"
          testid="audit-backup-last"
        />
      </dl>
      <p className="text-xs text-ink-subtle">
        Verify a backup any time from Settings → Privacy &amp; data → Verify a
        backup file. Round-12 added the verifier; it doesn’t change anything on
        this device.
      </p>
    </fieldset>
  );
}

function ExperimentsFieldset() {
  /* [R14-4] Surfaces the experiments-scaffold state on-device.
   * When the registry is empty (R14-4 ships dormant), this reads
   * "no experiments registered" and the audit row stays a single line.
   * Once the owner activates an experiment, this section starts
   * showing recent exposures so they can verify on-device that the
   * scaffold is working without any network telemetry. */
  const active = REGISTRY.filter((e) => e.status === 'active');
  const exposures = readExposures();
  const recentExposures = exposures.slice(-5).reverse();

  return (
    <fieldset className={FIELDSET_CLASS}>
      <legend className={LEGEND_CLASS}>Experiments</legend>
      <dl className={GRID_CLASS}>
        <AuditRow
          label="Registered"
          value={String(REGISTRY.length)}
          testid="audit-exp-registered"
        />
        <AuditRow
          label="Active"
          value={active.length === 0 ? 'none' : active.map((e) => e.key).join(', ')}
          testid="audit-exp-active"
        />
        <AuditRow
          label="Exposures recorded"
          value={String(exposures.length)}
          testid="audit-exp-exposures"
        />
      </dl>
      {recentExposures.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-ink-subtle" data-testid="audit-exp-recent">
          {recentExposures.map((e, i) => (
            <li key={i}>
              {new Date(e.ts).toISOString().slice(0, 19).replace('T', ' ')} ·{' '}
              {e.key} → {e.variant}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-ink-subtle">
        Variant assignment is deterministic and stays on this device. No
        exposure data is ever sent off-device.
      </p>
    </fieldset>
  );
}

export default function DiagnosticsAudit() {
  return (
    <section
      className="card"
      aria-labelledby="diagnostics-audit-heading"
      data-testid="diagnostics-audit"
    >
      <div className="card-header">
        <h2
          id="diagnostics-audit-heading"
          className="text-lg font-semibold tracking-tight"
        >
          What the app is doing right now
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          A read-only audit of your settings, notifications, accessibility,
          and backups. None of this leaves your phone.
        </p>
      </div>
      <div className="card-content space-y-5">
        <NotificationsFieldset />
        <AccessibilityFieldset />
        <LocaleFieldset />
        <BackupFieldset />
        <ExperimentsFieldset />
      </div>
    </section>
  );
}
