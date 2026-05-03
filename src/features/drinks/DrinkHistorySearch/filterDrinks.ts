/**
 * [R14-2] Pure search/filter logic for the Track tab history.
 *
 * Lives apart from the React component so it's easy to test the
 * matching rules without rendering. The component is just a UI
 * adapter on top of this function.
 *
 * Search dimensions:
 *
 *   query   — case-insensitive substring match against intention +
 *             alt + tags (when present). Empty/whitespace = match all.
 *
 *   dateFrom / dateTo — inclusive ms boundaries on Drink.ts. The host
 *             component should pass full-day boundaries (start of
 *             day for `from`, end of day for `to`) to avoid surprising
 *             off-by-one behavior on date-only inputs.
 *
 *   stdMin / stdMax  — inclusive boundaries on the computed std-drink
 *             count for each entry.
 *
 * Forward-compat: when R14-3 adds `Drink.tags`, the query check
 * already reads from `d.tags ?? []` and joins them into the haystack,
 * so tag-text search lights up automatically.
 */
import type { Drink } from '../../../types/common';
import { stdDrinks } from '../../../lib/calc';

export interface DrinkSearchCriteria {
  /** Free-text query; matches against intention, alt, and tags. */
  query?: string | undefined;
  /** Inclusive lower bound on Drink.ts (ms). */
  dateFrom?: number | undefined;
  /** Inclusive upper bound on Drink.ts (ms). */
  dateTo?: number | undefined;
  /** Inclusive lower bound on computed std drinks. */
  stdMin?: number | undefined;
  /** Inclusive upper bound on computed std drinks. */
  stdMax?: number | undefined;
}

export function filterDrinks(drinks: Drink[], criteria: DrinkSearchCriteria): Drink[] {
  const q = criteria.query?.trim().toLowerCase() ?? '';
  const hasQuery = q.length > 0;
  const { dateFrom, dateTo, stdMin, stdMax } = criteria;

  return drinks.filter((d) => {
    if (hasQuery) {
      const tags = d.tags ?? [];
      const haystack = [d.intention, d.alt ?? '', ...tags].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (dateFrom !== undefined && d.ts < dateFrom) return false;
    if (dateTo !== undefined && d.ts > dateTo) return false;

    if (stdMin !== undefined || stdMax !== undefined) {
      const std = stdDrinks(d.volumeMl, d.abvPct);
      if (stdMin !== undefined && std < stdMin) return false;
      if (stdMax !== undefined && std > stdMax) return false;
    }

    return true;
  });
}

export function isCriteriaEmpty(criteria: DrinkSearchCriteria): boolean {
  return (
    !criteria.query?.trim() &&
    criteria.dateFrom === undefined &&
    criteria.dateTo === undefined &&
    criteria.stdMin === undefined &&
    criteria.stdMax === undefined
  );
}
