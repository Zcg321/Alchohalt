/**
 * [R27-2] A/B exposure × satisfaction signal cross-tab.
 *
 * Reads the device's local exposures + satisfaction signals + the
 * experiment registry, then renders one row per exposed experiment:
 * "experiment-key • variant • 12 up / 1 down · 92%".
 *
 * On a single device this is degenerate (1 variant per experiment,
 * N=1 arm), but the surface still tells the owner which arm they're
 * in and how the satisfaction signal is trending while they're in
 * it. The data shape would scale unchanged if a multi-bucket
 * aggregation surface were ever wired up.
 *
 * Owner-facing diagnostics — no localization, no marketing voice.
 */
import React from 'react';
import { useDB } from '../../store/db';
import { REGISTRY } from './registry';
import { readExposures } from './bucket';
import {
  buildExperimentSatisfactionCrosstab,
  type ExperimentSatisfactionCell,
} from './experimentSatisfactionCrosstab';
import type { SatisfactionSignal } from '../satisfaction/satisfaction';

function fmtCell(c: ExperimentSatisfactionCell): string {
  if (c.positivePct === null) {
    return `${c.up} up · ${c.down} down · — (no signals after exposure)`;
  }
  return `${c.up} up · ${c.down} down · ${c.positivePct}%`;
}

export default function ExperimentSatisfactionPanel() {
  const signals = useDB((s) => s.db.settings.satisfactionSignals) as
    | SatisfactionSignal[]
    | undefined;
  const exposures = readExposures();
  const cells = buildExperimentSatisfactionCrosstab(REGISTRY, exposures, signals);

  return (
    <fieldset
      className="rounded-2xl border border-neutral-200 bg-white p-card dark:border-neutral-700 dark:bg-neutral-900"
      data-testid="experiment-satisfaction-panel"
    >
      <legend className="px-2 text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
        A/B × satisfaction
      </legend>
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        For each experiment this device has been bucketed into, the
        thumb up/down totals counted from signals timestamped after the
        first exposure. On-device only.
      </p>
      {cells.length === 0 ? (
        <p
          className="mt-3 text-sm text-neutral-700 dark:text-neutral-200"
          data-testid="experiment-satisfaction-empty"
        >
          No experiment exposures recorded on this device.
        </p>
      ) : (
        <ul
          className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-700"
          data-testid="experiment-satisfaction-rows"
        >
          {cells.map((c) => (
            <li
              key={c.experimentKey}
              className="py-2"
              data-testid={`experiment-satisfaction-row-${c.experimentKey}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {c.experimentKey}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    variant: <span data-testid={`experiment-satisfaction-variant-${c.experimentKey}`}>{c.variant}</span>
                    {' · '}exposures: {c.exposureCount}
                  </p>
                </div>
                <p
                  className="flex-none text-xs tabular-nums text-neutral-700 dark:text-neutral-200"
                  data-testid={`experiment-satisfaction-cell-${c.experimentKey}`}
                >
                  {fmtCell(c)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
