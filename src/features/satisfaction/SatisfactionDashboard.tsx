/**
 * [R27-1] Per-surface satisfaction dashboard.
 *
 * R26-1 wired the per-surface signal collection. R26's DiagnosticsAudit
 * surfaced raw counts ("3 up · 1 down") in a flat list. R27-1 adds a
 * dedicated dashboard view: every surface gets a row with a thumb-up
 * count, thumb-down count, percentage, and a traffic-light mood
 * indicator so the owner can scan in seconds rather than count chips.
 *
 * Design rules:
 *   - On-device only — same store as the chip, no transmission.
 *   - Owner-facing — "Today panel: 12 up / 1 down · 92%" not user-
 *     facing copy. We don't translate this view; it's diagnostics.
 *   - Distinguish "no responses yet" from "every response was down."
 *     The unrated state shows "—" rather than 0%, so empty surfaces
 *     don't masquerade as concerning.
 *   - Voice rule still applies: factual, no marketing. We don't say
 *     "great job!" — we just report the number.
 *
 * Renders inside DiagnosticsAudit so the owner finds it where they
 * already look. The legacy SatisfactionFieldset is replaced; tests
 * that asserted on its testids are kept where the new component
 * surfaces the same data.
 */
import React from 'react';
import { useDB } from '../../store/db';
import {
  surfaceSentiments,
  surfaceDisplayLabel,
  totalSatisfactionCount,
  type SatisfactionSignal,
} from './satisfaction';

const MOOD_DOT_CLASS: Record<'good' | 'mixed' | 'concerning' | 'unrated', string> = {
  good: 'bg-emerald-500 dark:bg-emerald-400',
  mixed: 'bg-amber-500 dark:bg-amber-400',
  concerning: 'bg-rose-500 dark:bg-rose-400',
  unrated: 'bg-neutral-300 dark:bg-neutral-600',
};

const MOOD_LABEL: Record<'good' | 'mixed' | 'concerning' | 'unrated', string> = {
  good: 'Good',
  mixed: 'Mixed',
  concerning: 'Concerning',
  unrated: 'No responses yet',
};

export default function SatisfactionDashboard() {
  const signals = useDB((s) => s.db.settings.satisfactionSignals) as
    | SatisfactionSignal[]
    | undefined;
  const total = totalSatisfactionCount(signals);
  const sentiments = surfaceSentiments(signals);

  return (
    <fieldset
      className="rounded-2xl border border-neutral-200 bg-white p-card dark:border-neutral-700 dark:bg-neutral-900"
      data-testid="satisfaction-dashboard"
    >
      <legend className="px-2 text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
        Satisfaction signals
      </legend>
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        Real-time thumb-up/down counts per surface. Stays on this device.
      </p>
      {total === 0 ? (
        <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-200" data-testid="satisfaction-dashboard-empty">
          No responses yet. The chip surfaces after you use a surface; once
          you respond or dismiss, it suppresses for 14 days for that surface.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-700" data-testid="satisfaction-dashboard-rows">
          {sentiments.map((s) => {
            const moodKey = s.rated ? s.mood : ('unrated' as const);
            return (
              <li
                key={s.surface}
                className="flex items-center justify-between gap-3 py-2"
                data-testid={`satisfaction-dashboard-row-${s.surface}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className={`inline-block h-2 w-2 flex-none rounded-full ${MOOD_DOT_CLASS[moodKey]}`}
                  />
                  <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {surfaceDisplayLabel(s.surface)}
                  </span>
                  <span className="sr-only">{MOOD_LABEL[moodKey]}</span>
                </div>
                <div className="flex flex-none items-center gap-3 text-xs tabular-nums text-neutral-600 dark:text-neutral-400">
                  {s.rated ? (
                    <>
                      <span data-testid={`satisfaction-dashboard-up-${s.surface}`}>
                        {s.up} up
                      </span>
                      <span data-testid={`satisfaction-dashboard-down-${s.surface}`}>
                        {s.down} down
                      </span>
                      <span
                        className="font-semibold text-neutral-800 dark:text-neutral-100"
                        data-testid={`satisfaction-dashboard-pct-${s.surface}`}
                      >
                        {s.positivePct}%
                      </span>
                    </>
                  ) : (
                    <span data-testid={`satisfaction-dashboard-unrated-${s.surface}`}>—</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
