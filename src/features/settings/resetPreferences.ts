/**
 * [R17-3] Selective preference reset.
 *
 * Defines the four reset-categories the user can pick in the
 * "Reset preferences" flow + a pure builder that returns a
 * Settings patch to apply each selected category.
 *
 * Pure on purpose: the modal UI is one component, this module is
 * the math, and tests assert the math without rendering anything.
 *
 * What's INTENTIONALLY not in scope: drink entries, presets, goals,
 * trash, and any cryptographic state. Resetting preferences must
 * never touch user data — the existing "Wipe all data" surface
 * exists for that, with its own much louder confirmation.
 */

import type { Settings } from '../../store/db';

export type ResetCategory = 'theme' | 'language' | 'notifications' | 'goals';

export interface ResetCategoryDescriptor {
  id: ResetCategory;
  label: string;
  description: string;
}

export const RESET_CATEGORIES: ResetCategoryDescriptor[] = [
  {
    id: 'theme',
    label: 'Theme',
    description: 'Reverts theme to "Follow system".',
  },
  {
    id: 'language',
    label: 'Language',
    description: 'Reverts language to English.',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Disables daily reminders and clears the reminder time list. Resets calm-config (quiet hours, daily cap, per-type toggles) to defaults.',
  },
  {
    id: 'goals',
    label: 'Goal targets',
    description: 'Sets daily/weekly drink targets and monthly budget back to 0 (no goal). Does not delete advanced goals.',
  },
];

/**
 * Returns the Settings patch to send through setSettings to apply the
 * requested reset categories. Returns an empty patch when no
 * categories are selected (caller should treat as a no-op).
 */
export function buildResetPatch(selected: Set<ResetCategory>): Partial<Settings> {
  const patch: Partial<Settings> = {};
  if (selected.has('theme')) patch.theme = 'system';
  if (selected.has('language')) patch.language = 'en';
  if (selected.has('notifications')) {
    patch.reminders = { enabled: false, times: [] };
    patch.calmNotifications = undefined;
  }
  if (selected.has('goals')) {
    patch.dailyGoalDrinks = 0;
    patch.weeklyGoalDrinks = 0;
    patch.monthlyBudget = 0;
  }
  return patch;
}

/**
 * Human-readable summary of what the patch will change. Shown in the
 * confirmation modal so the user reads exactly what's about to happen
 * before tapping Reset. Each line corresponds to one selected category.
 */
export function summarizeReset(selected: Set<ResetCategory>): string[] {
  return RESET_CATEGORIES
    .filter((c) => selected.has(c.id))
    .map((c) => `${c.label}: ${c.description}`);
}
