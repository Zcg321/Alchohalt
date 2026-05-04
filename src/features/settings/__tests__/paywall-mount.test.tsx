/**
 * Regression for [BUG-PAYWALL-MOUNT].
 *
 * SubscriptionManager (the four-tier pricing grid with $4.99 / $24.99 /
 * $69) was built in [PRICING-1] but its default export wasn't imported
 * anywhere — only the named PremiumFeatureGate export was consumed.
 * Users had no path to a screen showing the prices, so no paid
 * conversion was possible.
 *
 * This test asserts that SettingsPanel mounts SubscriptionManager and
 * that all three paid tiers render with the right $ amounts.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SettingsPanel from '../SettingsPanel';

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe('[BUG-PAYWALL-MOUNT] SettingsPanel mounts the paywall', () => {
  it('renders a Plan & Billing section', async () => {
    render(<SettingsPanel />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Plan & Billing/i })).toBeInTheDocument();
    });
  });

  it('the lazy SubscriptionManager renders all three paid tiers with correct prices', async () => {
    render(<SettingsPanel />);
    /* [R29-C] Bumped from 4s to 10s. The lazy chunk import is fast in
     * isolation (~1.7s) but the full vitest suite (~280 files) runs
     * with high parallel pressure on a constrained CI environment, and
     * the dynamic-import path can stretch past 4s under that load. The
     * 10s ceiling absorbs that without masking real regressions — a
     * genuinely-broken paywall mount fails synchronously. */
    await waitFor(
      () => {
        expect(screen.getByText(/\$4\.99 \/ month/)).toBeInTheDocument();
        expect(screen.getByText(/\$24\.99 \/ year/)).toBeInTheDocument();
        expect(screen.getByText(/\$69 once/)).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  });

  it('mount does not surface a React-warning console.error', async () => {
    render(<SettingsPanel />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Plan & Billing/i })).toBeInTheDocument();
    });
    const reactWarnings = consoleErrorSpy.mock.calls
      .map((call) => String(call[0] ?? ''))
      .filter((msg) => /Invalid hook call|Warning:|act\(/.test(msg));
    expect(reactWarnings).toEqual([]);
  });
});
