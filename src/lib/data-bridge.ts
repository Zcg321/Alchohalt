// Bridge to unify persistence between legacy AlcoholCoachApp and useDB store
import type { Drink as LegacyDrink, Goals as LegacyGoals, Halt } from '../types/common';
import type { Entry, Settings, HALT, Intention as StoreIntention } from '../store/db';
import { stdDrinks as stdDrinksForActiveSystem } from './calc';

/**
 * Convert legacy volumeMl + abvPct to standard drinks for the user's
 * active jurisdiction. R14-6 made stdDrinks() jurisdiction-aware via
 * a module-level activeSystem hydrated from settings. This bridge
 * delegates to it so newly-persisted Entry.stdDrinks values are in
 * the user's chosen system from the moment of save.
 *
 * Limitation (documented in audit-walkthrough/round-14-researcher-judge.md):
 * pre-R14-6 entries were persisted as US-14g std drinks. Switching
 * jurisdiction does NOT rescale historical entries today — that would
 * require either a one-time migration or storing grams-of-ethanol
 * natively. Both are legitimate followup work.
 */
export function calculateStdDrinks(volumeMl: number, abvPct: number): number {
  return stdDrinksForActiveSystem(volumeMl, abvPct);
}

// Convert legacy halt array to HALT object
export function legacyHaltToHALT(halt: string[]): HALT {
  return {
    H: halt.includes('hungry'),
    A: halt.includes('angry'), 
    L: halt.includes('lonely'),
    T: halt.includes('tired')
  };
}

// Convert HALT object to legacy halt array
export function HALTToLegacyHalt(halt: HALT): Halt[] {
  const result: Halt[] = [];
  if (halt.H) result.push('hungry');
  if (halt.A) result.push('angry');
  if (halt.L) result.push('lonely');
  if (halt.T) result.push('tired');
  return result;
}

// Map legacy intentions to store intentions
export function mapLegacyIntention(intention: string): StoreIntention {
  switch (intention) {
    case 'taste': return 'taste';
    case 'social': return 'social';
    case 'cope': return 'cope';
    case 'celebrate': return 'celebrate';
    case 'bored': return 'bored';
    case 'habit': return 'bored'; // Map habit -> bored as closest match
    default: return 'other';
  }
}

// Convert legacy drink to store entry
export function legacyDrinkToEntry(drink: LegacyDrink): Omit<Entry, 'id'> {
  const entry: Omit<Entry, 'id'> = {
    ts: drink.ts,
    kind: 'custom', // Default since legacy doesn't distinguish types
    stdDrinks: calculateStdDrinks(drink.volumeMl, drink.abvPct),
    intention: mapLegacyIntention(drink.intention),
    craving: drink.craving,
    halt: legacyHaltToHALT(drink.halt),
    altAction: drink.alt || undefined,
  };
  // [R14-3] Persist tags through the save path. Without this, the
  // form's `drink.tags` would be silently dropped here, breaking the
  // tag search and tag-pattern surfaces for any newly-logged drink.
  if (drink.tags && drink.tags.length > 0) entry.tags = drink.tags;
  return entry;
}

// Convert store entry back to legacy drink format (for compatibility)
export function entryToLegacyDrink(entry: Entry): LegacyDrink {
  // Approximate reverse conversion (lossy)
  const volumeMl = Math.round(entry.stdDrinks * 355); // Assume ~beer volume
  const abvPct = Math.round((entry.stdDrinks * 14 * 100) / (volumeMl * 0.789)); // Reverse calc

  const drink: LegacyDrink = {
    volumeMl: Math.min(volumeMl, 1000), // Cap at reasonable volume
    abvPct: Math.min(abvPct, 50), // Cap at reasonable ABV
    intention: entry.intention as StoreIntention, // Types are now compatible
    craving: entry.craving,
    halt: HALTToLegacyHalt(entry.halt),
    alt: entry.altAction || '',
    ts: entry.ts,
  };
  // [R14-3] Round-trip tags so persisted entries are searchable and
  // visible in tag patterns alongside in-flight ones.
  if (entry.tags && entry.tags.length > 0) drink.tags = entry.tags;
  return drink;
}

// Convert legacy goals to store settings (partial)
export function legacyGoalsToSettings(goals: LegacyGoals): Partial<Settings> {
  return {
    dailyGoalDrinks: goals.dailyCap,
    weeklyGoalDrinks: goals.weeklyGoal,
    monthlyBudget: goals.baselineMonthlySpend,
  };
}

// Convert store settings back to legacy goals
export function settingsToLegacyGoals(settings: Settings): LegacyGoals {
  return {
    dailyCap: settings.dailyGoalDrinks,
    weeklyGoal: settings.weeklyGoalDrinks,
    pricePerStd: 2, // Default price per standard drink
    baselineMonthlySpend: settings.monthlyBudget,
  };
}