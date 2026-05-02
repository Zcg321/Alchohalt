/**
 * [R11-2] Module-scope recovery state. Set by db.ts:migrate() when
 * validateDB rejects the persisted blob; read by the
 * DataRecoveryScreen component.
 *
 * Module scope (not zustand state) because the corruption happens
 * BEFORE the store is hydrated — we'd be poisoning the very state
 * we're trying to protect. Also intentionally a simple
 * publish/subscribe so test code can wire it up without store mocks.
 */

export interface RecoveryEvent {
  reason: string;
  raw: unknown;
  occurredAt: number;
}

let current: RecoveryEvent | null = null;
const listeners = new Set<(e: RecoveryEvent | null) => void>();

export function reportCorruption(reason: string, raw: unknown): void {
  current = { reason, raw, occurredAt: Date.now() };
  for (const l of listeners) l(current);
}

export function getCorruption(): RecoveryEvent | null {
  return current;
}

export function clearCorruption(): void {
  current = null;
  for (const l of listeners) l(null);
}

export function subscribeCorruption(
  listener: (e: RecoveryEvent | null) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
