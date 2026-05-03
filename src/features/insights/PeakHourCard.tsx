/**
 * [R14-5] Peak-hour insight card.
 *
 * Renders one factual line:
 *   "Peak hour: 8 PM. On those days you average 2.3 drinks."
 *
 * Voice contract: factual, no pathologizing. The card just names the
 * pattern; the user does the interpretation.
 *
 * Render rules: only when computePeakHour returns non-null (≥7 real
 * drinks across ≥3 distinct days at the peak hour). Below threshold,
 * the card hides completely.
 */
import React from 'react';
import type { Drink } from '../../types/common';
import { computePeakHour, formatHour12 } from './peakHour';
import { useLanguage } from '../../i18n';
import { pluralNoun } from '../../i18n/plural';

interface Props {
  drinks: Drink[];
}

export default function PeakHourCard({ drinks }: Props) {
  const { t, lang } = useLanguage();
  const stats = computePeakHour(drinks);
  if (!stats) return null;

  const startLabel = formatHour12(stats.peakHour);
  const endLabel = formatHour12((stats.peakHour + 1) % 24);
  const avgLabel = stats.avgDrinksOnThoseDays.toFixed(1);
  const dayLabel = pluralNoun(t, lang, 'unit.day', stats.daysWithPeakHour, 'day', 'days');
  const drinkLabel = pluralNoun(t, lang, 'unit.drink', stats.avgDrinksOnThoseDays, 'drink', 'drinks');

  return (
    <section
      data-testid="peak-hour-card"
      aria-labelledby="peak-hour-heading"
      className="rounded-2xl border border-border-soft bg-surface-elevated p-card space-y-2"
    >
      <h3 id="peak-hour-heading" className="text-h3 text-ink">
        Peak hour
      </h3>
      <p className="text-body text-ink">
        Most of your drinks land between{' '}
        <span className="font-medium tabular-nums">
          {startLabel} – {endLabel}
        </span>
        . On those {dayLabel} you average{' '}
        <span className="font-medium tabular-nums">
          {avgLabel} {drinkLabel}
        </span>
        .
      </p>
      <p className="text-caption text-ink-soft tabular-nums">
        {stats.drinksInPeakHour} entries across {stats.daysWithPeakHour}{' '}
        {dayLabel}.
      </p>
    </section>
  );
}
