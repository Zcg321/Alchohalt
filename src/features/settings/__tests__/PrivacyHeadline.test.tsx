/**
 * [R26-B] PrivacyHeadline — pinned 1-line summary at top of Settings
 * → Privacy & data.
 *
 * [R30-2] Year-1-user "show first-launch privacy card again" affordance.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PrivacyHeadline from '../PrivacyHeadline';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.getState().setSettings({
    firstLaunchPrivacyCardDismissedAt: undefined as never,
  });
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

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

  describe('[R30-2] show first-launch privacy card again', () => {
    it('hides the affordance when the first-launch card has not been dismissed', () => {
      render(<PrivacyHeadline />);
      expect(
        screen.queryByTestId('privacy-headline-show-first-launch'),
      ).toBeNull();
    });

    it('renders the affordance once the first-launch card has been dismissed', () => {
      useDB.getState().setSettings({
        firstLaunchPrivacyCardDismissedAt: 1234567890,
      });
      render(<PrivacyHeadline />);
      expect(
        screen.getByTestId('privacy-headline-show-first-launch'),
      ).toBeTruthy();
    });

    it('clicking the affordance clears the dismissal timestamp', () => {
      useDB.getState().setSettings({
        firstLaunchPrivacyCardDismissedAt: 1234567890,
      });
      render(<PrivacyHeadline />);
      fireEvent.click(
        screen.getByTestId('privacy-headline-show-first-launch'),
      );
      expect(
        useDB.getState().db.settings.firstLaunchPrivacyCardDismissedAt,
      ).toBeUndefined();
    });
  });
});
