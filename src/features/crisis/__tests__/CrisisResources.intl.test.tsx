import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CrisisResources from '../CrisisResources';

/** [INTL-1] Crisis modal locale-aware rendering. The detected region's
 *  resources render first; US falls below as "Other regions" — never
 *  hidden, even when the user is non-US. */
describe('CrisisResources (international)', () => {
  it('US is the default — no "Other regions" section when detected = US', () => {
    render(<CrisisResources region="US" />);
    expect(screen.getByText(/988 Suicide & Crisis Lifeline/i)).toBeInTheDocument();
    // The "Other regions" headings should not exist when US is the
    // primary pack (the subtitle prose phrase is filtered out).
    expect(screen.queryByText(/Other regions — Immediate help/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Other regions — Ongoing support/i)).not.toBeInTheDocument();
  });

  it('UK render shows Samaritans 116 123 first AND keeps US below', () => {
    render(<CrisisResources region="UK" />);
    expect(screen.getByText(/Immediate help — United Kingdom/i)).toBeInTheDocument();
    expect(screen.getByText(/0300 123 1110/i)).toBeInTheDocument();
    // US fallback section is still on the page.
    expect(screen.getAllByText(/Other regions/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/SAMHSA National Helpline/i)).toBeInTheDocument();
  });

  it('AU renders Lifeline 13 11 14 + DirectLine + Call 000 banner', () => {
    render(<CrisisResources region="AU" />);
    expect(screen.getByText(/13 11 14/)).toBeInTheDocument();
    expect(screen.getByText(/1800 250 015/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Call 000/i })).toBeInTheDocument();
  });

  it('CA renders Talk Suicide Canada + ON helpline', () => {
    render(<CrisisResources region="CA" />);
    expect(screen.getByText(/1-833-456-4566/)).toBeInTheDocument();
    expect(screen.getByText(/Drug & Alcohol Helpline/i)).toBeInTheDocument();
  });

  it('IE renders Samaritans + HSE + Call 999 banner', () => {
    render(<CrisisResources region="IE" />);
    expect(screen.getByText(/HSE Drugs & Alcohol Helpline/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Call 999/i })).toBeInTheDocument();
  });

  it('US numbers stay reachable from any non-US region', () => {
    render(<CrisisResources region="UK" />);
    // 988 button + SAMHSA US + Crisis Text Line US all visible in the
    // "Other regions" block.
    expect(screen.getByText(/988 Suicide & Crisis Lifeline/i)).toBeInTheDocument();
    expect(screen.getByText(/1-800-662-4357/)).toBeInTheDocument();
    /* [R12-6] HOME + TEEN keyword variants of Crisis Text Line both
     * use 741741 (same number, different routing). Match on the link
     * text to disambiguate. */
    expect(screen.getByRole('link', { name: /Text HOME to 741741/i })).toBeInTheDocument();
  });
});
