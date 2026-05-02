import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SoftPaywall from '../SoftPaywall';
import { useSubscriptionStore } from '../../features/subscription/subscriptionStore';

afterEach(() => {
  useSubscriptionStore.getState().reset();
  vi.restoreAllMocks();
});

// NOTE: ENABLE_SUBSCRIPTIONS is governed by an env flag at module load.
// In the vitest env it defaults to false → premium gates always closed.
// We test the gate-closed (free) path here. Gate-open path covered by
// the FEATURE_TIER unit tests + integration tests in the live app.

describe('SoftPaywall — premium feature behavior on free tier', () => {
  it('renders preview + Unlock CTA when feature is gated', () => {
    // [R11-C] csv_export moved to free; pdf_export stays premium and
    // is the canonical gated-export example.
    render(
      <SoftPaywall feature="pdf_export">
        <div data-testid="real-content">PDF export here</div>
      </SoftPaywall>,
    );
    // The preview IS rendered (children present, just dimmed)
    expect(screen.getByTestId('real-content')).toBeTruthy();
    // The unlock CTA is present
    expect(screen.getByRole('button', { name: /See plans/i })).toBeTruthy();
  });

  it('preview is aria-hidden + non-interactive (pointer-events-none)', () => {
    const { container } = render(
      <SoftPaywall feature="pdf_export">
        <button>Click me</button>
      </SoftPaywall>,
    );
    const preview = container.querySelector('[aria-hidden="true"]');
    expect(preview).toBeTruthy();
    expect(preview!.className).toMatch(/pointer-events-none/);
    expect(preview!.className).toMatch(/select-none/);
  });

  it('CTA button click dispatches alch:open-subscription event by default', () => {
    const listener = vi.fn();
    window.addEventListener('alch:open-subscription', listener);
    render(
      <SoftPaywall feature="encrypted_backup">
        <div>Hidden</div>
      </SoftPaywall>,
    );
    fireEvent.click(screen.getByRole('button', { name: /See plans/i }));
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('alch:open-subscription', listener);
  });

  it('explicit onUnlock prop overrides the default event', () => {
    const onUnlock = vi.fn();
    const eventListener = vi.fn();
    window.addEventListener('alch:open-subscription', eventListener);
    render(
      <SoftPaywall feature="advanced_viz" onUnlock={onUnlock}>
        <div>Hidden</div>
      </SoftPaywall>,
    );
    fireEvent.click(screen.getByRole('button', { name: /See plans/i }));
    expect(onUnlock).toHaveBeenCalledTimes(1);
    expect(eventListener).not.toHaveBeenCalled();
    window.removeEventListener('alch:open-subscription', eventListener);
  });

  it('data-soft-paywall attribute exposes the gated feature for E2E', () => {
    const { container } = render(
      <SoftPaywall feature="ai_insights">
        <div>Hidden</div>
      </SoftPaywall>,
    );
    const wrapper = container.querySelector('[data-soft-paywall]');
    expect(wrapper).toBeTruthy();
    expect(wrapper!.getAttribute('data-soft-paywall')).toBe('ai_insights');
  });
});

describe('SoftPaywall — never gates a free feature', () => {
  it('renders children straight through for crisis_resources (free)', () => {
    render(
      <SoftPaywall feature="crisis_resources">
        <div data-testid="crisis-real-content">988</div>
      </SoftPaywall>,
    );
    // No unlock CTA when the feature is free
    expect(screen.queryByRole('button', { name: /See plans/i })).toBeNull();
    expect(screen.getByTestId('crisis-real-content')).toBeTruthy();
  });

  it('renders children for every required free feature', () => {
    const freeFeatures = [
      'drink_log',
      'streak_tracker',
      'money_saved_widget',
      'basic_journal',
      'crisis_resources',
      'biometric_lock',
      'one_default_reminder',
      'json_export',
      'csv_export', // [R11-C] data ownership ≠ paywall
      'dark_mode',
      'multi_language',
    ] as const;
    for (const feature of freeFeatures) {
      const { unmount } = render(
        <SoftPaywall feature={feature}>
          <div data-testid={`free-${feature}`}>real</div>
        </SoftPaywall>,
      );
      // Should render children directly with no paywall overlay.
      expect(screen.getByTestId(`free-${feature}`)).toBeTruthy();
      expect(screen.queryByRole('button', { name: /See plans/i })).toBeNull();
      unmount();
    }
  });
});
