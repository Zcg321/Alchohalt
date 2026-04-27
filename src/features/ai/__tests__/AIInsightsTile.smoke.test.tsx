/**
 * Regression test for the AIInsightsTile dispatcher-null crash
 * (commit `a60c487`, fix in this commit). The tile is wrapped in
 * <SoftPaywall> + <ErrorBoundary isolate> in MainContent — this test
 * verifies it renders without firing a React-warning console.error
 * AND without throwing, regardless of consent state.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import AIInsightsTile from '../AIInsightsTile';
import { useAIConsentStore } from '../../../lib/ai/consent';

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  useAIConsentStore.getState().reset();
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  useAIConsentStore.getState().reset();
});

describe('AIInsightsTile — regression smoke', () => {
  it('renders without throwing on default fresh-install state', () => {
    expect(() => render(<AIInsightsTile />)).not.toThrow();
  });

  it('does NOT log any React warning during default render', () => {
    render(<AIInsightsTile />);
    // Filter out any console.error calls that look like React warnings.
    const reactWarnings = consoleErrorSpy.mock.calls.filter((call) => {
      const msg = String(call[0] ?? '');
      return /Invalid hook call|hooks can only be called|properties of null/i.test(msg);
    });
    expect(reactWarnings).toEqual([]);
  });

  it('renders without throwing after consent is granted', () => {
    useAIConsentStore.getState().grant('anthropic');
    expect(() => render(<AIInsightsTile />)).not.toThrow();
  });

  it('renders without throwing after consent is granted then revoked', () => {
    useAIConsentStore.getState().grant('anthropic');
    useAIConsentStore.getState().revoke();
    expect(() => render(<AIInsightsTile />)).not.toThrow();
  });
});
