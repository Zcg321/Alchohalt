import React, { useEffect, useState, useRef } from 'react';
import { stdDrinks } from '../lib/calc';
import { getJSON, setJSONDebounced } from '../lib/storage';
import type { Drink, Intention, Halt, DrinkPreset, Goals } from '../types/common';
import { haltOptions } from '../features/drinks/DrinkForm/lib';
import { useLanguage } from '../i18n';
import ScrollTopButton from '../components/ScrollTopButton';
import AppHeader from './AppHeader';
import StatsAndGoals from './StatsAndGoals';
import MainContent from './MainContent';
import PWAInstallBanner from './PWAInstallBanner';
import UpdateBanner from './UpdateBanner';
import { usePWA } from '../hooks/usePWA';

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
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);
  const undoTimer = useRef<number>();
  const { t } = useLanguage();
  const { isInstallable, isOnline, updateAvailable, promptInstall, updateApp } = usePWA();

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Persist data changes
  useEffect(() => {
    setJSONDebounced('drinks', drinks);
  }, [drinks]);

  useEffect(() => {
    setJSONDebounced('goals', goals);
  }, [goals]);

  useEffect(() => {
    setJSONDebounced('presets', presets);
  }, [presets]);

  async function loadData() {
    const [savedDrinks, savedPresets, savedGoals] = await Promise.all([
      getJSON<Drink[]>('drinks', []),
      getJSON<DrinkPreset[]>('presets', []),
      getJSON<Partial<Goals>>('goals', {})
    ]);

    setDrinks(
      savedDrinks.map((d) => ({
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
    );

    setPresets(savedPresets);
    setGoals({ ...defaultGoals, ...savedGoals });
  }

  function addDrink(drink: Drink) {
    setDrinks((prev) => [...prev, { ...drink, ts: Date.now() }]);
  }

  function saveDrink(drink: Drink) {
    setDrinks((prev) => prev.map((d) => (d.ts === drink.ts ? drink : d)));
    setEditing(null);
  }

  function deleteDrink(drink: Drink) {
    setDrinks((prev) => prev.filter((d) => d.ts !== drink.ts));
    setLastDeleted(drink);
    
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => {
      setLastDeleted(null);
    }, 5000);
  }

  function undoDelete() {
    if (!lastDeleted) return;
    setDrinks((prev) => [...prev, lastDeleted]);
    setLastDeleted(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }

  function startEdit(drink: Drink) {
    setEditing(drink);
  }

  function cancelEdit() {
    setEditing(null);
  }

  return (
    <>
      <PWAInstallBanner
        isInstallable={isInstallable && showInstallBanner}
        promptInstall={promptInstall}
        onDismiss={() => setShowInstallBanner(false)}
      />
      
      <UpdateBanner
        updateAvailable={updateAvailable && showUpdateBanner}
        updateApp={updateApp}
        onDismiss={() => setShowUpdateBanner(false)}
      />

      {/* Online Status Indicator */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        <span className="text-xs text-gray-600 bg-white/90 px-2 py-1 rounded shadow">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <AppHeader />

      <StatsAndGoals />

      <MainContent
        drinks={drinks}
        editing={editing}
        presets={presets}
        lastDeleted={lastDeleted}
        onAddDrink={addDrink}
        onSaveDrink={saveDrink}
        onStartEdit={startEdit}
        onDeleteDrink={deleteDrink}
        onUndoDelete={undoDelete}
        onCancelEdit={cancelEdit}
      />

      <ScrollTopButton />
    </>
  );
}