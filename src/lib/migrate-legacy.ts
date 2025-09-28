// One-time migration from legacy localStorage to unified DB
import { getJSON } from './storage';
import { useDB } from '../store/db';
import { legacyDrinkToEntry, legacyGoalsToSettings } from './data-bridge';
import type { Drink as LegacyDrink, Goals as LegacyGoals, DrinkPreset } from '../types/common';

let migrationCompleted = false;

export async function migrateLegacyData(): Promise<void> {
  if (migrationCompleted) return;
  
  try {
    // Check if we have legacy data to migrate
    const [legacyDrinks, legacyGoals] = await Promise.all([
      getJSON<LegacyDrink[]>('drinks', []),
      getJSON<Partial<LegacyGoals>>('goals', {})
    ]);

    if (legacyDrinks.length === 0 && Object.keys(legacyGoals).length === 0) {
      migrationCompleted = true;
      return; // No legacy data to migrate
    }

    console.log(`Migrating ${legacyDrinks.length} legacy drinks and goals to unified store...`);

    const store = useDB.getState();

    // Migrate drinks to entries
    for (const drink of legacyDrinks) {
      const entry = legacyDrinkToEntry(drink);
      store.addEntry(entry);
    }

    // Migrate goals to settings
    if (Object.keys(legacyGoals).length > 0) {
      const legacyGoalsWithDefaults: LegacyGoals = {
        dailyCap: 3,
        weeklyGoal: 14,
        pricePerStd: 2,
        baselineMonthlySpend: 200,
        ...legacyGoals
      };
      const settingsUpdates = legacyGoalsToSettings(legacyGoalsWithDefaults);
      store.setSettings(settingsUpdates);
    }

    console.log('Legacy data migration completed successfully');
    migrationCompleted = true;

  } catch (error) {
    console.error('Failed to migrate legacy data:', error);
    migrationCompleted = true; // Don't retry on error
  }
}