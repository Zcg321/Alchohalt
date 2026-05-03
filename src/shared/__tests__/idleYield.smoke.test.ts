/**
 * [R20-1] Smoke for the idle-yield helper.
 *
 * Tests the API contract: yieldToIdle resolves, chunked() processes
 * all items and combines correctly, fallback path works when
 * requestIdleCallback isn't present.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import { chunked, yieldToIdle } from '../idleYield';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('[R20-1] yieldToIdle', () => {
  it('resolves to undefined', async () => {
    await expect(yieldToIdle()).resolves.toBeUndefined();
  });

  it('uses setTimeout fallback when requestIdleCallback is absent', async () => {
    /* Stub window.requestIdleCallback to undefined so the fallback fires. */
    vi.stubGlobal('window', { requestIdleCallback: undefined });
    const start = Date.now();
    await yieldToIdle();
    /* setTimeout(1) — should resolve quickly. CI variance: a busy
     * runner can take ≥50ms to schedule the timer callback (saw 57ms
     * once on shared CI), so the budget is 200ms — still proves the
     * fallback didn't hang. */
    expect(Date.now() - start).toBeLessThan(200);
  });
});

describe('[R20-1] chunked', () => {
  it('processes all items and combines via the combine fn', async () => {
    const items = Array.from({ length: 100 }, (_, i) => i + 1);
    const sum = await chunked({
      items,
      chunkSize: 10,
      processChunk: (slice) => slice.reduce((a, b) => a + b, 0),
      combine: (partials) => partials.reduce((a, b) => a + b, 0),
    });
    expect(sum).toBe(5050); /* 1 + 2 + … + 100 */
  });

  it('handles empty items array', async () => {
    const result = await chunked({
      items: [],
      chunkSize: 10,
      processChunk: () => 0,
      combine: (partials) => partials.length,
    });
    expect(result).toBe(0);
  });

  it('handles items shorter than chunkSize (one chunk, no yields)', async () => {
    const result = await chunked({
      items: [1, 2, 3],
      chunkSize: 100,
      processChunk: (slice) => slice.length,
      combine: (partials) => partials[0] ?? 0,
    });
    expect(result).toBe(3);
  });
});
