/**
 * [R14-3] Tag-pattern insights card.
 * [R15-A] Tags are now tappable buttons that open an inline tag explorer
 * with weekday + hour distributions and the 10 most recent entries.
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
import React, { useState } from 'react';
import type { Drink } from '../../types/common';
import { stdDrinks } from '../../lib/calc';
import { computeTagPatterns } from './tagPatterns';
import TagExplorer from './TagExplorer';

interface Props {
  drinks: Drink[];
}

function fmt(n: number): string {
  return n.toFixed(2);
}

export default function TagPatternsCard({ drinks }: Props) {
  const [openTag, setOpenTag] = useState<string | null>(null);
  const patterns = computeTagPatterns(drinks);
  if (patterns.length === 0) return null;

  // R14-6 makes stdDrinks() jurisdiction-aware via a module-level
  // activeSystem; re-using it here keeps the displayed "vs overall"
  // baseline numerically consistent with the per-tag averages.
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
        Tags appearing on at least 3 entries. Tap one to see weekday and hour-of-day shape.
      </p>
      <ul className="space-y-2" data-testid="tag-patterns-list">
        {patterns.map((p) => {
          const heavier = p.deltaVsOverall > 0;
          const isOpen = openTag === p.tag;
          return (
            <li key={p.tag} data-testid={`tag-pattern-${p.tag}`}>
              <button
                type="button"
                onClick={() => setOpenTag(isOpen ? null : p.tag)}
                aria-expanded={isOpen}
                aria-controls={isOpen ? `tag-explorer-${p.tag}-heading` : undefined}
                className="flex w-full flex-wrap items-baseline justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-start hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-primary-500"
                data-testid={`tag-pattern-button-${p.tag}`}
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
              </button>
            </li>
          );
        })}
      </ul>
      {openTag !== null && (
        <TagExplorer
          drinks={drinks}
          tag={openTag}
          onClose={() => setOpenTag(null)}
        />
      )}
    </section>
  );
}
