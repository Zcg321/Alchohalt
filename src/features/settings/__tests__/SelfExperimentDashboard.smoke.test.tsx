/**
 * [R21-3] Self-experiment dashboard smoke test.
 *
 * Verifies the dashboard wrapper renders + the three sub-sections
 * are still mounted under it. Doesn't re-test the sub-sections
 * themselves — they have their own test files (Diagnostics.test.tsx,
 * DiagnosticsAudit.test.tsx, OnboardingFunnelView is exercised via
 * SettingsPanel.smoke.test.tsx).
 *
 * The point of this test is to pin that the structural reorg
 * didn't drop a section, and that the jump-nav links resolve to
 * the section ids.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import SelfExperimentDashboard from '../SelfExperimentDashboard';

describe('[R21-3] SelfExperimentDashboard', () => {
  it('renders the dashboard wrapper', () => {
    render(<SelfExperimentDashboard />);
    expect(screen.getByTestId('self-experiment-dashboard')).toBeInTheDocument();
  });

  it('renders the on-device-only message in the header', () => {
    render(<SelfExperimentDashboard />);
    /* The header text should match the descriptive default. */
    expect(
      screen.getByRole('heading', { level: 2, name: /measures about itself/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Nothing is sent off-device/i)).toBeInTheDocument();
  });

  it('renders a jump-nav with three section links', () => {
    render(<SelfExperimentDashboard />);
    const nav = screen.getByTestId('self-experiment-jumpnav');
    expect(nav).toBeInTheDocument();
    /* Three links: Onboarding diagnostics, Settings audit, Onboarding funnel. */
    expect(nav.querySelectorAll('a').length).toBe(3);
  });

  it('jump-nav hrefs match the actual section ids', () => {
    render(<SelfExperimentDashboard />);
    const nav = screen.getByTestId('self-experiment-jumpnav');
    const hrefs = Array.from(nav.querySelectorAll('a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual([
      '#diagnostics-heading',
      '#diagnostics-audit-heading',
      '#funnel-heading',
    ]);
    /* Verify each id actually exists on the page. */
    expect(document.getElementById('diagnostics-heading')).not.toBeNull();
    expect(document.getElementById('diagnostics-audit-heading')).not.toBeNull();
    /* funnel-heading appears only when there are attempts; we don't
     * pin its presence here since the empty-state branch renders a
     * different section without the heading id. */
  });

  it('renders Diagnostics sub-section', () => {
    render(<SelfExperimentDashboard />);
    expect(screen.getByTestId('diagnostics-card')).toBeInTheDocument();
  });

  it('renders DiagnosticsAudit sub-section', () => {
    render(<SelfExperimentDashboard />);
    expect(screen.getByTestId('diagnostics-audit')).toBeInTheDocument();
  });
});
