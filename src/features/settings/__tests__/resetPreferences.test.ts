import { describe, expect, it } from 'vitest';
import {
  RESET_CATEGORIES,
  buildResetPatch,
  summarizeReset,
  type ResetCategory,
} from '../resetPreferences';

describe('[R17-3] resetPreferences — buildResetPatch', () => {
  it('returns an empty patch for an empty selection (caller should treat as no-op)', () => {
    expect(buildResetPatch(new Set<ResetCategory>())).toEqual({});
  });

  it('reverts theme to system when theme is selected', () => {
    expect(buildResetPatch(new Set(['theme']))).toEqual({ theme: 'system' });
  });

  it('reverts language to en when language is selected', () => {
    expect(buildResetPatch(new Set(['language']))).toEqual({ language: 'en' });
  });

  it('disables reminders + clears times + clears calmNotifications when notifications selected', () => {
    const patch = buildResetPatch(new Set(['notifications']));
    expect(patch.reminders).toEqual({ enabled: false, times: [] });
    expect(patch.calmNotifications).toBeUndefined();
  });

  it('zeroes daily/weekly/monthly goal targets when goals selected — does not delete advanced goals', () => {
    const patch = buildResetPatch(new Set(['goals']));
    expect(patch.dailyGoalDrinks).toBe(0);
    expect(patch.weeklyGoalDrinks).toBe(0);
    expect(patch.monthlyBudget).toBe(0);
    /* Critical: nothing in the patch touches advancedGoals or entries.
     * The patch shape itself ONLY allows Settings keys. */
    expect(Object.keys(patch).every((k) => ['dailyGoalDrinks', 'weeklyGoalDrinks', 'monthlyBudget'].includes(k))).toBe(true);
  });

  it('combines multiple selections into a single patch', () => {
    const patch = buildResetPatch(new Set(['theme', 'language']));
    expect(patch.theme).toBe('system');
    expect(patch.language).toBe('en');
  });
});

describe('[R17-3] resetPreferences — summarizeReset', () => {
  it('returns one human-readable line per selected category', () => {
    const lines = summarizeReset(new Set(['theme', 'language']));
    expect(lines.length).toBe(2);
    expect(lines[0]).toMatch(/Theme:/);
    expect(lines[1]).toMatch(/Language:/);
  });

  it('preserves the canonical category order regardless of insertion order', () => {
    const lines = summarizeReset(new Set(['goals', 'theme']));
    // Theme appears before goals in RESET_CATEGORIES, so theme line first.
    expect(lines[0]).toMatch(/Theme/);
    expect(lines[1]).toMatch(/Goal targets/);
  });
});

describe('[R17-3] resetPreferences — category invariants', () => {
  it('exposes exactly four categories — bumping the count needs an explicit decision', () => {
    expect(RESET_CATEGORIES.length).toBe(4);
  });

  it('every category id is unique', () => {
    const ids = RESET_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
