import React, { useEffect, useState, useRef } from 'react';
import { stdDrinks } from '../lib/calc';
import { getJSON, setJSONDebounced } from '../lib/storage';
import { Drink, DrinkForm, Intention, haltOptions, Halt } from '../features/drinks/DrinkForm';
import type { DrinkPreset } from '../features/drinks/DrinkPresets';
import { DrinkList } from '../features/drinks/DrinkList';
import ReminderBanner from '../features/coach/ReminderBanner';
import { DrinkChart } from '../features/drinks/DrinkChart';
import { Stats } from '../features/rewards/Stats';
import { GoalSettings, Goals } from '../features/goals/GoalSettings';
import { Disclaimer } from '../components/Disclaimer';
import SettingsPanel from '../features/settings/SettingsPanel';
import { useLanguage } from '../i18n';
import { Button } from '../components/ui/Button';
import ScrollTopButton from '../components/ScrollTopButton';

const defaultGoals: Goals = {
  dailyCap: 3,
  weeklyGoal: 14,
  pricePerStd: 2,
  baselineMonthlySpend: 200,
};

export function AlcoholCoachApp() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [editing, setEditing] = useState<Drink | null>(null);
  const [presets, setPresets] = useState<DrinkPreset[]>([]);
  const [lastDeleted, setLastDeleted] = useState<Drink | null>(null);
  const undoTimer = useRef<number>();
  const { t } = useLanguage();

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
    getJSON<DrinkPreset[]>('presets', []).then(setPresets);
  }, []);

  useEffect(() => {
    getJSON<Partial<Goals>>('goals', {}).then((g) =>
      setGoals({
        ...defaultGoals,
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

  useEffect(() => {
    setJSONDebounced('presets', presets);
  }, [presets]);

  function addDrink(drink: Drink) {
    setDrinks((d) => [...d, drink]);
  }

  function saveDrink(drink: Drink) {
    setDrinks((d) => d.map((x) => (x.ts === drink.ts ? drink : x)));
    setEditing(null);
  }


  function deleteDrink(ts: number) {
    setDrinks((d) => {
      const drink = d.find((x) => x.ts === ts);
      if (drink) {
        setLastDeleted(drink);
        if (undoTimer.current) clearTimeout(undoTimer.current);
        undoTimer.current = window.setTimeout(() => setLastDeleted(null), 5000);
      }
      return d.filter((drink) => drink.ts !== ts);
    });
  }

  function undoDelete() {
    if (!lastDeleted) return;
    setDrinks((d) => [...d, lastDeleted]);
    setLastDeleted(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }

  function startEdit(drink: Drink) {
    setEditing(drink);
  }

  const totalStd = drinks.reduce(
    (sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct),
    0
  );
  return (
    <div id="main" className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t('appName')}</h1>
      <ReminderBanner />
      {editing ? (
        <DrinkForm
          initial={editing}
          submitLabel={t('save')}
          onSubmit={saveDrink}
          onCancel={() => setEditing(null)}
          presets={presets}
        />
      ) : (
        <DrinkForm onSubmit={addDrink} presets={presets} />
      )}
      <div>
        {t('totalStdDrinks')}: {totalStd.toFixed(2)}
      </div>
      <GoalSettings goals={goals} onChange={setGoals} />
      <Stats drinks={drinks} goals={goals} />
      <DrinkChart drinks={drinks} />
      <DrinkList
        drinks={drinks}
        onDelete={deleteDrink}
        onEdit={startEdit}
        dailyCap={goals.dailyCap}
      />
      <SettingsPanel />
      <Disclaimer />
      <ScrollTopButton />
      {lastDeleted && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 transform bg-gray-800 text-white px-4 py-2 rounded shadow flex items-center"
          role="alert"
          aria-live="assertive"
        >
          <span>{t('drinkDeleted')}</span>
          <Button className="ml-2" onClick={undoDelete}>
            {t('undo')}
          </Button>
        </div>
      )}
    </div>
  );
}
