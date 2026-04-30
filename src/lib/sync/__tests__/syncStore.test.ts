import { describe, expect, it, beforeEach } from 'vitest';
import {
  useSyncStore,
  isPassphraseStrongEnough,
} from '../syncStore';

describe('[SYNC-3] syncStore + isPassphraseStrongEnough', () => {
  beforeEach(() => {
    useSyncStore.getState().reset();
  });

  it('default phase is "off"', () => {
    expect(useSyncStore.getState().phase).toBe('off');
    expect(useSyncStore.getState().userId).toBeNull();
    expect(useSyncStore.getState().deviceId).toBeNull();
  });

  it('setEnabled mints a stable deviceId + records "enabled" activity', () => {
    useSyncStore.getState().setEnabled('user-1');
    const s = useSyncStore.getState();
    expect(s.phase).toBe('enabled');
    expect(s.userId).toBe('user-1');
    expect(s.deviceId).not.toBeNull();
    expect(s.activity[0]?.kind).toBe('enabled');
  });

  it('setDisabled clears identity + records "disabled"', () => {
    useSyncStore.getState().setEnabled('user-1');
    useSyncStore.getState().setDisabled();
    const s = useSyncStore.getState();
    expect(s.phase).toBe('off');
    expect(s.userId).toBeNull();
    expect(s.deviceId).toBeNull();
    expect(s.activity[0]?.kind).toBe('disabled');
  });

  it('recordSync(success) bumps lastSyncAt and adds an entry', () => {
    useSyncStore.getState().recordSync('success', 'manual');
    const s = useSyncStore.getState();
    expect(s.lastSyncAt).not.toBeNull();
    expect(s.activity[0]?.kind).toBe('sync-success');
    expect(s.activity[0]?.detail).toBe('manual');
  });

  it('recordSync(error) records an entry but does NOT bump lastSyncAt', () => {
    const before = useSyncStore.getState().lastSyncAt;
    useSyncStore.getState().recordSync('error', 'network down');
    const after = useSyncStore.getState();
    expect(after.lastSyncAt).toBe(before);
    expect(after.activity[0]?.kind).toBe('sync-error');
  });

  it('recordConflict bumps the counter + adds an LWW activity row', () => {
    useSyncStore.getState().recordConflict('goals: server wins');
    const s = useSyncStore.getState();
    expect(s.conflictsResolved).toBe(1);
    expect(s.activity[0]?.kind).toBe('conflict-resolved');
    expect(s.activity[0]?.detail).toBe('goals: server wins');
  });

  it('activity log caps at 50 entries (FIFO drop)', () => {
    for (let i = 0; i < 60; i++) {
      useSyncStore.getState().recordSync('success', `i=${i}`);
    }
    expect(useSyncStore.getState().activity.length).toBe(50);
    // Newest first → first entry is i=59, last is i=10.
    expect(useSyncStore.getState().activity[0]?.detail).toBe('i=59');
    expect(useSyncStore.getState().activity[49]?.detail).toBe('i=10');
  });
});

describe('[SYNC-3] isPassphraseStrongEnough', () => {
  it('rejects under 12 chars', () => {
    expect(isPassphraseStrongEnough('Short1A')).toBe(false);
  });
  it('rejects without uppercase', () => {
    expect(isPassphraseStrongEnough('lowercase123')).toBe(false);
  });
  it('rejects without lowercase', () => {
    expect(isPassphraseStrongEnough('UPPERCASE123')).toBe(false);
  });
  it('rejects without digit', () => {
    expect(isPassphraseStrongEnough('NoDigitsHere')).toBe(false);
  });
  it('accepts 12 chars + upper + lower + digit', () => {
    expect(isPassphraseStrongEnough('StrongPass12')).toBe(true);
  });
});
