export interface Drink {
  volumeMl: number;
  abvPct: number;
  intention: Intention;
  craving: number;
  halt: Halt[];
  alt: string;
  ts: number;
  /**
   * [R14-3] Free-form tags the user attaches at log-time. Stored
   * lowercase, trimmed, de-duplicated. Optional and may be missing
   * from older entries created before R14-3 — consumers must treat
   * absent and `[]` identically.
   */
  tags?: string[];
}

export type Intention = 'celebrate' | 'social' | 'taste' | 'bored' | 'cope' | 'other';
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