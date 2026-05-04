/**
 * [R21-1] Client side of the insights worker.
 *
 * Lazy-creates the Worker on first call, multiplexes requests by id,
 * and falls back to direct sync execution when Worker is unavailable
 * (jsdom under Vitest, SSR, very old browsers).
 *
 * Why lazy: the Worker bundle is its own chunk (Vite's `?worker`
 * suffix). Spawning it costs ~5-10ms + the network fetch on first
 * insights-tab open. Lazy avoids paying that on the homepage.
 *
 * Why multiplexed: a single Worker handles all three methods. Reusing
 * one worker amortizes the spawn cost across the session.
 *
 * Why fallback: jsdom (test) doesn't implement Worker. Without the
 * fallback every component test using insights would have to mock the
 * worker — instead, the client transparently runs sync.
 */

import { computeProgressData } from '../features/insights/progressMath';
import { computeTagPatterns } from '../features/insights/tagPatterns';
import { computeRetrospective } from '../features/insights/retrospective';
import type { Drink } from '../features/drinks/DrinkForm';
import type { ProgressData } from '../features/insights/progressMath';
import type { TagPattern } from '../features/insights/tagPatterns';
import type { Retrospective } from '../features/insights/retrospective';

type Method = 'progressData' | 'tagPatterns' | 'retrospective';

interface Pending {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
}

let workerPromise: Promise<Worker | null> | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function workerSupported(): boolean {
  return typeof Worker !== 'undefined' && typeof window !== 'undefined';
}

async function ensureWorker(): Promise<Worker | null> {
  if (!workerSupported()) return null;
  if (workerPromise) return workerPromise;

  workerPromise = (async () => {
    try {
      /* Vite's `?worker` query gives us a typed Worker constructor.
       * The dynamic import keeps the worker bundle out of the main
       * chunk so users who never open Insights don't pay for it.
       * The `as unknown as` cast skips TypeScript's resolution of the
       * non-standard `?worker` query string — types are real at
       * build time but the TS resolver doesn't know about Vite's
       * suffix protocol. */
      const mod = (await import(
        /* @vite-ignore */ './insightsWorker?worker'
      )) as unknown as { default: new () => Worker };
      const w = new mod.default();
      w.addEventListener('message', (event: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
        const { id, result, error } = event.data;
        const p = pending.get(id);
        if (!p) return;
        pending.delete(id);
        if (error) p.reject(new Error(error));
        else p.resolve(result);
      });
      w.addEventListener('error', (event: ErrorEvent) => {
        /* Worker-level error: reject every pending request and tear
         * down so the next call can re-spawn. */
        const err = new Error(event.message || 'worker error');
        for (const [id, p] of pending) {
          pending.delete(id);
          p.reject(err);
        }
        w.terminate();
        workerPromise = null;
      });
      return w;
    } catch {
      /* Spawn failed (CSP, unsupported, etc.) — sync fallback. */
      return null;
    }
  })();

  return workerPromise;
}

function runSync(method: Method, args: unknown[]): unknown {
  switch (method) {
    case 'progressData':
      return computeProgressData(
        args[0] as Parameters<typeof computeProgressData>[0],
        args[1] as Parameters<typeof computeProgressData>[1],
      );
    case 'tagPatterns':
      return computeTagPatterns(
        args[0] as Parameters<typeof computeTagPatterns>[0],
        args[1] as Parameters<typeof computeTagPatterns>[1],
      );
    case 'retrospective':
      return computeRetrospective(
        args[0] as Parameters<typeof computeRetrospective>[0],
        args[1] as Parameters<typeof computeRetrospective>[1],
      );
  }
}

async function call(method: Method, args: unknown[]): Promise<unknown> {
  const w = await ensureWorker();
  if (!w) {
    /* Fallback path: run synchronously on the caller's thread.
     * Tests + SSR hit this branch. */
    return runSync(method, args);
  }
  return new Promise<unknown>((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    w.postMessage({ id, method, args });
  });
}

/* ───── Typed wrappers ───── */

export async function runProgressData(
  drinks: Drink[],
  goals: Parameters<typeof computeProgressData>[1],
): Promise<ProgressData> {
  return call('progressData', [drinks, goals]) as Promise<ProgressData>;
}

export async function runTagPatterns(
  drinks: Drink[],
  opts?: Parameters<typeof computeTagPatterns>[1],
): Promise<TagPattern[]> {
  return call('tagPatterns', [drinks, opts ?? {}]) as Promise<TagPattern[]>;
}

export async function runRetrospective(
  entries: Parameters<typeof computeRetrospective>[0],
  window: Parameters<typeof computeRetrospective>[1],
): Promise<Retrospective | null> {
  return call('retrospective', [entries, window]) as Promise<Retrospective | null>;
}

/** Test-only: tear down the worker and clear pending state. */
export function _resetForTests(): void {
  workerPromise = null;
  pending.clear();
  nextId = 1;
}
