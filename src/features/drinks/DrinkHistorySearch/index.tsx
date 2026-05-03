/**
 * [R14-2] Drink-history search bar.
 *
 * Lives above DrinkList on the Track tab. Surfaces a free-text query
 * with optional advanced filters (date range, std count). On every
 * change it emits the criteria up to the host so the host can apply
 * the pure filterDrinks() function and re-render.
 *
 * Voice notes:
 *   - Empty filter state shows nothing extra; the bar is just an
 *     input until the user touches it.
 *   - When filters are active, a quiet "X of Y entries" line surfaces
 *     so the user can tell they're not seeing the whole list.
 *   - Advanced filters are collapsed by default to avoid mobile
 *     clutter; expand on demand via a single toggle.
 *
 * Wiring intentionally narrow: the component owns the form state
 * (text in inputs) and emits the parsed criteria object. The host
 * applies the filter — keeps DrinkList itself unaware of search.
 */
import React, { useEffect, useMemo, useState } from 'react';
import type { DrinkSearchCriteria } from './filterDrinks';
import { isCriteriaEmpty } from './filterDrinks';
import { useLanguage } from '../../../i18n';
import { pluralNoun } from '../../../i18n/plural';

interface Props {
  onCriteriaChange: (criteria: DrinkSearchCriteria) => void;
  /** Total entries in the unfiltered list — used in the result-count summary. */
  totalCount: number;
  /** Entries visible after filter applied — used in the result-count summary. */
  matchedCount: number;
}

/**
 * Parse "YYYY-MM-DD" from an <input type="date"> as LOCAL-time
 * boundaries.
 *
 * Date.parse("YYYY-MM-DD") interprets the string as UTC midnight,
 * which shifts the filter boundary by the user's UTC offset. A user
 * in UTC-5 picking "2026-04-01" would get a boundary at 7 PM local
 * on March 31 — entries logged in the late evening of March 31 local
 * time would be incorrectly included in a "from April 1" filter.
 *
 * Construct the Date with local year/month/day fields instead so the
 * boundary lines up with the user's perception of the day.
 */
function parseLocalDateBoundary(
  dateInput: string,
  position: 'start' | 'end',
): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
  if (!m) return Number.NaN;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (position === 'end') {
    return new Date(year, month, day, 23, 59, 59, 999).getTime();
  }
  return new Date(year, month, day, 0, 0, 0, 0).getTime();
}

function endOfDay(dateInput: string): number {
  return parseLocalDateBoundary(dateInput, 'end');
}

function startOfDay(dateInput: string): number {
  return parseLocalDateBoundary(dateInput, 'start');
}

function parseNonNegFloat(s: string): number | undefined {
  if (!s.trim()) return undefined;
  const n = parseFloat(s);
  if (Number.isNaN(n) || n < 0) return undefined;
  return n;
}

interface AdvancedFiltersProps {
  dateFrom: string;
  dateTo: string;
  stdMin: string;
  stdMax: string;
  onChange: (field: 'dateFrom' | 'dateTo' | 'stdMin' | 'stdMax', value: string) => void;
}

function AdvancedFilters({
  dateFrom,
  dateTo,
  stdMin,
  stdMax,
  onChange,
}: AdvancedFiltersProps) {
  const inputClass =
    'rounded-xl border border-border-soft bg-surface px-3 py-2 text-body text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500';

  return (
    <div
      id="drink-search-advanced"
      data-testid="drink-search-advanced"
      className="grid grid-cols-2 gap-3"
    >
      <label className="flex flex-col gap-1 text-caption text-ink-soft">
        <span>From</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onChange('dateFrom', e.target.value)}
          data-testid="drink-search-date-from"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-caption text-ink-soft">
        <span>To</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onChange('dateTo', e.target.value)}
          data-testid="drink-search-date-to"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-caption text-ink-soft">
        <span>Min std</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.1"
          value={stdMin}
          onChange={(e) => onChange('stdMin', e.target.value)}
          data-testid="drink-search-std-min"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-caption text-ink-soft">
        <span>Max std</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.1"
          value={stdMax}
          onChange={(e) => onChange('stdMax', e.target.value)}
          data-testid="drink-search-std-max"
          className={inputClass}
        />
      </label>
    </div>
  );
}

export default function DrinkHistorySearch({
  onCriteriaChange,
  totalCount,
  matchedCount,
}: Props) {
  const { t: translate, lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [stdMin, setStdMin] = useState('');
  const [stdMax, setStdMax] = useState('');

  const criteria = useMemo<DrinkSearchCriteria>(() => {
    const c: DrinkSearchCriteria = {};
    if (query.trim()) c.query = query;
    if (dateFrom) {
      const t = startOfDay(dateFrom);
      if (!Number.isNaN(t)) c.dateFrom = t;
    }
    if (dateTo) {
      const t = endOfDay(dateTo);
      if (!Number.isNaN(t)) c.dateTo = t;
    }
    const min = parseNonNegFloat(stdMin);
    if (min !== undefined) c.stdMin = min;
    const max = parseNonNegFloat(stdMax);
    if (max !== undefined) c.stdMax = max;
    return c;
  }, [query, dateFrom, dateTo, stdMin, stdMax]);

  useEffect(() => {
    onCriteriaChange(criteria);
  }, [criteria, onCriteriaChange]);

  const empty = isCriteriaEmpty(criteria);

  const clearAll = () => {
    setQuery('');
    setDateFrom('');
    setDateTo('');
    setStdMin('');
    setStdMax('');
  };

  const onAdvancedChange = (
    field: 'dateFrom' | 'dateTo' | 'stdMin' | 'stdMax',
    value: string,
  ) => {
    if (field === 'dateFrom') setDateFrom(value);
    else if (field === 'dateTo') setDateTo(value);
    else if (field === 'stdMin') setStdMin(value);
    else if (field === 'stdMax') setStdMax(value);
  };

  return (
    <div
      data-testid="drink-history-search"
      className="rounded-2xl border border-border-soft bg-surface-elevated p-card space-y-3"
    >
      <div className="flex gap-2">
        <label htmlFor="drink-search-query" className="sr-only">
          Search history
        </label>
        <input
          id="drink-search-query"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search history (intention, notes, tags)"
          className="flex-1 rounded-xl border border-border-soft bg-surface px-3 py-2 text-body text-ink placeholder:text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          aria-expanded={advancedOpen}
          aria-controls="drink-search-advanced"
          onClick={() => setAdvancedOpen((v) => !v)}
          data-testid="drink-search-advanced-toggle"
          className="rounded-xl border border-border-soft bg-surface px-3 py-2 text-caption text-ink hover:bg-cream-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500"
        >
          {advancedOpen ? 'Hide filters' : 'Filters'}
        </button>
      </div>

      {advancedOpen && (
        <AdvancedFilters
          dateFrom={dateFrom}
          dateTo={dateTo}
          stdMin={stdMin}
          stdMax={stdMax}
          onChange={onAdvancedChange}
        />
      )}

      {!empty && (
        <div
          data-testid="drink-search-summary"
          className="flex items-center justify-between text-caption text-ink-soft"
        >
          <span aria-live="polite">
            {matchedCount} of {totalCount} {pluralNoun(translate, lang, 'unit.entry', totalCount, 'entry', 'entries')} match
          </span>
          <button
            type="button"
            onClick={clearAll}
            data-testid="drink-search-clear"
            className="rounded-pill border border-border-soft bg-surface px-3 py-1 text-caption text-ink hover:bg-cream-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
