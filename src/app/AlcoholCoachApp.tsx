import React, { useEffect, useState, useRef } from 'react';
import type { Drink, Intention, Halt, DrinkPreset, Goals } from '../types/common';
import { haltOptions } from '../features/drinks/DrinkForm/lib';
import { useLanguage } from '../i18n';
import { useDB } from '../store/db';
import { entryToLegacyDrink, settingsToLegacyGoals, legacyDrinkToEntry, legacyGoalsToSettings } from '../lib/data-bridge';
import { migrateLegacyData } from '../lib/migrate-legacy';
import ScrollTopButton from '../components/ScrollTopButton';
import AppHeader from './AppHeader';
import StatsAndGoals from './StatsAndGoals';
import MainContent from './MainContent';
import PWAInstallBanner from './PWAInstallBanner';
import UpdateBanner from './UpdateBanner';
import { usePWA } from '../hooks/usePWA';

export function AlcoholCoachApp() {
  // Use unified store instead of separate state
  const { db, addEntry, editEntry, deleteEntry, undo, setSettings } = useDB();
  const [editing, setEditing] = useState<string | null>(null); // Track entry ID instead of drink object
  const [presets, setPresets] = useState<DrinkPreset[]>([]); // Keep presets in local state for now
  const [lastDeleted, setLastDeleted] = useState<string | null>(null); // Track entry ID
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);
  const undoTimer = useRef<number>();
  const { t } = useLanguage();
  const { isInstallable, isOnline, updateAvailable, promptInstall, updateApp } = usePWA();

  // Convert store data to legacy format for compatibility with existing UI components
  const drinks = db.entries.map(entryToLegacyDrink);
  const goals = settingsToLegacyGoals(db.settings);

  // Migrate legacy data on mount
  useEffect(() => {
    migrateLegacyData();
  }, []);

  // Update data modification functions to use store
  function addDrink(drink: Drink) {
    const entry = legacyDrinkToEntry(drink);
    addEntry(entry);
  }

  function saveDrink(drink: Drink) {
    if (!editing) return;
    const entry = legacyDrinkToEntry(drink);
    editEntry(editing, entry);
    setEditing(null);
  }

  function deleteDrink(drink: Drink) {
    // Find entry by timestamp since it's the stable identifier
    const entry = db.entries.find(e => e.ts === drink.ts);
    if (entry) {
      deleteEntry(entry.id);
      setLastDeleted(entry.id);
      
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = window.setTimeout(() => {
        setLastDeleted(null);
      }, 5000);
    }
  }

  function undoDelete() {
    if (!lastDeleted) return;
    undo(); // Use store's undo functionality
    setLastDeleted(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }

  function startEdit(drink: Drink) {
    const entry = db.entries.find(e => e.ts === drink.ts);
    if (entry) {
      setEditing(entry.id);
    }
  }

  function cancelEdit() {
    setEditing(null);
  }

  function onGoalsChange(newGoals: Goals) {
    const settingsUpdate = legacyGoalsToSettings(newGoals);
    setSettings(settingsUpdate);
  }

  // Get current editing drink for UI
  const editingDrink = editing 
    ? entryToLegacyDrink(db.entries.find(e => e.id === editing)!)
    : null;

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

      <StatsAndGoals 
        drinks={drinks} 
        goals={goals} 
        onGoalsChange={onGoalsChange}
      />

      <MainContent
        drinks={drinks}
        editing={editingDrink}
        goals={goals}
        presets={presets}
        lastDeleted={lastDeleted ? entryToLegacyDrink(db.entries.find(e => e.id === lastDeleted)!) : null}
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