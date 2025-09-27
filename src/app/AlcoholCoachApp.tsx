import React, { useEffect, useState, useRef, Suspense } from 'react';
import { stdDrinks } from '../lib/calc';
import { getJSON, setJSONDebounced } from '../lib/storage';
import type { Drink, Intention, Halt } from '../features/drinks/DrinkForm/lib';
import { haltOptions } from '../features/drinks/DrinkForm/lib';
import type { DrinkPreset } from '../features/drinks/DrinkPresets';
import ReminderBanner from '../features/coach/ReminderBanner';
import { GoalSettings, Goals } from '../features/goals/GoalSettings';
import { Disclaimer } from '../components/Disclaimer';
import { useLanguage } from '../i18n';
import { Button } from '../components/ui/Button';
import ScrollTopButton from '../components/ScrollTopButton';
import AppHeader from './AppHeader';
import StatsAndGoals from './StatsAndGoals';
import { usePWA } from '../hooks/usePWA';

const DrinkForm = React.lazy(() => import('../features/drinks/DrinkForm'));
const DrinkList = React.lazy(() => import('../features/drinks/DrinkList'));
const Stats = React.lazy(() => import('../features/rewards/Stats'));
const SettingsPanel = React.lazy(() => import('../features/settings/SettingsPanel'));
const DrinkChart = React.lazy(() => import('../features/drinks/DrinkChart').then(m => ({ default: m.DrinkChart })));
const InsightsPanel = React.lazy(() => import('../features/insights/InsightsPanel'));
const SmartRecommendations = React.lazy(() => import('../features/insights/SmartRecommendations'));
const QuickActions = React.lazy(() => import('../features/insights/QuickActions'));
const ProgressVisualization = React.lazy(() => import('../features/insights/ProgressVisualization'));

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
  const { isInstallable, isOnline, updateAvailable, promptInstall, updateApp } = usePWA();

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
  return (
    <>
      {/* PWA Install Banner */}
      {isInstallable && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 flex items-center justify-between sticky top-0 z-40 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">
              📱
            </div>
            <div className="text-sm">
              <p className="font-medium">Install Alchohalt</p>
              <p className="text-blue-100 text-xs">Get the app for quick access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={promptInstall}
              className="text-white hover:bg-white/20 text-sm px-3 py-1"
            >
              Install
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* dismiss banner */}}
              className="text-white hover:bg-white/20 p-1 text-xl leading-none"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {updateAvailable && (
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-3 flex items-center justify-between sticky top-0 z-40 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">
              🔄
            </div>
            <div className="text-sm">
              <p className="font-medium">Update Available</p>
              <p className="text-green-100 text-xs">Restart to get the latest features</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={updateApp}
            className="text-white hover:bg-white/20 text-sm px-3 py-1"
          >
            Update
          </Button>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-amber-600 text-white p-2 text-center text-sm sticky top-0 z-30 flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          Offline mode - Data saved locally
        </div>
      )}

      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary-600 text-white rounded-md">
        {t('skipToContent')}
      </a>
      
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 touch-pan-y">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 max-w-6xl">
          <AppHeader />

          <main id="main" className="space-y-4 sm:space-y-6">
            <ReminderBanner />
            
            <Suspense fallback={
              <div className="card animate-pulse">
                <div className="card-content space-y-4">
                  <div className="skeleton h-4 w-3/4"></div>
                  <div className="skeleton h-10 w-full"></div>
                  <div className="skeleton h-10 w-full"></div>
                </div>
              </div>
            }>
              {/* Quick Actions - Most Important on Mobile */}
              <section className="slide-up order-1 sm:order-3">
                <QuickActions 
                  drinks={drinks}
                  goals={goals}
                  onAddDrink={addDrink}
                  onOpenSettings={() => document.getElementById('settings-section')?.scrollIntoView({ behavior: 'smooth' })}
                  onOpenStats={() => document.getElementById('stats-section')?.scrollIntoView({ behavior: 'smooth' })}
                />
              </section>

              {/* Smart Recommendations */}
              <section className="slide-up order-2">
                <SmartRecommendations drinks={drinks} goals={goals} />
              </section>

              {/* Mobile-First Grid Layout */}
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {/* Left Column - Primary Actions */}
                <div className="space-y-4 sm:space-y-6 lg:col-span-1 xl:col-span-2 order-3">
                  {/* Drink Form Section */}
                  <section className="slide-up">
                    {editing ? (
                      <div className="card border-l-4 border-warning-500">
                        <div className="card-header">
                          <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                            <span className="w-2 h-2 bg-warning-500 rounded-full mr-3"></span>
                            {t('editDrink')}
                          </h2>
                        </div>
                        <div className="card-content">
                          <DrinkForm
                            initial={editing}
                            submitLabel={t('save')}
                            onSubmit={saveDrink}
                            onCancel={() => setEditing(null)}
                            presets={presets}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="card border-l-4 border-primary-500">
                        <div className="card-header">
                          <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                            <span className="w-2 h-2 bg-primary-500 rounded-full mr-3 animate-pulse"></span>
                            {t('logDrink')}
                          </h2>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            Tap to quickly log your drink intake
                          </p>
                        </div>
                        <div className="card-content">
                          <DrinkForm onSubmit={addDrink} presets={presets} />
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Drink History List */}
                  <section className="slide-up">
                    <div className="card">
                      <div className="card-header">
                        <h2 className="text-lg sm:text-xl font-semibold flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                            Recent Drinks
                          </div>
                          <div className="text-xs bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded-full">
                            {drinks.length} total
                          </div>
                        </h2>
                      </div>
                      <div className="card-content max-h-96 overflow-y-auto">
                        <DrinkList
                          drinks={drinks}
                          onDelete={deleteDrink}
                          onEdit={startEdit}
                          dailyCap={goals.dailyCap}
                        />
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Column - Analytics & Insights */}
                <div className="space-y-4 sm:space-y-6 order-4 lg:order-3">
                  {/* Stats Summary with Mobile Optimization */}
                  <section id="stats-section" className="slide-up">
                    <StatsAndGoals 
                      drinks={drinks}
                      goals={goals}
                      onGoalsChange={setGoals}
                    />
                  </section>

                  {/* Progress Visualization */}
                  <section className="slide-up">
                    <div className="card">
                      <div className="card-header">
                        <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                          Progress Tracking
                        </h2>
                      </div>
                      <div className="card-content">
                        <ProgressVisualization drinks={drinks} goals={goals} />
                      </div>
                    </div>
                  </section>

                  {/* Personal Insights */}
                  <section className="slide-up">
                    <div className="card">
                      <div className="card-header">
                        <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                          AI Insights
                        </h2>
                      </div>
                      <div className="card-content">
                        <InsightsPanel drinks={drinks} goals={goals} />
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* Full-Width Analytics Section */}
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 order-5">
                {/* Main Stats */}
                <section className="slide-up">
                  <div className="card">
                    <div className="card-header">
                      <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                        Statistics
                      </h2>
                    </div>
                    <div className="card-content">
                      <Stats drinks={drinks} goals={goals} />
                    </div>
                  </div>
                </section>
                
                {/* Chart */}
                <section className="slide-up">
                  <div className="card">
                    <div className="card-header">
                      <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                        Trends
                      </h2>
                    </div>
                    <div className="card-content">
                      <DrinkChart drinks={drinks} />
                    </div>
                  </div>
                </section>
              </div>
              
              {/* Settings - Collapsible on Mobile */}
              <section id="settings-section" className="slide-up order-6">
                <details className="card group">
                  <summary className="card-header cursor-pointer list-none flex justify-between items-center select-none">
                    <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                      <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                      Settings & Data
                    </h2>
                    <div className="w-5 h-5 text-neutral-500 transform transition-transform duration-200 group-open:rotate-180">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </summary>
                  <div className="card-content border-t dark:border-neutral-700">
                    <SettingsPanel />
                  </div>
                </details>
              </section>
              
              {/* Footer */}
              <footer className="mt-8 sm:mt-12 pb-8">
                <Disclaimer />
                <div className="text-center mt-6 text-xs text-neutral-500">
                  <p>Alchohalt v1.0 - Your personal wellness companion</p>
                  <p className="mt-1">
                    {isOnline ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        Offline
                      </span>
                    )}
                  </p>
                </div>
              </footer>
              
              <ScrollTopButton />
            </Suspense>
          </main>
        </div>
      </div>

      {/* Enhanced Mobile Toast */}
      {lastDeleted && (
        <div
          className="fixed bottom-4 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto transform bg-neutral-800 dark:bg-neutral-700 text-white px-4 sm:px-6 py-3 rounded-xl shadow-2xl flex items-center justify-between z-50 slide-up backdrop-blur-sm border border-neutral-600"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 3a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-medium">{t('drinkDeleted')}</span>
              <p className="text-xs text-neutral-300 mt-0.5">Tap undo to restore</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-white hover:bg-white/20 ml-4 px-3" 
            onClick={undoDelete}
          >
            {t('undo')}
          </Button>
        </div>
      )}
    </>
  );
}
