/**
 * useSyncPanelState — extracted from SyncPanel.tsx as part of the
 * [R17-A] long-function lint sweep. Owns form state, error
 * messaging, mnemonic generation, and the four async submit handlers
 * (enable / mnemonic-continue / sign-in / sync-now / disable).
 *
 * Splitting state + handlers from render keeps SyncPanel.tsx as a
 * pure phase-switch and lets each phase render component live in
 * SyncPanelPhases.tsx.
 */

import React, { useRef, useState } from 'react';
import {
  useSyncStore,
  isPassphraseStrongEnough,
} from '../../lib/sync/syncStore';
import { scheduleSync } from '../../lib/sync/scheduler';
import {
  deriveMasterKey,
  deriveAuthHash,
  generateUserSalt,
} from '../../lib/sync/keys';
import { generate as generateMnemonic } from '../../lib/sync/mnemonic';
import type { SyncTransport } from '../../lib/sync/transport';
import { humanizeSyncError } from './syncErrorMessage';
import { hapticForEvent } from '../../shared/haptics';

export type SyncErrorField = 'email' | 'passphrase' | 'form' | null;

interface PendingKeys { masterKey: Uint8Array; authHash: Uint8Array; userSalt: Uint8Array }

function useSyncFormState() {
  const [email, setEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<SyncErrorField>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingMnemonic, setPendingMnemonic] = useState<string[] | null>(null);
  const [mnemonicAck, setMnemonicAck] = useState(false);
  const [pendingKeys, setPendingKeys] = useState<PendingKeys | null>(null);
  return {
    email, setEmail, passphrase, setPassphrase,
    error, setError, errorField, setErrorField, errorRef, busy, setBusy,
    pendingMnemonic, setPendingMnemonic, mnemonicAck, setMnemonicAck,
    pendingKeys, setPendingKeys,
  };
}

export function useSyncPanelState(transport: SyncTransport) {
  const phase = useSyncStore((s) => s.phase);
  const setPhase = useSyncStore((s) => s.setPhase);
  const setEnabled = useSyncStore((s) => s.setEnabled);
  const setDisabled = useSyncStore((s) => s.setDisabled);
  const recordSync = useSyncStore((s) => s.recordSync);
  const userId = useSyncStore((s) => s.userId);
  const f = useSyncFormState();

  function setFieldError(field: 'email' | 'passphrase' | 'form', message: string) {
    f.setErrorField(field); f.setError(message);
    if (field === 'form') hapticForEvent('error');
    queueMicrotask(() => f.errorRef.current?.focus?.());
  }
  function clearError() { f.setError(null); f.setErrorField(null); }
  function resetForm() {
    f.setEmail(''); f.setPassphrase(''); clearError();
    f.setMnemonicAck(false); f.setPendingMnemonic(null); f.setPendingKeys(null);
  }

  async function handleEnableSubmit(e: React.FormEvent) {
    e.preventDefault(); clearError();
    if (!f.email.includes('@')) { setFieldError('email', 'Enter a valid email.'); return; }
    if (!isPassphraseStrongEnough(f.passphrase)) {
      setFieldError('passphrase', 'Passphrase must be 12+ characters with upper, lower, and a digit.');
      return;
    }
    f.setBusy(true);
    try {
      const userSalt = await generateUserSalt();
      const [masterKey, authHash, mnemonic] = await Promise.all([
        deriveMasterKey(f.passphrase, userSalt),
        deriveAuthHash(f.passphrase, userSalt),
        generateMnemonic(),
      ]);
      f.setPendingKeys({ masterKey, authHash, userSalt });
      f.setPendingMnemonic(mnemonic); setPhase('mnemonic-shown');
    } catch (err) { setFieldError('form', humanizeSyncError((err as Error).message)); }
    finally { f.setBusy(false); }
  }

  async function handleMnemonicContinue() {
    if (!f.pendingMnemonic || !f.pendingKeys || !f.mnemonicAck) return;
    f.setBusy(true); clearError();
    try {
      const session = await transport.signUp(f.email, f.pendingKeys.authHash, f.pendingKeys.userSalt);
      await transport.push(session, []);
      setEnabled(session.userId); recordSync('success', 'initial push'); resetForm();
    } catch (err) {
      setFieldError('form', humanizeSyncError((err as Error).message));
      recordSync('error', (err as Error).message);
    } finally { f.setBusy(false); }
  }

  async function handleSignInSubmit(e: React.FormEvent) {
    e.preventDefault(); clearError();
    if (!f.email.includes('@')) { setFieldError('email', 'Enter your email.'); return; }
    if (f.passphrase.length === 0) { setFieldError('passphrase', 'Enter your passphrase.'); return; }
    f.setBusy(true);
    try {
      const userSalt = await transport.getUserSalt(f.email);
      const authHash = await deriveAuthHash(f.passphrase, userSalt);
      const session = await transport.signIn(f.email, authHash);
      await deriveMasterKey(f.passphrase, session.userSalt);
      const result = await transport.pull(session, null);
      setEnabled(session.userId); recordSync('success', `pulled ${result.blobs.length} blob(s)`); resetForm();
    } catch (err) { setFieldError('form', humanizeSyncError((err as Error).message)); }
    finally { f.setBusy(false); }
  }

  async function handleSyncNow() {
    if (phase !== 'enabled' || !userId) return;
    f.setBusy(true);
    try { scheduleSync('manual'); } finally { f.setBusy(false); }
  }
  function handleDisable() { setDisabled(); resetForm(); }

  return {
    email: f.email, setEmail: f.setEmail,
    passphrase: f.passphrase, setPassphrase: f.setPassphrase,
    error: f.error, errorField: f.errorField, errorRef: f.errorRef, busy: f.busy,
    pendingMnemonic: f.pendingMnemonic, mnemonicAck: f.mnemonicAck, setMnemonicAck: f.setMnemonicAck,
    resetForm, handleEnableSubmit, handleMnemonicContinue, handleSignInSubmit, handleSyncNow, handleDisable,
  };
}
