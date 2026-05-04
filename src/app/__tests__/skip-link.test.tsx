import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AlcoholCoachApp } from '../AlcoholCoachApp';

/** [A11Y-1] WCAG 2.4.1 — Bypass Blocks. The skip-to-content link must
 *  exist as the first interactive element in the doc, target #main,
 *  and be reachable via keyboard. We don't assert visual hidden state
 *  (that's a CSS concern); we assert the link is in the DOM and the
 *  href is right.
 *
 *  [R22-2] Updated link text after the duplicate-skip-link fix: the
 *  inline "Skip to main content" anchor in AlcoholCoachApp was removed
 *  in favor of the canonical i18n'd `<A11ySkipLink />` component, which
 *  uses the `skipToContent` translation key ("Skip to content" in EN).
 *  Same target (#main), same WCAG contract, single AT announcement. */
describe('skip-to-content link', () => {
  it('renders a "Skip to content" link pointing at #main', () => {
    render(<AlcoholCoachApp />);
    const link = screen.getByRole('link', { name: /Skip to content/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('#main');
  });

  it('renders only one skip-link (no duplicate anchors to #main)', () => {
    render(<AlcoholCoachApp />);
    const links = screen.getAllByRole('link').filter((a) => a.getAttribute('href') === '#main');
    expect(links).toHaveLength(1);
  });
});
