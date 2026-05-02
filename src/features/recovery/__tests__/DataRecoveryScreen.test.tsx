import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import DataRecoveryScreen from '../DataRecoveryScreen';
import { clearCorruption, reportCorruption } from '../../../lib/dbRecovery';

describe('[R11-2] DataRecoveryScreen', () => {
  beforeEach(() => {
    clearCorruption();
  });

  afterEach(() => {
    clearCorruption();
    vi.restoreAllMocks();
  });

  it('renders nothing when there is no corruption', () => {
    const { container } = render(<DataRecoveryScreen />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the alert dialog when corruption is reported', () => {
    reportCorruption('entries-not-array', { broken: true });
    render(<DataRecoveryScreen />);
    const dialog = screen.getByTestId('data-recovery-screen');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('role', 'alertdialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText(/entries-not-array/i)).toBeInTheDocument();
  });

  it("subscribes to dbRecovery — appears even if reported AFTER mount", () => {
    render(<DataRecoveryScreen />);
    expect(screen.queryByTestId('data-recovery-screen')).not.toBeInTheDocument();
    act(() => reportCorruption('entry-missing-ts', { foo: 1 }));
    expect(screen.getByTestId('data-recovery-screen')).toBeInTheDocument();
  });

  it('shows three options: try again, salvage, start fresh', () => {
    reportCorruption('not-an-object', 'oops');
    render(<DataRecoveryScreen />);
    expect(screen.getByTestId('recovery-try-again')).toBeInTheDocument();
    expect(screen.getByTestId('recovery-salvage')).toBeInTheDocument();
    expect(screen.getByTestId('recovery-start-fresh')).toBeInTheDocument();
  });

  it('start-fresh requires explicit confirmation (two-step)', () => {
    reportCorruption('not-an-object', 'oops');
    render(<DataRecoveryScreen />);
    expect(screen.queryByTestId('recovery-confirm-fresh')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('recovery-start-fresh'));
    expect(screen.getByTestId('recovery-confirm-fresh')).toBeInTheDocument();
    expect(screen.getByTestId('recovery-confirm-fresh-yes')).toBeInTheDocument();
    expect(screen.getByTestId('recovery-confirm-fresh-cancel')).toBeInTheDocument();
  });

  it('start-fresh cancel returns to the three-options view', () => {
    reportCorruption('not-an-object', 'oops');
    render(<DataRecoveryScreen />);
    fireEvent.click(screen.getByTestId('recovery-start-fresh'));
    fireEvent.click(screen.getByTestId('recovery-confirm-fresh-cancel'));
    expect(screen.queryByTestId('recovery-confirm-fresh')).not.toBeInTheDocument();
    expect(screen.getByTestId('recovery-start-fresh')).toBeInTheDocument();
  });

  it('salvage triggers a download (URL.createObjectURL invoked with a Blob)', () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:salvage');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(window.URL, 'createObjectURL', {
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectURL,
    });
    reportCorruption('settings-not-object', { entries: [{ ts: 1 }] });
    render(<DataRecoveryScreen />);
    fireEvent.click(screen.getByTestId('recovery-salvage'));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const firstCall = createObjectURL.mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toBeInstanceOf(Blob);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:salvage');
  });
});
