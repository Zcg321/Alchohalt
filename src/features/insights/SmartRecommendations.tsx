import React, { useMemo } from 'react';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../../types/common';
import { stdDrinks } from '../../lib/calc';
import { Button } from '../../components/ui/Button';

interface Props {
  drinks: Drink[];
  goals: Goals;
}

interface Recommendation {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  type: 'prevention' | 'motivation' | 'health' | 'planning';
  urgency: 'low' | 'medium' | 'high';
}

export default function SmartRecommendations({ drinks, goals }: Props) {

  const recommendations = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const monthStart = now - 30 * 24 * 60 * 60 * 1000;

    const todayDrinks = drinks.filter(d => d.ts >= todayStart);
    const monthDrinks = drinks.filter(d => d.ts >= monthStart);

    const recommendations: Recommendation[] = [];

    // Daily limit warning
    const todayStd = todayDrinks.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
    if (todayStd >= goals.dailyCap * 0.8 && todayStd < goals.dailyCap) {
      recommendations.push({
        title: 'Approaching Daily Limit',
        description: `You've consumed ${todayStd.toFixed(1)} of your ${goals.dailyCap} daily limit. Consider switching to alcohol-free alternatives for the rest of today.`,
        type: 'prevention',
        urgency: 'medium'
      });
    } else if (todayStd >= goals.dailyCap) {
      recommendations.push({
        title: 'Daily Limit Reached',
        description: 'You\'ve reached your daily limit. Taking a break now will help you stay on track with your goals.',
        type: 'prevention',
        urgency: 'high'
      });
    }

    // Weekend pattern prevention
    const today = new Date().getDay();
    if ((today === 5 || today === 6) && hasWeekendPattern(drinks)) {
      recommendations.push({
        title: 'Weekend Strategy Needed',
        description: 'You tend to drink more on weekends. Consider planning alcohol-free activities or setting a specific weekend limit.',
        action: {
          label: 'Set Weekend Goal',
          onClick: () => {/* Open goal setting */}
        },
        type: 'planning',
        urgency: 'medium'
      });
    }

    // High craving management
    const recentHighCravings = monthDrinks.filter(d => d.craving >= 7).length;
    if (recentHighCravings > 5) {
      recommendations.push({
        title: 'Craving Management Tips',
        description: 'You\'ve experienced high cravings recently. Try the 10-minute rule: wait 10 minutes before drinking and engage in a different activity.',
        type: 'health',
        urgency: 'medium'
      });
    }

    // HALT-specific recommendations
    const haltRecommendation = getHaltRecommendation(monthDrinks);
    if (haltRecommendation) {
      recommendations.push(haltRecommendation);
    }

    // Streak motivation
    const currentStreak = getCurrentStreak(drinks);
    if (currentStreak >= 3 && currentStreak < 7) {
      recommendations.push({
        title: 'Keep Your Streak Going!',
        description: `You're ${currentStreak} days alcohol-free. You're doing great! Each day gets easier.`,
        type: 'motivation',
        urgency: 'low'
      });
    }

    // Alternative activity suggestion
    if (getAlternativeUsage(monthDrinks) < 30 && monthDrinks.length > 0) {
      recommendations.push({
        title: 'Try Alternative Activities',
        description: 'Consider planning enjoyable alternatives when you feel like drinking: go for a walk, call a friend, or try a new hobby.',
        type: 'planning',
        urgency: 'low'
      });
    }

    // Spending alert
    const monthlySpend = calculateMonthlySpend(monthDrinks, goals.pricePerStd);
    if (monthlySpend > goals.baselineMonthlySpend * 1.2) {
      recommendations.push({
        title: 'Budget Alert',
        description: `You've spent $${monthlySpend.toFixed(2)} on alcohol this month, which is over your $${goals.baselineMonthlySpend} budget.`,
        type: 'health',
        urgency: 'medium'
      });
    }

    return recommendations.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
  }, [drinks, goals]);

  const urgencyColors = {
    high: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
    medium: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    low: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
  };

  const urgencyIcons = {
    high: <AlertCircleIcon />,
    medium: <WarningIcon />,
    low: <InfoIcon />
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
          Smart Recommendations
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Personalized suggestions based on your patterns
        </p>
      </div>

      <div className="card-content space-y-4">
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <CheckCircleIcon />
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">
              Great job! No urgent recommendations right now. Keep up the good work!
            </p>
          </div>
        ) : (
          recommendations.map((rec, index) => (
            <div key={index} className={`p-4 rounded-lg border ${urgencyColors[rec.urgency]}`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {urgencyIcons[rec.urgency]}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{rec.title}</h3>
                  <p className="text-sm opacity-90 mb-3">{rec.description}</p>
                  {rec.action && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={rec.action.onClick}
                      className="text-current border-current hover:bg-current hover:bg-opacity-10"
                    >
                      {rec.action.label}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Helper functions
function hasWeekendPattern(drinks: Drink[]): boolean {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentDrinks = drinks.filter(d => d.ts > thirtyDaysAgo);

  const weekendTotal = recentDrinks.filter(d => {
    const day = new Date(d.ts).getDay();
    return day === 0 || day === 6;
  }).reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);

  const weekdayTotal = recentDrinks.filter(d => {
    const day = new Date(d.ts).getDay();
    return day >= 1 && day <= 5;
  }).reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);

  const avgWeekend = weekendTotal / 8; // ~4 weekends in 30 days
  const avgWeekday = weekdayTotal / 20; // ~20 weekdays in 30 days

  return avgWeekend > avgWeekday * 1.5;
}

function getCurrentStreak(drinks: Drink[]): number {
  const byDay: Record<string, number> = {};
  drinks.forEach(d => {
    const day = new Date(d.ts).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + stdDrinks(d.volumeMl, d.abvPct);
  });

  let streak = 0;
  const current = new Date();
  let continueChecking = true;
  while (continueChecking) {
    const key = current.toISOString().slice(0, 10);
    if (byDay[key] > 0) {
      continueChecking = false;
      break;
    }
    streak++;
    current.setDate(current.getDate() - 1);
    if (streak > 365) {
      continueChecking = false;
      break;
    }
  }

  return streak;
}

function getHaltRecommendation(drinks: Drink[]): Recommendation | null {
  const haltCounts = { hungry: 0, angry: 0, lonely: 0, tired: 0 };
  drinks.forEach(d => {
    d.halt.forEach(h => haltCounts[h]++);
  });

  const total = Object.values(haltCounts).reduce((sum, count) => sum + count, 0);
  if (total < 3) return null;

  const topHalt = Object.entries(haltCounts).sort(([,a], [,b]) => b - a)[0];
  const percentage = (topHalt[1] / total) * 100;

  if (percentage < 40) return null;

  const haltStrategies = {
    hungry: {
      title: 'Manage Hunger-Triggered Drinking',
      description: 'Keep healthy snacks ready and eat regular meals. Low blood sugar can trigger alcohol cravings.'
    },
    angry: {
      title: 'Channel Your Anger Differently',
      description: 'Try physical exercise, deep breathing, or journaling when you feel angry instead of reaching for alcohol.'
    },
    lonely: {
      title: 'Combat Loneliness Proactively',
      description: 'Schedule regular social activities or video calls with friends. Loneliness is a common drinking trigger.'
    },
    tired: {
      title: 'Address Fatigue First',
      description: 'Prioritize sleep hygiene and rest. Being tired makes it harder to resist cravings.'
    }
  };

  const strategy = haltStrategies[topHalt[0] as keyof typeof haltStrategies];
  return {
    title: strategy.title,
    description: strategy.description,
    type: 'health',
    urgency: 'medium'
  };
}

function getAlternativeUsage(drinks: Drink[]): number {
  const withAlt = drinks.filter(d => d.alt && d.alt.trim() !== '').length;
  return drinks.length > 0 ? (withAlt / drinks.length) * 100 : 0;
}

function calculateMonthlySpend(drinks: Drink[], pricePerStd: number): number {
  return drinks.reduce((sum, d) => sum + (stdDrinks(d.volumeMl, d.abvPct) * pricePerStd), 0);
}

// Icon components
function AlertCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}