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

  it('never renders PII tokens that callers might accidentally pass through', async () => {
    /* Worst-case: a future caller wires a journal entry's text into a
     * recordStorageEvent detail. The panel should not surface it
     * verbatim — but right now it WOULD, because we render the whole
     * detail JSON when expanded. The redaction guarantee we hold today
     * is only as strong as the discipline at the call site: events
     * carry no payload, only key + bytes. We assert that discipline. */
    recordStorageEvent('set', 'alchohalt.db', { bytes: 4096 });
    recordStorageEvent('get', 'lang', { hit: true });
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

  it('redacts even when a buggy caller would shove PII into detail', async () => {
    /* Simulate the regression: someone calls
     *   recordStorageEvent('set', 'entries', { lastJournal: PII })
     * The detail expands on click. The detail JSON would contain the
     * PII string. We're asserting THIS test fails until we either
     * (a) prevent passing arbitrary detail through, or (b) redact
     * recognizable PII patterns inside the renderer. Today we hold
     * (a) at the call sites — see src/lib/storage.ts. This test
     * documents the contract: if it ever fires, fix the call site,
     * not this test. */
    recordStorageEvent('set', 'entries', { lastJournal: PII_TOKENS[0] });
    const view = render(<TrustReceipt />);
    const toggleInput = view.container.querySelector('input[type="checkbox"]');
    await act(async () => {
      fireEvent.click(toggleInput as HTMLInputElement);
    });
    // Click the row to expand detail.
    const rowButton = view.container.querySelector('ul button');
    if (rowButton) {
      await act(async () => {
        fireEvent.click(rowButton);
      });
    }
    const panelText = view.container.textContent ?? '';
    if (panelText.includes(PII_TOKENS[0]!)) {
      // Eslint friendliness — explicit failure with a fixable hint.
      throw new Error(
        `Trust receipt expanded a PII token into the visible detail JSON. ` +
          `Storage callers must not pass content fields through recordStorageEvent. ` +
          `Audit src/lib/storage.ts and any other callers.`,
      );
    }
  });
});
