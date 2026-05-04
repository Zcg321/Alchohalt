/**
 * [R24-3] On-device NPS pulse banner.
 *
 * Renders the calm one-question pulse. Two actions:
 *   - submit (score + optional reason) → settings.npsResponses
 *   - skip → settings.npsDismissedAt = now (suppresses for 30 days)
 *
 * No external network, no telemetry. The component does not gate on
 * the eligibility window itself — the host (TodayHome) calls
 * shouldShowNpsPrompt and only mounts when true.
 *
 * Voice: factual + two anchors. No "we'd love your feedback", no
 * exclamation, no smiley faces. The "Stays on this device" line is
 * the trust receipt for this specific question.
 */
import React, { useState } from 'react';
import { useDB } from '../../store/db';
import { useLanguage } from '../../i18n';
import {
  clampScore,
  normalizeReason,
  NPS_REASON_MAX,
  type NpsResponse,
} from './nps';

interface Props {
  /** Optional now() override for tests. */
  now?: () => number;
  /** Called after the user submits or dismisses, so the host can unmount the banner. */
  onResolved?: () => void;
}

export default function NpsPulseBanner({ now = Date.now, onResolved }: Props) {
  const setSettings = useDB((s) => s.setSettings);
  const existing = useDB((s) => s.db.settings.npsResponses);
  const { t } = useLanguage();
  const [score, setScore] = useState<number>(7);
  const [reason, setReason] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  function submit() {
    const ts = now();
    const next: NpsResponse = {
      ts,
      score: clampScore(score),
    };
    const trimmed = normalizeReason(reason);
    if (trimmed !== undefined) next.reason = trimmed;
    setSettings({
      npsResponses: [...(existing ?? []), next],
    });
    setSubmitted(true);
    /* Briefly show the thanks state before unmounting so the user
     * sees the privacy reassurance ("Stays on this device.") at
     * least once. The host's onResolved fires immediately so the
     * gate stops re-rendering the banner; the thanks state lives
     * in local component state until the host re-renders. */
    onResolved?.();
  }

  function skip() {
    setSettings({ npsDismissedAt: now() });
    onResolved?.();
  }

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="nps-pulse-thanks"
        className="rounded-2xl border border-border-soft bg-surface-elevated p-card"
      >
        <p className="text-body text-ink">
          {t('nps.thanks', 'Thanks. Stays on this device.')}
        </p>
      </div>
    );
  }

  return (
    <section
      role="region"
      aria-labelledby="nps-pulse-title"
      data-testid="nps-pulse-banner"
      className="rounded-2xl border border-border-soft bg-surface-elevated p-card space-y-4 mb-4"
    >
      <h3 id="nps-pulse-title" className="text-h3 text-ink">
        {t('nps.title', 'Quick check-in')}
      </h3>
      <p className="text-body text-ink-soft">
        {t('nps.body', 'Would you tell a friend about Alchohalt? 0 = not at all, 10 = definitely.')}
      </p>
      <div className="space-y-2">
        <label htmlFor="nps-score" className="sr-only">
          {t('nps.body', 'Would you tell a friend about Alchohalt? 0 = not at all, 10 = definitely.')}
        </label>
        <input
          id="nps-score"
          type="range"
          min={0}
          max={10}
          step={1}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          data-testid="nps-pulse-score"
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={score}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-ink-subtle tabular-nums">
          <span>0</span>
          <span data-testid="nps-pulse-score-readout" className="font-semibold text-ink">
            {score}
          </span>
          <span>10</span>
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="nps-reason" className="text-sm text-ink-soft">
          {t('nps.reasonLabel', 'One line on why (optional)')}
        </label>
        <input
          id="nps-reason"
          type="text"
          maxLength={NPS_REASON_MAX}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          data-testid="nps-pulse-reason"
          className="w-full rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          data-testid="nps-pulse-submit"
          className="rounded-full bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-600 dark:hover:bg-primary-700"
        >
          {t('nps.submit', 'Send')}
        </button>
        <button
          type="button"
          onClick={skip}
          data-testid="nps-pulse-skip"
          className="text-sm text-ink-soft underline underline-offset-2 hover:text-ink"
        >
          {t('nps.dismiss', 'Skip for now')}
        </button>
      </div>
      <p className="text-xs text-ink-subtle">
        {t('nps.thanks', 'Thanks. Stays on this device.')}
      </p>
    </section>
  );
}
