import type { Drink } from '../drinks/DrinkForm';
import { stdDrinks } from '../../lib/calc';

export interface Insight {
  title: string;
  description: string;
  type: 'tip' | 'warning' | 'achievement' | 'pattern';
  icon: React.ReactNode;
  priority: number;
}

export interface TrendData {
  direction: 'improving' | 'stable' | 'worsening';
  percentage: number;
  message: string;
  type: 'success' | 'warning' | 'danger';
}

export function getCurrentStreak(drinks: Drink[]): number {
  const byDay: Record<string, number> = {};
  drinks.forEach(d => {
    const day = new Date(d.ts).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + stdDrinks(d.volumeMl, d.abvPct);
  });
  
  let streak = 0;
  const current = new Date();
  while (true) {
    const key = current.toISOString().slice(0, 10);
    if (byDay[key] > 0) break;
    streak++;
    current.setDate(current.getDate() - 1);
    if (streak > 365) break; // Safety limit
  }
  
  return streak;
}

export function analyzeWeekendPattern(drinks: Drink[]): { hasPattern: boolean; percentage: number } {
  const weekdayTotal = drinks.filter(d => {
    const day = new Date(d.ts).getDay();
    return day >= 1 && day <= 5; // Mon-Fri
  }).reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
  
  const weekendTotal = drinks.filter(d => {
    const day = new Date(d.ts).getDay();
    return day === 0 || day === 6; // Sat-Sun
  }).reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
  
  if (weekdayTotal === 0 && weekendTotal === 0) return { hasPattern: false, percentage: 0 };
  
  const avgWeekday = weekdayTotal / 5;
  const avgWeekend = weekendTotal / 2;
  
  if (avgWeekend > avgWeekday * 1.5) {
    const percentage = Math.round(((avgWeekend - avgWeekday) / avgWeekday) * 100);
    return { hasPattern: true, percentage };
  }
  
  return { hasPattern: false, percentage: 0 };
}

export function analyzeCravingTrend(drinks: Drink[]): TrendData {
  const now = Date.now();
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
  
  const recent = drinks.filter(d => d.ts > twoWeeksAgo);
  const older = drinks.filter(d => d.ts <= twoWeeksAgo && d.ts > (now - 28 * 24 * 60 * 60 * 1000));
  
  if (recent.length === 0 || older.length === 0) {
    return { direction: 'stable', percentage: 0, message: '', type: 'success' };
  }
  
  const recentAvg = recent.reduce((sum, d) => sum + d.craving, 0) / recent.length;
  const olderAvg = older.reduce((sum, d) => sum + d.craving, 0) / older.length;
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (change < -10) {
    return { direction: 'improving', percentage: Math.abs(change), message: '', type: 'success' };
  } else if (change > 10) {
    return { direction: 'worsening', percentage: change, message: '', type: 'warning' };
  }
  
  return { direction: 'stable', percentage: 0, message: '', type: 'success' };
}