import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import LongTermActivityRibbon, {
  compute7DaySummary,
  checkRibbonGate,
} from '../LongTermActivityRibbon';
import type { Drink, Goals } from '../../../types/common';

const NOW = new Date('2026-05-15T12:00:00Z').getTime();
const DAY = 86_400_000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function drink(daysAgo: number, abv = 5, vol = 350): Drink {
  return {
    ts: NOW - daysAgo * DAY,
    volumeMl: vol,
    abvPct: abv,
    intention: 'social',
    craving: 0,
    halt: [],
    alt: '',
  };
}

function af(daysAgo: number): Drink {
  // A "mark today AF" entry is std=0 (volumeMl=0, abvPct=0).
  return {
    ts: NOW - daysAgo * DAY,
    volumeMl: 0,
    abvPct: 0,
    intention: 'social',
    craving: 0,
    halt: [],
    alt: '',
  };
}

const goals: Goals = {
  dailyCap: 2,
  weeklyGoal: 7,
  pricePerStd: 5,
  baselineMonthlySpend: 200,
};

describe('[R12-A] checkRibbonGate', () => {
  it('rejects users with fewer than 7 entries', () => {
    expect(checkRibbonGate([])).toEqual({ pass: false, daysSinceFirstEntry: 0 });
    expect(checkRibbonGate([drink(40)])).toEqual({ pass: false, daysSinceFirstEntry: 0 });
    expect(
      checkRibbonGate([drink(40), drink(35), drink(30), drink(25), drink(20), drink(15)]),
    ).toEqual({ pass: false, daysSinceFirstEntry: 0 });
  });

  it('rejects users in their first 30 days (long-term gate)', () => {
    const seven = Array.from({ length: 7 }, (_, i) => drink(i + 1));
    const gate = checkRibbonGate(seven);
    expect(gate.pass).toBe(false);
    expect(gate.daysSinceFirstEntry).toBe(7);
  });

  it('passes for users with >= 7 entries and >= 30 days tracked', () => {
    const drinks = Array.from({ length: 7 }, (_, i) => drink(i * 5));
    const gate = checkRibbonGate(drinks);
    expect(gate.pass).toBe(true);
    expect(gate.daysSinceFirstEntry).toBe(30);
  });
});

describe('[R12-A] compute7DaySummary', () => {
  it('counts AF days when no drinks in the last 7', () => {
    const old = Array.from({ length: 7 }, (_, i) => drink(40 + i));
    const summary = compute7DaySummary(old, goals.dailyCap);
    expect(summary.afDays).toBe(7);
    expect(summary.loggedDrinkDays).toBe(0);
    expect(summary.daysOverCap).toBe(0);
  });

  it('counts logged drink days within the last 7 days', () => {
    const drinks = [
      drink(0),
      drink(1),
      drink(2),
      drink(40),
      drink(41),
      drink(42),
      drink(43),
    ];
    const summary = compute7DaySummary(drinks, goals.dailyCap);
    expect(summary.loggedDrinkDays).toBe(3);
    expect(summary.afDays).toBe(4);
  });

  it('counts a day as logged-drink when std > 0, regardless of how many drinks', () => {
    const drinks = [
      drink(0, 5, 350),
      drink(0, 5, 350),
      ...Array.from({ length: 5 }, (_, i) => drink(40 + i)),
    ];
    const summary = compute7DaySummary(drinks, goals.dailyCap);
    expect(summary.loggedDrinkDays).toBe(1);
    expect(summary.afDays).toBe(6);
  });

  it('counts daysOverCap when std on a day exceeds the cap', () => {
    // 350ml × 5% × 0.789 / 14 ≈ 0.986 std. Cap is 2.
    // 3 such drinks in one day → 2.96 → over.
    const drinks = [
      drink(0, 5, 350),
      drink(0, 5, 350),
      drink(0, 5, 350),
      drink(1, 5, 350),
      ...Array.from({ length: 5 }, (_, i) => drink(40 + i)),
    ];
    const summary = compute7DaySummary(drinks, goals.dailyCap);
    expect(summary.daysOverCap).toBe(1);
  });

  it('hides over-cap when dailyCap is 0 (capTracked false)', () => {
    const drinks = [
      drink(0, 5, 1000),
      ...Array.from({ length: 6 }, (_, i) => drink(40 + i)),
    ];
    const summary = compute7DaySummary(drinks, 0);
    expect(summary.capTracked).toBe(false);
    expect(summary.daysOverCap).toBe(0);
  });

  it('treats explicit AF entries (std=0) as AF days', () => {
    const drinks = [af(0), af(1), af(2), ...Array.from({ length: 7 }, (_, i) => drink(40 + i))];
    const summary = compute7DaySummary(drinks, goals.dailyCap);
    expect(summary.afDays).toBe(7);
    expect(summary.loggedDrinkDays).toBe(0);
  });
});

describe('[R12-A] LongTermActivityRibbon component', () => {
  it('renders nothing for new users', () => {
    const { container } = render(
      <LongTermActivityRibbon drinks={[]} goals={goals} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for users with < 30 days tracked', () => {
    const drinks = Array.from({ length: 7 }, (_, i) => drink(i + 1));
    const { container } = render(
      <LongTermActivityRibbon drinks={drinks} goals={goals} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for long-term users with < 7 entries', () => {
    const drinks = [drink(40), drink(35), drink(30)];
    const { container } = render(
      <LongTermActivityRibbon drinks={drinks} goals={goals} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the ribbon for long-term users with >= 7 entries', () => {
    const drinks = Array.from({ length: 7 }, (_, i) => drink(7 + i * 5));
    render(<LongTermActivityRibbon drinks={drinks} goals={goals} />);
    expect(screen.getByTestId('long-term-activity-ribbon')).toBeInTheDocument();
    expect(screen.getByText(/Last 7 days:/)).toBeInTheDocument();
    expect(screen.getByText(/7 AF days/)).toBeInTheDocument();
  });

  it('uses singular "1 logged drink day"', () => {
    const drinks = [
      drink(0, 5, 350),
      ...Array.from({ length: 7 }, (_, i) => drink(40 + i)),
    ];
    render(<LongTermActivityRibbon drinks={drinks} goals={goals} />);
    expect(screen.getByText(/1 logged drink day/)).toBeInTheDocument();
    expect(screen.getByText(/6 AF days/)).toBeInTheDocument();
  });

  it('omits the over-cap fragment when none over cap', () => {
    const drinks = [
      drink(0, 5, 350),
      ...Array.from({ length: 7 }, (_, i) => drink(40 + i)),
    ];
    render(<LongTermActivityRibbon drinks={drinks} goals={goals} />);
    expect(screen.queryByText(/over your daily cap/i)).not.toBeInTheDocument();
  });

  it('shows the over-cap fragment when a day exceeds the cap', () => {
    // Need >2 std on one day. 350ml @ 5% ≈ 0.986 std → 3 drinks ≈ 2.96.
    const drinks = [
      drink(0, 5, 350),
      drink(0, 5, 350),
      drink(0, 5, 350),
      ...Array.from({ length: 7 }, (_, i) => drink(40 + i)),
    ];
    render(<LongTermActivityRibbon drinks={drinks} goals={goals} />);
    expect(screen.getByText(/1 over your daily cap/)).toBeInTheDocument();
  });

  it('omits the over-cap fragment when goals.dailyCap is 0', () => {
    const drinks = [
      drink(0, 5, 1000),
      ...Array.from({ length: 7 }, (_, i) => drink(40 + i)),
    ];
    render(
      <LongTermActivityRibbon
        drinks={drinks}
        goals={{ ...goals, dailyCap: 0 }}
      />,
    );
    expect(screen.queryByText(/over your daily cap/i)).not.toBeInTheDocument();
  });
});
