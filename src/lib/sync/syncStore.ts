/**
 * Cloud-sync state store.
 *
 * Tracks the user's enable / disable state, the anonymous device id,
 * sign-in metadata, and the recent-activity log shown in the Settings
 * panel. Does NOT hold the master key — keys are derived on demand
 * from the passphrase the user types at unlock; we never persist the
 * key, the passphrase, or anything else that would let an attacker
 * decrypt blobs from the device alone.
 *
 * The store is intentionally NOT persisted via zustand/middleware
 * here — sync state is mirrored into the existing UnifiedDB store
 * (src/store/db.ts) on enable/disable so a single Capacitor
 * Preferences write covers both.
 */

import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type SyncPhase =
  | 'off'
  | 'enabling'           // user opened the toggle, hasn't completed sign-up
  | 'mnemonic-shown'     // 12-word phrase displayed; waiting for ack
  | 'enabled'
  | 'signing-in';        // multi-device sign-in mid-flow

export type ActivityKind =
  | 'enabled'
  | 'disabled'
  | 'sync-success'
  | 'sync-error'
  | 'conflict-resolved';

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  ts: number;
  detail?: string;
}

interface SyncState {
  phase: SyncPhase;
  /** User-stable anonymous device id; rotated only if the user
   *  disables + re-enables sync. */
  deviceId: string | null;
  userId: string | null;
  /** Server-reported timestamp of the user's first enable. */
  enabledAt: number | null;
  lastSyncAt: number | null;
  activity: ActivityEntry[];
  conflictsResolved: number;

  setPhase: (p: SyncPhase) => void;
  setEnabled: (userId: string) => void;
  setDisabled: () => void;
  recordActivity: (kind: ActivityKind, detail?: string) => void;
  recordSync: (
    outcome: 'success' | 'error',
    detail?: string,
  ) => void;
  recordConflict: (detail: string) => void;
  reset: () => void;
}

const MAX_ACTIVITY = 50;

export const useSyncStore = create<SyncState>((set) => ({
  phase: 'off',
  deviceId: null,
  userId: null,
  enabledAt: null,
  lastSyncAt: null,
  activity: [],
  conflictsResolved: 0,

  setPhase: (p) => set({ phase: p }),

  setEnabled: (userId) =>
    set((s) => {
      const ts = Date.now();
      const entry: ActivityEntry = { id: nanoid(8), kind: 'enabled', ts };
      return {
        phase: 'enabled',
        userId,
        deviceId: s.deviceId ?? `dev-${nanoid(10)}`,
        enabledAt: ts,
        activity: [entry, ...s.activity].slice(0, MAX_ACTIVITY),
      };
    }),

  setDisabled: () =>
    set((s) => {
      const entry: ActivityEntry = {
        id: nanoid(8),
        kind: 'disabled',
        ts: Date.now(),
      };
      return {
        phase: 'off',
        userId: null,
        deviceId: null,
        enabledAt: null,
        lastSyncAt: null,
        conflictsResolved: 0,
        activity: [entry, ...s.activity].slice(0, MAX_ACTIVITY),
      };
    }),

  recordActivity: (kind, detail) =>
    set((s) => ({
      activity: [
        { id: nanoid(8), kind, ts: Date.now(), detail },
        ...s.activity,
      ].slice(0, MAX_ACTIVITY),
    })),

  recordSync: (outcome, detail) =>
    set((s) => {
      const kind: ActivityKind =
        outcome === 'success' ? 'sync-success' : 'sync-error';
      const entry: ActivityEntry = {
        id: nanoid(8),
        kind,
        ts: Date.now(),
        detail,
      };
      return {
        lastSyncAt: outcome === 'success' ? entry.ts : s.lastSyncAt,
        activity: [entry, ...s.activity].slice(0, MAX_ACTIVITY),
      };
    }),

  recordConflict: (detail) =>
    set((s) => {
      const entry: ActivityEntry = {
        id: nanoid(8),
        kind: 'conflict-resolved',
        ts: Date.now(),
        detail,
      };
      return {
        conflictsResolved: s.conflictsResolved + 1,
        activity: [entry, ...s.activity].slice(0, MAX_ACTIVITY),
      };
    }),

  reset: () =>
    set({
      phase: 'off',
      deviceId: null,
      userId: null,
      enabledAt: null,
      lastSyncAt: null,
      activity: [],
      conflictsResolved: 0,
    }),
}));

/** Passphrase strength — 12+ chars, mixed case + at least one digit.
 *  Pure function, exposed for the UI form to live-validate. */
export function isPassphraseStrongEnough(p: string): boolean {
  return (
    p.length >= 12 &&
    /[a-z]/.test(p) &&
    /[A-Z]/.test(p) &&
    /\d/.test(p)
  );
}
