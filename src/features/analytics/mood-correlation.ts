/**
 * Mood ↔ drink correlation — pure on-device aggregation.
 *
 * Owner-locked spec: "simple on-device aggregation showing which moods
 * precede which drink patterns. No cloud, no analytics ping."
 *
 * Inputs are the existing Entry shape from src/store/db.ts (which already
 * has optional `mood` + `halt` fields). Output is a small struct the
 * UI tile renders without any further computation.
 */

import type { Entry, HALT } from '../../store/db';

export type MoodKey =
  | 'happy'
  | 'sad'
  | 'anxious'
  | 'stressed'
  | 'calm'
  | 'excited'
  | 'neutral';

const ALL_MOODS: MoodKey[] = [
  'happy',
  'sad',
  'anxious',
  'stressed',
  'calm',
  'excited',
  'neutral',
];

export interface MoodCorrelationRow {
  mood: MoodKey;
  count: number;
  /** Mean standard drinks per drinking-session in this mood. */
  meanStdDrinks: number;
  /** Mean craving rating (1-5 or whatever your scale uses) in this mood. */
  meanCraving: number;
}

export interface HaltCorrelationRow {
  halt: keyof HALT;
  count: number;
  meanStdDrinks: number;
}

export interface MoodCorrelation {
  windowDays: number;
  totalDrinks: number;
  byMood: MoodCorrelationRow[];
  byHalt: HaltCorrelationRow[];
  /** The mood with the most drinks during the window — useful as headline. */
  topMood: MoodKey | null;
  /** The HALT trigger with the most drinks during the window — headline. */
  topHalt: keyof HALT | null;
}

/**
 * Aggregate mood + HALT trigger frequencies from a list of entries
 * within the last N days. Pure function — no side effects.
 */
export function computeMoodCorrelation(
  entries: Entry[],
  windowDays = 30,
  now: number = Date.now(),
): MoodCorrelation {
  const cutoff = now - windowDays * 24 * 60 * 60 * 1000;
  const inWindow = entries.filter((e) => e.ts >= cutoff);

  const moodAgg: Record<MoodKey, { count: number; std: number; craving: number }> = {
    happy: { count: 0, std: 0, craving: 0 },
    sad: { count: 0, std: 0, craving: 0 },
    anxious: { count: 0, std: 0, craving: 0 },
    stressed: { count: 0, std: 0, craving: 0 },
    calm: { count: 0, std: 0, craving: 0 },
    excited: { count: 0, std: 0, craving: 0 },
    neutral: { count: 0, std: 0, craving: 0 },
  };

  const haltAgg: Record<keyof HALT, { count: number; std: number }> = {
    H: { count: 0, std: 0 },
    A: { count: 0, std: 0 },
    L: { count: 0, std: 0 },
    T: { count: 0, std: 0 },
  };

  for (const entry of inWindow) {
    const mood: MoodKey = entry.mood ?? 'neutral';
    moodAgg[mood].count += 1;
    moodAgg[mood].std += entry.stdDrinks;
    moodAgg[mood].craving += entry.craving;

    const halts = entry.halt;
    (Object.keys(halts) as Array<keyof HALT>).forEach((k) => {
      if (halts[k]) {
        haltAgg[k].count += 1;
        haltAgg[k].std += entry.stdDrinks;
      }
    });
  }

  const byMood: MoodCorrelationRow[] = ALL_MOODS.map((m) => ({
    mood: m,
    count: moodAgg[m].count,
    meanStdDrinks: moodAgg[m].count > 0 ? moodAgg[m].std / moodAgg[m].count : 0,
    meanCraving: moodAgg[m].count > 0 ? moodAgg[m].craving / moodAgg[m].count : 0,
  })).sort((a, b) => b.count - a.count);

  const byHalt: HaltCorrelationRow[] = (Object.keys(haltAgg) as Array<keyof HALT>)
    .map((k) => ({
      halt: k,
      count: haltAgg[k].count,
      meanStdDrinks:
        haltAgg[k].count > 0 ? haltAgg[k].std / haltAgg[k].count : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const topMood = byMood[0] && byMood[0].count > 0 ? byMood[0].mood : null;
  const topHalt = byHalt[0] && byHalt[0].count > 0 ? byHalt[0].halt : null;

  return {
    windowDays,
    totalDrinks: inWindow.length,
    byMood,
    byHalt,
    topMood,
    topHalt,
  };
}

export const HALT_LABELS: Record<keyof HALT, string> = {
  H: 'Hungry',
  A: 'Angry',
  L: 'Lonely',
  T: 'Tired',
};

export const MOOD_EMOJI: Record<MoodKey, string> = {
  happy: '😊',
  sad: '😔',
  anxious: '😰',
  stressed: '😣',
  calm: '😌',
  excited: '🤩',
  neutral: '😐',
};
