import React, { useEffect, useState, useRef } from 'react';
import type { Drink, Goals } from '../types/common';
import { useDB } from '../store/db';
import { entryToLegacyDrink, settingsToLegacyGoals, legacyDrinkToEntry, legacyGoalsToSettings } from '../lib/data-bridge';
import { migrateLegacyData } from '../lib/migrate-legacy';
import ScrollTopButton from '../components/ScrollTopButton';
import AppHeader from './AppHeader';
import StatsAndGoals from './StatsAndGoals';
import MainContent from './MainContent';
import PWAInstallBanner from './PWAInstallBanner';
import UpdateBanner from './UpdateBanner';
import OnboardingFlow from '../features/onboarding/OnboardingFlow';
import CrisisResources from '../features/crisis/CrisisResources';
import SettingsPanel from '../features/settings/SettingsPanel';
import { usePWA } from '../hooks/usePWA';
import { useLanguage } from '../i18n';

export function AlcoholCoachApp() {
  // Use unified store instead of separate state
  const { db, addEntry, editEntry, deleteEntry, undo, setSettings } = useDB();
  const [editing, setEditing] = useState<string | null>(null); // Track entry ID instead of drink object
  const [lastDeleted, setLastDeleted] = useState<Drink | null>(null); // Store deleted drink snapshot
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);
  const [showCrisis, setShowCrisis] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Esc closes the topmost modal (Settings first, Crisis second).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (showSettings) setShowSettings(false);
      else if (showCrisis) setShowCrisis(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCrisis, showSettings]);
  const undoTimer = useRef<number>();
  const { isInstallable, isOnline, updateAvailable, promptInstall, updateApp } = usePWA();
  const { t } = useLanguage();

  // Convert store data to legacy format for compatibility with existing UI components
  const drinks = db.entries.map(entryToLegacyDrink);
  const goals = settingsToLegacyGoals(db.settings);

  // Migrate legacy data on mount
  useEffect(() => {
    migrateLegacyData();
  }, []);

  // [ROUTE-1] /crisis (and #crisis) deep-link opens the crisis modal
  // on load. Bookmarks, external links, and pasted URLs all land
  // somewhere useful instead of the home dashboard. Pure hash/path
  // check — no router introduced.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isCrisis =
      window.location.pathname === '/crisis' ||
      window.location.hash === '#crisis';
    if (isCrisis) setShowCrisis(true);
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
      // Store the drink snapshot before deletion
      setLastDeleted(drink);
      deleteEntry(entry.id);
      
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

  // [BUG-5] Quick Actions "Settings" button used to scroll to a
  // #settings-section anchor that was just an inline goal-settings
  // widget; the actual SettingsPanel was never mounted anywhere. Now
  // it opens the SettingsPanel as a modal (Esc + backdrop dismiss).
  function handleOpenSettings() {
    setShowSettings(true);
  }

  function handleOpenStats() {
    const statsElement = document.getElementById('stats-section');
    if (statsElement) {
      statsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Get current editing drink for UI
  const editingDrink = editing 
    ? entryToLegacyDrink(db.entries.find(e => e.id === editing)!)
    : null;

  return (
    <>
      <OnboardingFlow />
      
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

      {/*
       * Offline indicator. Only visible when the user is OFFLINE — when
       * online there's no value in showing "Online" to a privacy-first
       * app whose data never leaves the device. Mounted at the bottom
       * of the viewport so it doesn't fight the header crisis button.
       */}
      {!isOnline && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-neutral-900/90 px-3.5 py-2 text-xs font-medium text-white shadow-md backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
          {t('status.offline')}
        </div>
      )}

      <AppHeader onOpenCrisis={() => setShowCrisis(true)} />

      {showCrisis ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="crisis-dialog-title"
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-neutral-950/70 backdrop-blur-sm p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCrisis(false);
          }}
        >
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-xl ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800 animate-slide-up">
            <div className="flex items-center justify-between border-b border-neutral-200/70 px-5 py-4 dark:border-neutral-800">
              <h2 id="crisis-dialog-title" className="text-base font-semibold tracking-tight">
                Need help now?
              </h2>
              <button
                type="button"
                onClick={() => setShowCrisis(false)}
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors"
              >
                <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <CrisisResources />
          </div>
        </div>
      ) : null}

      {/* [BUG-5] Settings modal — wired to QuickActions Settings button. */}
      {showSettings ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-dialog-title"
          data-testid="settings-modal"
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-neutral-950/70 backdrop-blur-sm p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSettings(false);
          }}
        >
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-xl ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800 animate-slide-up">
            <div className="flex items-center justify-between border-b border-neutral-200/70 px-5 py-4 dark:border-neutral-800 sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur z-10 rounded-t-2xl">
              <h2 id="settings-dialog-title" className="text-base font-semibold tracking-tight">
                Settings
              </h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors"
              >
                <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <SettingsPanel />
            </div>
          </div>
        </div>
      ) : null}

      <StatsAndGoals
        drinks={drinks} 
        goals={goals} 
        onGoalsChange={onGoalsChange}
        id="stats-section"
      />

      <MainContent
        drinks={drinks}
        editing={editingDrink}
        goals={goals}
        presets={db.presets}
        lastDeleted={lastDeleted}
        onAddDrink={addDrink}
        onSaveDrink={saveDrink}
        onStartEdit={startEdit}
        onDeleteDrink={deleteDrink}
        onUndoDelete={undoDelete}
        onCancelEdit={cancelEdit}
        onOpenSettings={handleOpenSettings}
        onOpenStats={handleOpenStats}
      />

      <ScrollTopButton />
    </>
  );
}