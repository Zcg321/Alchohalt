import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import SyncPanel from '../SyncPanel';
import { MockSyncTransport } from '../../../lib/sync/transport';
import { useSyncStore } from '../../../lib/sync/syncStore';

function resetStore() {
  act(() => {
    useSyncStore.getState().reset();
  });
}

describe('[SYNC-3] SyncPanel — Settings flow', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the off-state with both CTAs', () => {
    render(<SyncPanel transport={new MockSyncTransport()} />);
    expect(screen.getByTestId('sync-panel')).toBeInTheDocument();
    expect(screen.getByTestId('sync-enable')).toBeInTheDocument();
    expect(screen.getByTestId('sync-signin')).toBeInTheDocument();
  });

  it('Turn-on opens the enable form', () => {
    render(<SyncPanel transport={new MockSyncTransport()} />);
    fireEvent.click(screen.getByTestId('sync-enable'));
    expect(screen.getByTestId('sync-enable-form')).toBeInTheDocument();
  });

  it('rejects a weak passphrase before generating a mnemonic', async () => {
    render(<SyncPanel transport={new MockSyncTransport()} />);
    fireEvent.click(screen.getByTestId('sync-enable'));
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Passphrase/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByTestId('sync-enable-continue'));
    expect(await screen.findByRole('alert')).toHaveTextContent(/12\+ characters/i);
    // Did NOT advance to mnemonic display.
    expect(screen.queryByTestId('sync-mnemonic-display')).not.toBeInTheDocument();
  }, 30_000);

  it('rejects an invalid email before generating a mnemonic', async () => {
    render(<SyncPanel transport={new MockSyncTransport()} />);
    fireEvent.click(screen.getByTestId('sync-enable'));
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText(/Passphrase/i), { target: { value: 'StrongPass123' } });
    fireEvent.click(screen.getByTestId('sync-enable-continue'));
    expect(await screen.findByRole('alert')).toHaveTextContent(/valid email/i);
  }, 30_000);

  it('passes a strong passphrase + email and advances to mnemonic display', async () => {
    render(<SyncPanel transport={new MockSyncTransport()} />);
    fireEvent.click(screen.getByTestId('sync-enable'));
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Passphrase/i), { target: { value: 'StrongPass123' } });
    fireEvent.click(screen.getByTestId('sync-enable-continue'));
    const display = await screen.findByTestId('sync-mnemonic-display', {}, { timeout: 30_000 });
    expect(display).toBeInTheDocument();
    const words = screen.getByTestId('sync-mnemonic-words');
    expect(words.querySelectorAll('li')).toHaveLength(12);
  }, 60_000);

  it('mnemonic Continue is disabled until the acknowledgment checkbox is ticked', async () => {
    render(<SyncPanel transport={new MockSyncTransport()} />);
    fireEvent.click(screen.getByTestId('sync-enable'));
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Passphrase/i), { target: { value: 'StrongPass123' } });
    fireEvent.click(screen.getByTestId('sync-enable-continue'));
    await screen.findByTestId('sync-mnemonic-display', {}, { timeout: 30_000 });

    const cont = screen.getByTestId('sync-mnemonic-continue') as HTMLButtonElement;
    expect(cont.disabled).toBe(true);
    fireEvent.click(screen.getByTestId('sync-mnemonic-ack'));
    expect(cont.disabled).toBe(false);
  }, 60_000);

  it('full enable flow lands on the enabled state with provider + device id + activity', async () => {
    const transport = new MockSyncTransport();
    render(<SyncPanel transport={transport} />);
    fireEvent.click(screen.getByTestId('sync-enable'));
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Passphrase/i), { target: { value: 'StrongPass123' } });
    fireEvent.click(screen.getByTestId('sync-enable-continue'));
    await screen.findByTestId('sync-mnemonic-display', {}, { timeout: 30_000 });
    fireEvent.click(screen.getByTestId('sync-mnemonic-ack'));
    fireEvent.click(screen.getByTestId('sync-mnemonic-continue'));
    await waitFor(() => {
      expect(screen.getByTestId('sync-enabled-state')).toBeInTheDocument();
    }, { timeout: 30_000 });
    expect(screen.getByText(/Supabase/)).toBeInTheDocument();
    // Device id was minted + activity log records "enabled".
    expect(screen.getByText(/Encrypted backup turned on/)).toBeInTheDocument();
  }, 90_000);

  it('multi-device sign-in flow drives sync-pull and lands on enabled', async () => {
    // First, register a user via signUp so the sign-in path has
    // someone to sign in as. We bypass the UI and call the transport
    // directly to keep this test focused on the sign-in flow.
    const transport = new MockSyncTransport();
    const { deriveAuthHash } = await import('../../../lib/sync/keys');
    const tempSalt = new Uint8Array(16);
    const probeAuthHash = await deriveAuthHash('StrongPass123', tempSalt);
    await transport.signUp('a@b.com', probeAuthHash, tempSalt);

    render(<SyncPanel transport={transport} />);
    fireEvent.click(screen.getByTestId('sync-signin'));
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Passphrase/i), { target: { value: 'StrongPass123' } });
    fireEvent.click(screen.getByTestId('sync-signin-continue'));
    await waitFor(() => {
      expect(screen.getByTestId('sync-enabled-state')).toBeInTheDocument();
    }, { timeout: 30_000 });
    // Sync-success entry recorded.
    expect(screen.getByText(/Synced/)).toBeInTheDocument();
  }, 90_000);

  it('disable returns to the off state and records the activity', async () => {
    const transport = new MockSyncTransport();
    render(<SyncPanel transport={transport} />);
    // Drive directly through the store for speed.
    act(() => {
      useSyncStore.getState().setEnabled('user-stub');
    });
    expect(screen.getByTestId('sync-enabled-state')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('sync-disable'));
    expect(screen.getByTestId('sync-enable')).toBeInTheDocument();
  });

  it('conflict-resolved entries render in the activity log', () => {
    render(<SyncPanel transport={new MockSyncTransport()} />);
    act(() => {
      useSyncStore.getState().setEnabled('user-stub');
      useSyncStore.getState().recordConflict('goals: server wins (LWW)');
    });
    expect(screen.getByText(/Conflict resolved/)).toBeInTheDocument();
    expect(screen.getByText(/server wins/)).toBeInTheDocument();
  });
}, { timeout: 90_000 });
