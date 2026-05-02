// @no-smoke
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DrinkList from '../DrinkList';
import type { Drink } from '../DrinkForm';

const NOW = new Date('2026-05-15T15:00:00Z').getTime();
const DAY = 86_400_000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function drink(daysAgo: number, hour = 18): Drink {
  // Anchor on local-day boundary for the daysAgo, then add `hour` hours.
  // Tests don't depend on exact local TZ of test runner.
  const base = NOW - daysAgo * DAY;
  const d = new Date(base);
  d.setUTCHours(hour, 0, 0, 0);
  return {
    ts: d.getTime(),
    volumeMl: 350,
    abvPct: 5,
    intention: 'social',
    craving: 0,
    halt: [],
    alt: '',
  };
}

const FIXTURE: Drink[] = [
  drink(0, 18),
  drink(0, 20),
  drink(1, 21),
  drink(3, 19),
  drink(8, 19), // 8 days ago — outside the "this week" window
];

describe('[R12-2] DrinkList bulk mode', () => {
  it('shows the "Bulk edit" button when drinks exist', () => {
    render(<DrinkList drinks={FIXTURE} />);
    expect(screen.getByTestId('bulk-enter')).toBeInTheDocument();
  });

  it('hides "Bulk edit" button when no drinks', () => {
    render(<DrinkList drinks={[]} />);
    expect(screen.queryByTestId('bulk-enter')).not.toBeInTheDocument();
  });

  it('reveals the action bar when bulk mode is entered', () => {
    render(<DrinkList drinks={FIXTURE} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument();
  });

  it('replaces per-row edit/delete with checkboxes in bulk mode', () => {
    render(<DrinkList drinks={FIXTURE} onEdit={() => undefined} onDelete={() => undefined} />);
    // Pre-bulk: see edit/delete labels.
    expect(screen.getAllByLabelText(/edit/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    // In bulk: per-drink checkbox surfaces, edit buttons hide.
    expect(
      screen.getByTestId(`bulk-checkbox-${FIXTURE[0]!.ts}`),
    ).toBeInTheDocument();
  });

  it('selects today via the quick-select scope', () => {
    render(<DrinkList drinks={FIXTURE} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    fireEvent.click(screen.getByTestId('bulk-select-today'));
    // Two of the fixture drinks are today (daysAgo=0).
    expect(screen.getByText(/2 drinks selected/)).toBeInTheDocument();
  });

  it('selects this week via the quick-select scope', () => {
    render(<DrinkList drinks={FIXTURE} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    fireEvent.click(screen.getByTestId('bulk-select-week'));
    // Four drinks are within the last 7 days; one is 8 days old.
    expect(screen.getByText(/4 drinks selected/)).toBeInTheDocument();
  });

  it('clears the selection', () => {
    render(<DrinkList drinks={FIXTURE} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    fireEvent.click(screen.getByTestId('bulk-select-week'));
    fireEvent.click(screen.getByTestId('bulk-clear'));
    expect(screen.getByText(/0 drinks selected/)).toBeInTheDocument();
  });

  it('toggles a drink via its checkbox', () => {
    render(<DrinkList drinks={FIXTURE} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    fireEvent.click(screen.getByTestId(`bulk-checkbox-${FIXTURE[0]!.ts}`));
    expect(screen.getByText(/1 drink selected/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(`bulk-checkbox-${FIXTURE[0]!.ts}`));
    expect(screen.getByText(/0 drinks selected/)).toBeInTheDocument();
  });

  it('calls onBulkDelete with the selected ts list', () => {
    const onBulkDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<DrinkList drinks={FIXTURE} onBulkDelete={onBulkDelete} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    fireEvent.click(screen.getByTestId('bulk-select-today'));
    fireEvent.click(screen.getByTestId('bulk-delete'));
    expect(onBulkDelete).toHaveBeenCalledTimes(1);
    expect(onBulkDelete.mock.calls[0]?.[0]).toHaveLength(2);
  });

  it('cancels delete when window.confirm returns false', () => {
    const onBulkDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<DrinkList drinks={FIXTURE} onBulkDelete={onBulkDelete} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    fireEvent.click(screen.getByTestId('bulk-select-today'));
    fireEvent.click(screen.getByTestId('bulk-delete'));
    expect(onBulkDelete).not.toHaveBeenCalled();
  });

  it('disables delete when nothing is selected', () => {
    render(<DrinkList drinks={FIXTURE} onBulkDelete={() => undefined} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    const button = screen.getByTestId('bulk-delete') as HTMLButtonElement;
    expect(button).toBeDisabled();
  });

  it('falls back to onDelete when onBulkDelete is not wired', () => {
    const onDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<DrinkList drinks={FIXTURE} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    fireEvent.click(screen.getByTestId('bulk-select-today'));
    fireEvent.click(screen.getByTestId('bulk-delete'));
    expect(onDelete).toHaveBeenCalledTimes(2);
  });

  it('exits bulk mode and clears selection on Done', () => {
    render(<DrinkList drinks={FIXTURE} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    fireEvent.click(screen.getByTestId('bulk-select-today'));
    fireEvent.click(screen.getByTestId('bulk-exit'));
    expect(screen.queryByTestId('bulk-action-bar')).not.toBeInTheDocument();
    expect(screen.getByTestId('bulk-enter')).toBeInTheDocument();
  });

  it('exits bulk mode after a successful delete', () => {
    const onBulkDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<DrinkList drinks={FIXTURE} onBulkDelete={onBulkDelete} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    fireEvent.click(screen.getByTestId('bulk-select-today'));
    fireEvent.click(screen.getByTestId('bulk-delete'));
    expect(screen.queryByTestId('bulk-action-bar')).not.toBeInTheDocument();
  });

  it('calls onBulkShiftTime with the right delta', () => {
    const onBulkShiftTime = vi.fn();
    render(<DrinkList drinks={FIXTURE} onBulkShiftTime={onBulkShiftTime} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    fireEvent.click(screen.getByTestId('bulk-select-today'));
    fireEvent.click(screen.getByTestId('bulk-time--60'));
    expect(onBulkShiftTime).toHaveBeenCalledWith(expect.any(Array), -60);
  });

  it('calls onBulkScaleStd with the right factor', () => {
    const onBulkScaleStd = vi.fn();
    render(<DrinkList drinks={FIXTURE} onBulkScaleStd={onBulkScaleStd} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    fireEvent.click(screen.getByTestId('bulk-select-today'));
    fireEvent.click(screen.getByTestId('bulk-std-0.5'));
    expect(onBulkScaleStd).toHaveBeenCalledWith(expect.any(Array), 0.5);
  });

  it('clears selection after a time shift (so next op starts clean)', () => {
    const onBulkShiftTime = vi.fn();
    render(<DrinkList drinks={FIXTURE} onBulkShiftTime={onBulkShiftTime} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    fireEvent.click(screen.getByTestId('bulk-select-today'));
    fireEvent.click(screen.getByTestId('bulk-time-60'));
    expect(screen.getByText(/0 drinks selected/)).toBeInTheDocument();
  });

  it('day-level select toggles every drink in that group', () => {
    render(<DrinkList drinks={FIXTURE} />);
    fireEvent.click(screen.getByTestId('bulk-enter'));
    // Today has 2 drinks. Find the Select-day button for today's day key.
    const todayKey = new Date(FIXTURE[0]!.ts).toISOString().slice(0, 10);
    const button = screen.getByTestId(`day-select-${todayKey}`);
    fireEvent.click(button);
    expect(screen.getByText(/2 drinks selected/)).toBeInTheDocument();
    // Click again — toggles off.
    fireEvent.click(button);
    expect(screen.getByText(/0 drinks selected/)).toBeInTheDocument();
  });
});
