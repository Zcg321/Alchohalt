/**
 * [ROUND-5-B] Screen-reader walkthrough simulation.
 *
 * Renders each high-leverage surface and asserts the accessibility
 * tree (via @testing-library queries that go through ARIA semantics)
 * matches what we documented in
 * `audit-walkthrough/screen-reader-walkthrough-2026-05-01.md`.
 *
 * This is not a substitute for a real VoiceOver / NVDA / TalkBack run,
 * but it locks down the role/name/state contract: if a future change
 * regresses one of these (drops a label, swaps a fieldset for a div,
 * removes the dialog progressbar), this test fails.
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import OnboardingFlow from '../features/onboarding/OnboardingFlow';
import HaltChecks from '../features/drinks/DrinkForm/HaltChecks';
import { useDB } from '../store/db';
import { __resetPreferencesCacheForTests } from '../shared/capacitor';

function resetOnboarding(seen: boolean) {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.getState().setSettings({ hasCompletedOnboarding: seen });
}

describe('SR walkthrough — Onboarding (Beat 1)', () => {
  it('exposes role=dialog with labelledby pointing at a step-counter title', () => {
    resetOnboarding(false);
    render(<OnboardingFlow />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const title = document.getElementById(labelledBy!);
    // [R27-C] Onboarding gained a 4th beat (log-style picker).
    expect(title?.textContent).toMatch(/step 1 of 4/i);
  });

  it('step indicator is exposed as a progressbar (not aria-hidden)', () => {
    resetOnboarding(false);
    render(<OnboardingFlow />);
    const progress = screen.getByRole('progressbar');
    expect(progress.getAttribute('aria-valuenow')).toBe('1');
    // [R27-C] Onboarding gained a 4th beat (log-style picker).
    expect(progress.getAttribute('aria-valuemax')).toBe('4');
  });

  it('X icon button announces as "Close" (not "Skip")', () => {
    resetOnboarding(false);
    render(<OnboardingFlow />);
    const closeBtn = screen.getByLabelText(/close/i);
    expect(closeBtn.tagName).toBe('BUTTON');
  });

  it('renders the Beat 1 question as an h2 inside the dialog', () => {
    resetOnboarding(false);
    render(<OnboardingFlow />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent).toMatch(/what brings you here today/i);
  });
});

describe('SR walkthrough — HALT checkboxes', () => {
  it('groups the HALT checkboxes inside a fieldset+legend (not span)', () => {
    const { container } = render(
      <HaltChecks selected={[]} onChange={() => undefined} />
    );
    const fieldset = container.querySelector('fieldset');
    const legend = container.querySelector('legend');
    expect(fieldset).toBeTruthy();
    expect(legend?.textContent).toBeTruthy();
    // Every HALT option exposes itself as a checkbox role
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(4);
  });

  it('checkbox state reflects selection prop', () => {
    render(<HaltChecks selected={['hungry', 'tired']} onChange={() => undefined} />);
    const checkboxes = screen.getAllByRole('checkbox');
    const checkedCount = checkboxes.filter((c) => (c as HTMLInputElement).checked).length;
    expect(checkedCount).toBe(2);
  });
});

describe('SR walkthrough — common gaps audit', () => {
  it('Onboarding dialog has at least one focusable button on mount', () => {
    resetOnboarding(false);
    render(<OnboardingFlow />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
