/**
 * [R21-1] React hook for off-thread insight compute.
 *
 * Wraps the insights worker client in a stable hook that:
 *   - Re-runs when `deps` change (caller controls memoization).
 *   - Returns `loading | error | data` — never throws.
 *   - Cancels stale results: if `deps` change before the previous
 *     promise resolves, the stale result is dropped on the floor.
 *
 * In test/SSR environments the underlying client falls back to sync
 * execution, so the hook resolves on the next microtask. Components
 * using this hook should render a "computing…" placeholder while
 * `loading` is true (most charts already do — they short-circuit on
 * an undefined `data`).
 */

import { useEffect, useRef, useState } from 'react';

interface State<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

export function useInsightWorker<T>(
  fn: () => Promise<T>,
  deps: ReadonlyArray<unknown>,
): State<T> {
  const [state, setState] = useState<State<T>>({
    data: undefined,
    loading: true,
    error: undefined,
  });
  /* Bumps every render where `deps` changed; lets the effect cancel
   * stale fulfillments without depending on the actual `fn` identity. */
  const generationRef = useRef(0);

  useEffect(() => {
    const myGeneration = ++generationRef.current;
    setState((prev) => ({ ...prev, loading: true, error: undefined }));
    let cancelled = false;
    fn()
      .then((result) => {
        if (cancelled || myGeneration !== generationRef.current) return;
        setState({ data: result, loading: false, error: undefined });
      })
      .catch((err: unknown) => {
        if (cancelled || myGeneration !== generationRef.current) return;
        setState({
          data: undefined,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });
    return () => {
      cancelled = true;
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, deps);

  return state;
}
