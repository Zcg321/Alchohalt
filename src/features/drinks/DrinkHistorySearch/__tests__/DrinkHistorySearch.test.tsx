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
    const lastCall = onCriteriaChange.mock.calls.at(-1);
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
    const lastCall = onCriteriaChange.mock.calls.at(-1);
    expect(lastCall?.[0]?.query).toBeUndefined();
    expect(lastCall?.[0]?.dateFrom).toBeUndefined();
  });

  it('emits dateFrom when user picks a from-date in advanced filters', () => {
    const { onCriteriaChange } = renderBar();
    fireEvent.click(screen.getByTestId('drink-search-advanced-toggle'));
    fireEvent.change(screen.getByTestId('drink-search-date-from'), {
      target: { value: '2026-04-01' },
    });
    const lastCall = onCriteriaChange.mock.calls.at(-1);
    expect(typeof lastCall?.[0]?.dateFrom).toBe('number');
  });

  it('emits stdMin when user enters a min-std value', () => {
    const { onCriteriaChange } = renderBar();
    fireEvent.click(screen.getByTestId('drink-search-advanced-toggle'));
    fireEvent.change(screen.getByTestId('drink-search-std-min'), {
      target: { value: '1.5' },
    });
    const lastCall = onCriteriaChange.mock.calls.at(-1);
    expect(lastCall?.[0]?.stdMin).toBe(1.5);
  });

  it('ignores negative std values (treats as no filter)', () => {
    const { onCriteriaChange } = renderBar();
    fireEvent.click(screen.getByTestId('drink-search-advanced-toggle'));
    fireEvent.change(screen.getByTestId('drink-search-std-min'), {
      target: { value: '-5' },
    });
    const lastCall = onCriteriaChange.mock.calls.at(-1);
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
