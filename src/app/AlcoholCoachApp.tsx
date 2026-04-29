import React, { useEffect, useState, useRef } from 'react';
import type { Drink, Goals } from '../types/common';
import { useDB } from '../store/db';
import {
  entryToLegacyDrink,
  settingsToLegacyGoals,
  legacyDrinkToEntry,
  legacyGoalsToSettings,
} from '../lib/data-bridge';
import { migrateLegacyData } from '../lib/migrate-legacy';
import ScrollTopButton from '../components/ScrollTopButton';
import AppHeader from './AppHeader';
import TabShell, { type TabId } from './TabShell';
import TodayHome from '../features/homepage/TodayHome';
import TrackTab from './tabs/TrackTab';
import GoalsTab from './tabs/GoalsTab';
import InsightsTab from './tabs/InsightsTab';
import SettingsTab from './tabs/SettingsTab';
import PWAInstallBanner from './PWAInstallBanner';
import UpdateBanner from './UpdateBanner';
import OnboardingFlow from '../features/onboarding/OnboardingFlow';
import CrisisResources from '../features/crisis/CrisisResources';
import { usePWA } from '../hooks/usePWA';
import { useLanguage } from '../i18n';

export function AlcoholCoachApp() {
  const { db, addEntry, editEntry, deleteEntry, undo, setSettings } = useDB();
  const [editing, setEditing] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Drink | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);
  const [showCrisis, setShowCrisis] = useState(false);
  // [IA-2] active tab — controlled here so other surfaces (the Today
  // panel "See progress" CTA) can request a jump to Insights.
  const [activeTab, setActiveTab] = useState<TabId | undefined>(undefined);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape' && showCrisis) return;
      if (e.key === 'Escape' && showCrisis) setShowCrisis(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCrisis]);

  const undoTimer = useRef<number>();
  const { isInstallable, isOnline, updateAvailable, promptInstall, updateApp } = usePWA();
  const { t } = useLanguage();

  const drinks = db.entries.map(entryToLegacyDrink);
  const goals = settingsToLegacyGoals(db.settings);

  useEffect(() => {
    migrateLegacyData();
  }, []);

  // [ROUTE-1] /crisis (and #crisis) deep-link.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isCrisis =
      window.location.pathname === '/crisis' ||
      window.location.hash === '#crisis';
    if (isCrisis) setShowCrisis(true);
  }, []);

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
    const entry = db.entries.find((e) => e.ts === drink.ts);
    if (entry) {
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
    undo();
    setLastDeleted(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }

  function startEdit(drink: Drink) {
    const entry = db.entries.find((e) => e.ts === drink.ts);
    if (entry) setEditing(entry.id);
  }

  function cancelEdit() {
    setEditing(null);
  }

  function onGoalsChange(newGoals: Goals) {
    const settingsUpdate = legacyGoalsToSettings(newGoals);
    setSettings(settingsUpdate);
  }

  const editingDrink = editing
    ? entryToLegacyDrink(db.entries.find((e) => e.id === editing)!)
    : null;

  const panels: Record<TabId, React.ReactNode> = {
    today: (
      <TodayHome
        drinks={drinks}
        editing={editingDrink}
        goals={goals}
        presets={db.presets}
        onAddDrink={addDrink}
        onSaveDrink={saveDrink}
        onCancelEdit={cancelEdit}
        onOpenInsights={() => setActiveTab('insights')}
      />
    ),
    track: (
      <TrackTab
        drinks={drinks}
        goals={goals}
        presets={db.presets}
        editing={editingDrink}
        onAddDrink={addDrink}
        onSaveDrink={saveDrink}
        onStartEdit={startEdit}
        onDeleteDrink={deleteDrink}
        onCancelEdit={cancelEdit}
      />
    ),
    goals: <GoalsTab goals={goals} onGoalsChange={onGoalsChange} />,
    insights: <InsightsTab drinks={drinks} goals={goals} />,
    settings: <SettingsTab onOpenCrisis={() => setShowCrisis(true)} />,
  };

  return (
    <>
      {/* [A11Y-1] Skip-to-content. Visually hidden until focused; lets
          keyboard / SR users jump straight into <main>. */}
      <a href="#main" className="skip-link">Skip to main content</a>

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

      {!isOnline && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-pill bg-charcoal-900/90 px-3.5 py-2 text-caption font-medium text-white shadow-medium backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <span className="h-1.5 w-1.5 rounded-pill bg-amber-300" aria-hidden />
          {t('status.offline')}
        </div>
      )}

      <AppHeader onOpenCrisis={() => setShowCrisis(true)} />

      {showCrisis ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="crisis-dialog-title"
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-charcoal-900/70 backdrop-blur-sm p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCrisis(false);
          }}
        >
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-surface-elevated shadow-strong ring-1 ring-border animate-slide-up">
            <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
              <h2 id="crisis-dialog-title" className="text-h3 text-ink">
                Need help now?
              </h2>
              <button
                type="button"
                onClick={() => setShowCrisis(false)}
                aria-label="Close"
                className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-ink-soft hover:bg-cream-50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 transition-colors"
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

      <TabShell panels={panels} activeTab={activeTab} onChange={setActiveTab} />

      {lastDeleted && (
        <div className="fixed bottom-24 lg:bottom-4 left-1/2 transform -translate-x-1/2 bg-charcoal-900 text-white px-6 py-3 rounded-pill shadow-strong flex items-center gap-3 z-50 animate-slide-up">
          <span className="text-caption">{t('drinkDeleted')}</span>
          <button
            type="button"
            onClick={undoDelete}
            className="text-caption underline-offset-4 hover:underline"
          >
            {t('undo')}
          </button>
        </div>
      )}

      <ScrollTopButton />
    </>
  );
}
