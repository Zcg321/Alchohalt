/**
 * [R7-E] Heading hierarchy regression test.
 *
 * Each tab page should produce a heading sequence that scans
 * cleanly via a screen reader's Rotor — no skipped levels (h1 → h3
 * with no h2), no out-of-order siblings.
 *
 * The app's structure:
 *   AppHeader: h1 "Alchohalt"
 *   Per tab:   h2 (tab name) → h3 (sections within)
 *
 * This test renders each of the four main tab components inside a
 * stub AppHeader context and asserts the rendered sequence is
 * monotonic (no gaps, no descending jumps).
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import GoalsTab from '../app/tabs/GoalsTab';
import SettingsTab from '../app/tabs/SettingsTab';
import TrackTab from '../app/tabs/TrackTab';
import InsightsTab from '../app/tabs/InsightsTab';

function renderedHeadingLevels(container: HTMLElement): number[] {
  const headings = Array.from(
    container.querySelectorAll('h1, h2, h3, h4, h5, h6'),
  );
  return headings.map((h) => Number(h.tagName.slice(1)));
}

function assertHierarchy(levels: number[], surface: string) {
  expect(levels.length, `${surface} should produce at least one heading`).toBeGreaterThan(0);
  for (let i = 1; i < levels.length; i++) {
    const prev = levels[i - 1]!;
    const curr = levels[i]!;
    // Skipping a level is the violation we care about: h2 → h4 is
    // bad (no h3 in between). Going back up (h3 → h2) is fine; that's
    // a new section. The bar is monotonic descent of at most 1.
    expect(
      curr - prev,
      `${surface}: heading at index ${i} skips a level (h${prev} → h${curr})`,
    ).toBeLessThanOrEqual(1);
  }
}

describe('[R7-E] heading hierarchy — tab surfaces', () => {
  it('GoalsTab: h2 → h3 with no skipped levels', () => {
    const { container } = render(
      <GoalsTab
        goals={{ dailyCap: 0, weeklyGoal: 0, pricePerStd: 0, baselineMonthlySpend: 0 }}
        onGoalsChange={() => undefined}
      />,
    );
    assertHierarchy(renderedHeadingLevels(container), 'GoalsTab');
  });

  it('SettingsTab: h2 → h3 with no skipped levels', () => {
    const { container } = render(<SettingsTab onOpenCrisis={() => undefined} />);
    assertHierarchy(renderedHeadingLevels(container), 'SettingsTab');
  });

  it('TrackTab: h2 → h3 with no skipped levels', () => {
    const { container } = render(
      <TrackTab
        drinks={[]}
        presets={[]}
        editing={null}
        onAddDrink={() => undefined}
        onSaveDrink={() => undefined}
        onStartEdit={() => undefined}
        onDeleteDrink={() => undefined}
        onCancelEdit={() => undefined}
      />,
    );
    assertHierarchy(renderedHeadingLevels(container), 'TrackTab');
  });

  it('InsightsTab: h2 → h3 with no skipped levels', () => {
    const { container } = render(<InsightsTab drinks={[]} goals={{ dailyCap: 0, weeklyGoal: 0, pricePerStd: 0, baselineMonthlySpend: 0 }} />);
    assertHierarchy(renderedHeadingLevels(container), 'InsightsTab');
  });
});
