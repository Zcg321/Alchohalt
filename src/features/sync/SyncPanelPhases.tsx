/**
 * SyncPanelPhases — phase-specific render components extracted from
 * SyncPanel.tsx as part of the [R17-A] long-function lint sweep.
 *
 * Each phase is a presentation-only component: state + handlers
 * arrive via props from useSyncPanelState. Splitting this way keeps
 * each function below the 80-line lint cap without introducing new
 * indirection in tests (the data-testid hooks are unchanged).
 */

import React from 'react';
import type { ActivityEntry } from '../../lib/sync/syncStore';

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

const ERROR_BOX =
  'rounded-lg border border-crisis-200 bg-crisis-50 px-3 py-2 text-caption text-crisis-700 dark:bg-crisis-900/20 dark:border-crisis-800 dark:text-crisis-200 focus:outline-2 focus:outline-crisis-500';
const PRIMARY_BTN =
  'flex-1 inline-flex items-center justify-center rounded-pill bg-sage-700 px-4 py-2.5 text-caption font-medium text-white hover:bg-sage-900 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]';
const SECONDARY_BTN =
  'inline-flex items-center justify-center rounded-pill border border-border bg-surface-elevated px-4 py-2.5 text-caption text-ink hover:bg-cream-50 min-h-[44px]';

interface ErrorAlertProps {
  id: string;
  error: string | null;
  errorRef: React.RefObject<HTMLDivElement>;
}
function ErrorAlert({ id, error, errorRef }: ErrorAlertProps) {
  if (!error) return null;
  return (
    <div ref={errorRef} id={id} role="alert" tabIndex={-1} className={ERROR_BOX}>
      {error}
    </div>
  );
}

export function SyncOffPhase({ onEnable, onSignIn }: { onEnable: () => void; onSignIn: () => void }) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onEnable}
        className="w-full inline-flex items-center justify-center rounded-pill bg-sage-700 px-4 py-2.5 text-caption font-medium text-white hover:bg-sage-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
        data-testid="sync-enable"
      >
        Turn on encrypted backup
      </button>
      <button
        type="button"
        onClick={onSignIn}
        className="w-full inline-flex items-center justify-center rounded-pill border border-border bg-surface-elevated px-4 py-2.5 text-caption font-medium text-ink hover:bg-cream-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
        data-testid="sync-signin"
      >
        I have an account (sign in on this device)
      </button>
    </div>
  );
}

interface FormProps {
  email: string;
  passphrase: string;
  error: string | null;
  errorField: 'email' | 'passphrase' | 'form' | null;
  errorRef: React.RefObject<HTMLDivElement>;
  busy: boolean;
  onEmailChange: (v: string) => void;
  onPassphraseChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function SyncEnablingForm({
  email, passphrase, error, errorField, errorRef, busy,
  onEmailChange, onPassphraseChange, onSubmit, onCancel,
}: FormProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4" data-testid="sync-enable-form" aria-describedby={error ? 'sync-enable-error' : undefined}>
      <ErrorAlert id="sync-enable-error" error={error} errorRef={errorRef} />
      <div className="space-y-1">
        <label htmlFor="sync-email" className="block text-caption font-medium text-ink">Email</label>
        <input
          id="sync-email" type="email" value={email}
          onChange={(e) => onEmailChange(e.target.value)} className="input" autoComplete="email"
          aria-invalid={errorField === 'email' ? true : undefined}
          aria-describedby={errorField === 'email' ? 'sync-enable-error' : undefined}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="sync-pass" className="block text-caption font-medium text-ink">Passphrase</label>
        <input
          id="sync-pass" type="password" value={passphrase}
          onChange={(e) => onPassphraseChange(e.target.value)} className="input" autoComplete="new-password"
          aria-invalid={errorField === 'passphrase' ? true : undefined}
          aria-describedby={errorField === 'passphrase' ? 'sync-pass-hint sync-enable-error' : 'sync-pass-hint'}
        />
        <p id="sync-pass-hint" className="text-micro text-ink-subtle">12+ characters, with upper, lower, and a digit.</p>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={PRIMARY_BTN} data-testid="sync-enable-continue">
          {busy ? 'Working…' : 'Continue'}
        </button>
        <button type="button" onClick={onCancel} className={SECONDARY_BTN}>Cancel</button>
      </div>
    </form>
  );
}

interface MnemonicProps {
  mnemonic: string[];
  ack: boolean;
  error: string | null;
  errorRef: React.RefObject<HTMLDivElement>;
  busy: boolean;
  onAckChange: (v: boolean) => void;
  onContinue: () => void;
  onCancel: () => void;
}

export function SyncMnemonicPhase({
  mnemonic, ack, error, errorRef, busy, onAckChange, onContinue, onCancel,
}: MnemonicProps) {
  return (
    <div className="space-y-4" data-testid="sync-mnemonic-display">
      <div className="rounded-2xl border border-amber-100/70 bg-amber-50/60 p-4 text-caption text-ink">
        <p className="font-medium">Save these 12 words.</p>
        <p className="mt-1 text-ink-soft">
          This is the only way to recover your encrypted backup if you forget your passphrase.
          We can&apos;t show them again, and we cannot recover them for you.
        </p>
      </div>
      <ol className="grid grid-cols-2 sm:grid-cols-3 gap-2 list-decimal ps-6 text-body text-ink tabular-nums" data-testid="sync-mnemonic-words">
        {mnemonic.map((w) => (<li key={w} className="font-mono">{w}</li>))}
      </ol>
      <label className="flex items-start gap-2 text-caption text-ink">
        <input
          type="checkbox" checked={ack} onChange={(e) => onAckChange(e.target.checked)}
          className="mt-1" data-testid="sync-mnemonic-ack"
        />
        <span>I&apos;ve saved these 12 words somewhere safe. I understand that nobody — including the app team — can recover them for me.</span>
      </label>
      <ErrorAlert id="sync-mnemonic-error" error={error} errorRef={errorRef} />
      <div className="flex gap-2">
        <button
          type="button" onClick={onContinue} disabled={!ack || busy}
          className={PRIMARY_BTN} data-testid="sync-mnemonic-continue"
        >
          {busy ? 'Signing up…' : 'Continue'}
        </button>
        <button type="button" onClick={onCancel} className={SECONDARY_BTN}>Cancel</button>
      </div>
    </div>
  );
}

export function SyncSignInForm({
  email, passphrase, error, errorField, errorRef, busy,
  onEmailChange, onPassphraseChange, onSubmit, onCancel,
}: FormProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4" data-testid="sync-signin-form" aria-describedby={error ? 'sync-signin-error' : undefined}>
      <ErrorAlert id="sync-signin-error" error={error} errorRef={errorRef} />
      <div className="space-y-1">
        <label htmlFor="signin-email" className="block text-caption font-medium text-ink">Email</label>
        <input
          id="signin-email" type="email" value={email}
          onChange={(e) => onEmailChange(e.target.value)} className="input" autoComplete="email"
          aria-invalid={errorField === 'email' ? true : undefined}
          aria-describedby={errorField === 'email' ? 'sync-signin-error' : undefined}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="signin-pass" className="block text-caption font-medium text-ink">Passphrase</label>
        <input
          id="signin-pass" type="password" value={passphrase}
          onChange={(e) => onPassphraseChange(e.target.value)} className="input" autoComplete="current-password"
          aria-invalid={errorField === 'passphrase' ? true : undefined}
          aria-describedby={errorField === 'passphrase' ? 'sync-signin-error' : undefined}
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={PRIMARY_BTN} data-testid="sync-signin-continue">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <button type="button" onClick={onCancel} className={SECONDARY_BTN}>Cancel</button>
      </div>
    </form>
  );
}

interface EnabledStatusProps {
  enabledAt: number | null;
  deviceId: string | null;
  userId: string | null;
  lastSyncAt: number | null;
  busy: boolean;
  activity: ActivityEntry[];
  onSyncNow: () => void;
  onDisable: () => void;
}

export function SyncEnabledStatus({
  enabledAt, deviceId, userId, lastSyncAt, busy, activity, onSyncNow, onDisable,
}: EnabledStatusProps) {
  return (
    <div className="space-y-4" data-testid="sync-enabled-state">
      <dl className="grid grid-cols-2 gap-y-2 text-caption">
        <dt className="text-ink-soft">Provider</dt>
        <dd className="text-ink">Supabase (encrypted; server cannot read)</dd>
        <dt className="text-ink-soft">Enabled</dt>
        <dd className="text-ink tabular-nums">{enabledAt ? new Date(enabledAt).toLocaleDateString() : '—'}</dd>
        <dt className="text-ink-soft">Device id</dt>
        <dd className="text-ink font-mono text-micro">{deviceId ?? '—'}</dd>
        <dt className="text-ink-soft">User id</dt>
        <dd className="text-ink font-mono text-micro">{userId ?? '—'}</dd>
        <dt className="text-ink-soft">Last sync</dt>
        <dd className="text-ink">{lastSyncAt ? fmtRelative(lastSyncAt) : 'never'}</dd>
      </dl>
      <div className="flex gap-2">
        <button type="button" onClick={onSyncNow} disabled={busy} className={PRIMARY_BTN} data-testid="sync-now">
          {busy ? 'Syncing…' : 'Sync now'}
        </button>
        <button type="button" onClick={onDisable} className={SECONDARY_BTN} data-testid="sync-disable">Disable</button>
      </div>
      <div>
        <h4 className="text-caption font-medium text-ink mb-1">Recent activity</h4>
        {activity.length === 0 ? (
          <p className="text-caption text-ink-subtle">No activity yet.</p>
        ) : (
          <ul role="list" data-testid="sync-activity-log">
            {activity.slice(0, 8).map((e) => (<ActivityRow key={e.id} entry={e} />))}
          </ul>
        )}
      </div>
    </div>
  );
}
