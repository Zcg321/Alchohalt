import type { Intention, Halt } from '../../../types/common';

export const intentions = ['celebrate', 'social', 'taste', 'bored', 'cope', 'other'] as const;
export const haltOptions = ['hungry', 'angry', 'lonely', 'tired'] as const;

export type { Intention, Halt };

export interface Drink {
  volumeMl: number;
  abvPct: number;
  intention: Intention;
  craving: number;
  halt: Halt[];
  alt: string;
  ts: number;
  /** [R14-3] Free-form tags. See src/types/common.ts. */
  tags?: string[];
}

/**
 * [R14-3] Normalize a raw tag input into a canonical form.
 * Lowercase, trim, drop the leading '#' if user typed one. Empty
 * results are filtered out by the caller.
 */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').toLowerCase();
}

/**
 * [R14-3] Parse a comma-separated string of tags into a normalized,
 * deduplicated array. Used by the form input to convert user keystrokes
 * into Drink.tags.
 */
export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw.split(',')) {
    const norm = normalizeTag(t);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      out.push(norm);
    }
  }
  return out;
}
