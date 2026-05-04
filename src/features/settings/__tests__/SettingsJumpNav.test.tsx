import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsJumpNav from '../SettingsJumpNav';
import { LanguageProvider } from '../../../i18n';

/**
 * [R23-B] Settings jump-nav UI assertions.
 *
 * Pins:
 *   - <nav> exists with an aria-label so SR users can jump-list it
 *   - All 7 sections render as anchor links (R28-1 added Help)
 *   - Each anchor href targets one of the R22-4 H2 IDs
 *     (appearance-heading, reminders-heading,
 *      privacy-and-data-heading, plan-and-billing-heading,
 *      help-heading, about-heading, legal-heading)
 *   - Each anchor button meets the WCAG 2.5.5 / R22-5 44pt floor
 *     via min-h-[44px]
 */

const EXPECTED_ANCHORS = [
  '#appearance-heading',
  '#reminders-heading',
  '#privacy-and-data-heading',
  '#plan-and-billing-heading',
  /* [R28-1] Help anchor — surfaces the FAQ between Plan and About. */
  '#help-heading',
  '#about-heading',
  '#legal-heading',
];

function renderJumpNav() {
  return render(
    <LanguageProvider>
      <SettingsJumpNav />
    </LanguageProvider>,
  );
}

describe('SettingsJumpNav', () => {
  it('renders a labelled <nav>', () => {
    renderJumpNav();
    const nav = screen.getByRole('navigation');
    expect(nav).toBeTruthy();
    expect(nav.getAttribute('aria-label')).toBeTruthy();
  });

  it('renders one anchor per Settings section, hrefs targeting H2 IDs', () => {
    renderJumpNav();
    const anchors = screen.getAllByRole('link');
    const hrefs = anchors.map((a) => a.getAttribute('href'));
    for (const expected of EXPECTED_ANCHORS) {
      expect(hrefs).toContain(expected);
    }
    expect(anchors).toHaveLength(EXPECTED_ANCHORS.length);
  });

  it('every chip enforces the 44pt minimum touch target', () => {
    renderJumpNav();
    const anchors = screen.getAllByRole('link');
    for (const a of anchors) {
      expect(a.className).toMatch(/min-h-\[44px\]/);
    }
  });
});
