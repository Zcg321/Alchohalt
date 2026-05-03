/**
 * [R21-1] Insights Web Worker.
 *
 * Off-thread compute for the heaviest insight functions:
 *   - computeProgressData   (Insights tab, every render with new drinks)
 *   - computeTagPatterns    (TagPatternsCard, every render)
 *   - computeRetrospective  (RetrospectivePanel, less frequent)
 *
 * Why a worker, when R20-1 already made these single-pass:
 *   Even single-pass over a 250K-row history can take 15-40ms on a
 *   mid-tier Android device. That's not enough to drop a frame, but
 *   it's enough to delay an input event when the user taps DURING the
 *   compute. A worker moves the entire compute off the main thread so
 *   input handlers stay snappy regardless of history size.
 *
 * Protocol:
 *   { id, method: 'progressData' | 'tagPatterns' | 'retrospective', args }
 *   ← { id, result } | { id, error: string }
 *
 * The client is `insightsWorkerClient.ts`. Import it, not this file
 * directly (this file runs INSIDE the worker; the client wraps the
 * postMessage protocol).
 */

import { computeProgressData } from '../features/insights/progressMath';
import { computeTagPatterns } from '../features/insights/tagPatterns';
import { computeRetrospective } from '../features/insights/retrospective';

type Method = 'progressData' | 'tagPatterns' | 'retrospective';

interface Request {
  id: number;
  method: Method;
  args: unknown[];
}

interface Response {
  id: number;
  result?: unknown;
  error?: string;
}

function dispatch(method: Method, args: unknown[]): unknown {
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
    default: {
      // Exhaustive guard — TypeScript widens unknown method names to
      // never. Runtime guard returns a clear error string instead.
      const _exhaustive: never = method;
      throw new Error(`unknown method: ${String(_exhaustive)}`);
    }
  }
}

self.addEventListener('message', (event: MessageEvent<Request>) => {
  const { id, method, args } = event.data;
  try {
    const result = dispatch(method, args);
    const response: Response = { id, result };
    (self as unknown as { postMessage: (m: Response) => void }).postMessage(response);
  } catch (e) {
    const response: Response = {
      id,
      error: e instanceof Error ? e.message : String(e),
    };
    (self as unknown as { postMessage: (m: Response) => void }).postMessage(response);
  }
});
