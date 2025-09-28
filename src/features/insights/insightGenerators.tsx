import React from 'react';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../goals/GoalSettings';
import type { Insight } from './lib';
import { 
  getCurrentStreak, 
  analyzeWeekendPattern, 
  analyzeCravingTrend 
} from './lib';

// Icon components
export function TrophyIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 2l3 6 6 .75-4.5 4.25 1 6.25L10 16l-5.5 3.25 1-6.25L1 8.75 7 8l3-6z" clipRule="evenodd" />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export function TrendDownIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  );
}

export function TrendUpIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
    </svg>
  );
}

export function ChartIcon() {
  return (
    <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

export function generateInsights(drinks: Drink[], goals: Goals): Insight[] {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  
  const recentDrinks = drinks.filter(d => d.ts > thirtyDaysAgo);
  const insights: Insight[] = [];
  
  // Streak analysis
  const currentStreak = getCurrentStreak(drinks);
  if (currentStreak >= 7) {
    insights.push({
      title: `${currentStreak} Day Alcohol-Free Streak!`,
      description: 'Great job maintaining your alcohol-free streak. Keep it up!',
      type: 'achievement',
      icon: <TrophyIcon />,
      priority: 1
    });
  }
  
  // Weekend pattern analysis
  const weekendPattern = analyzeWeekendPattern(recentDrinks);
  if (weekendPattern.hasPattern) {
    insights.push({
      title: 'Weekend Drinking Pattern Detected',
      description: `You tend to drink ${weekendPattern.percentage}% more on weekends. Consider planning alcohol-free weekend activities.`,
      type: 'pattern',
      icon: <CalendarIcon />,
      priority: 2
    });
  }
  
  // Craving trend analysis
  const cravingTrend = analyzeCravingTrend(recentDrinks);
  if (cravingTrend.direction === 'improving') {
    insights.push({
      title: 'Cravings Are Decreasing',
      description: `Your average craving intensity has decreased by ${cravingTrend.percentage}% over the past month. This suggests improved control.`,
      type: 'achievement',
      icon: <TrendDownIcon />,
      priority: 1
    });
  } else if (cravingTrend.direction === 'worsening') {
    insights.push({
      title: 'Cravings Are Increasing',
      description: `Your cravings have increased by ${cravingTrend.percentage}% recently. Consider stress management techniques.`,
      type: 'warning',
      icon: <TrendUpIcon />,
      priority: 3
    });
  }
  
  return insights.sort((a, b) => a.priority - b.priority);
}