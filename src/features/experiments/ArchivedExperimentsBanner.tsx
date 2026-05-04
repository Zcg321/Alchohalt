/**
 * [R29-D] Archived experiments banner — DiagnosticsAudit surface.
 *
 * Closes a discoverability gap: after an owner taps Archive Losers
 * (R28-B), nothing in the audit panel acknowledged the change beyond
 * the row's status flipping to "archived". This banner surfaces every
 * archived experiment with its declared-winner arm so the owner sees,
 * at a glance, which arm is now live for everyone.
 *
 * Lives at the top of DiagnosticsAudit so it is the first thing the
 * owner reads when they open the panel after archiving — no scroll
 * required to confirm what changed.
 *
 * Renders nothing when no experiments are archived (avoids audit-panel
 * noise pre-archive).
 */

import React from 'react';
import { useDB } from '../../store/db';
import { REGISTRY } from './registry';
import { readExposures } from './bucket';
import { summarizeExperimentWinners } from './winners';
import type { SatisfactionSignal } from '../satisfaction/satisfaction';

export default function ArchivedExperimentsBanner() {
  const signals = useDB((s) => s.db.settings.satisfactionSignals) as
    | SatisfactionSignal[]
    | undefined;
  const archivedKeys = useDB((s) => s.db.settings.archivedExperimentKeys);
  const exposures = readExposures();
  const summaries = summarizeExperimentWinners(REGISTRY, exposures, signals, archivedKeys);

  /* Surface only experiments that are archived AND have a real
   * declared winner. A registry-archived experiment with no winner
   * marker is just historical bookkeeping and should not flag as a
   * recent owner action. */
  const archivedWithWinner = summaries.filter(
    (s) => s.effectiveStatus === 'archived' && s.declaredWinner !== null,
  );

  if (archivedWithWinner.length === 0) return null;

  return (
    <div
      className="rounded-2xl border border-emerald-300 bg-emerald-50 p-card text-sm dark:border-emerald-700 dark:bg-emerald-950/30"
      data-testid="archived-experiments-banner"
      role="status"
    >
      <p className="font-semibold text-emerald-900 dark:text-emerald-200">
        Archived experiments — winners are now live for everyone
      </p>
      <ul className="mt-2 space-y-1.5">
        {archivedWithWinner.map((s) => (
          <li
            key={s.experimentKey}
            className="text-xs text-emerald-900/90 dark:text-emerald-100/90"
            data-testid={`archived-banner-row-${s.experimentKey}`}
          >
            <span className="font-mono">{s.experimentKey}</span>
            {' → arm '}
            <strong data-testid={`archived-banner-arm-${s.experimentKey}`}>
              &lsquo;{s.declaredWinner}&rsquo;
            </strong>
            {' is now the production default. '}
            <span className="text-emerald-800/80 dark:text-emerald-200/80">
              {s.runtimeArchived
                ? 'Runtime archive — clear archivedExperimentKeys to reactivate bucketing.'
                : 'Registry archive — edit registry.ts to reactivate.'}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-emerald-800/70 dark:text-emerald-200/70">
        Bucketing has stopped for these keys. New users see the winning
        arm directly; existing users keep their last-rendered arm
        until next mount, then fall through to the production default.
      </p>
    </div>
  );
}
