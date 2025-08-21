import React, { useEffect, useState } from 'react';
import { stdDrinks } from '../lib/calc';
import { getJSON, setJSONDebounced } from '../lib/storage';
import { Drink, DrinkForm, Intention, haltOptions, Halt } from '../features/drinks/DrinkForm';
import { DrinkList } from '../features/drinks/DrinkList';
import { DrinkChart } from '../features/drinks/DrinkChart';
import { ExportImport } from '../features/drinks/ExportImport';
import { Stats } from '../features/rewards/Stats';
import { NotificationsToggle } from '../features/coach/NotificationsToggle';
import { GoalSettings, Goals } from '../features/goals/GoalSettings';
import { ThemeToggle } from '../features/settings/ThemeToggle';

export function AlcoholCoachApp() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [goals, setGoals] = useState<Goals>({
    dailyCap: 3,
    weeklyGoal: 14,
    pricePerStd: 2,
    baselineMonthlySpend: 200,
  });

  useEffect(() => {
    getJSON<Drink[]>('drinks', []).then((saved) =>
      setDrinks(
        saved.map((d) => ({
          volumeMl: d.volumeMl,
          abvPct: d.abvPct,
          intention: (d.intention as Intention) || 'taste',
          craving: typeof d.craving === 'number' ? d.craving : 0,
          halt: Array.isArray(d.halt)
            ? d.halt.filter((h): h is Halt => (haltOptions as readonly string[]).includes(h))
            : [],
          alt: d.alt || '',
          ts: d.ts,
        }))
      )
    );
  }, []);

  useEffect(() => {
    getJSON<Partial<Goals>>('goals', {}).then((g) =>
      setGoals({
        dailyCap: 3,
        weeklyGoal: 14,
        pricePerStd: 2,
        baselineMonthlySpend: 200,
        ...g,
      })
    );
  }, []);

  useEffect(() => {
    setJSONDebounced('drinks', drinks);
  }, [drinks]);

  useEffect(() => {
    setJSONDebounced('goals', goals);
  }, [goals]);

  function addDrink(drink: Drink) {
    setDrinks((d) => [...d, drink]);
  }

  function importDrinks(d: Drink[]) {
    setDrinks(
      d.map((x) => ({
        volumeMl: x.volumeMl,
        abvPct: x.abvPct,
        intention: (x.intention as Intention) || 'taste',
        craving: typeof x.craving === 'number' ? x.craving : 0,
        halt: Array.isArray(x.halt)
          ? x.halt.filter((h): h is Halt => (haltOptions as readonly string[]).includes(h))
          : [],
        alt: x.alt || '',
        ts: x.ts,
      }))
    );
  }

  const totalStd = drinks.reduce(
    (sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct),
    0
  );
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">alchohalt</h1>
      <ThemeToggle />
      <DrinkForm onAdd={addDrink} />
      <div>Total standard drinks: {totalStd.toFixed(2)}</div>
      <GoalSettings goals={goals} onChange={setGoals} />
      <Stats drinks={drinks} goals={goals} />
      <NotificationsToggle />
      <DrinkChart drinks={drinks} />
      <ExportImport drinks={drinks} onImport={importDrinks} />
      <DrinkList drinks={drinks} />
    </div>
  );
}
