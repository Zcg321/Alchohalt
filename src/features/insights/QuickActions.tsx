import React, { useState } from 'react';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../../types/common';
import { Button } from '../../components/ui/Button';
import { stdDrinks } from '../../lib/calc';
import { useAnalytics } from '../analytics/analytics';
import { getCurrentStreak } from './lib';
import MoodTracker from '../mood/MoodTracker';
import { useLanguage, type TranslationValues } from '../../i18n';

type Translator = (key: string, vars?: TranslationValues) => string;

interface Props {
  drinks: Drink[];
  goals: Goals;
  onAddDrink: (drink: Drink) => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
}

// Extracted helper functions
function getQuickDrinks(t: Translator) {
  return [
    { name: t('quickActions.drinks.beer', { volume: 355, abv: 5 }), volumeMl: 355, abvPct: 5.0 },
    { name: t('quickActions.drinks.wine', { volume: 148, abv: 12 }), volumeMl: 148, abvPct: 12.0 },
    { name: t('quickActions.drinks.cocktail', { volume: 44, abv: 40 }), volumeMl: 44, abvPct: 40.0 },
    { name: t('quickActions.drinks.custom'), volumeMl: 0, abvPct: 0 },
  ];
}

// Status Overview Component
function StatusOverview({ currentStreak, todayProgressLabel, t }: {
  currentStreak: number;
  todayProgressLabel: string;
  t: Translator;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="card text-center">
        <div className="card-content">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {currentStreak}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('quickActions.daysAlcoholFreeLabel')}
          </div>
        </div>
      </div>
      
      <div className="card text-center">
        <div className="card-content">
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {todayProgressLabel}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('quickActions.todayDrinksLabel')}
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Actions Grid Component
function QuickActionsGrid({ t, isAlcoholFree, onMoodCheckIn, onOpenStats, onOpenSettings }: {
  t: Translator;
  isAlcoholFree: boolean;
  onMoodCheckIn: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold">{t('quickActions.title')}</h3>
      </div>
      <div className="card-content">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="h-12"
            onClick={onMoodCheckIn}
            leftIcon={<HeartIcon />}
          >
            {t('quickActions.actions.moodCheckIn')}
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            className="h-12"
            onClick={onOpenStats}
            leftIcon={<ChartIcon />}
          >
            {t('quickActions.actions.viewProgress')}
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            className="h-12"
            onClick={onOpenSettings}
            leftIcon={<SettingsIcon />}
          >
            {t('quickActions.actions.settings')}
          </Button>
          
          <Button
            variant={isAlcoholFree ? "success" : "primary"}
            size="sm"
            className="h-12"
            leftIcon={isAlcoholFree ? <CheckIcon /> : <CalendarIcon />}
          >
            {isAlcoholFree ? t('quickActions.actions.afToday') : t('quickActions.actions.logDrink')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Quick Drink Logging Component
function QuickDrinkLogging({ t, quickDrinks, onQuickLog }: {
  t: Translator;
  quickDrinks: Array<{ name: string; volumeMl: number; abvPct: number; }>;
  onQuickLog: (drink: { name: string; volumeMl: number; abvPct: number; }) => void;
}) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold">{t('quickActions.quickLog.title')}</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('quickActions.quickLog.subtitle')}
        </p>
      </div>
      <div className="card-content">
        <div className="space-y-2">
          {quickDrinks.map((drink, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-between"
              onClick={() => onQuickLog(drink)}
            >
              <span>{drink.name}</span>
              {drink.volumeMl > 0 && (
                <span className="text-sm opacity-70">
                  {t('quickActions.quickLog.standardDrinks', {
                    count: stdDrinks(drink.volumeMl, drink.abvPct).toFixed(1)
                  })}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Motivation Card Component
function MotivationCard({ t, currentStreak, isAlcoholFree, todayStd, dailyCap }: {
  t: Translator;
  currentStreak: number;
  isAlcoholFree: boolean;
  todayStd: number;
  dailyCap: number;
}) {
  return (
    <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
      <div className="card-content text-center">
        <div className="text-2xl mb-2">
          <StarIcon />
        </div>
        <h3 className="font-semibold mb-2">
          {getMotivationalMessage(t, currentStreak, isAlcoholFree)}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {getMotivationalSubtext(t, todayStd, dailyCap)}
        </p>
      </div>
    </div>
  );
}

// Custom hooks for data processing
function useQuickActionsData(drinks: Drink[], goals: Goals, t: Translator) {
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todayDrinks = drinks.filter(d => d.ts >= todayStart);
  const todayStd = todayDrinks.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
  
  const currentStreak = getCurrentStreak(drinks);
  const isAlcoholFree = todayStd === 0;
  const todayProgressLabel = t('quickActions.todayDrinksProgress', {
    consumed: todayStd.toFixed(1),
    limit: goals.dailyCap,
  });

  const quickDrinks = getQuickDrinks(t);

  return {
    todayStd,
    currentStreak,
    isAlcoholFree,
    todayProgressLabel,
    quickDrinks
  };
}

// Event handlers hook
function useQuickActionsHandlers(onAddDrink: (drink?: Drink) => void) {
  const { trackFeatureUsage } = useAnalytics();

  const handleQuickLog = (preset: { name: string; volumeMl: number; abvPct: number; }) => {
    if (preset.volumeMl === 0) {
      onAddDrink?.();
    } else {
      onAddDrink?.({
        volumeMl: preset.volumeMl,
        abvPct: preset.abvPct,
        intention: 'social' as const,
        craving: 3,
        halt: [],
        alt: '',
      });
    }
    trackFeatureUsage('quick_drink_logged', { 
      preset: preset.name,
      volumeMl: preset.volumeMl,
      abvPct: preset.abvPct 
    });
  };

  const handleMoodCheckIn = (setShowMoodCheck: (show: boolean) => void) => {
    setShowMoodCheck(true);
    trackFeatureUsage('mood_check_opened', { source: 'quick_actions' });
  };

  return { handleQuickLog, handleMoodCheckIn };
}

export default function QuickActions({ 
  drinks = [], 
  goals = { dailyCap: 2, weeklyGoal: 10, pricePerStd: 3, baselineMonthlySpend: 150 }, 
  onAddDrink = () => {}, 
  onOpenSettings = () => {}, 
  onOpenStats = () => {} 
}: Props) {
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const { t } = useLanguage();
  
  const { todayStd, currentStreak, isAlcoholFree, todayProgressLabel, quickDrinks } = 
    useQuickActionsData(drinks, goals, t);
  
  const { handleQuickLog, handleMoodCheckIn } = useQuickActionsHandlers(onAddDrink);

  return (
    <div className="space-y-4">
      <StatusOverview 
        currentStreak={currentStreak}
        todayProgressLabel={todayProgressLabel}
        t={t}
      />
      
      <QuickActionsGrid
        t={t}
        isAlcoholFree={isAlcoholFree}
        onMoodCheckIn={() => handleMoodCheckIn(setShowMoodCheck)}
        onOpenStats={onOpenStats}
        onOpenSettings={onOpenSettings}
      />

      <QuickDrinkLogging
        t={t}
        quickDrinks={quickDrinks}
        onQuickLog={handleQuickLog}
      />

      <MotivationCard
        t={t}
        currentStreak={currentStreak}
        isAlcoholFree={isAlcoholFree}
        todayStd={todayStd}
        dailyCap={goals.dailyCap}
      />

      {/* Mood Check Modal */}
      {showMoodCheck && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-lg w-full">
            <button
              onClick={() => setShowMoodCheck(false)}
              className="absolute -top-2 -right-2 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50"
            >
              <CloseIcon />
            </button>
            <MoodTracker 
              onComplete={() => setShowMoodCheck(false)}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-6 h-6 mx-auto text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

// Helper functions
function getMotivationalMessage(t: Translator, streak: number, isAlcoholFree: boolean): string {
  if (isAlcoholFree) {
    if (streak >= 30) return t('quickActions.motivation.amazingMonth');
    if (streak >= 7) return t('quickActions.motivation.weekStrong');
    if (streak >= 3) return t('quickActions.motivation.buildingMomentum');
    if (streak >= 1) return t('quickActions.motivation.anotherDay');
    return t('quickActions.motivation.startingFresh');
  }

  return t('quickActions.motivation.everyStep');
}

function getMotivationalSubtext(t: Translator, todayStd: number, dailyCap: number): string {
  if (todayStd === 0) {
    return t('quickActions.motivationSubtext.alcoholFree');
  }

  if (todayStd >= dailyCap) {
    return t('quickActions.motivationSubtext.limitReached');
  }

  const remaining = dailyCap - todayStd;
  return t('quickActions.motivationSubtext.remaining', { remaining: remaining.toFixed(1) });
}

// Icon components (keeping existing styles)