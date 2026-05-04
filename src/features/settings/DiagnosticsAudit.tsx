// @no-smoke
import React, { useEffect, useState } from 'react';
import { useDB } from '../../store/db';
import { useLanguage } from '../../i18n';
import {
  APP_QUIET_HOURS,
  DEFAULT_CALM_CONFIG,
  type NotificationType,
} from '../../lib/notifications/calmConfig';
import { REGISTRY } from '../experiments/registry';
import { readExposures, getDeviceBucket, assignVariant } from '../experiments/bucket';
import { computeStorageUsage, formatBytes, type StorageUsage } from '../../lib/storage/usage';
import { bucketForScore, type NpsResponse } from '../nps/nps';
import {
  summarizeSatisfaction,
  totalSatisfactionCount,
  type SatisfactionSignal,
} from '../satisfaction/satisfaction';

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
  /* [R15-3] The auto-verifier persists its result on every export,
   * so we now have a real timestamp + ok/fail status to show here.
   * The manual BackupVerifier (R12-3) still doesn't write to
   * settings — its result lives in component state. */
  const autoVerification = useDB((s) => s.db.settings.lastBackupAutoVerification);

  let lastValue: string;
  if (!autoVerification) {
    lastValue = 'never';
  } else {
    const stamp = new Date(autoVerification.ts).toLocaleString();
    lastValue = autoVerification.ok ? `${stamp} (ok)` : `${stamp} (failed)`;
  }

  return (
    <fieldset className={FIELDSET_CLASS}>
      <legend className={LEGEND_CLASS}>Backup</legend>
      <dl className={GRID_CLASS}>
        <AuditRow
          label="Last auto-verified"
          value={lastValue}
          testid="audit-backup-last"
        />
        {autoVerification && !autoVerification.ok && (
          <AuditRow
            label="Last error"
            value={autoVerification.error ?? 'unspecified failure'}
            testid="audit-backup-last-error"
          />
        )}
      </dl>
      <p className="text-xs text-ink-subtle">
        Auto-verification round-trips every export through the same checksum +
        schema check the import path uses. Failures raise a small ribbon at the
        top of the app.
      </p>
    </fieldset>
  );
}

function StorageFieldset() {
  /* [R19-3] On-device storage usage. Shows browser quota + app-side
   * size with a soft warning at 80%. Read on mount; not polling.
   * Both reads are best-effort — Safari and some Capacitor envs
   * return nulls for navigator.storage.estimate, so the panel falls
   * back to "—" for those rows rather than going blank. */
  const db = useDB((s) => s.db);
  const [usage, setUsage] = useState<StorageUsage | null>(null);

  useEffect(() => {
    let cancelled = false;
    computeStorageUsage(db).then((u) => {
      if (!cancelled) setUsage(u);
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  if (!usage) {
    return (
      <fieldset className={FIELDSET_CLASS}>
        <legend className={LEGEND_CLASS}>Storage</legend>
        <p className="text-xs text-ink-subtle">Computing…</p>
      </fieldset>
    );
  }

  const browserUsed = usage.browserUsedBytes;
  const browserQuota = usage.browserQuotaBytes;
  const browserPercent = usage.browserPercentUsed;

  return (
    <fieldset className={FIELDSET_CLASS}>
      <legend className={LEGEND_CLASS}>Storage</legend>
      <dl className={GRID_CLASS}>
        <AuditRow
          label="App data on device"
          value={`${formatBytes(usage.appUsedBytes)} (${usage.appPercentUsed.toFixed(1)}% of ${formatBytes(usage.appSoftCapBytes)} soft cap)`}
          testid="audit-storage-app-used"
        />
        <AuditRow
          label="Entries"
          value={`${usage.entryCount.toLocaleString()}`}
          testid="audit-storage-entry-count"
        />
        <AuditRow
          label="Browser quota"
          value={
            browserQuota !== null
              ? `${formatBytes(browserUsed ?? 0)} of ${formatBytes(browserQuota)} (${(browserPercent ?? 0).toFixed(1)}%)`
              : '— (browser does not report)'
          }
          testid="audit-storage-browser-quota"
        />
      </dl>
      {usage.warn ? (
        <p
          className="text-xs text-amber-700 dark:text-amber-400"
          data-testid="audit-storage-warning"
        >
          You&apos;re using {usage.effectivePercentUsed.toFixed(0)}% of your
          storage. Export your data and clear old entries from Settings →
          Data Management when you have a moment. Nothing breaks at 100%
          — the OS will just stop accepting new writes.
        </p>
      ) : (
        <p className="text-xs text-ink-subtle">
          Plenty of headroom. Export-your-data and clear-old-entries live
          in Settings → Data Management whenever you need them.
        </p>
      )}
    </fieldset>
  );
}

function ActiveExperimentsTable({ exposures }: { exposures: ReturnType<typeof readExposures> }) {
  /* [R17-B] Per-experiment row: key + current arm assignment + how
   * many times exposure has been recorded for that experiment. The
   * arm is computed deterministically from the device bucket so it
   * matches what useExperiment() returned at the live call sites
   * (no risk of the audit panel disagreeing with the running app). */
  const active = REGISTRY.filter((e) => e.status === 'active');
  if (active.length === 0) return null;

  let bucket = '';
  try { bucket = getDeviceBucket(); } catch { /* localStorage disabled */ }

  return (
    <div className="mt-3 space-y-2" data-testid="audit-exp-active-table">
      <p className={LEGEND_CLASS}>Active experiments</p>
      <ul className="space-y-1.5">
        {active.map((exp) => {
          let arm = '—';
          try {
            if (bucket) arm = assignVariant(exp, bucket);
          } catch {
            arm = '— (misconfigured)';
          }
          const count = exposures.filter((e) => e.key === exp.key).length;
          return (
            <li
              key={exp.key}
              className="flex items-baseline justify-between gap-3 text-xs"
              data-testid={`audit-exp-row-${exp.key}`}
            >
              <span className="font-mono text-ink-soft truncate">{exp.key}</span>
              <span className="flex-shrink-0 tabular-nums text-ink">
                arm: <strong className="font-semibold">{arm}</strong>
                {' · '}
                <span data-testid={`audit-exp-count-${exp.key}`}>
                  {count} exposure{count === 1 ? '' : 's'}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ExperimentsFieldset() {
  /* [R14-4] Surfaces the experiments-scaffold state on-device.
   * When the registry is empty, this reads "no experiments registered"
   * and the audit row stays a single line. Once the owner activates
   * an experiment, this section shows arm assignments + exposures.
   *
   * [R17-B] Per-experiment arm + exposure count surfaced via the
   * ActiveExperimentsTable so the owner can verify on-device which
   * arm this build is showing them and how often exposures fire. */
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
          value={active.length === 0 ? 'none' : String(active.length)}
          testid="audit-exp-active"
        />
        <AuditRow
          label="Exposures recorded"
          value={String(exposures.length)}
          testid="audit-exp-exposures"
        />
      </dl>
      <ActiveExperimentsTable exposures={exposures} />
      {recentExposures.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-ink-subtle cursor-pointer">
            Recent exposures (last 5)
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-ink-subtle" data-testid="audit-exp-recent">
            {recentExposures.map((e, i) => (
              <li key={i}>
                {new Date(e.ts).toISOString().slice(0, 19).replace('T', ' ')} ·{' '}
                {e.key} → {e.variant}
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="text-xs text-ink-subtle">
        Variant assignment is deterministic and stays on this device. No
        exposure data is ever sent off-device.
      </p>
    </fieldset>
  );
}

function NpsFieldset() {
  /* [R24-3] On-device NPS pulse history — owner-readable summary
   * with mean score, last response timestamp, and bucket counts.
   * Renders an empty-state when there are no responses yet so the
   * fieldset stays visible and the user can confirm the feature
   * exists and stores nothing off-device. */
  const responses: NpsResponse[] = useDB((s) => s.db.settings.npsResponses ?? []);
  const dismissedAt = useDB((s) => s.db.settings.npsDismissedAt);

  if (responses.length === 0) {
    return (
      <fieldset className={FIELDSET_CLASS}>
        <legend className={LEGEND_CLASS}>NPS pulse</legend>
        <dl className={GRID_CLASS}>
          <AuditRow label="Responses" value="none yet" testid="audit-nps-count" />
          <AuditRow
            label="Last skip"
            value={dismissedAt ? new Date(dismissedAt).toLocaleString() : '—'}
            testid="audit-nps-skip"
          />
        </dl>
        <p className="text-xs text-ink-subtle">
          Stays on this device. Surfaces every 30 days after at least 14
          days of usage. Skipping counts as a 30-day suppression.
        </p>
      </fieldset>
    );
  }

  const total = responses.length;
  const mean = responses.reduce((s, r) => s + r.score, 0) / total;
  const buckets = { detractor: 0, passive: 0, promoter: 0 };
  for (const r of responses) buckets[bucketForScore(r.score)]++;
  const last = responses.reduce((a, b) => (a.ts > b.ts ? a : b));

  return (
    <fieldset className={FIELDSET_CLASS}>
      <legend className={LEGEND_CLASS}>NPS pulse</legend>
      <dl className={GRID_CLASS}>
        <AuditRow
          label="Responses"
          value={`${total} (mean ${mean.toFixed(1)})`}
          testid="audit-nps-count"
        />
        <AuditRow
          label="Last response"
          value={`${new Date(last.ts).toLocaleString()} → ${last.score}`}
          testid="audit-nps-last"
        />
        <AuditRow
          label="Buckets"
          value={`${buckets.promoter} promoter · ${buckets.passive} passive · ${buckets.detractor} detractor`}
          testid="audit-nps-buckets"
        />
        <AuditRow
          label="Last skip"
          value={dismissedAt ? new Date(dismissedAt).toLocaleString() : '—'}
          testid="audit-nps-skip"
        />
      </dl>
      <p className="text-xs text-ink-subtle">
        Stays on this device. Reasons (when given) are visible only when
        you export your data; this audit shows the score and bucket only.
      </p>
    </fieldset>
  );
}

function SatisfactionFieldset() {
  /* [R26-1] Per-surface real-time satisfaction signal. Renders the
   * full surface list even at 0 responses so the owner can confirm
   * the feature exists and stores nothing off-device. */
  const signals = useDB((s) => s.db.settings.satisfactionSignals) as
    | SatisfactionSignal[]
    | undefined;
  const total = totalSatisfactionCount(signals);
  const tallies = summarizeSatisfaction(signals);

  return (
    <fieldset className={FIELDSET_CLASS}>
      <legend className={LEGEND_CLASS}>Satisfaction signals</legend>
      {total === 0 ? (
        <dl className={GRID_CLASS}>
          <AuditRow
            label="Responses"
            value="none yet"
            testid="audit-satisfaction-count"
          />
        </dl>
      ) : (
        <dl className={GRID_CLASS}>
          <AuditRow
            label="Total responses"
            value={String(total)}
            testid="audit-satisfaction-count"
          />
          {tallies
            .filter((t) => t.up + t.down > 0)
            .map((t) => (
              <AuditRow
                key={t.surface}
                label={t.surface}
                value={`${t.up} up · ${t.down} down`}
                testid={`audit-satisfaction-${t.surface}`}
              />
            ))}
        </dl>
      )}
      <p className="text-xs text-ink-subtle">
        Stays on this device. The chip surfaces after you use a surface
        and suppresses for 14 days once you respond or dismiss.
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
          /* [R21-2] tabIndex=-1 — see Diagnostics.tsx for rationale. */
          tabIndex={-1}
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
        <StorageFieldset />
        <BackupFieldset />
        <ExperimentsFieldset />
        <NpsFieldset />
        <SatisfactionFieldset />
      </div>
    </section>
  );
}
