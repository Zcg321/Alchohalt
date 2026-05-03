/**
 * [R20-1] Idle-yield helper.
 *
 * For compute that doesn't fit single-pass aggregation (e.g.,
 * sliding-window analyses, multi-table joins), yield to the
 * browser between chunks so the user's input doesn't queue up
 * behind a long synchronous block.
 *
 * Uses requestIdleCallback when available (Chrome 47+, Edge 79+,
 * Firefox 55+, Safari Tech Preview), falls back to setTimeout
 * with a 1ms delay (still yields a paint frame). The helper
 * doesn't bind to React; consumers can use it from any context.
 *
 * Usage:
 *
 *   const result = await chunked(
 *     items,
 *     chunkSize: 1000,
 *     processChunk: (slice) => slice.reduce(reducer, ...),
 *     combine: (chunkResults) => chunkResults.reduce(combiner),
 *   );
 *
 * Most chart-compute paths are already single-pass after R20-1.
 * Reach for this helper only when you've measured a >100ms block
 * and confirmed the compute can't be made single-pass.
 */

interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

type IdleCallback = (deadline: IdleDeadline) => void;

interface WindowWithIdle {
  requestIdleCallback?: (cb: IdleCallback, opts?: { timeout: number }) => number;
}

/* Yield once. Resolves on the next idle frame, or after
 * setTimeout fallback within 16ms (≈ one render frame at 60fps). */
export function yieldToIdle(timeoutMs = 50): Promise<void> {
  return new Promise((resolve) => {
    const w = (typeof window !== 'undefined' ? window : undefined) as WindowWithIdle | undefined;
    if (w?.requestIdleCallback) {
      w.requestIdleCallback(() => resolve(), { timeout: timeoutMs });
    } else {
      setTimeout(resolve, 1);
    }
  });
}

export interface ChunkedOptions<T, R, C> {
  /** Items to process. */
  items: readonly T[];
  /** Items per chunk. Pick a size such that one chunk takes ≤16ms. */
  chunkSize: number;
  /** Reducer that runs synchronously over a chunk. */
  processChunk: (slice: readonly T[]) => R;
  /** Combine partial results from each chunk into the final answer. */
  combine: (chunkResults: R[]) => C;
}

/**
 * Process `items` in chunks, yielding to idle between chunks.
 * Returns the combined result.
 *
 * Each chunk runs synchronously (no internal yielding) — the yield
 * point is between chunks. Sizing chunks to take ~16ms is a good
 * starting point; smaller chunks yield more often (lower input
 * latency) at the cost of slightly more total wall time.
 */
export async function chunked<T, R, C>(
  opts: ChunkedOptions<T, R, C>,
): Promise<C> {
  const { items, chunkSize, processChunk, combine } = opts;
  const partials: R[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const slice = items.slice(i, i + chunkSize);
    partials.push(processChunk(slice));
    /* Yield between chunks, but not after the LAST one — caller
     * is going to await our return anyway. */
    if (i + chunkSize < items.length) await yieldToIdle();
  }
  return combine(partials);
}
