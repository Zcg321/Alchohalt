import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClearData } from '../ClearData';

/* [R13-C] Erase-all-data must require typing the locale-specific
 * confirm word before the destructive button enables. The original
 * window.confirm() pattern was a single-tap "OK" away from nuking
 * every entry, goal, preset, and setting.
 *
 * These tests pin: the modal opens, a wrong word disables the button,
 * the right word enables it, and only the correct word actually wipes
 * preferences. */

const clearMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@/shared/capacitor', () => ({
  getPreferences: vi.fn(async () => ({ clear: clearMock })),
}));

beforeEach(() => {
  clearMock.mockClear();
});

describe('[R13-C] ClearData type-to-confirm modal', () => {
  it('clicking the danger button opens a modal, not a window.confirm', () => {
    const onCleared = vi.fn();
    render(<ClearData onCleared={onCleared} />);
    const triggers = screen.getAllByRole('button', { name: /clear all data|clearAllData/i });
    fireEvent.click(triggers[0]!);
    expect(screen.getByTestId('erase-confirm-modal')).toBeInTheDocument();
    expect(screen.getByTestId('erase-confirm-input')).toBeInTheDocument();
  });

  it('confirm button is disabled until the user types the confirm word', () => {
    const onCleared = vi.fn();
    render(<ClearData onCleared={onCleared} />);
    fireEvent.click(screen.getAllByRole('button', { name: /clear all data|clearAllData/i })[0]!);
    const confirm = screen.getByTestId('erase-confirm-confirm');
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByTestId('erase-confirm-input'), {
      target: { value: 'wrong' },
    });
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByTestId('erase-confirm-input'), {
      target: { value: 'ERASE' },
    });
    expect(confirm).not.toBeDisabled();
  });

  it('confirm word is case-insensitive — "erase" / "Erase" / "ERASE" all work', () => {
    const onCleared = vi.fn();
    render(<ClearData onCleared={onCleared} />);
    fireEvent.click(screen.getAllByRole('button', { name: /clear all data|clearAllData/i })[0]!);
    const input = screen.getByTestId('erase-confirm-input');
    const confirm = screen.getByTestId('erase-confirm-confirm');
    for (const variant of ['erase', 'Erase', 'ERASE', '  erase  ']) {
      fireEvent.change(input, { target: { value: variant } });
      expect(confirm).not.toBeDisabled();
    }
  });

  it('cancel button closes the modal without wiping preferences', () => {
    const onCleared = vi.fn();
    render(<ClearData onCleared={onCleared} />);
    fireEvent.click(screen.getAllByRole('button', { name: /clear all data|clearAllData/i })[0]!);
    fireEvent.click(screen.getByTestId('erase-confirm-cancel'));
    expect(screen.queryByTestId('erase-confirm-modal')).not.toBeInTheDocument();
    expect(clearMock).not.toHaveBeenCalled();
    expect(onCleared).not.toHaveBeenCalled();
  });

  it('only the correct confirm word actually clears preferences', async () => {
    const onCleared = vi.fn();
    render(<ClearData onCleared={onCleared} />);
    fireEvent.click(screen.getAllByRole('button', { name: /clear all data|clearAllData/i })[0]!);
    fireEvent.change(screen.getByTestId('erase-confirm-input'), {
      target: { value: 'ERASE' },
    });
    fireEvent.click(screen.getByTestId('erase-confirm-confirm'));
    await waitFor(() => expect(clearMock).toHaveBeenCalledOnce());
    expect(onCleared).toHaveBeenCalledOnce();
  });

  it('disabled-button click does NOT wipe preferences (defense in depth)', async () => {
    const onCleared = vi.fn();
    render(<ClearData onCleared={onCleared} />);
    fireEvent.click(screen.getAllByRole('button', { name: /clear all data|clearAllData/i })[0]!);
    fireEvent.change(screen.getByTestId('erase-confirm-input'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByTestId('erase-confirm-confirm'));
    await new Promise((r) => setTimeout(r, 10));
    expect(clearMock).not.toHaveBeenCalled();
  });
});
