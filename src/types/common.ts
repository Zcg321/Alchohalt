export interface Drink {
  volumeMl: number;
  abvPct: number;
  intention: Intention;
  craving: number;
  halt: Halt[];
  alt: string;
  ts: number;
}

export type Intention = 'taste' | 'social' | 'cope' | 'habit';
export type Halt = 'hungry' | 'angry' | 'lonely' | 'tired';

export interface DrinkPreset {
  name: string;
  volumeMl: number;
  abvPct: number;
}

export interface Goals {
  dailyCap: number;
  weeklyGoal: number;
  pricePerStd: number;
  baselineMonthlySpend: number;
}