/**
 * [R26-B] PrivacyHeadline — pinned 1-line summary at top of Settings
 * → Privacy & data.
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrivacyHeadline from '../PrivacyHeadline';

describe('[R26-B] PrivacyHeadline', () => {
  it('renders a pinned 1-line privacy claim', () => {
    render(<PrivacyHeadline />);
    const headline = screen.getByTestId('privacy-headline');
    expect(headline).toBeInTheDocument();
    const claim = screen.getByTestId('privacy-headline-claim');
    expect(claim.textContent).toMatch(/Nothing leaves your device/i);
    expect(claim.textContent).toMatch(/end-to-end encrypted/i);
    expect(claim.textContent).toMatch(/No analytics/i);
  });

  it('exposes a labelled section landmark', () => {
    render(<PrivacyHeadline />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading.id).toBe('privacy-headline-heading');
  });

  it('expand details element starts collapsed', () => {
    render(<PrivacyHeadline />);
    const details = screen.getByTestId('privacy-headline-expand');
    expect(details).toBeInTheDocument();
    expect(details.tagName).toBe('DETAILS');
    expect(details).not.toHaveAttribute('open');
  });

  it('expand contains all three verification steps', () => {
    render(<PrivacyHeadline />);
    const details = screen.getByTestId('privacy-headline-expand');
    expect(details.textContent).toMatch(/devtools/i);
    expect(details.textContent).toMatch(/per-feature breakdown/i);
    expect(details.textContent).toMatch(/Trust Receipt/i);
  });
});
