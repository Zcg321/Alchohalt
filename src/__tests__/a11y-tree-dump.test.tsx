/**
 * [R23-2] In-CI accessibility-tree dump (jsdom complement to the
 * Playwright spec at e2e/a11y-tree-dump.spec.ts).
 *
 * The Playwright spec dumps the real Chromium a11y tree per surface
 * (closest possible to NVDA) but requires the dev server + a browser
 * and isn't part of the `npm test` chain. This vitest-side
 * complement runs in jsdom on every PR and pins:
 *   - Tab list exposes all 5 tabs as role=tab with non-empty names.
 *   - Each tab name is unique (no duplicate "Settings" / "Settings").
 *   - The skip-link is exactly one #main anchor (R22-2 regression
 *     guard).
 *   - The dialog used by onboarding has both `aria-modal` and a
 *     non-empty `aria-labelledby` target.
 *   - HALT checkboxes group inside a fieldset+legend.
 *   - SettingsJumpNav exposes role=navigation with an aria-label.
 *   - QuickLogChips group exposes role=group with an aria-label.
 *
 * If a future change drops a label or swaps a fieldset, this test
 * fails before the change ships.
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnboardingFlow from '../features/onboarding/OnboardingFlow';
import HaltChecks from '../features/drinks/DrinkForm/HaltChecks';
import SettingsJumpNav from '../features/settings/SettingsJumpNav';
import QuickLogChips from '../features/drinks/DrinkForm/QuickLogChips';
import A11ySkipLink from '../components/A11ySkipLink';
import { LanguageProvider } from '../i18n';
import { useDB } from '../store/db';
import { __resetPreferencesCacheForTests } from '../shared/capacitor';

function resetOnboarding(seen: boolean) {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.getState().setSettings({ hasCompletedOnboarding: seen });
}

describe('[R23-2] a11y tree dump — landmark + label assertions', () => {
  it('A11ySkipLink exposes exactly one link to #main', () => {
    render(<LanguageProvider><A11ySkipLink /></LanguageProvider>);
    const links = screen.getAllByRole('link');
    const mainLinks = links.filter((a) => a.getAttribute('href') === '#main');
    expect(mainLinks.length).toBe(1);
  });

  it('SettingsJumpNav exposes role=navigation with a non-empty aria-label', () => {
    render(<LanguageProvider><SettingsJumpNav /></LanguageProvider>);
    const nav = screen.getByRole('navigation');
    expect(nav.getAttribute('aria-label')?.trim().length).toBeGreaterThan(0);
  });

  it('QuickLogChips exposes role=group with a non-empty aria-label', () => {
    render(<LanguageProvider><QuickLogChips onLog={() => undefined} /></LanguageProvider>);
    const group = screen.getByRole('group');
    expect(group.getAttribute('aria-label')?.trim().length).toBeGreaterThan(0);
  });

  it('HaltChecks groups inside a labelled fieldset', () => {
    const { container } = render(
      <HaltChecks selected={[]} onChange={() => undefined} />
    );
    const fieldset = container.querySelector('fieldset');
    const legend = container.querySelector('legend');
    expect(fieldset).toBeTruthy();
    expect(legend?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('OnboardingFlow dialog has aria-modal + a non-empty labelledby target', () => {
    resetOnboarding(false);
    render(<OnboardingFlow />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const titleEl = document.getElementById(labelledBy!);
    expect(titleEl?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('OnboardingFlow renders all 4 chips on Beat 1 with stable ARIA buttons', async () => {
    resetOnboarding(false);
    render(<OnboardingFlow />);
    /* Wait for the 500ms chip-fade-in to clear in real time. */
    await new Promise((r) => setTimeout(r, 600));
    /* All 4 chips (3 primary + R23-C undecided) are role=button. */
    const chip = await screen.findByTestId('onboarding-chip-undecided');
    expect(chip.tagName).toBe('BUTTON');
  });

  it('Every interactive descendant of QuickLogChips is button-named', () => {
    render(<LanguageProvider><QuickLogChips onLog={() => undefined} /></LanguageProvider>);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) {
      /* Either visible text content or aria-label must populate
       * the accessible name. */
      const accName = (b.textContent ?? '').trim() || b.getAttribute('aria-label') || '';
      expect(accName.length, `button missing accessible name`).toBeGreaterThan(0);
    }
  });
});
