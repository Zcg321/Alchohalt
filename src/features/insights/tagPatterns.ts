/**
 * [R14-3] Tag-pattern analyzer.
 *
 * For each tag the user has applied to drinks, computes how many
 * drinks carry it and the average std-drink count for those drinks.
 * Surfaces tags that diverge meaningfully from the user's overall
 * average — e.g. "your highest-std drinks tend to have #stressed."
 *
 * Voice contract for the consuming card: factual, no pathologizing.
 * The tag patterns are pattern-noticing, not value judgements.
 *
 * Filtering rules (intentional):
 *   - Tags with fewer than `minOccurrences` (default 3) are dropped.
 *     Two data points isn't a pattern; it's a coincidence the user
 *     can pattern-match on their own without our help.
 *   - Patterns are sorted by absolute deltaVsOverall, descending —
 *     the most divergent tags surface first. The card decides how
 *     many to show.
 *
 * Pure function; no side effects, no React.
 */
import type { Drink } from '../../types/common';
import { stdDrinks } from '../../lib/calc';

export interface TagPattern {
  tag: string;
  count: number;
  avgStd: number;
  /** Difference between this tag's avgStd and the overall avgStd. */
  deltaVsOverall: number;
}

interface Options {
  /** A tag must appear on at least this many drinks to be surfaced. */
  minOccurrences?: number | undefined;
  /** Maximum tags returned. Sorted by |delta| desc; ties stable. */
  limit?: number | undefined;
}

const DEFAULT_MIN_OCCURRENCES = 3;
const DEFAULT_LIMIT = 5;

export function computeTagPatterns(
  drinks: Drink[],
  opts: Options = {},
): TagPattern[] {
  const minOccurrences = opts.minOccurrences ?? DEFAULT_MIN_OCCURRENCES;
  const limit = opts.limit ?? DEFAULT_LIMIT;

  if (drinks.length === 0) return [];

  // Compute overall avg-std once; the per-tag delta is relative to
  // this baseline.
  let overallStdSum = 0;
  let overallCount = 0;
  for (const d of drinks) {
    overallStdSum += stdDrinks(d.volumeMl, d.abvPct);
    overallCount += 1;
  }
  const overallAvg = overallCount > 0 ? overallStdSum / overallCount : 0;

  // Per-tag aggregation. Map tag → { count, sumStd }.
  const map = new Map<string, { count: number; sumStd: number }>();
  for (const d of drinks) {
    const tags = d.tags ?? [];
    if (tags.length === 0) continue;
    const std = stdDrinks(d.volumeMl, d.abvPct);
    for (const tag of tags) {
      const cur = map.get(tag) ?? { count: 0, sumStd: 0 };
      cur.count += 1;
      cur.sumStd += std;
      map.set(tag, cur);
    }
  }

  const patterns: TagPattern[] = [];
  for (const [tag, agg] of map.entries()) {
    if (agg.count < minOccurrences) continue;
    const avgStd = agg.sumStd / agg.count;
    patterns.push({
      tag,
      count: agg.count,
      avgStd,
      deltaVsOverall: avgStd - overallAvg,
    });
  }

  patterns.sort((a, b) => Math.abs(b.deltaVsOverall) - Math.abs(a.deltaVsOverall));
  return patterns.slice(0, limit);
}
