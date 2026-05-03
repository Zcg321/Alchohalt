import React from 'react';
import { useDB } from '../../store/db';
import { configureCrashReporter } from '../../lib/crashReporter';

/**
 * [R19-4] Crash-reports opt-in toggle.
 *
 * Sits inside Settings → Privacy & data. Default off (undefined).
 * When toggled on, we reconfigure the crash reporter so the next
 * uncaught error / unhandled rejection is forwarded to the build's
 * Sentry endpoint. The toggle copy is explicit about what's sent
 * and what isn't.
 *
 * Privacy invariants are pinned by tests in
 * src/lib/__tests__/crashReporter.test.ts:
 *   - no breadcrumbs
 *   - no user data
 *   - no entries / goals / settings
 *   - no IP / cookies / localStorage
 */

export default function CrashReportsToggle() {
  const enabled = useDB((s) => s.db.settings.crashReportsEnabled === true);
  const setSettings = useDB((s) => s.setSettings);

  function toggle() {
    const next = !enabled;
    setSettings?.({ crashReportsEnabled: next });
    configureCrashReporter({ enabled: next });
  }

  return (
    <section
      className="card"
      aria-labelledby="crash-reports-heading"
      data-testid="crash-reports-toggle"
    >
      <div className="card-header">
        <h3 id="crash-reports-heading" className="text-base font-semibold tracking-tight">
          Crash reports
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Off by default. When on, we send anonymized error stack traces
          (no entries, no notes, no settings) so we can fix bugs you
          hit. Toggle off any time.
        </p>
      </div>
      <div className="card-content">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggle}
            className="mt-1 h-5 w-5 accent-sage-700"
            aria-describedby="crash-reports-detail"
            data-testid="crash-reports-checkbox"
          />
          <span className="flex-1">
            <span className="font-medium text-ink">
              Send crash reports to help fix bugs
            </span>
            <span id="crash-reports-detail" className="block mt-1 text-xs text-ink-soft">
              What we send: error message, stack trace (file + line), OS
              family, app version. What we don&apos;t send: anything from
              your entries, goals, mood, notes, or settings; no
              breadcrumbs; no cookies or session info; no IP address.
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}
