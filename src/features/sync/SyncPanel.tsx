/**
 * SyncPanel — Settings → "Encrypted backup" toggle + flows.
 *
 * Phases:
 *   off              → toggle visible, off. Two CTAs: "Turn on
 *                      encrypted backup" + "I have an account".
 *   enabling         → email + passphrase form. Validates strength
 *                      live. Generates mnemonic + userSalt + keys
 *                      on submit; advances to mnemonic-shown.
 *   mnemonic-shown   → 12 words displayed once. "I've saved it"
 *                      checkbox gates the Continue button. On
 *                      Continue → transport.signUp + initial push,
 *                      then phase = enabled.
 *   signing-in       → email + passphrase form for multi-device
 *                      sign-in. transport.signIn + pull + decrypt
 *                      + recordActivity, then phase = enabled.
 *   enabled          → status card: provider, enabled timestamp,
 *                      anonymous device id, last sync, "Sync now",
 *                      "Disable", recent activity log.
 *
 * Conflict UI: silent log into recent-activity. Never modal.
 *
 * The component takes a SyncTransport prop so tests can pass a
 * MockSyncTransport. Production code wires the real Supabase
 * transport from a sibling module (deferred to follow-up).
 *
 * Privacy reminder: this panel never stores the master key, the auth
 * hash, or the passphrase. The mnemonic is generated, displayed, and
 * discarded after the user acknowledges they've saved it.
 */

import React from 'react';
import { useSyncStore } from '../../lib/sync/syncStore';
import type { SyncTransport } from '../../lib/sync/transport';
import {
  SyncOffPhase,
  SyncEnablingForm,
  SyncMnemonicPhase,
  SyncSignInForm,
  SyncEnabledStatus,
} from './SyncPanelPhases';
import { useSyncPanelState } from './useSyncPanelState';

interface Props {
  transport: SyncTransport;
}

function SyncPhaseSwitch({ state, store }: { state: ReturnType<typeof useSyncPanelState>; store: { phase: string; setPhase: (p: 'off' | 'enabling' | 'mnemonic-shown' | 'signing-in' | 'enabled') => void; userId: string | null; deviceId: string | null; enabledAt: number | null; lastSyncAt: number | null; activity: import('../../lib/sync/syncStore').ActivityEntry[] } }) {
  const { phase, setPhase, userId, deviceId, enabledAt, lastSyncAt, activity } = store;
  const cancelToOff = () => { state.resetForm(); setPhase('off'); };
  if (phase === 'off') return <SyncOffPhase onEnable={() => { state.resetForm(); setPhase('enabling'); }} onSignIn={() => { state.resetForm(); setPhase('signing-in'); }} />;
  if (phase === 'enabling') return <SyncEnablingForm email={state.email} passphrase={state.passphrase} error={state.error} errorField={state.errorField} errorRef={state.errorRef} busy={state.busy} onEmailChange={state.setEmail} onPassphraseChange={state.setPassphrase} onSubmit={state.handleEnableSubmit} onCancel={cancelToOff} />;
  if (phase === 'mnemonic-shown' && state.pendingMnemonic) return <SyncMnemonicPhase mnemonic={state.pendingMnemonic} ack={state.mnemonicAck} error={state.error} errorRef={state.errorRef} busy={state.busy} onAckChange={state.setMnemonicAck} onContinue={state.handleMnemonicContinue} onCancel={cancelToOff} />;
  if (phase === 'signing-in') return <SyncSignInForm email={state.email} passphrase={state.passphrase} error={state.error} errorField={state.errorField} errorRef={state.errorRef} busy={state.busy} onEmailChange={state.setEmail} onPassphraseChange={state.setPassphrase} onSubmit={state.handleSignInSubmit} onCancel={cancelToOff} />;
  if (phase === 'enabled') return <SyncEnabledStatus enabledAt={enabledAt} deviceId={deviceId} userId={userId} lastSyncAt={lastSyncAt} busy={state.busy} activity={activity} onSyncNow={state.handleSyncNow} onDisable={state.handleDisable} />;
  return null;
}

export default function SyncPanel({ transport }: Props) {
  const store = {
    phase: useSyncStore((s) => s.phase),
    setPhase: useSyncStore((s) => s.setPhase),
    userId: useSyncStore((s) => s.userId),
    deviceId: useSyncStore((s) => s.deviceId),
    enabledAt: useSyncStore((s) => s.enabledAt),
    lastSyncAt: useSyncStore((s) => s.lastSyncAt),
    activity: useSyncStore((s) => s.activity),
  };
  const state = useSyncPanelState(transport);
  return (
    <section className="card" aria-labelledby="sync-heading" data-testid="sync-panel">
      <div className="card-header">
        <h3 id="sync-heading" className="text-h3 text-ink">Encrypted backup</h3>
        <p className="mt-1 text-caption text-ink-soft">
          Backups upload encrypted with a key only you have. Off by default.
        </p>
      </div>
      <div className="card-content space-y-4">
        <SyncPhaseSwitch state={state} store={store} />
      </div>
    </section>
  );
}
