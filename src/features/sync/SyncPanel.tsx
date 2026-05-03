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

import React, { useRef, useState } from 'react';
import {
  useSyncStore,
  isPassphraseStrongEnough,
  type ActivityEntry,
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

interface Props {
  transport: SyncTransport;
}

function fmtRelative(ts: number): string {
  const delta = Date.now() - ts;
  if (delta < 60_000) return 'just now';
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)} min ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)} hr ago`;
  return new Date(ts).toLocaleDateString();
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const labels: Record<typeof entry.kind, string> = {
    enabled: 'Encrypted backup turned on',
    disabled: 'Encrypted backup turned off',
    'sync-success': 'Synced',
    'sync-error': 'Sync error',
    'conflict-resolved': 'Conflict resolved',
  };
  return (
    <li className="flex items-center justify-between py-2 border-b border-border-soft/60 last:border-0 text-caption">
      <span className="text-ink">{labels[entry.kind]}{entry.detail ? ` — ${entry.detail}` : ''}</span>
      <span className="text-ink-subtle tabular-nums">{fmtRelative(entry.ts)}</span>
    </li>
  );
}

/* [REFACTOR-LONG-FN] Enabled-phase status card extracted from the
 * SyncPanel render. Pure presentation: displays provider info, device
 * id, last sync, sync-now / disable buttons, and the recent-activity
 * list. State + handlers stay in the parent and pass down. */
interface SyncEnabledStatusProps {
  enabledAt: number | null;
  deviceId: string | null;
  userId: string | null;
  lastSyncAt: number | null;
  busy: boolean;
  activity: ActivityEntry[];
  onSyncNow: () => void;
  onDisable: () => void;
}

function SyncEnabledStatus({
  enabledAt, deviceId, userId, lastSyncAt, busy, activity, onSyncNow, onDisable,
}: SyncEnabledStatusProps) {
  return (
    <div className="space-y-4" data-testid="sync-enabled-state">
      <dl className="grid grid-cols-2 gap-y-2 text-caption">
        <dt className="text-ink-soft">Provider</dt>
        <dd className="text-ink">Supabase (encrypted; server cannot read)</dd>
        <dt className="text-ink-soft">Enabled</dt>
        <dd className="text-ink tabular-nums">
          {enabledAt ? new Date(enabledAt).toLocaleDateString() : '—'}
        </dd>
        <dt className="text-ink-soft">Device id</dt>
        <dd className="text-ink font-mono text-micro">{deviceId ?? '—'}</dd>
        <dt className="text-ink-soft">User id</dt>
        <dd className="text-ink font-mono text-micro">{userId ?? '—'}</dd>
        <dt className="text-ink-soft">Last sync</dt>
        <dd className="text-ink">{lastSyncAt ? fmtRelative(lastSyncAt) : 'never'}</dd>
      </dl>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSyncNow}
          disabled={busy}
          className="flex-1 inline-flex items-center justify-center rounded-pill bg-sage-700 px-4 py-2.5 text-caption font-medium text-white hover:bg-sage-900 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
          data-testid="sync-now"
        >
          {busy ? 'Syncing…' : 'Sync now'}
        </button>
        <button
          type="button"
          onClick={onDisable}
          className="inline-flex items-center justify-center rounded-pill border border-border bg-surface-elevated px-4 py-2.5 text-caption text-ink hover:bg-cream-50 min-h-[44px]"
          data-testid="sync-disable"
        >
          Disable
        </button>
      </div>
      <div>
        <h4 className="text-caption font-medium text-ink mb-1">Recent activity</h4>
        {activity.length === 0 ? (
          <p className="text-caption text-ink-subtle">No activity yet.</p>
        ) : (
          <ul role="list" data-testid="sync-activity-log">
            {activity.slice(0, 8).map((e) => (
              <ActivityRow key={e.id} entry={e} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function SyncPanel({ transport }: Props) {
  const phase = useSyncStore((s) => s.phase);
  const setPhase = useSyncStore((s) => s.setPhase);
  const setEnabled = useSyncStore((s) => s.setEnabled);
  const setDisabled = useSyncStore((s) => s.setDisabled);
  const recordSync = useSyncStore((s) => s.recordSync);
  const userId = useSyncStore((s) => s.userId);
  const deviceId = useSyncStore((s) => s.deviceId);
  const enabledAt = useSyncStore((s) => s.enabledAt);
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt);
  const activity = useSyncStore((s) => s.activity);

  // Form state
  const [email, setEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  /* [A11Y-FORM-ERRORS] Track which field the current error is about so
   * we can apply aria-invalid + aria-describedby on the right input.
   * 'form' = error not tied to a single field (network, sign-up, etc.)
   * Both `error` and `errorField` move together via setFieldError /
   * clearError helpers. */
  const [errorField, setErrorField] = useState<'email' | 'passphrase' | 'form' | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState(false);

  function setFieldError(field: 'email' | 'passphrase' | 'form', message: string) {
    setErrorField(field);
    setError(message);
    /* Form-level errors are the catch-block path (network / auth /
     * mnemonic-checksum). Field-level email/passphrase errors are
     * inline validation hints — they stay haptic-silent so the device
     * doesn't buzz on every typo. See shared/haptics.ts for the map. */
    if (field === 'form') hapticForEvent('error');
    /* Move focus to the error region so the screen-reader announces it
     * AND a sighted keyboard user can see exactly what failed without
     * scanning the whole form. tabIndex=-1 makes the region focusable
     * programmatically without adding a Tab stop in the regular flow. */
    queueMicrotask(() => errorRef.current?.focus?.());
  }
  function clearError() {
    setError(null);
    setErrorField(null);
  }

  // Mnemonic-shown state — generated once during the signup flow.
  const [pendingMnemonic, setPendingMnemonic] = useState<string[] | null>(null);
  const [mnemonicAck, setMnemonicAck] = useState(false);
  const [pendingKeys, setPendingKeys] = useState<{
    masterKey: Uint8Array;
    authHash: Uint8Array;
    userSalt: Uint8Array;
  } | null>(null);

  function resetForm() {
    setEmail('');
    setPassphrase('');
    clearError();
    setMnemonicAck(false);
    setPendingMnemonic(null);
    setPendingKeys(null);
  }

  async function handleEnableSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!email.includes('@')) {
      setFieldError('email', 'Enter a valid email.');
      return;
    }
    if (!isPassphraseStrongEnough(passphrase)) {
      setFieldError('passphrase', 'Passphrase must be 12+ characters with upper, lower, and a digit.');
      return;
    }
    setBusy(true);
    try {
      const userSalt = await generateUserSalt();
      const [masterKey, authHash, mnemonic] = await Promise.all([
        deriveMasterKey(passphrase, userSalt),
        deriveAuthHash(passphrase, userSalt),
        generateMnemonic(),
      ]);
      setPendingKeys({ masterKey, authHash, userSalt });
      setPendingMnemonic(mnemonic);
      setPhase('mnemonic-shown');
    } catch (err) {
      setFieldError('form', humanizeSyncError((err as Error).message));
    } finally {
      setBusy(false);
    }
  }

  async function handleMnemonicContinue() {
    if (!pendingMnemonic || !pendingKeys || !mnemonicAck) return;
    setBusy(true);
    clearError();
    try {
      const session = await transport.signUp(
        email,
        pendingKeys.authHash,
        pendingKeys.userSalt,
      );
      // Initial sync — empty push is enough to record provisioning.
      await transport.push(session, []);
      setEnabled(session.userId);
      recordSync('success', 'initial push');
      resetForm();
    } catch (err) {
      setFieldError('form', humanizeSyncError((err as Error).message));
      recordSync('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignInSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!email.includes('@')) {
      setFieldError('email', 'Enter your email.');
      return;
    }
    if (passphrase.length === 0) {
      setFieldError('passphrase', 'Enter your passphrase.');
      return;
    }
    setBusy(true);
    try {
      // [SYNC-3a] Multi-device flow. Fetch the userSalt from the
      // pre-auth salt-lookup endpoint, derive authHash + masterKey
      // from (passphrase, userSalt), then sign in. The transport
      // ALWAYS returns 16 bytes — for a non-existent email it
      // returns a pepper-derived fake. Sign-in then fails uniformly
      // on auth, so a remote observer cannot tell whether the email
      // is registered.
      const userSalt = await transport.getUserSalt(email);
      const authHash = await deriveAuthHash(passphrase, userSalt);
      const session = await transport.signIn(email, authHash);
      // Master key is derived for completeness even though we don't
      // surface it here — the same derivation that ran on the first
      // device produces the same masterKey, so blobs the server has
      // sent us decrypt cleanly.
      await deriveMasterKey(passphrase, session.userSalt);
      const result = await transport.pull(session, null);
      setEnabled(session.userId);
      recordSync('success', `pulled ${result.blobs.length} blob(s)`);
      resetForm();
    } catch (err) {
      setFieldError('form', humanizeSyncError((err as Error).message));
    } finally {
      setBusy(false);
    }
  }

  async function handleSyncNow() {
    if (phase !== 'enabled' || !userId) return;
    setBusy(true);
    try {
      // [SYNC-3b] Dispatch through the scheduler so the manual run
      // is serialized against any in-flight foreground / mutation
      // run. Manual reason has 0s debounce; the scheduler's runner
      // is configured at app startup with the active SyncTransport
      // session.
      scheduleSync('manual');
    } finally {
      setBusy(false);
    }
  }

  function handleDisable() {
    setDisabled();
    resetForm();
  }

  // ---------- render ----------
  return (
    <section
      className="card"
      aria-labelledby="sync-heading"
      data-testid="sync-panel"
    >
      <div className="card-header">
        <h3 id="sync-heading" className="text-h3 text-ink">Encrypted backup</h3>
        <p className="mt-1 text-caption text-ink-soft">
          Backups upload encrypted with a key only you have. Off by default.
        </p>
      </div>
      <div className="card-content space-y-4">
        {phase === 'off' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => { resetForm(); setPhase('enabling'); }}
              className="w-full inline-flex items-center justify-center rounded-pill bg-sage-700 px-4 py-2.5 text-caption font-medium text-white hover:bg-sage-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
              data-testid="sync-enable"
            >
              Turn on encrypted backup
            </button>
            <button
              type="button"
              onClick={() => { resetForm(); setPhase('signing-in'); }}
              className="w-full inline-flex items-center justify-center rounded-pill border border-border bg-surface-elevated px-4 py-2.5 text-caption font-medium text-ink hover:bg-cream-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
              data-testid="sync-signin"
            >
              I have an account (sign in on this device)
            </button>
          </div>
        )}

        {phase === 'enabling' && (
          <form noValidate onSubmit={handleEnableSubmit} className="space-y-4" data-testid="sync-enable-form" aria-describedby={error ? 'sync-enable-error' : undefined}>
            {/* [A11Y-FORM-ERRORS] Form-level error summary lives at the
                top of the form so screen readers and sighted keyboard
                users encounter it before the inputs. tabIndex=-1 makes
                it programmatically focusable; setFieldError moves focus
                here so the message is announced and visible. */}
            {error ? (
              <div
                ref={errorRef}
                id="sync-enable-error"
                role="alert"
                tabIndex={-1}
                className="rounded-lg border border-crisis-200 bg-crisis-50 px-3 py-2 text-caption text-crisis-700 dark:bg-crisis-900/20 dark:border-crisis-800 dark:text-crisis-200 focus:outline-2 focus:outline-crisis-500"
              >
                {error}
              </div>
            ) : null}
            <div className="space-y-1">
              <label htmlFor="sync-email" className="block text-caption font-medium text-ink">Email</label>
              <input
                id="sync-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                autoComplete="email"
                aria-invalid={errorField === 'email' ? true : undefined}
                aria-describedby={errorField === 'email' ? 'sync-enable-error' : undefined}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="sync-pass" className="block text-caption font-medium text-ink">Passphrase</label>
              <input
                id="sync-pass"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="input"
                autoComplete="new-password"
                aria-invalid={errorField === 'passphrase' ? true : undefined}
                aria-describedby={
                  errorField === 'passphrase'
                    ? 'sync-pass-hint sync-enable-error'
                    : 'sync-pass-hint'
                }
              />
              <p id="sync-pass-hint" className="text-micro text-ink-subtle">
                12+ characters, with upper, lower, and a digit.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 inline-flex items-center justify-center rounded-pill bg-sage-700 px-4 py-2.5 text-caption font-medium text-white hover:bg-sage-900 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
                data-testid="sync-enable-continue"
              >
                {busy ? 'Working…' : 'Continue'}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setPhase('off'); }}
                className="inline-flex items-center justify-center rounded-pill border border-border bg-surface-elevated px-4 py-2.5 text-caption text-ink hover:bg-cream-50 min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {phase === 'mnemonic-shown' && pendingMnemonic && (
          <div className="space-y-4" data-testid="sync-mnemonic-display">
            <div className="rounded-2xl border border-amber-100/70 bg-amber-50/60 p-4 text-caption text-ink">
              <p className="font-medium">Save these 12 words.</p>
              <p className="mt-1 text-ink-soft">
                This is the only way to recover your encrypted backup if
                you forget your passphrase. We can&apos;t show them again,
                and we cannot recover them for you.
              </p>
            </div>
            <ol className="grid grid-cols-2 sm:grid-cols-3 gap-2 list-decimal ps-6 text-body text-ink tabular-nums" data-testid="sync-mnemonic-words">
              {pendingMnemonic.map((w) => (
                <li key={w} className="font-mono">{w}</li>
              ))}
            </ol>
            <label className="flex items-start gap-2 text-caption text-ink">
              <input
                type="checkbox"
                checked={mnemonicAck}
                onChange={(e) => setMnemonicAck(e.target.checked)}
                className="mt-1"
                data-testid="sync-mnemonic-ack"
              />
              <span>
                I&apos;ve saved these 12 words somewhere safe. I understand
                that nobody — including the app team — can recover them
                for me.
              </span>
            </label>
            {error ? (
              <div
                ref={errorRef}
                id="sync-mnemonic-error"
                role="alert"
                tabIndex={-1}
                className="rounded-lg border border-crisis-200 bg-crisis-50 px-3 py-2 text-caption text-crisis-700 dark:bg-crisis-900/20 dark:border-crisis-800 dark:text-crisis-200 focus:outline-2 focus:outline-crisis-500"
              >
                {error}
              </div>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleMnemonicContinue}
                disabled={!mnemonicAck || busy}
                className="flex-1 inline-flex items-center justify-center rounded-pill bg-sage-700 px-4 py-2.5 text-caption font-medium text-white hover:bg-sage-900 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
                data-testid="sync-mnemonic-continue"
              >
                {busy ? 'Signing up…' : 'Continue'}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setPhase('off'); }}
                className="inline-flex items-center justify-center rounded-pill border border-border bg-surface-elevated px-4 py-2.5 text-caption text-ink hover:bg-cream-50 min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {phase === 'signing-in' && (
          <form noValidate onSubmit={handleSignInSubmit} className="space-y-4" data-testid="sync-signin-form" aria-describedby={error ? 'sync-signin-error' : undefined}>
            {error ? (
              <div
                ref={errorRef}
                id="sync-signin-error"
                role="alert"
                tabIndex={-1}
                className="rounded-lg border border-crisis-200 bg-crisis-50 px-3 py-2 text-caption text-crisis-700 dark:bg-crisis-900/20 dark:border-crisis-800 dark:text-crisis-200 focus:outline-2 focus:outline-crisis-500"
              >
                {error}
              </div>
            ) : null}
            <div className="space-y-1">
              <label htmlFor="signin-email" className="block text-caption font-medium text-ink">Email</label>
              <input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                autoComplete="email"
                aria-invalid={errorField === 'email' ? true : undefined}
                aria-describedby={errorField === 'email' ? 'sync-signin-error' : undefined}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="signin-pass" className="block text-caption font-medium text-ink">Passphrase</label>
              <input
                id="signin-pass"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="input"
                autoComplete="current-password"
                aria-invalid={errorField === 'passphrase' ? true : undefined}
                aria-describedby={errorField === 'passphrase' ? 'sync-signin-error' : undefined}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 inline-flex items-center justify-center rounded-pill bg-sage-700 px-4 py-2.5 text-caption font-medium text-white hover:bg-sage-900 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
                data-testid="sync-signin-continue"
              >
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setPhase('off'); }}
                className="inline-flex items-center justify-center rounded-pill border border-border bg-surface-elevated px-4 py-2.5 text-caption text-ink hover:bg-cream-50 min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {phase === 'enabled' && (
          <SyncEnabledStatus
            enabledAt={enabledAt}
            deviceId={deviceId}
            userId={userId}
            lastSyncAt={lastSyncAt}
            busy={busy}
            activity={activity}
            onSyncNow={handleSyncNow}
            onDisable={handleDisable}
          />
        )}
      </div>
    </section>
  );
}
