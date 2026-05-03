import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Milestones, { getMilestoneStates } from '../Milestones';
import type { Drink } from '../../../types/common';

function makeDrink(ts: number): Drink {
  return {
    ts,
    volumeMl: 350,
    abvPct: 5,
    intention: 'social',
    craving: 1,
    halt: [],
    alt: '',
  } as Drink;
}

const ONE_DAY = 24 * 60 * 60 * 1000;

describe('Milestones — quiet dated entries (replaces Levels/Points)', () => {
  it('lists all canonical milestones, including the [R17-1] 2yr/5yr tiers', () => {
    render(<Milestones drinks={[]} />);
    expect(screen.getByText(/First alcohol-free day/i)).toBeInTheDocument();
    expect(screen.getByText(/1 week alcohol-free/i)).toBeInTheDocument();
    expect(screen.getByText(/30 days alcohol-free/i)).toBeInTheDocument();
    expect(screen.getByText(/90 days alcohol-free/i)).toBeInTheDocument();
    expect(screen.getByText(/1 year alcohol-free/i)).toBeInTheDocument();
    expect(screen.getByText(/2 years alcohol-free/i)).toBeInTheDocument();
    expect(screen.getByText(/5 years alcohol-free/i)).toBeInTheDocument();
  });

  it('all unreached when no drinks history', () => {
    const states = getMilestoneStates([]);
    for (const s of states) expect(s.reached).toBe(false);
  });

  it('first day reached when one full AF day exists after a drink', () => {
    const drink = makeDrink(Date.now() - 3 * ONE_DAY);
    const states = getMilestoneStates([drink]);
    const firstDay = states.find((s) => s.id === 'first-day');
    expect(firstDay?.reached).toBe(true);
    expect(typeof firstDay?.reachedAt).toBe('number');
  });

  it('does not advertise points / levels / XP language anywhere', () => {
    render(<Milestones drinks={[]} />);
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/level/i);
    expect(text).not.toMatch(/\bpoints?\b/i);
    expect(text).not.toMatch(/\bxp\b/i);
    expect(text).not.toMatch(/unlock/i);
  });

  it('renders a check glyph for reached + dash for unreached', () => {
    const drink = makeDrink(Date.now() - 3 * ONE_DAY);
    render(<Milestones drinks={[drink]} />);
    // First day reached → ✓ visible. 1 year unreached → at least one —.
    const text = document.body.textContent ?? '';
    expect(text).toContain('✓');
    expect(text).toContain('—');
  });
});
