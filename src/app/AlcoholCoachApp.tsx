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
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary-600 text-white rounded-md">
        {t('skipToContent')}
      </a>
      
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-6xl">
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
              {/* Drink Form Section */}
              <section className="slide-up">
                {editing ? (
                  <div className="card">
                    <div className="card-header">
                      <h2 className="text-xl font-semibold flex items-center">
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
                  <div className="card">
                    <div className="card-header">
                      <h2 className="text-xl font-semibold flex items-center">
                        <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                        {t('logDrink')}
                      </h2>
                    </div>
                    <div className="card-content">
                      <DrinkForm onSubmit={addDrink} presets={presets} />
                    </div>
                  </div>
                )}
              </section>

              {/* Stats Summary */}
              <StatsAndGoals 
                drinks={drinks}
                goals={goals}
                onGoalsChange={setGoals}
              />

              {/* Quick Actions */}
              <QuickActions 
                drinks={drinks}
                goals={goals}
                onAddDrink={addDrink}
                onOpenSettings={() => {/* scroll to settings */}}
                onOpenStats={() => {/* scroll to stats */}}
              />

              {/* Smart Recommendations */}
              <SmartRecommendations drinks={drinks} goals={goals} />

              {/* Progress Visualization */}
              <ProgressVisualization drinks={drinks} goals={goals} />

              {/* Personal Insights */}
              <InsightsPanel drinks={drinks} goals={goals} />

              {/* Main Stats */}
              <Stats drinks={drinks} goals={goals} />
              
              {/* Chart */}
              <DrinkChart drinks={drinks} />
              
              {/* Drink List */}
              <DrinkList
                drinks={drinks}
                onDelete={deleteDrink}
                onEdit={startEdit}
                dailyCap={goals.dailyCap}
              />
              
              {/* Settings */}
              <SettingsPanel />
              
              {/* Footer */}
              <footer className="mt-8 sm:mt-12">
                <Disclaimer />
              </footer>
              
              <ScrollTopButton />
            </Suspense>
          </main>
        </div>
      </div>

      {/* Toast Notification */}
      {lastDeleted && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 transform bg-neutral-800 dark:bg-neutral-700 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50 slide-up"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{t('drinkDeleted')}</span>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-white hover:bg-white/20 -mr-2" 
            onClick={undoDelete}
          >
            {t('undo')}
          </Button>
        </div>
      )}
    </>
  );
}
