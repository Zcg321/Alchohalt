import { describe, it, expect } from 'vitest';
import { legacyDrinkToEntry, entryToLegacyDrink } from '../data-bridge';
import type { Drink as LegacyDrink } from '../../types/common';
import type { Entry } from '../../store/db';

/**
 * [R14-3 / R14-CI-FIX] Codex review on PR-48 caught that
 * legacyDrinkToEntry was dropping the tags field — the form would
 * compose `drink.tags`, but the bridge silently stripped it on the
 * way to the store. Users could type tags, click Add, and tags would
 * never persist. These tests pin the round-trip semantics.
 */
describe('[R14-3] data-bridge tags round-trip', () => {
  it('legacyDrinkToEntry preserves a non-empty tags array', () => {
    const drink: LegacyDrink = {
      ts: 1_700_000_000_000,
      volumeMl: 350,
      abvPct: 5,
      intention: 'social',
      craving: 0,
      halt: [],
      alt: '',
      tags: ['stressed', 'work'],
    };
    const entry = legacyDrinkToEntry(drink);
    expect(entry.tags).toEqual(['stressed', 'work']);
  });

  it('legacyDrinkToEntry omits the tags field when undefined', () => {
    const drink: LegacyDrink = {
      ts: 1_700_000_000_000,
      volumeMl: 350,
      abvPct: 5,
      intention: 'social',
      craving: 0,
      halt: [],
      alt: '',
    };
    const entry = legacyDrinkToEntry(drink);
    expect(entry.tags).toBeUndefined();
  });

  it('legacyDrinkToEntry omits the tags field when empty array', () => {
    const drink: LegacyDrink = {
      ts: 1_700_000_000_000,
      volumeMl: 350,
      abvPct: 5,
      intention: 'social',
      craving: 0,
      halt: [],
      alt: '',
      tags: [],
    };
    const entry = legacyDrinkToEntry(drink);
    expect(entry.tags).toBeUndefined();
  });

  it('entryToLegacyDrink preserves tags', () => {
    const entry: Entry = {
      id: 'abc',
      ts: 1_700_000_000_000,
      kind: 'custom',
      stdDrinks: 1,
      intention: 'social',
      craving: 0,
      halt: { H: false, A: false, L: false, T: false },
      tags: ['stressed', 'work'],
    };
    const drink = entryToLegacyDrink(entry);
    expect(drink.tags).toEqual(['stressed', 'work']);
  });

  it('entryToLegacyDrink omits tags when entry has none', () => {
    const entry: Entry = {
      id: 'abc',
      ts: 1_700_000_000_000,
      kind: 'custom',
      stdDrinks: 1,
      intention: 'social',
      craving: 0,
      halt: { H: false, A: false, L: false, T: false },
    };
    const drink = entryToLegacyDrink(entry);
    expect(drink.tags).toBeUndefined();
  });

  it('round-trip Drink → Entry → Drink preserves tags', () => {
    const original: LegacyDrink = {
      ts: 1_700_000_000_000,
      volumeMl: 350,
      abvPct: 5,
      intention: 'celebrate',
      craving: 0,
      halt: [],
      alt: '',
      tags: ['family', 'dinner'],
    };
    const entry = legacyDrinkToEntry(original);
    const recovered = entryToLegacyDrink({ ...entry, id: 'x' });
    expect(recovered.tags).toEqual(['family', 'dinner']);
  });
});
