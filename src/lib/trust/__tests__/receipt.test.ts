/**
 * [R8-C] Trust Receipt module — unit coverage.
 *
 * Verifies the three capture paths (storage, fetch, cleartext) and
 * the bounded buffer / subscriber semantics. The fetch wrap is
 * idempotent, so each test resets module state via __resetForTests.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetForTests,
  clearTrustEvents,
  getTrustEvents,
  installFetchWrap,
  recordCleartextRead,
  recordStorageEvent,
  subscribe,
} from '../receipt';

describe('TrustReceipt — capture paths', () => {
  beforeEach(() => __resetForTests());
  afterEach(() => __resetForTests());

  it('records a storage-set event', () => {
    recordStorageEvent('set', 'theme', { bytes: 12 });
    const events = getTrustEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'storage-set',
      source: 'storage',
      summary: 'SET theme',
      detail: { bytes: 12 },
    });
  });

  it('records a storage-get event', () => {
    recordStorageEvent('get', 'lang');
    expect(getTrustEvents()[0]).toMatchObject({
      type: 'storage-get',
      summary: 'GET lang',
    });
  });

  it('records a cleartext annotation', () => {
    recordCleartextRead('sync.passphrase', 'derived 32-byte key (5ms)');
    expect(getTrustEvents()[0]).toMatchObject({
      type: 'cleartext',
      source: 'sync.passphrase',
    });
  });

  it('clearTrustEvents wipes the buffer', () => {
    recordStorageEvent('set', 'a');
    recordStorageEvent('set', 'b');
    expect(getTrustEvents()).toHaveLength(2);
    clearTrustEvents();
    expect(getTrustEvents()).toHaveLength(0);
  });

  it('caps the buffer at 200 events', () => {
    for (let i = 0; i < 250; i += 1) recordStorageEvent('set', `k${i}`);
    expect(getTrustEvents()).toHaveLength(200);
    // Oldest dropped — earliest summary should be SET k50.
    expect(getTrustEvents()[0]?.summary).toBe('SET k50');
  });

  it('notifies subscribers on every push', () => {
    const seen: number[] = [];
    const unsubscribe = subscribe((events) => seen.push(events.length));
    recordStorageEvent('set', 'a');
    recordStorageEvent('set', 'b');
    expect(seen).toEqual([1, 2]);
    unsubscribe();
    recordStorageEvent('set', 'c');
    expect(seen).toEqual([1, 2]);
  });
});

describe('TrustReceipt — fetch wrap', () => {
  beforeEach(() => __resetForTests());
  afterEach(() => __resetForTests());

  it('wraps fetch and records a successful request', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    installFetchWrap({ fetchImpl: fetchImpl as unknown as typeof fetch });
    await globalThis.fetch('https://example.com/foo');
    const events = getTrustEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'fetch',
      summary: 'GET https://example.com/foo → 200',
    });
    expect(events[0]?.detail).toMatchObject({ ok: true });
  });

  it('records a failed request and rethrows', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('net down'));
    installFetchWrap({ fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(globalThis.fetch('https://example.com/x')).rejects.toThrow(
      'net down',
    );
    const events = getTrustEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.summary).toContain('error');
    expect(events[0]?.detail).toMatchObject({ error: expect.stringContaining('net down') });
  });

  it('is idempotent — second installFetchWrap call is a no-op', async () => {
    const a = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const b = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    installFetchWrap({ fetchImpl: a as unknown as typeof fetch });
    installFetchWrap({ fetchImpl: b as unknown as typeof fetch });
    await globalThis.fetch('https://example.com/y');
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
  });
});
