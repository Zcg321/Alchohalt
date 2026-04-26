// @no-smoke
import React from 'react';
import type { StreakStatus } from '../../../lib/calc';
import { useLanguage } from '../../../i18n';

/**
 * Soft-restart banner — owner-locked language. Replaces any "0 day"
 * shame-framing with one of three encouragement messages depending on
 * what's actually true right now:
 *
 *   building  → "{{count}} days alcohol-free. Keep going."
 *   starting  → "Today's a fresh start."   (new user, no history)
 *   restart   → "You're back. {{total}} alcohol-free days so far."
 */
interface Props {
  status: StreakStatus;
  className?: string;
}

export default function SoftRestartBanner({ status, className = '' }: Props) {
  const { t } = useLanguage();

  let message = '';
  let tone: 'positive' | 'neutral' | 'celebrate' = 'neutral';

  switch (status.kind) {
    case 'building':
      message = t('stats.softRestart.building').replace(
        '{{count}}',
        String(status.currentStreak),
      );
      tone = status.currentStreak >= 7 ? 'celebrate' : 'positive';
      break;
    case 'starting':
      message = t('stats.softRestart.starting');
      tone = 'neutral';
      break;
    case 'restart':
      message = t('stats.softRestart.restart').replace(
        '{{total}}',
        String(status.totalAFDays),
      );
      tone = 'positive';
      break;
  }

  const toneClasses = {
    celebrate:
      'bg-green-50 text-green-900 border-green-200 dark:bg-green-950/30 dark:text-green-100 dark:border-green-800',
    positive:
      'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/30 dark:text-blue-100 dark:border-blue-800',
    neutral:
      'bg-gray-50 text-gray-900 border-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800',
  }[tone];

  return (
    <div
      role="status"
      aria-live="polite"
      data-streak-kind={status.kind}
      className={`rounded-md border px-4 py-3 text-sm ${toneClasses} ${className}`}
    >
      {message}
    </div>
  );
}
