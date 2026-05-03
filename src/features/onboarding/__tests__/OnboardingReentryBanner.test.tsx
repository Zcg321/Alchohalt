import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import OnboardingReentryBanner from '../OnboardingReentryBanner';
import { useDB } from '../../../store/db';

describe('[R17-4] OnboardingReentryBanner', () => {
  beforeEach(() => {
    /* Default: nobody has skipped. The banner stays hidden until
     * onboardingDiagnostics.status flips to 'skipped'. */
    act(() => {
      useDB.setState((s) => ({
        db: {
          ...s.db,
          settings: {
            ...s.db.settings,
            hasCompletedOnboarding: true,
            onboardingDiagnostics: undefined,
          },
        },
      }));
    });
  });

  it('does not render when there is no onboardingDiagnostics row', () => {
    render(<OnboardingReentryBanner />);
    expect(screen.queryByTestId('onboarding-reentry-banner')).not.toBeInTheDocument();
  });

  it('does not render when the user completed onboarding', () => {
    act(() => {
      useDB.setState((s) => ({
        db: {
          ...s.db,
          settings: {
            ...s.db.settings,
            onboardingDiagnostics: { status: 'completed' },
          },
        },
      }));
    });
    render(<OnboardingReentryBanner />);
    expect(screen.queryByTestId('onboarding-reentry-banner')).not.toBeInTheDocument();
  });

  it('renders for users who skipped onboarding', () => {
    act(() => {
      useDB.setState((s) => ({
        db: {
          ...s.db,
          settings: {
            ...s.db.settings,
            onboardingDiagnostics: { status: 'skipped', skipPath: 'skip-explore' },
          },
        },
      }));
    });
    render(<OnboardingReentryBanner />);
    expect(screen.getByTestId('onboarding-reentry-banner')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-reentry-resume')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-reentry-dismiss')).toBeInTheDocument();
  });

  it('discloses the cost up front ("Takes 30 seconds")', () => {
    act(() => {
      useDB.setState((s) => ({
        db: {
          ...s.db,
          settings: {
            ...s.db.settings,
            onboardingDiagnostics: { status: 'skipped' },
          },
        },
      }));
    });
    const { container } = render(<OnboardingReentryBanner />);
    expect(container.textContent).toMatch(/30 seconds/);
  });

  it('Set up now flips hasCompletedOnboarding back so OnboardingFlow re-mounts', () => {
    act(() => {
      useDB.setState((s) => ({
        db: {
          ...s.db,
          settings: {
            ...s.db.settings,
            hasCompletedOnboarding: true,
            onboardingDiagnostics: { status: 'skipped' },
          },
        },
      }));
    });
    render(<OnboardingReentryBanner />);
    fireEvent.click(screen.getByTestId('onboarding-reentry-resume'));
    expect(useDB.getState().db.settings.hasCompletedOnboarding).toBe(false);
  });

  it('Dismiss hides the banner without changing settings', () => {
    act(() => {
      useDB.setState((s) => ({
        db: {
          ...s.db,
          settings: {
            ...s.db.settings,
            hasCompletedOnboarding: true,
            onboardingDiagnostics: { status: 'skipped' },
          },
        },
      }));
    });
    render(<OnboardingReentryBanner />);
    fireEvent.click(screen.getByTestId('onboarding-reentry-dismiss'));
    expect(screen.queryByTestId('onboarding-reentry-banner')).not.toBeInTheDocument();
    expect(useDB.getState().db.settings.hasCompletedOnboarding).toBe(true);
  });
});
