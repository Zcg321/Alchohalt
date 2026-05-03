export function gramsAlcohol(volumeMl: number, abvPct: number): number {
  return (volumeMl * (abvPct / 100) * 0.789).valueOf();
}

/**
 * [R14-6] Jurisdiction-specific "standard drink" definitions.
 *
 * The number printed by `stdDrinks()` depends on which jurisdiction's
 * health authority defines a "standard drink". Sources:
 *   us: NIAAA (https://www.niaaa.nih.gov/alcohols-effects-health/what-standard-drink)
 *   uk: NHS / Chief Medical Officers (1 unit = 8g) called "units" not "std drinks"
 *   au: NHMRC (https://www.health.gov.au/topics/alcohol/about-alcohol/standard-drinks)
 *   eu: most-common-EU consensus (NL/FR/DE/IE — ICAP report)
 *   ca: Canada's Low-Risk Alcohol Drinking Guidelines (13.6g)
 *   ie: Irish Health Service Executive
 *
 * See audit-walkthrough/round-14-researcher-judge.md for the full
 * citations + the bug rationale.
 */
export type StdDrinkSystem = 'us' | 'uk' | 'au' | 'eu' | 'ca' | 'ie';

export const STD_DRINK_GRAMS: Record<StdDrinkSystem, number> = {
  us: 14.0,
  uk: 8.0,
  au: 10.0,
  eu: 10.0,
  ca: 13.6,
  ie: 10.0,
};

/**
 * Active system. Module-level state, hydrated from user settings on
 * app boot via setActiveStdDrinkSystem(). Tests reset to 'us' in
 * beforeEach. Default 'us' preserves backwards-compatibility for
 * pre-R14-6 installs that don't have the setting set.
 */
let activeSystem: StdDrinkSystem = 'us';

export function setActiveStdDrinkSystem(s: StdDrinkSystem): void {
  activeSystem = s;
}

export function getActiveStdDrinkSystem(): StdDrinkSystem {
  return activeSystem;
}

/**
 * Compute std drinks (or UK units — same physical concept, different
 * gram threshold) for a given drink in a given jurisdiction.
 *
 * Pre-R14-6 callers passed only volumeMl + abvPct; the returned value
 * was always US-NIAAA std drinks. R14-6 makes the function honor a
 * module-level activeSystem (set from user settings) but accepts an
 * explicit system override for tests and analytics that need a
 * specific jurisdiction's count.
 */
export function stdDrinks(
  volumeMl: number,
  abvPct: number,
  system?: StdDrinkSystem,
): number {
  const sys = system ?? activeSystem;
  return gramsAlcohol(volumeMl, abvPct) / STD_DRINK_GRAMS[sys];
}

/**
 * [R14-6] Display label for the system. UK calls a "standard drink"
 * a "unit"; everyone else calls it a "standard drink" (or "std" in
 * compact contexts). Returns the singular form; callers handle
 * pluralization where needed.
 */
export function stdDrinkLabel(system?: StdDrinkSystem): string {
  const sys = system ?? activeSystem;
  return sys === 'uk' ? 'unit' : 'std';
}

/**
 * Human-readable jurisdiction name for the Settings picker. Pure;
 * does NOT depend on activeSystem.
 */
export const STD_DRINK_SYSTEM_LABELS: Record<StdDrinkSystem, string> = {
  us: 'United States (NIAAA, 14 g)',
  uk: 'United Kingdom (NHS units, 8 g)',
  au: 'Australia (NHMRC, 10 g)',
  eu: 'Europe (10 g)',
  ca: 'Canada (13.6 g)',
  ie: 'Ireland (HSE, 10 g)',
};

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

/* [R8-F] Date arithmetic uses UTC throughout. Mixing setDate/getDate
 * (local time) with toISOString().slice(0,10) (UTC) caused streak
 * vs longest-streak to disagree across DST transitions — uncovered by
 * the round-8 random-fixture resilience sweep with a 1/200 hit rate.
 * Switching to setUTCDate/getUTCDate keeps the iteration pinned to
 * UTC midnights, which matches how the keys are produced. */
export function computeStreak(drinksByDay: Record<string, number>): number {
  const days = Object.keys(drinksByDay).sort();
  const earliestKey = days[0];
  if (!earliestKey) return 0;
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
    current.setUTCDate(current.getUTCDate() - 1);
  }
  return streak;
}

export function computeLongestStreak(
  drinksByDay: Record<string, number>
): number {
  const days = Object.keys(drinksByDay);
  if (days.length === 0) return 0;
  const times = days
    .map((d) => Date.parse(`${d}T00:00:00Z`))
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
    current.setUTCDate(current.getUTCDate() + 1);
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
    current.setUTCDate(current.getUTCDate() - 1);
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
    .map((d) => Date.parse(`${d}T00:00:00Z`))
    .filter((n) => Number.isFinite(n));
  if (times.length === 0) return 0;
  let total = 0;
  const current = new Date(Math.min(...times));
  const today = new Date();
  while (current <= today) {
    const key = current.toISOString().slice(0, 10);
    if ((drinksByDay[key] ?? 0) === 0) total++;
    current.setUTCDate(current.getUTCDate() + 1);
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
