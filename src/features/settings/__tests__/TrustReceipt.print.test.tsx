/**
 * [R15-4] Trust Receipt print button.
 *
 * The print path opens a new window with a self-contained HTML page
 * built from the current trust events. Asserts the button appears
 * when the receipt toggle is on, fires window.open with a blob URL,
 * and is hidden when the toggle is off.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, fireEvent, waitFor } from '@testing-library/react';
import TrustReceipt from '../TrustReceipt';
import {
  __resetForTests,
  recordStorageEvent,
} from '../../../lib/trust/receipt';
import { setJSON } from '../../../lib/storage';

beforeEach(() => {
  __resetForTests();
});

afterEach(() => {
  cleanup();
  __resetForTests();
  vi.restoreAllMocks();
});

describe('[R15-4] TrustReceipt print', () => {
  it('print button is hidden when trust receipt is off', async () => {
    const { queryByTestId } = render(<TrustReceipt />);
    expect(queryByTestId('trust-receipt-print')).toBeNull();
  });

  it('print button appears once the toggle is on', async () => {
    await act(async () => {
      await setJSON('trust-receipt-enabled', true);
    });
    const { findByTestId } = render(<TrustReceipt />);
    await findByTestId('trust-receipt-print');
  });

  it('clicking print calls window.open with a blob: URL', async () => {
    await act(async () => {
      await setJSON('trust-receipt-enabled', true);
    });
    recordStorageEvent('set', 'some-key', { bytes: 12 });

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    /* JSDOM may not implement createObjectURL; provide a stub. */
    const createObjUrl = vi.fn(() => 'blob:mock-url');
    const revokeObjUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjUrl,
    });

    const { findByTestId } = render(<TrustReceipt />);
    const btn = await findByTestId('trust-receipt-print');
    await waitFor(() => expect(btn).toBeInTheDocument());

    /* JSDOM doesn't navigate; window.open returning null triggers the
     * fallback assignment. We're not testing the fallback branch
     * here — just that the open call was attempted. */
    const origLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...origLocation, href: '' } as Location,
    });

    fireEvent.click(btn);

    expect(createObjUrl).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith('blob:mock-url', '_blank');
  });
});
