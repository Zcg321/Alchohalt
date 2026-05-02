import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GoalEvolution, {
  shouldShowEvolution,
  evolutionPatch,
} from '../GoalEvolution';
import type { AdvancedGoal } from '../types';

function makeGoal(overrides: Partial<AdvancedGoal> = {}): AdvancedGoal {
  return {
    id: 'g1',
    type: 'streak',
    title: '30 days clean',
    description: 'A full month.',
    target: 30,
    current: 30,
    unit: 'days',
    isActive: true,
    ...overrides,
  };
}

describe('shouldShowEvolution', () => {
  it('shows when streak goal hits target', () => {
    expect(shouldShowEvolution(makeGoal({ current: 30, target: 30 }))).toBe(true);
  });

  it('shows when streak exceeds target', () => {
    expect(shouldShowEvolution(makeGoal({ current: 45, target: 30 }))).toBe(true);
  });

  it('hides when streak goal is below target', () => {
    expect(shouldShowEvolution(makeGoal({ current: 29, target: 30 }))).toBe(false);
  });

  it('hides for non-streak goals', () => {
    expect(
      shouldShowEvolution(makeGoal({ type: 'reduction', current: 50, target: 50 }))
    ).toBe(false);
  });

  it('hides for inactive goals', () => {
    expect(shouldShowEvolution(makeGoal({ isActive: false }))).toBe(false);
  });

  it('hides when target is 0', () => {
    expect(shouldShowEvolution(makeGoal({ target: 0 }))).toBe(false);
  });
});

describe('evolutionPatch', () => {
  it('extend doubles target for 30-day goal', () => {
    expect(evolutionPatch(makeGoal({ target: 30 }), 'extend').target).toBe(60);
  });

  it('extend doubles target for 60-day goal', () => {
    expect(evolutionPatch(makeGoal({ target: 60 }), 'extend').target).toBe(120);
  });

  it('extend adds at least 30 days for tiny goals', () => {
    expect(evolutionPatch(makeGoal({ target: 7 }), 'extend').target).toBe(37);
  });

  it('maintenance switches to habit type', () => {
    const p = evolutionPatch(makeGoal(), 'maintenance');
    expect(p.type).toBe('habit');
    expect(p.target).toBe(1);
    expect(p.current).toBe(0);
  });

  it('budget switches to reduction with 4-drink target', () => {
    const p = evolutionPatch(makeGoal(), 'budget');
    expect(p.type).toBe('reduction');
    expect(p.target).toBe(4);
  });
});

describe('GoalEvolution component', () => {
  it('renders three options and calls onEvolve with extend patch', () => {
    const onEvolve = vi.fn();
    const onDismiss = vi.fn();
    render(<GoalEvolution goal={makeGoal()} onEvolve={onEvolve} onDismiss={onDismiss} />);
    expect(screen.getByText(/Keep going/i)).toBeInTheDocument();
    expect(screen.getByText(/weekly check-in/i)).toBeInTheDocument();
    expect(screen.getByText(/Maintenance budget/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Keep going/i));
    expect(onEvolve).toHaveBeenCalledWith(expect.objectContaining({ target: 60 }));
  });

  it('calls onDismiss when X clicked', () => {
    const onEvolve = vi.fn();
    const onDismiss = vi.fn();
    render(<GoalEvolution goal={makeGoal()} onEvolve={onEvolve} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText(/Not now/i));
    expect(onDismiss).toHaveBeenCalled();
  });
});
