export function gramsAlcohol(volumeMl: number, abvPct: number): number {
  return (volumeMl * (abvPct / 100) * 0.789).valueOf();
}

export function stdDrinks(volumeMl: number, abvPct: number): number {
  return gramsAlcohol(volumeMl, abvPct) / 14;
}

interface Drink {
  ts: number;
  volumeMl: number;
  abvPct: number;
}

export function widmarkBAC(
  drinks: Drink[],
  weightKg: number,
  sex: 'male' | 'female' | 'other',
  nowMs: number
): number {
  const rMap = { male: 0.68, female: 0.55, other: 0.6 } as const;
  const r = rMap[sex];
  const grams = drinks
    .filter((d) => d.ts <= nowMs)
    .reduce((sum, d) => sum + gramsAlcohol(d.volumeMl, d.abvPct), 0);
  if (grams === 0) return 0;
  const firstTs = Math.min(...drinks.map((d) => d.ts));
  const hours = Math.max(0, (nowMs - firstTs) / 3600000);
  let bac = (grams / (weightKg * r * 1000)) * 100 - 0.015 * hours;
  bac = Math.max(0, Math.min(bac, 0.4));
  return bac;
}

export function computeStreak(drinksByDay: Record<string, number>): number {
  const days = Object.keys(drinksByDay).sort();
  if (days.length === 0) return 0;
  const earliestKey = days[0];
  let streak = 0;
  const current = new Date();
  // Walk backwards from today. A streak ends on a drink-day, OR when
  // we go past the earliest record (a brand-new user has no streak,
  // not a 10-year one).
  for (let i = 0; i < 3650; i++) {
    const key = current.toISOString().slice(0, 10);
    if (key < earliestKey) break;
    const val = drinksByDay[key] ?? 0;
    if (val > 0) break;
    streak++;
    current.setDate(current.getDate() - 1);
  }
  return streak;
}

export function computeLongestStreak(
  drinksByDay: Record<string, number>
): number {
  const days = Object.keys(drinksByDay);
  if (days.length === 0) return 0;
  const times = days
    .map((d) => new Date(d).getTime())
    .filter((n) => Number.isFinite(n));
  if (times.length === 0) return 0;
  let longest = 0;
  let currentStreak = 0;
  const current = new Date(Math.min(...times));
  const today = new Date();
  while (current <= today) {
    const key = current.toISOString().slice(0, 10);
    const val = drinksByDay[key] ?? 0;
    if (val === 0) {
      currentStreak++;
    } else {
      longest = Math.max(longest, currentStreak);
      currentStreak = 0;
    }
    current.setDate(current.getDate() + 1);
  }
  longest = Math.max(longest, currentStreak);
  return longest;
}

export function daysSinceLastDrink(drinksByDay: Record<string, number>): number {
  const current = new Date();
  let days = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = current.toISOString().slice(0, 10);
    const val = drinksByDay[key] ?? 0;
    if (val > 0) break;
    days++;
    current.setDate(current.getDate() - 1);
    if (days > 3650) break;
  }
  return days;
}

export function computePoints(
  drinksByDay: Record<string, { std: number; coping: number }>,
  dailyCap: number,
  altEvents30: number
): number {
  let points = altEvents30 * 5;
  for (const rec of Object.values(drinksByDay)) {
    if (rec.std === 0) points += 10;
    else if (rec.std <= dailyCap) points += 3;
    points -= rec.coping * 2;
  }
  return points;
}

/**
 * Total alcohol-free days across the whole record. NOT a streak — this
 * is a cumulative count that NEVER decreases. Owner-locked: every AF day
 * is a real win. Even after a soft-restart, the user keeps every prior
 * AF day in their lifetime total.
 */
export function computeTotalAFDays(drinksByDay: Record<string, number>): number {
  const days = Object.keys(drinksByDay);
  if (days.length === 0) return 0;
  const times = days
    .map((d) => new Date(d).getTime())
    .filter((n) => Number.isFinite(n));
  if (times.length === 0) return 0;
  let total = 0;
  const current = new Date(Math.min(...times));
  const today = new Date();
  while (current <= today) {
    const key = current.toISOString().slice(0, 10);
    if ((drinksByDay[key] ?? 0) === 0) total++;
    current.setDate(current.getDate() + 1);
  }
  return total;
}

/**
 * Soft-restart streak status — owner-locked language.
 *
 * Recovery best-practice (NIH 2023+ guidance): zero-day reset framing
 * is actively harmful. We frame "what's true right now" without shaming.
 *
 *   'building'  : current streak ≥ 1. "N days alcohol-free."
 *   'starting'  : current streak = 0 AND total AF = 0. New user.
 *                 "Today's a fresh start."
 *   'restart'   : current streak = 0 AND total AF > 0. Returning from
 *                 a relapse. "You're back. M AF days so far."
 */
export type StreakStatus = {
  kind: 'building' | 'starting' | 'restart';
  currentStreak: number;
  totalAFDays: number;
};

export function getStreakStatus(
  currentStreak: number,
  totalAFDays: number,
): StreakStatus {
  if (currentStreak > 0) return { kind: 'building', currentStreak, totalAFDays };
  if (totalAFDays === 0) return { kind: 'starting', currentStreak: 0, totalAFDays: 0 };
  return { kind: 'restart', currentStreak: 0, totalAFDays };
}
