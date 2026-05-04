/**
 * [R28-B] A/B winner readout — DiagnosticsAudit surface.
 *
 * Renders one row per non-draft experiment. Where a winner has been
 * declared in the registry description AND the experiment is still
 * marked active, a sovereign-locked "Archive losers" button writes
 * the experiment key into settings.archivedExperimentKeys (which
 * useExperiment then honors by skipping bucketing).
 *
 * The button confirms via window.confirm; one explicit confirmation
 * per archive event. No telemetry; the action is local-state only.
 */

import React, { useState } from 'react';
import { useDB } from '../../store/db';
import { REGISTRY } from './registry';
import { readExposures } from './bucket';
import { summarizeExperimentWinners, type ExperimentWinnerSummary } from './winners';
import type { SatisfactionSignal } from '../satisfaction/satisfaction';

interface ArchiveLosersButtonProps {
  experimentKey: string;
  onArchive: () => void;
}

function ArchiveLosersButton({ experimentKey, onArchive }: ArchiveLosersButtonProps) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      data-testid={`archive-losers-${experimentKey}`}
      disabled={pending}
      onClick={() => {
        setPending(true);
        const ok =
          typeof window !== 'undefined' && typeof window.confirm === 'function'
            ? window.confirm(
                `Archive '${experimentKey}'? This stops new exposure recordings and pins all users to the production default. The registry is unchanged; clear archivedExperimentKeys to undo.`,
              )
            : true;
        if (ok) onArchive();
        setPending(false);
      }}
      className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
    >
      Archive losers
    </button>
  );
}

function WinnerRow({
  summary,
  onArchive,
}: {
  summary: ExperimentWinnerSummary;
  onArchive: () => void;
}) {
  const statusBadge = summary.effectiveStatus === 'archived' ? 'archived' : 'active';
  return (
    <li
      className="py-2"
      data-testid={`ab-winner-row-${summary.experimentKey}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {summary.experimentKey}
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            status: <span data-testid={`ab-winner-status-${summary.experimentKey}`}>{statusBadge}</span>
            {summary.declaredWinner ? (
              <> · declared winner: <strong data-testid={`ab-winner-declared-${summary.experimentKey}`}>{summary.declaredWinner}</strong></>
            ) : (
              <> · no winner declared</>
            )}
          </p>
          <p
            className="mt-1 text-xs text-neutral-700 dark:text-neutral-200"
            data-testid={`ab-winner-readout-${summary.experimentKey}`}
          >
            {summary.readoutLine}
          </p>
        </div>
        {summary.canArchiveLosers && (
          <ArchiveLosersButton
            experimentKey={summary.experimentKey}
            onArchive={onArchive}
          />
        )}
      </div>
    </li>
  );
}

export default function AbWinnerReadout() {
  const signals = useDB((s) => s.db.settings.satisfactionSignals) as
    | SatisfactionSignal[]
    | undefined;
  const archivedKeys = useDB((s) => s.db.settings.archivedExperimentKeys);
  const setSettings = useDB((s) => s.setSettings);
  const exposures = readExposures();
  const summaries = summarizeExperimentWinners(REGISTRY, exposures, signals, archivedKeys);

  function archiveExperiment(key: string) {
    const next = Array.from(new Set([...(archivedKeys ?? []), key]));
    setSettings({ archivedExperimentKeys: next });
  }

  return (
    <fieldset
      className="rounded-2xl border border-neutral-200 bg-white p-card dark:border-neutral-700 dark:bg-neutral-900"
      data-testid="ab-winner-readout"
    >
      <legend className="px-2 text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
        A/B winners
      </legend>
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        For each registered experiment, the declared winner (parsed
        from the registry description) and this device&apos;s arm with
        post-exposure satisfaction signal. The &ldquo;Archive losers&rdquo; button
        appears only when a winner is declared and the experiment is
        still active in the registry. Each archive requires explicit
        confirmation.
      </p>
      {summaries.length === 0 ? (
        <p
          className="mt-3 text-sm text-neutral-700 dark:text-neutral-200"
          data-testid="ab-winner-empty"
        >
          No active or archived experiments registered.
        </p>
      ) : (
        <ul
          className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-700"
          data-testid="ab-winner-rows"
        >
          {summaries.map((s) => (
            <WinnerRow
              key={s.experimentKey}
              summary={s}
              onArchive={() => archiveExperiment(s.experimentKey)}
            />
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-500">
        How to declare a winner: edit the experiment description in
        <code className="mx-1 rounded bg-neutral-100 px-1 py-0.5 text-[11px] dark:bg-neutral-800">src/features/experiments/registry.ts</code>
        and add <code className="mx-1 rounded bg-neutral-100 px-1 py-0.5 text-[11px] dark:bg-neutral-800">[winner: arm-name]</code> at the
        start. Re-build; the row above will show the &ldquo;Archive losers&rdquo; button.
      </p>
    </fieldset>
  );
}
