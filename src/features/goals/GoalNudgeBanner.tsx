/**
 * [R15-2] Goal-nudge banner.
 *
 * Renders a calm in-app banner when computeGoalNudge returns a Nudge.
 * Two actions:
 *   - "Revisit goal" — dispatches a navigate-to-goals event the host
 *     surface listens for (or scrolls to #goal-settings if a hash
 *     anchor is wired). For now: emits a custom event consumers can
 *     hook, since the navigation shape varies by tab host.
 *   - "Dismiss for the week" — calls setSettings({
 *     goalNudgeDismissedAt: Date.now() }). The analyzer suppresses
 *     re-show for 7 days from this stamp.
 *
 * Voice: factual + a question (control) OR goal-first observation
 * (softer). [R16-B] A/B copy variants are wired through the
 * goal-nudge-copy-2026Q2 experiment so the owner can compare on-device
 * exposures. No "you're failing", no urgency, no streaks framing.
 *
 * The banner renders nothing when nudge is null — caller passes the
 * pre-computed nudge to keep the calc co-located with the host
 * (typically InsightsPanel).
 */
import React from 'react';
import { useDB } from '../../store/db';
import type { GoalNudge } from './goalNudge';
import { useExperiment } from '../experiments/useExperiment';

interface Props {
  nudge: GoalNudge;
  /** Optional handler for the Revisit action; defaults to dispatching the alch:revisit-goal event. */
  onRevisit?: () => void;
}

export default function GoalNudgeBanner({ nudge, onRevisit }: Props) {
  const setSettings = useDB((s) => s.setSettings);
  /* [R16-B] Goal-nudge copy A/B test. Returns null when the experiment
   * is dormant or storage is unavailable, which falls through to the
   * control branch below. The hook records exposure once on mount. */
  const copyVariant = useExperiment('goal-nudge-copy-2026Q2');

  function handleDismiss() {
    setSettings({ goalNudgeDismissedAt: Date.now() });
  }

  function handleRevisit() {
    if (onRevisit) {
      onRevisit();
      return;
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('alch:revisit-goal'));
    }
  }

  const avgFormatted = nudge.avgPerDay.toFixed(1);
  const goalFormatted = nudge.goalPerDay.toFixed(1);

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="goal-nudge-banner"
      data-copy-variant={copyVariant ?? 'control'}
      className="rounded-2xl border border-border-soft bg-surface-elevated p-card space-y-3"
    >
      {copyVariant === 'softer' ? (
        <p className="text-body text-ink">
          Your goal is{' '}
          <span className="font-semibold tabular-nums" data-testid="goal-nudge-goal">
            {goalFormatted}
          </span>
          /day. This week&apos;s been around{' '}
          <span className="font-semibold tabular-nums" data-testid="goal-nudge-avg">
            {avgFormatted}
          </span>
          /day. Some weeks land different &mdash; adjust if it&apos;s helpful.
        </p>
      ) : (
        <p className="text-body text-ink">
          You&apos;ve been at{' '}
          <span className="font-semibold tabular-nums" data-testid="goal-nudge-avg">
            {avgFormatted}
          </span>{' '}
          std/day this week. Your goal is{' '}
          <span className="font-semibold tabular-nums" data-testid="goal-nudge-goal">
            {goalFormatted}
          </span>
          /day. Want to revisit it?
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleRevisit}
          data-testid="goal-nudge-revisit"
          className="rounded-full bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-600 dark:hover:bg-primary-700"
        >
          Revisit goal
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          data-testid="goal-nudge-dismiss"
          className="text-sm text-ink-soft underline underline-offset-2 hover:text-ink"
        >
          Not this week
        </button>
      </div>
    </div>
  );
}
