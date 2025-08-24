export interface DrinkPreset {
  name: string;
  volumeMl: number;
  abvPct: number;
}

export function updatePreset(
  presets: DrinkPreset[],
  original: string,
  next: DrinkPreset
): DrinkPreset[] {
  return presets.map((p) => (p.name === original ? next : p));
}
