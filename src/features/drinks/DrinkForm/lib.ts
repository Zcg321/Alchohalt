import type { Intention, Halt } from '../../../types/common';

export const intentions = ['celebrate', 'social', 'taste', 'bored', 'cope'] as const;
export const haltOptions = ['hungry', 'angry', 'lonely', 'tired'] as const;

export interface Drink {
  volumeMl: number;
  abvPct: number;
  intention: Intention;
  craving: number;
  halt: Halt[];
  alt: string;
  ts: number;
}
