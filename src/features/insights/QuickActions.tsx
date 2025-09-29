import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../../types/common';
import { stdDrinks } from '../../lib/calc';
import { useAnalytics } from '../analytics/analytics';
import { getCurrentStreak } from './lib';
import MoodTracker from '../mood/MoodTracker';

interface Props {
  drinks?: Drink[];
  goals?: Goals;
  onAddDrink?: (drink: Drink) => void;
  onOpenSettings?: () => void;
  onOpenStats?: () => void;
}

export default function QuickActions({ 
  drinks = [], 
  goals = { dailyCap: 0, weeklyGoal: 0, pricePerStd: 0, baselineMonthlySpend: 0 }, 
  onAddDrink = () => {}, 
  onOpenSettings = () => {}, 
  onOpenStats = () => {} 
}: Props) {
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const { trackFeatureUsage } = useAnalytics();

  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todayDrinks = drinks.filter(d => d.ts >= todayStart);
  const todayStd = todayDrinks.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
  
  const currentStreak = getCurrentStreak(drinks);
  const isAlcoholFree = todayStd === 0;

  // Quick drink presets
  const quickDrinks = [
    { name: 'Beer (355ml, 5%)', volumeMl: 355, abvPct: 5.0 },
    { name: 'Wine (148ml, 12%)', volumeMl: 148, abvPct: 12.0 },
    { name: 'Cocktail (44ml, 40%)', volumeMl: 44, abvPct: 40.0 },
    { name: 'Custom Entry', volumeMl: 0, abvPct: 0 },
  ];

  const handleQuickLog = (preset: typeof quickDrinks[0]) => {
    if (preset.volumeMl === 0) {
      // Open full form for custom entry
      return;
    }

    const newDrink: Drink = {
      volumeMl: preset.volumeMl,
      abvPct: preset.abvPct,
      intention: 'social', // Default
      craving: 0,
      halt: [],
      alt: '',
      ts: Date.now()
    };
    
    onAddDrink(newDrink);
  };

  const handleMoodCheckIn = () => {
    setShowMoodCheck(true);
    trackFeatureUsage('mood_check_opened', { source: 'quick_actions' });
  };

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <div className="card-content">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {currentStreak}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Days alcohol-free
            </div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-content">
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {todayStd.toFixed(1)} / {goals.dailyCap}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Today&apos;s drinks
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Quick Actions</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="primary"
              size="sm"
              className="h-12"
              onClick={handleMoodCheckIn}
              leftIcon={<HeartIcon />}
            >
              Mood Check-In
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              className="h-12"
              onClick={onOpenStats}
              leftIcon={<ChartIcon />}
            >
              View Progress
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              className="h-12"
              onClick={onOpenSettings}
              leftIcon={<SettingsIcon />}
            >
              Settings
            </Button>
            
            <Button
              variant={isAlcoholFree ? 'success' : 'secondary'}
              size="sm"
              className="h-12"
              leftIcon={isAlcoholFree ? <CheckIcon /> : <CalendarIcon />}
            >
              {isAlcoholFree ? 'AF Today!' : 'Log Drink'}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Drink Logging */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Quick Log</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Tap to log common drinks
          </p>
        </div>
        <div className="card-content">
          <div className="space-y-2">
            {quickDrinks.map((drink, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-between"
                onClick={() => handleQuickLog(drink)}
              >
                <span>{drink.name}</span>
                {drink.volumeMl > 0 && (
                  <span className="text-sm opacity-70">
                    {stdDrinks(drink.volumeMl, drink.abvPct).toFixed(1)} std
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Motivation */}
      <div className="card">
        <div className="card-content text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
            <StarIcon />
          </div>
          <h3 className="font-semibold mb-2">
            {getMotivationalMessage(currentStreak, isAlcoholFree)}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {getMotivationalSubtext(currentStreak, todayStd, goals.dailyCap)}
          </p>
        </div>
      </div>

      {/* Enhanced Mood Check Modal */}
      {showMoodCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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

// Helper functions
function getMotivationalMessage(streak: number, isAlcoholFree: boolean): string {
  if (isAlcoholFree) {
    if (streak >= 30) return "Amazing month-long streak! 🏆";
    if (streak >= 7) return "Week-long streak going strong! 💪";
    if (streak >= 3) return "Building momentum! 🚀";
    if (streak >= 1) return "Another alcohol-free day! ⭐";
    return "Starting fresh today! 🌅";
  }

  return "Every step counts! 🌟";
}

function getMotivationalSubtext(streak: number, todayStd: number, dailyCap: number): string {
  if (todayStd === 0) {
    return "Keep going! Each alcohol-free day builds your strength and resilience.";
  }
  
  if (todayStd >= dailyCap) {
    return "You&apos;ve reached your limit for today. Tomorrow is a new opportunity.";
  }
  
  const remaining = dailyCap - todayStd;
  return `You have ${remaining.toFixed(1)} drinks remaining in today&apos;s limit.`;
}

// Icon components
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

function StarIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

