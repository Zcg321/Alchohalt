/**
 * LoggingTenure — [R17-1] Continuity surface for users in long-term
 * recovery whose drinking pattern is irregular.
 *
 * Streaks reward consecutive abstinence, which is the right frame for
 * the early-recovery audience but the wrong frame for someone four
 * years in who occasionally has a glass of wine at a wedding. For
 * those users a streak counter that resets feels punitive, and the
 * milestones panel can read as a relic of an earlier phase. This
 * surface answers a different question: "How long have I been showing
 * up here?"
 *
 * Tenure = days between the user's earliest entry and today, regardless
 * of what's in those entries. Five entries spread across two years
 * reads as "two years of logging" — not a streak. Pure observation,
 * no judgement encoded.
 *
 * Renders only when tenure ≥ 90 days. Below that, the streak + milestone
 * surfaces are doing the right work and a "you've been logging for 12
 * days" line would feel redundant.
 */

import React from 'react';
import type { Drink } from '../../types/common';
import { useLanguage } from '../../i18n';
import { pluralCount } from '../../i18n/plural';

interface Props {
  drinks: Drink[];
  className?: string | undefined;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_TENURE_DAYS = 90;

export function computeTenureDays(drinks: Drink[], now: number = Date.now()): number {
  if (drinks.length === 0) return 0;
  const earliest = Math.min(...drinks.map((d) => d.ts));
  return Math.max(0, Math.floor((now - earliest) / DAY_MS));
}

/* [R17-5] Locale-aware plural formatting. Uses pluralCount with
 * tenure.* keys; falls back to English-shaped strings for any
 * locale not yet localized. */
export function formatTenure(
  days: number,
  t: (k: string, fb?: string) => string,
  lang: string,
): string {
  if (days < 365) {
    const months = Math.floor(days / 30);
    if (months >= 6) {
      return pluralCount(t, lang, 'tenure.months', months, `${months} months`);
    }
    return pluralCount(t, lang, 'tenure.days', days, `${days} days`);
  }
  const years = Math.floor(days / 365);
  const remainderMonths = Math.floor((days - years * 365) / 30);
  if (years >= 2 && remainderMonths >= 1) {
    const yearsPart = pluralCount(t, lang, 'tenure.years', years, `${years} years`);
    const monthsPart = pluralCount(t, lang, 'tenure.months', remainderMonths, `${remainderMonths} month${remainderMonths === 1 ? '' : 's'}`);
    return `${yearsPart}, ${monthsPart}`;
  }
  return pluralCount(t, lang, 'tenure.years', years, `${years} year${years === 1 ? '' : 's'}`);
}

export default function LoggingTenure({ drinks, className = '' }: Props) {
  const { t, lang } = useLanguage();
  const tenure = computeTenureDays(drinks);
  if (tenure < MIN_TENURE_DAYS) return null;

  const tenureLabel = formatTenure(tenure, t, lang);
  return (
    <section
      className={`card ${className}`}
      aria-labelledby="logging-tenure-heading"
      data-testid="logging-tenure"
    >
      <div className="card-content">
        <p
          id="logging-tenure-heading"
          className="text-caption text-ink-soft"
        >
          You&rsquo;ve been logging here for{' '}
          <strong className="font-semibold text-ink" data-testid="logging-tenure-value">
            {tenureLabel}
          </strong>
          .
        </p>
        <p className="mt-1 text-micro text-ink-subtle">
          Separate from your current streak. Some weeks land different;
          showing up to log is the through-line.
        </p>
      </div>
    </section>
  );
}
