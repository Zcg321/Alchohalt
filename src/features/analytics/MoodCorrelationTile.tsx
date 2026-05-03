import React from 'react';
import { useLanguage } from '../../i18n';
import SoftPaywall from '../../components/SoftPaywall';
import {
  computeMoodCorrelation,
  HALT_LABELS,
  MOOD_EMOJI,
} from './mood-correlation';
import type { Entry } from '../../store/db';

/**
 * Mood ↔ drink correlation tile (PREMIUM feature).
 *
 * Wrapped in <SoftPaywall feature="mood_drink_correlation">. Free users
 * see a dimmed preview + Unlock CTA. Premium users see the real tile.
 *
 * Renders a one-glance summary:
 *   "Top mood: 😣 Stressed (12 drinks, avg 2.1 std)"
 *   "Top HALT: Tired (9 drinks, avg 1.8 std)"
 * Plus the small tables for the curious.
 */

interface Props {
  entries: Entry[];
  windowDays?: number;
  className?: string;
}

export default function MoodCorrelationTile({
  entries,
  windowDays = 30,
  className = '',
}: Props) {
  return (
    <SoftPaywall feature="mood_drink_correlation" className={className}>
      <MoodCorrelationContent entries={entries} windowDays={windowDays} />
    </SoftPaywall>
  );
}

function MoodCorrelationContent({
  entries,
  windowDays,
}: {
  entries: Entry[];
  windowDays: number;
}) {
  const { t } = useLanguage();
  const data = computeMoodCorrelation(entries, windowDays);

  if (data.totalDrinks === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="text-sm font-semibold">{t('analytics.moodCorrelation.title')}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t('analytics.moodCorrelation.empty')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <header className="mb-3">
        <h3 className="text-sm font-semibold">
          {t('analytics.moodCorrelation.title')}
        </h3>
        <p className="text-xs text-gray-500">
          {t('analytics.moodCorrelation.window').replace(
            '{{days}}',
            String(windowDays),
          )}
        </p>
      </header>

      {data.topMood ? (
        <p className="mb-2 text-sm">
          <span className="font-medium">{t('analytics.moodCorrelation.topMood')}:</span>{' '}
          {MOOD_EMOJI[data.topMood]} <span className="capitalize">{data.topMood}</span>
        </p>
      ) : null}
      {data.topHalt ? (
        <p className="mb-3 text-sm">
          <span className="font-medium">{t('analytics.moodCorrelation.topHalt')}:</span>{' '}
          {HALT_LABELS[data.topHalt]}
        </p>
      ) : null}

      {/* Small breakdown tables for the curious */}
      <details className="mt-3 text-sm text-gray-700 dark:text-gray-300">
        <summary className="cursor-pointer text-xs text-gray-500 hover:underline">
          {t('analytics.moodCorrelation.showBreakdown')}
        </summary>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="text-start text-gray-500">
                <th>{t('analytics.moodCorrelation.colMood')}</th>
                <th className="text-end">{t('analytics.moodCorrelation.colCount')}</th>
                <th className="text-end">{t('analytics.moodCorrelation.colMean')}</th>
              </tr>
            </thead>
            <tbody>
              {data.byMood
                .filter((r) => r.count > 0)
                .map((r) => (
                  <tr key={r.mood}>
                    <td>
                      {MOOD_EMOJI[r.mood]} <span className="capitalize">{r.mood}</span>
                    </td>
                    <td className="text-end">{r.count}</td>
                    <td className="text-end">{r.meanStdDrinks.toFixed(1)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="text-start text-gray-500">
                <th>{t('analytics.moodCorrelation.colHalt')}</th>
                <th className="text-end">{t('analytics.moodCorrelation.colCount')}</th>
                <th className="text-end">{t('analytics.moodCorrelation.colMean')}</th>
              </tr>
            </thead>
            <tbody>
              {data.byHalt
                .filter((r) => r.count > 0)
                .map((r) => (
                  <tr key={r.halt}>
                    <td>{HALT_LABELS[r.halt]}</td>
                    <td className="text-end">{r.count}</td>
                    <td className="text-end">{r.meanStdDrinks.toFixed(1)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
