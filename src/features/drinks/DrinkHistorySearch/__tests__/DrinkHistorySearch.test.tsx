import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DrinkHistorySearch from '../index';
import type { DrinkSearchCriteria } from '../filterDrinks';

describe('[R14-2] DrinkHistorySearch component', () => {
  function renderBar(overrides: Partial<{ totalCount: number; matchedCount: number }> = {}) {
    const onCriteriaChange = vi.fn<(c: DrinkSearchCriteria) => void>();
    const utils = render(
      <DrinkHistorySearch
        onCriteriaChange={onCriteriaChange}
        totalCount={overrides.totalCount ?? 10}
        matchedCount={overrides.matchedCount ?? 10}
      />,
    );
    return { onCriteriaChange, ...utils };
  }

  it('renders the search input', () => {
    renderBar();
    expect(screen.getByPlaceholderText(/Search history/i)).toBeInTheDocument();
  });

  it('emits criteria with query when user types', () => {
    const { onCriteriaChange } = renderBar();
    const input = screen.getByPlaceholderText(/Search history/i);
    fireEvent.change(input, { target: { value: 'wine' } });
    // The component emits on every change via useEffect; the latest
    // call has the query field set.
    const calls = onCriteriaChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall?.[0]?.query).toBe('wine');
  });

  it('hides advanced filters by default', () => {
    renderBar();
    expect(screen.queryByTestId('drink-search-advanced')).not.toBeInTheDocument();
  });

  it('toggles advanced filters open via the Filters button', () => {
    renderBar();
    fireEvent.click(screen.getByTestId('drink-search-advanced-toggle'));
    expect(screen.getByTestId('drink-search-advanced')).toBeInTheDocument();
    expect(screen.getByTestId('drink-search-date-from')).toBeInTheDocument();
    expect(screen.getByTestId('drink-search-std-max')).toBeInTheDocument();
  });

  it('does not show summary line when no filter is active', () => {
    renderBar();
    expect(screen.queryByTestId('drink-search-summary')).not.toBeInTheDocument();
  });

  it('shows "X of Y" summary when filter is active', () => {
    const { rerender, onCriteriaChange } = renderBar({ totalCount: 10, matchedCount: 10 });
    fireEvent.change(screen.getByPlaceholderText(/Search history/i), {
      target: { value: 'cope' },
    });
    // Host typically re-renders with reduced matchedCount after applying
    // the filter — simulate that by rerendering with matchedCount=3.
    rerender(
      <DrinkHistorySearch
        onCriteriaChange={onCriteriaChange}
        totalCount={10}
        matchedCount={3}
      />,
    );
    expect(screen.getByTestId('drink-search-summary')).toHaveTextContent(
      /3 of 10 entries match/i,
    );
  });

  it('clears all filters when the Clear button is clicked', () => {
    const { onCriteriaChange } = renderBar();
    fireEvent.change(screen.getByPlaceholderText(/Search history/i), {
      target: { value: 'wine' },
    });
    fireEvent.click(screen.getByTestId('drink-search-clear'));
    const calls = onCriteriaChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall?.[0]?.query).toBeUndefined();
    expect(lastCall?.[0]?.dateFrom).toBeUndefined();
  });

  it('emits dateFrom when user picks a from-date in advanced filters', () => {
    const { onCriteriaChange } = renderBar();
    fireEvent.click(screen.getByTestId('drink-search-advanced-toggle'));
    fireEvent.change(screen.getByTestId('drink-search-date-from'), {
      target: { value: '2026-04-01' },
    });
    const calls = onCriteriaChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(typeof lastCall?.[0]?.dateFrom).toBe('number');
  });

  it('parses date inputs as LOCAL midnight, not UTC midnight', () => {
    /* Bug surfaced by Codex review on PR #48: <input type="date">
     * values are local calendar dates, but Date.parse('YYYY-MM-DD')
     * interprets them as UTC. In non-UTC zones this shifts boundaries
     * by the user's offset and excludes/includes entries on the wrong
     * day near midnight. The fix uses local-time Date construction. */
    const { onCriteriaChange } = renderBar();
    fireEvent.click(screen.getByTestId('drink-search-advanced-toggle'));
    fireEvent.change(screen.getByTestId('drink-search-date-from'), {
      target: { value: '2026-04-01' },
    });
    const calls = onCriteriaChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    const dateFrom = lastCall?.[0]?.dateFrom;
    expect(typeof dateFrom).toBe('number');
    // Local midnight at 2026-04-01: hour/min/sec/ms all zero in local TZ.
    const asDate = new Date(dateFrom!);
    expect(asDate.getFullYear()).toBe(2026);
    expect(asDate.getMonth()).toBe(3); // April (0-indexed)
    expect(asDate.getDate()).toBe(1);
    expect(asDate.getHours()).toBe(0);
    expect(asDate.getMinutes()).toBe(0);
    expect(asDate.getSeconds()).toBe(0);
  });

  it('parses dateTo as end-of-day local time (23:59:59.999)', () => {
    const { onCriteriaChange } = renderBar();
    fireEvent.click(screen.getByTestId('drink-search-advanced-toggle'));
    fireEvent.change(screen.getByTestId('drink-search-date-to'), {
      target: { value: '2026-04-01' },
    });
    const calls = onCriteriaChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    const dateTo = lastCall?.[0]?.dateTo;
    expect(typeof dateTo).toBe('number');
    const asDate = new Date(dateTo!);
    expect(asDate.getFullYear()).toBe(2026);
    expect(asDate.getMonth()).toBe(3);
    expect(asDate.getDate()).toBe(1);
    expect(asDate.getHours()).toBe(23);
    expect(asDate.getMinutes()).toBe(59);
    expect(asDate.getSeconds()).toBe(59);
  });

  it('emits stdMin when user enters a min-std value', () => {
    const { onCriteriaChange } = renderBar();
    fireEvent.click(screen.getByTestId('drink-search-advanced-toggle'));
    fireEvent.change(screen.getByTestId('drink-search-std-min'), {
      target: { value: '1.5' },
    });
    const calls = onCriteriaChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall?.[0]?.stdMin).toBe(1.5);
  });

  it('ignores negative std values (treats as no filter)', () => {
    const { onCriteriaChange } = renderBar();
    fireEvent.click(screen.getByTestId('drink-search-advanced-toggle'));
    fireEvent.change(screen.getByTestId('drink-search-std-min'), {
      target: { value: '-5' },
    });
    const calls = onCriteriaChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall?.[0]?.stdMin).toBeUndefined();
  });

  it('uses singular "entry" when totalCount is 1', () => {
    const { rerender, onCriteriaChange } = renderBar({ totalCount: 1, matchedCount: 1 });
    fireEvent.change(screen.getByPlaceholderText(/Search history/i), {
      target: { value: 'cope' },
    });
    rerender(
      <DrinkHistorySearch
        onCriteriaChange={onCriteriaChange}
        totalCount={1}
        matchedCount={0}
      />,
    );
    expect(screen.getByTestId('drink-search-summary')).toHaveTextContent(
      /0 of 1 entry match/i,
    );
  });
});
