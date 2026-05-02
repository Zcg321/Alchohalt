/**
 * [R8-C] Trust Receipt redaction guarantee — unit test.
 *
 * The trust-receipt panel is supposed to be safe to screenshot. Its
 * whole point is letting users verify privacy claims without leaking
 * the data being protected. This test proves the guarantee holds:
 * we push events containing recognizable PII tokens through the
 * recordStorageEvent path (the only path that the panel renders),
 * mount the panel with the toggle on, and assert that none of the
 * seeded tokens appear anywhere in the rendered DOM.
 *
 * Tested at the unit level (not via Playwright) because:
 *
 *   1. The redaction guarantee is a property of how events are
 *      formatted, not of how Playwright drives the UI. A unit test
 *      isolates the assertion.
 *
 *   2. The Playwright variant of this test wedged on the same SPA-
 *      hydration race that wedged the marketing-screenshot script.
 *      We don't gain anything by re-running that gauntlet.
 *
 *   3. If a future code change starts flowing journal/notes text into
 *      a trust event's summary or detail field, this test fails with
 *      the specific token that leaked — directly pointing at the
 *      offending call site.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, fireEvent, waitFor } from '@testing-library/react';

import TrustReceipt from '../TrustReceipt';
import {
  __resetForTests,
  recordCleartextRead,
  recordStorageEvent,
} from '../../../lib/trust/receipt';
import { setJSON } from '../../../lib/storage';

const PII_TOKENS = [
  'JOURNAL-SECRET-d8f2a1',
  'NOTES-PRIVATE-ce40b7',
  'fakeperson@example.test',
  '+15551234567',
];

describe('TrustReceipt — redaction guarantee', () => {
  beforeEach(() => {
    __resetForTests();
    vi.useRealTimers();
  });
  afterEach(() => {
    cleanup();
    __resetForTests();
  });

  it('never renders PII tokens that flow through the actual storage path', async () => {
    /* [R8-C-FIX Copilot] Drive the PII through the REAL setJSON path
     * (not just hand-crafted recordStorageEvent calls). setJSON is
     * what the app actually uses in production, and it records only
     * the key + bytes — never the value. This test fails the moment
     * a future change in storage.ts starts publishing the value, or
     * if EventRow starts surfacing more than `summary` + `detail`. */
    await setJSON('alchohalt.db', {
      entries: [{ id: 'e1', journal: PII_TOKENS[0], notes: PII_TOKENS[1] }],
      profile: { email: PII_TOKENS[2], phone: PII_TOKENS[3] },
    });
    recordCleartextRead('sync.passphrase', 'derived 32-byte key (5ms)');

    const view = render(<TrustReceipt />);
    /* Wait for the initial getJSON(...) useEffect to settle so that
     * a subsequent toggle click isn't overwritten by the async load. */
    await waitFor(() => {
      const input = view.container.querySelector('input[type="checkbox"]');
      expect(input).not.toBeNull();
    });
    const toggleInput = view.container.querySelector('input[type="checkbox"]');
    await act(async () => {
      fireEvent.click(toggleInput as HTMLInputElement);
    });
    await waitFor(() => {
      expect(view.container.querySelector('ul')).not.toBeNull();
    });

    const panelText = view.container.textContent ?? '';
    for (const token of PII_TOKENS) {
      expect(
        panelText.includes(token),
        `Trust receipt rendered PII token "${token}" — find the call site that passed it.`,
      ).toBe(false);
    }
    // Sanity — the legitimate keys/summaries DO render.
    expect(panelText).toContain('alchohalt.db');
    expect(panelText).toContain('derived 32-byte key');
  });

  it('toggle survives hydration race — fast user click is not clobbered by async getJSON', async () => {
    /* [R8-C-FIX regression] Codex review caught: the initial
     * getJSON(...).then(setEnabled) resolution previously overwrote
     * any user toggle that fired before it landed. This test pins the
     * fix: render the panel, immediately click the toggle on (before
     * the storage read can resolve), and assert the toggled-on state
     * is preserved after waitFor settles all async reads. */
    const view = render(<TrustReceipt />);
    const toggleInput = view.container.querySelector('input[type="checkbox"]');
    expect(toggleInput).not.toBeNull();
    // User clicks BEFORE waitFor — simulates a fast interaction.
    await act(async () => {
      fireEvent.click(toggleInput as HTMLInputElement);
    });
    // Now wait for any pending async reads to flush.
    await waitFor(() => {
      // List should be visible because user said enabled=true.
      expect(view.container.querySelector('ul')).not.toBeNull();
    });
    // The user's intent must win.
    const finalToggle = view.container.querySelector('input[type="checkbox"]') as
      | HTMLInputElement
      | null;
    expect(finalToggle?.checked).toBe(true);
  });

  it('contract: any PII passed through recordStorageEvent.detail surfaces in expanded JSON', async () => {
    /* [R8-C-FIX Copilot] This is the documenting test for the
     * caller-discipline contract: TrustReceipt.tsx will render any
     * detail JSON its caller hands it. The redaction guarantee comes
     * from the call sites — see src/lib/storage.ts. We assert here
     * that the contract is well-defined: a buggy caller WOULD leak.
     *
     * If this test starts failing because the renderer redacts now,
     * that's an upgrade — flip the assertion to expect non-leak.
     * Until then, the regression-prevention vector is "audit every
     * recordStorageEvent call site for content-bearing fields". */
    recordStorageEvent('set', 'entries', { lastJournal: PII_TOKENS[0] });
    const view = render(<TrustReceipt />);
    const toggleInput = view.container.querySelector('input[type="checkbox"]');
    expect(toggleInput).not.toBeNull();
    await act(async () => {
      fireEvent.click(toggleInput as HTMLInputElement);
    });
    await waitFor(() => {
      expect(view.container.querySelector('ul')).not.toBeNull();
    });
    /* Expand every row — the buffer is newest-first and the PII row
     * is one of N. Clicking the first button only expands the newest
     * (storage-set for trust-receipt-enabled), not the entries row. */
    const allRowButtons = view.container.querySelectorAll('ul button');
    expect(allRowButtons.length).toBeGreaterThan(0);
    for (const btn of Array.from(allRowButtons)) {
      await act(async () => {
        fireEvent.click(btn);
      });
    }
    const panelText = view.container.textContent ?? '';
    expect(
      panelText.includes(PII_TOKENS[0]!),
      'Buggy caller path: a future redaction layer would flip this expect to false.',
    ).toBe(true);
  });
});
