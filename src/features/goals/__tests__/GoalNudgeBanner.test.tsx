/**
 * [R15-2 / R16-B] GoalNudgeBanner tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import GoalNudgeBanner from '../GoalNudgeBanner';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';
import { assignVariant } from '../../experiments/bucket';
import { findExperiment } from '../../experiments/registry';

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

/* [R16-B] A/B copy variant. Bucket-pinning is identical to the
 * R15-B onboarding chip-copy test: seed exp.device-bucket directly,
 * useExperiment hashes deterministically. Both arms render the same
 * avg + goal numbers; only the surrounding sentence changes. */
describe('[R16-B] GoalNudgeBanner copy variant', () => {
  function findBucketFor(variant: 'control' | 'softer'): string {
    const exp = findExperiment('goal-nudge-copy-2026Q2');
    if (!exp) throw new Error('experiment not found in registry');
    for (let i = 0; i < 5000; i++) {
      const bucket = `nudge-bucket-${i}`;
      if (assignVariant(exp, bucket) === variant) return bucket;
    }
    throw new Error(`No bucket found for variant=${variant} within 5000 tries`);
  }

  it('control bucket renders comparison-then-question copy', () => {
    const bucket = findBucketFor('control');
    window.localStorage.setItem('exp.device-bucket', bucket);
    render(<GoalNudgeBanner nudge={{ avgPerDay: 2.0, goalPerDay: 1.5 }} />);
    const banner = screen.getByTestId('goal-nudge-banner');
    expect(banner).toHaveAttribute('data-copy-variant', 'control');
    expect(banner).toHaveTextContent("You've been at");
    expect(banner).toHaveTextContent('Want to revisit it?');
  });

  it('softer bucket renders goal-first observation copy', () => {
    const bucket = findBucketFor('softer');
    window.localStorage.setItem('exp.device-bucket', bucket);
    render(<GoalNudgeBanner nudge={{ avgPerDay: 2.0, goalPerDay: 1.5 }} />);
    const banner = screen.getByTestId('goal-nudge-banner');
    expect(banner).toHaveAttribute('data-copy-variant', 'softer');
    expect(banner).toHaveTextContent('Your goal is');
    expect(banner).toHaveTextContent('Some weeks land different');
    expect(banner).toHaveTextContent("adjust if it's helpful");
  });

  it('both arms keep the avg + goal testids stable for downstream consumers', () => {
    const bucket = findBucketFor('softer');
    window.localStorage.setItem('exp.device-bucket', bucket);
    render(<GoalNudgeBanner nudge={{ avgPerDay: 2.0, goalPerDay: 1.5 }} />);
    expect(screen.getByTestId('goal-nudge-avg')).toHaveTextContent('2.0');
    expect(screen.getByTestId('goal-nudge-goal')).toHaveTextContent('1.5');
  });
});
