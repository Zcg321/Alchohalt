import React from 'react';
import type { StreakStatus } from '../../lib/calc';
import { useLanguage } from '../../i18n';
import { pluralNoun } from '../../i18n/plural';

/**
 * [R13-3] Reflective prompt on streak break.
 *
 * When a user's active streak resets (currentStreak goes from > 0 to
 * 0 because they logged a drink), we surface a single calm prompt:
 *
 *   "Your streak resets today. The longest one (N days) is preserved.
 *    Want to add a note about today, or just keep going?"
 *
 *   [ Add a note ]   [ Keep going ]
 *
 * Two buttons — both leave the user in control. No guilt language,
 * no exclamation marks, no "you broke your streak." The longest-
 * streak number is named explicitly so the user knows that history
 * is intact.
 *
 * Dedup: parent owns `streakBreakAcknowledgedAt` (Settings). The
 * helper `shouldShowStreakBreakPrompt(status, ackAt)` returns true
 * iff status.kind === 'restart' AND ackAt is undefined. Either
 * button calls `onAcknowledge` which the parent uses to set
 * ackAt = Date.now(). When status flips back to 'building' (next
 * AF day), the parent clears ackAt to undefined.
 *
 * The note button calls `onAddNote` which opens the day's journal
 * entry — same surface as the existing JournalEntry component. The
 * note never leaves the device (same posture as every other entry).
 */

interface Props {
  longestStreak: number;
  onAddNote: () => void;
  onKeepGoing: () => void;
  className?: string;
}

export function shouldShowStreakBreakPrompt(
  status: StreakStatus,
  acknowledgedAt: number | undefined,
): boolean {
  return status.kind === 'restart' && acknowledgedAt === undefined;
}

export default function StreakBreakPrompt({
  longestStreak,
  onAddNote,
  onKeepGoing,
  className = '',
}: Props) {
  const { t, lang } = useLanguage();
  return (
    <section
      role="region"
      aria-labelledby="streak-break-heading"
      data-testid="streak-break-prompt"
      className={`rounded-2xl border border-cream-200 bg-cream-50 p-card text-ink dark:border-charcoal-700 dark:bg-charcoal-800/40 ${className}`}
    >
      <h3
        id="streak-break-heading"
        className="text-base font-semibold tracking-tight"
      >
        Your streak resets today.
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        The longest one ({longestStreak} {pluralNoun(t, lang, 'unit.day', longestStreak, 'day', 'days')})
        is preserved. Want to add a note about today, or just keep going?
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAddNote}
          data-testid="streak-break-add-note"
          className="inline-flex items-center justify-center rounded-pill bg-sage-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sage-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
        >
          Add a note
        </button>
        <button
          type="button"
          onClick={onKeepGoing}
          data-testid="streak-break-keep-going"
          className="inline-flex items-center justify-center rounded-pill border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-ink hover:bg-cream-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 dark:hover:bg-charcoal-700 min-h-[44px]"
        >
          Keep going
        </button>
      </div>
    </section>
  );
}
