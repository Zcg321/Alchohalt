import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoggingTenure, { computeTenureDays } from '../LoggingTenure';
import type { Drink } from '../../../types/common';

const DAY_MS = 24 * 60 * 60 * 1000;

function drink(daysAgo: number): Drink {
  return {
    ts: Date.now() - daysAgo * DAY_MS,
    kind: 'beer',
    volumeMl: 0,
    abvPct: 0,
    intention: 'taste',
    craving: 1,
    halt: [],
    alt: '',
  } as Drink;
}

describe('[R17-1] computeTenureDays', () => {
  it('returns 0 when there are no drinks', () => {
    expect(computeTenureDays([])).toBe(0);
  });

  it('returns the day-floor between earliest entry and now', () => {
    const drinks = [drink(100), drink(50), drink(0)];
    const tenure = computeTenureDays(drinks);
    // Earliest is 100 days ago, so tenure should be ~100.
    expect(tenure).toBeGreaterThanOrEqual(99);
    expect(tenure).toBeLessThanOrEqual(101);
  });

  it('uses the EARLIEST entry, not the latest, so tenure includes early activity', () => {
    const drinks = [drink(500), drink(1)];
    expect(computeTenureDays(drinks)).toBeGreaterThanOrEqual(499);
  });
});

describe('[R17-1] LoggingTenure surface', () => {
  it('does not render when tenure is below the 90-day threshold', () => {
    render(<LoggingTenure drinks={[drink(30)]} />);
    expect(screen.queryByTestId('logging-tenure')).not.toBeInTheDocument();
  });

  it('renders a months label when tenure is 6+ months but under a year', () => {
    render(<LoggingTenure drinks={[drink(200)]} />);
    expect(screen.getByTestId('logging-tenure')).toBeInTheDocument();
    expect(screen.getByTestId('logging-tenure-value').textContent).toMatch(/6 months|7 months/);
  });

  it('renders a "X year(s)" label when tenure is over a year', () => {
    render(<LoggingTenure drinks={[drink(400)]} />);
    expect(screen.getByTestId('logging-tenure-value').textContent).toMatch(/1 year/);
  });

  it('renders "X years, Y months" when tenure is over 2 years and not on a year boundary', () => {
    render(<LoggingTenure drinks={[drink(365 * 2 + 90)]} />);
    expect(screen.getByTestId('logging-tenure-value').textContent).toMatch(/2 years, 3 months/);
  });

  it('reads as continuity, not as a streak (subtitle frames it that way)', () => {
    const { container } = render(<LoggingTenure drinks={[drink(500)]} />);
    expect(container.textContent).toMatch(/Separate from your current streak/i);
  });
});
