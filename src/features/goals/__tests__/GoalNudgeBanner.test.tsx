/**
 * [R15-2] GoalNudgeBanner tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import GoalNudgeBanner from '../GoalNudgeBanner';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.setState({
    db: {
      ...useDB.getState().db,
      settings: {
        ...useDB.getState().db.settings,
        goalNudgesEnabled: undefined,
        goalNudgeDismissedAt: undefined,
      },
    },
  });
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('[R15-2] GoalNudgeBanner', () => {
  it('renders avg + goal numbers', () => {
    render(
      <GoalNudgeBanner nudge={{ avgPerDay: 2.4, goalPerDay: 1.5 }} />
    );
    expect(screen.getByTestId('goal-nudge-banner')).toBeInTheDocument();
    expect(screen.getByTestId('goal-nudge-avg')).toHaveTextContent('2.4');
    expect(screen.getByTestId('goal-nudge-goal')).toHaveTextContent('1.5');
  });

  it('uses role=status with aria-live=polite', () => {
    render(<GoalNudgeBanner nudge={{ avgPerDay: 2.4, goalPerDay: 1.5 }} />);
    const banner = screen.getByTestId('goal-nudge-banner');
    expect(banner).toHaveAttribute('role', 'status');
    expect(banner).toHaveAttribute('aria-live', 'polite');
  });

  it('persists goalNudgeDismissedAt on dismiss', () => {
    render(<GoalNudgeBanner nudge={{ avgPerDay: 2.4, goalPerDay: 1.5 }} />);
    expect(useDB.getState().db.settings.goalNudgeDismissedAt).toBeUndefined();
    fireEvent.click(screen.getByTestId('goal-nudge-dismiss'));
    const ts = useDB.getState().db.settings.goalNudgeDismissedAt;
    expect(ts).toBeGreaterThan(0);
  });

  it('calls onRevisit prop when provided', () => {
    const onRevisit = vi.fn();
    render(
      <GoalNudgeBanner
        nudge={{ avgPerDay: 2.4, goalPerDay: 1.5 }}
        onRevisit={onRevisit}
      />
    );
    fireEvent.click(screen.getByTestId('goal-nudge-revisit'));
    expect(onRevisit).toHaveBeenCalledTimes(1);
  });

  it('dispatches alch:revisit-goal event when onRevisit not provided', () => {
    const handler = vi.fn();
    window.addEventListener('alch:revisit-goal', handler);
    render(<GoalNudgeBanner nudge={{ avgPerDay: 2.4, goalPerDay: 1.5 }} />);
    fireEvent.click(screen.getByTestId('goal-nudge-revisit'));
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener('alch:revisit-goal', handler);
  });
});
