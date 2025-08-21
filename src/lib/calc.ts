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
  let streak = 0;
  const current = new Date();
  for (;;) {
    const key = current.toISOString().slice(0, 10);
    const val = drinksByDay[key] ?? 0;
    if (val > 0) break;
    streak++;
    current.setDate(current.getDate() - 1);
  }
  return streak;
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
