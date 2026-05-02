import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clearCorruption,
  getCorruption,
  reportCorruption,
  subscribeCorruption,
} from '../dbRecovery';

describe('[R11-2] dbRecovery publish/subscribe', () => {
  beforeEach(() => {
    clearCorruption();
  });

  it('starts with no corruption', () => {
    expect(getCorruption()).toBeNull();
  });

  it('reportCorruption sets the current event', () => {
    reportCorruption('entries-not-array', { foo: 'bar' });
    const c = getCorruption();
    expect(c).not.toBeNull();
    expect(c?.reason).toBe('entries-not-array');
    expect(c?.raw).toEqual({ foo: 'bar' });
    expect(typeof c?.occurredAt).toBe('number');
  });

  it('clearCorruption removes the current event', () => {
    reportCorruption('not-an-object', null);
    expect(getCorruption()).not.toBeNull();
    clearCorruption();
    expect(getCorruption()).toBeNull();
  });

  it('subscribers are notified on report and clear', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeCorruption(listener);
    reportCorruption('entry-missing-ts', { broken: true });
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'entry-missing-ts' }),
    );
    clearCorruption();
    expect(listener).toHaveBeenLastCalledWith(null);
    unsubscribe();
  });

  it('unsubscribe stops further notifications', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeCorruption(listener);
    unsubscribe();
    reportCorruption('not-an-object', null);
    expect(listener).not.toHaveBeenCalled();
  });
});
