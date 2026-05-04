/**
 * [R26-1] Per-surface thumb up/down chip.
 *
 * Hosts mount this AFTER the user has actually used the surface
 * (host passes `surfaceUsedTs`). The chip self-gates on
 * shouldShowSatisfactionChip — if the user has answered or dismissed
 * within the last 14 days for that surface, it renders nothing.
 *
 * Voice: "Was this helpful?" + thumb up + thumb down. No emoji on the
 * surface itself; the icons are SVG. Submit triggers a one-shot
 * "Thanks. Stays on this device." line and the chip unmounts.
 *
 * No external network. The signal is appended to
 * settings.satisfactionSignals[]; the owner reads aggregates in
 * DiagnosticsAudit.
 */
import React, { useState } from 'react';
import { useDB } from '../../store/db';
import { useLanguage } from '../../i18n';
import {
  shouldShowSatisfactionChip,
  type SatisfactionSurface,
  type SatisfactionResponse,
  type SatisfactionSignal,
} from './satisfaction';

interface Props {
  surface: SatisfactionSurface;
  /** Timestamp the user actually started using the surface; undefined =
   *  not yet used and the chip is hidden. */
  surfaceUsedTs: number | undefined;
  /** Test override for Date.now(). */
  now?: () => number;
}

export default function SatisfactionChip({ surface, surfaceUsedTs, now = Date.now }: Props) {
  const setSettings = useDB((s) => s.setSettings);
  const signals = useDB((s) => s.db.settings.satisfactionSignals) as
    | SatisfactionSignal[]
    | undefined;
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  const visible = shouldShowSatisfactionChip({
    surface,
    signals,
    surfaceUsedTs,
    now: now(),
  });

  if (!visible && !submitted) return null;

  function record(response: SatisfactionResponse) {
    const next: SatisfactionSignal = { surface, response, ts: now() };
    setSettings({
      satisfactionSignals: [...(signals ?? []), next] as never,
    });
    setSubmitted(true);
  }

  function dismiss() {
    /* Treat dismiss as a 'down' so it occupies the suppression
     * window without poisoning the up-count. We mark the response
     * 'down' with a synthetic ts; owner can still see the count. */
    record('down');
  }

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid={`satisfaction-thanks-${surface}`}
        className="my-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
      >
        <span aria-hidden>✓</span>
        <span>{t('satisfaction.thanks', 'Thanks. Stays on this device.')}</span>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={t('satisfaction.label', 'Was this helpful?')}
      data-testid={`satisfaction-chip-${surface}`}
      className="my-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
    >
      <span className="font-medium">
        {t('satisfaction.label', 'Was this helpful?')}
      </span>
      <button
        type="button"
        data-testid={`satisfaction-up-${surface}`}
        onClick={() => record('up')}
        aria-label={t('satisfaction.up', 'Thumb up — helpful')}
        className="rounded-full px-2 py-0.5 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:hover:bg-neutral-800"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M2 21h4V9H2v12zm20-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 1 7.59 6.59C7.22 6.95 7 7.45 7 8v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1z" />
        </svg>
      </button>
      <button
        type="button"
        data-testid={`satisfaction-down-${surface}`}
        onClick={() => record('down')}
        aria-label={t('satisfaction.down', 'Thumb down — not helpful')}
        className="rounded-full px-2 py-0.5 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:hover:bg-neutral-800"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M22 3h-4v12h4V3zM2 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L10.83 23l5.59-5.59c.36-.36.58-.86.58-1.41V6c0-1.1-.9-2-2-2H6c-.83 0-1.54.5-1.84 1.22L1.14 12.27c-.09.23-.14.47-.14.73v1z" />
        </svg>
      </button>
      <button
        type="button"
        data-testid={`satisfaction-dismiss-${surface}`}
        onClick={dismiss}
        aria-label={t('satisfaction.dismiss', 'Dismiss helpful prompt')}
        className="ml-1 text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        <span aria-hidden>×</span>
      </button>
    </div>
  );
}
