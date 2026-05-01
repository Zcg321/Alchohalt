/**
 * Regression for [BUG-DUPLICATE-REACT-ROOT].
 *
 * The Sprint 1 incident (4f7f78c [ALCH-AI-PRIVACY-FIX]) wrapped
 * AIInsightsTile in <ErrorBoundary isolate> as a band-aid for a
 * "Cannot read properties of null (reading 'useState')" crash that
 * Vite's optimizeDeps cache flake produced. The same class of bug
 * surfaced again on the Track tab during the 2026-04-27 audit
 * (DrinkForm / DrinkDiscovery throwing the same hook-null error).
 *
 * The durable fix is `resolve.dedupe` + `optimizeDeps.include` in
 * vite.config.ts (forces a single React copy). This test asserts:
 *
 *  1. None of the three previously-broken components (AIInsightsTile,
 *     DrinkForm, DrinkDiscovery) emits a React "Invalid hook call" or
 *     "useState is null" warning when rendered in succession in the
 *     same React tree.
 *  2. They survive being mounted, unmounted, and remounted.
 *
 * If a future commit reintroduces a duplicate React (a transitive dep
 * with its own copy, a missed dedupe entry, a Vite config regression),
 * this test fires.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import AIInsightsTile from '../features/ai/AIInsightsTile';
import DrinkForm from '../features/drinks/DrinkForm';
import DrinkDiscovery from '../features/drinks/DrinkDiscovery';
import { useAIConsentStore } from '../lib/ai/consent';

const REACT_DUPLICATE_PATTERNS = [
  /Invalid hook call/i,
  /hooks can only be called inside/i,
  /Cannot read propert(?:y|ies) of null \(reading ['"]?useState['"]?\)/i,
  /Cannot read propert(?:y|ies) of null \(reading ['"]?useEffect['"]?\)/i,
  /more than one copy of React/i,
];

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  useAIConsentStore.getState().reset();
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();
  useAIConsentStore.getState().reset();
  cleanup();
});

function flatten(spy: ReturnType<typeof vi.spyOn>): string[] {
  return spy.mock.calls.map((call) => call.map((c: unknown) => String(c ?? '')).join(' '));
}

function findReactDuplicateMessages(spy: ReturnType<typeof vi.spyOn>): string[] {
  return flatten(spy).filter((line) => REACT_DUPLICATE_PATTERNS.some((p) => p.test(line)));
}

describe('[BUG-DUPLICATE-REACT-ROOT] React identity regression', () => {
  it('AIInsightsTile + DrinkForm + DrinkDiscovery render in succession without hook warnings', () => {
    const onSubmit = vi.fn();
    expect(() => {
      render(<AIInsightsTile />);
      render(<DrinkForm onSubmit={onSubmit} submitLabel="Add" />);
      render(<DrinkDiscovery onSelectDrink={() => undefined} />);
    }).not.toThrow();

    const errs = findReactDuplicateMessages(consoleErrorSpy);
    const warns = findReactDuplicateMessages(consoleWarnSpy);
    expect(errs, `console.error duplicate-React lines:\n${errs.join('\n')}`).toEqual([]);
    expect(warns, `console.warn duplicate-React lines:\n${warns.join('\n')}`).toEqual([]);
  });

  it('mount → unmount → remount cycle does not introduce duplicate-React warnings', () => {
    const onSubmit = vi.fn();
    const first = render(<DrinkForm onSubmit={onSubmit} submitLabel="Add" />);
    first.unmount();
    const second = render(<DrinkForm onSubmit={onSubmit} submitLabel="Add" />);
    second.unmount();
    const errs = findReactDuplicateMessages(consoleErrorSpy);
    const warns = findReactDuplicateMessages(consoleWarnSpy);
    expect(errs).toEqual([]);
    expect(warns).toEqual([]);
  });

  it('useState in three different components shares a single React instance', async () => {
    // If two copies of React exist, useState reads from the wrong dispatcher
    // and the call returns null/undefined; that crashes synchronously inside
    // the function body, NOT through the boundary. Render and inspect.
    expect(() => render(<AIInsightsTile />)).not.toThrow();
    expect(() => render(<DrinkDiscovery onSelectDrink={() => undefined} />)).not.toThrow();
    expect(() => render(<DrinkForm onSubmit={() => undefined} submitLabel="Add" />)).not.toThrow();
  });
});
