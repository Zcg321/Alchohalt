import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AlcoholCoachApp } from '../AlcoholCoachApp';

/** [A11Y-1] WCAG 2.4.1 — Bypass Blocks. The skip-to-content link must
 *  exist as the first interactive element in the doc, target #main,
 *  and be reachable via keyboard. We don't assert visual hidden state
 *  (that's a CSS concern); we assert the link is in the DOM and the
 *  href is right. */
describe('skip-to-content link', () => {
  it('renders a "Skip to main content" link pointing at #main', () => {
    render(<AlcoholCoachApp />);
    const link = screen.getByRole('link', { name: /Skip to main content/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('#main');
  });
});
