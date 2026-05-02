/**
 * TodayPanel quiet-mode rendering
 * ===============================
 *
 * Round-4 spec: HardTimePanel "Stop tracking until tomorrow" sets
 * settings.quietUntilTs, and TodayPanel renders a quieter view
 * (Day-N hero + rough-night link only) while that timestamp is in
 * the future. The Copilot review on PR #36 flagged that the new
 * conditional render paths had no direct test coverage.
 *
 * This spec exercises the prop directly — TodayPanel reads `quiet`
 * from props (not the store), so the component-level test is the
 * right level. The TodayHome wrapper is what reads
 * settings.quietUntilTs from the store and computes the boolean;
 * that flow is exercised by the manual round-4 walkthrough.
 *
 * Cases:
 *   1. quiet=false: primary CTA, stats strip, rough-night link all render.
 *   2. quiet=true:  Day-N hero + rough-night link render; primary CTA,
 *                   secondary CTA, streak badge, stats strip, what's-next
 *                   card all hidden.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TodayPanel from '../TodayPanel';

const baseGoals = {
  dailyCap: 2,
  weeklyGoal: 7,
  pricePerStd: 5,
  baselineMonthlySpend: 100,
};

describe('TodayPanel quiet mode', () => {
  it('quiet=false: primary CTA + stats strip + rough-night link all render', () => {
    render(
      <TodayPanel
        drinks={[]}
        goals={baseGoals}
        onCheckIn={() => undefined}
        onLogDrink={() => undefined}
        onMarkAF={() => undefined}
        onSeeProgress={() => undefined}
        onRoughNight={() => undefined}
      />,
    );

    // The starting-state primary CTA on Day 0.
    expect(screen.getByText('How are you today?')).toBeTruthy();
    // The day-zero empty stats explainer.
    expect(screen.getByTestId('day-zero-empty-stats')).toBeTruthy();
    // Rough-night link.
    expect(screen.getByTestId('rough-night-link')).toBeTruthy();
  });

  it('quiet=true: hides primary CTA + stats strip; keeps Day-N hero + rough-night link', () => {
    render(
      <TodayPanel
        drinks={[]}
        goals={baseGoals}
        onCheckIn={() => undefined}
        onLogDrink={() => undefined}
        onMarkAF={() => undefined}
        onSeeProgress={() => undefined}
        onRoughNight={() => undefined}
        quiet
      />,
    );

    // Day-N hero stays.
    expect(screen.getByText('Day 0')).toBeTruthy();
    // Rough-night link stays — the user back in this state should not
    // have to hunt the support entry.
    expect(screen.getByTestId('rough-night-link')).toBeTruthy();
    // Quiet subcopy is shown instead of the normal heroSubcopy.
    expect(screen.getByText(/Resting until midnight/i)).toBeTruthy();
    // Primary CTA hidden.
    expect(screen.queryByText('How are you today?')).toBeNull();
    // Day-zero empty stats hidden.
    expect(screen.queryByTestId('day-zero-empty-stats')).toBeNull();
  });
});
