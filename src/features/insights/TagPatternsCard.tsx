/**
 * [R14-3] Tag-pattern insights card.
 *
 * Surfaces patterns the user might not have noticed:
 *
 *   "#stressed: 4 entries, avg 2.3 std (overall avg: 1.7)."
 *
 * Voice: factual, no pathologizing. The card simply names what's
 * present in the data — the user does the interpreting.
 *
 * Render rules:
 *   - At least one tag must meet the analyzer's occurrence threshold.
 *   - If no patterns surface, the card renders nothing (no "no
 *     patterns yet" placeholder — the absence speaks for itself).
 */
import React from 'react';
import type { Drink } from '../../types/common';
import { stdDrinks } from '../../lib/calc';
import { computeTagPatterns } from './tagPatterns';

interface Props {
  drinks: Drink[];
}

function fmt(n: number): string {
  // Two decimals for std-drink averages; matches formatStdDrinks
  // shape used elsewhere in DrinkItem.
  return n.toFixed(2);
}

export default function TagPatternsCard({ drinks }: Props) {
  const patterns = computeTagPatterns(drinks);
  if (patterns.length === 0) return null;

  // Overall avg is needed for the comparison line. R14-6 makes
  // stdDrinks() jurisdiction-aware via a module-level activeSystem.
  // Re-using stdDrinks() here keeps the displayed "vs overall"
  // baseline numerically consistent with computeTagPatterns' own
  // per-tag averages (which also call stdDrinks). Without this, UK
  // users (8 g per unit) would see a US-14g overall baseline next to
  // UK-8g per-tag rows — the deltas would render incoherent.
  const totalStd = drinks.reduce((s, d) => s + stdDrinks(d.volumeMl, d.abvPct), 0);
  const overallAvg = drinks.length > 0 ? totalStd / drinks.length : 0;

  return (
    <section
      data-testid="tag-patterns-card"
      aria-labelledby="tag-patterns-heading"
      className="rounded-2xl border border-border-soft bg-surface-elevated p-card space-y-3"
    >
      <h3 id="tag-patterns-heading" className="text-h3 text-ink">
        Tag patterns
      </h3>
      <p className="text-caption text-ink-soft">
        Tags appearing on at least 3 entries, sorted by how far their average diverges from your overall.
      </p>
      <ul className="space-y-2" data-testid="tag-patterns-list">
        {patterns.map((p) => {
          const heavier = p.deltaVsOverall > 0;
          return (
            <li
              key={p.tag}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-surface px-3 py-2"
              data-testid={`tag-pattern-${p.tag}`}
            >
              <span className="font-medium text-ink">#{p.tag}</span>
              <span className="text-caption text-ink-soft tabular-nums">
                {p.count} {p.count === 1 ? 'entry' : 'entries'}
                {' · '}
                avg {fmt(p.avgStd)} std
                {' · '}
                <span className={heavier ? 'text-ink' : 'text-ink-soft'}>
                  {heavier ? '+' : ''}
                  {fmt(p.deltaVsOverall)} vs overall {fmt(overallAvg)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
