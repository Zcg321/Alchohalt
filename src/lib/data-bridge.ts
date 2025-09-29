// Bridge to unify persistence between legacy AlcoholCoachApp and useDB store
import type { Drink as LegacyDrink, Goals as LegacyGoals } from '../types/common';
import type { Entry, Settings, HALT, Intention as StoreIntention } from '../store/db';

// Convert legacy volumeMl + abvPct to standard drinks (US: 14g ethanol = 1 std drink)
export function calculateStdDrinks(volumeMl: number, abvPct: number): number {
  const ethanolGrams = (volumeMl * abvPct / 100) * 0.789; // ethanol density
  return ethanolGrams / 14; // US standard drink = 14g ethanol
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
export function HALTToLegacyHalt(halt: HALT): string[] {
  const result: string[] = [];
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
  return {
    ts: drink.ts,
    kind: 'custom', // Default since legacy doesn't distinguish types
    stdDrinks: calculateStdDrinks(drink.volumeMl, drink.abvPct),
    intention: mapLegacyIntention(drink.intention),
    craving: drink.craving,
    halt: legacyHaltToHALT(drink.halt),
    altAction: drink.alt || undefined,
  };
}

// Convert store entry back to legacy drink format (for compatibility)
export function entryToLegacyDrink(entry: Entry): LegacyDrink {
  // Approximate reverse conversion (lossy)
  const volumeMl = Math.round(entry.stdDrinks * 355); // Assume ~beer volume
  const abvPct = Math.round((entry.stdDrinks * 14 * 100) / (volumeMl * 0.789)); // Reverse calc
  
  return {
    volumeMl: Math.min(volumeMl, 1000), // Cap at reasonable volume
    abvPct: Math.min(abvPct, 50), // Cap at reasonable ABV
    intention: entry.intention as any, // Types are now compatible
    craving: entry.craving,
    halt: HALTToLegacyHalt(entry.halt),
    alt: entry.altAction || '',
    ts: entry.ts,
  };
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