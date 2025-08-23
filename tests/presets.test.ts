import { describe, it, expect } from 'vitest';
import { updatePreset, type DrinkPreset } from '../src/features/drinks/DrinkPresets';

describe('updatePreset', () => {
  it('replaces the matching preset', () => {
    const list: DrinkPreset[] = [
      { name: 'Beer', volumeMl: 355, abvPct: 5 },
      { name: 'Wine', volumeMl: 150, abvPct: 12 }
    ];
    const updated = updatePreset(list, 'Beer', {
      name: 'Light Beer',
      volumeMl: 330,
      abvPct: 4
    });
    expect(updated[0]).toEqual({ name: 'Light Beer', volumeMl: 330, abvPct: 4 });
    expect(updated[1]).toEqual(list[1]);
  });
});
