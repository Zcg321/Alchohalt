export const intentions = ['celebrate', 'social', 'taste', 'bored', 'cope'] as const;
export type Intention = (typeof intentions)[number];

export const haltOptions = ['hungry', 'angry', 'lonely', 'tired'] as const;
export type Halt = (typeof haltOptions)[number];

export interface Drink {
  volumeMl: number;
  abvPct: number;
  intention: Intention;
  craving: number;
  halt: Halt[];
  alt: string;
  ts: number;
}
