import { useMemo } from 'react';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../../types/common';

export interface PersonalizationData {
  preferredDrinkTypes: string[];
  riskTimes: string[];
  motivationalTrend: 'improving' | 'stable' | 'concerning';
  personalityType: 'goal-oriented' | 'social' | 'health-focused' | 'casual';
  engagementLevel: 'high' | 'medium' | 'low';
}

const DAY_MS = 24 * 60 * 60 * 1000;

function classifyDrinkTypes(drinks: Drink[]): string[] {
  const counts = drinks.reduce<Record<string, number>>((acc, drink) => {
    if (drink.volumeMl > 300) acc.beer = (acc.beer || 0) + 1;
    else if (drink.abvPct > 15) acc.spirits = (acc.spirits || 0) + 1;
    else acc.wine = (acc.wine || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([type]) => type);
}

function classifyRiskTimes(drinks: Drink[]): string[] {
  const counts = drinks.reduce(
    (acc, drink) => {
      const hour = new Date(drink.ts).getHours();
      if (hour >= 17 && hour <= 22) acc.evening++;
      else if (hour >= 12 && hour <= 16) acc.afternoon++;
      else if (hour >= 22 || hour <= 2) acc.night++;
      else acc.other++;
      return acc;
    },
    { evening: 0, afternoon: 0, night: 0, other: 0 },
  );
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([time]) => time);
}

function avgCraving(drinks: Drink[]): number {
  if (drinks.length === 0) return 0;
  return drinks.reduce((sum, d) => sum + d.craving, 0) / drinks.length;
}

function classifyTrend(drinks: Drink[]): PersonalizationData['motivationalTrend'] {
  const recent = avgCraving(drinks.slice(0, 7));
  const previous = avgCraving(drinks.slice(7, 14));
  if (recent < previous) return 'improving';
  if (recent === previous) return 'stable';
  return 'concerning';
}

function classifyPersonality(
  last30Days: Drink[],
  goals: Goals | undefined,
): PersonalizationData['personalityType'] {
  if (last30Days.some((d) => d.halt?.includes('angry') || d.halt?.includes('lonely'))) {
    return 'health-focused';
  }
  if (last30Days.some((d) => d.intention === 'social')) return 'social';
  if (goals && (goals.dailyCap > 0 || goals.weeklyGoal > 0)) return 'goal-oriented';
  return 'casual';
}

function classifyEngagement(drinks: Drink[]): PersonalizationData['engagementLevel'] {
  const recentEntries = drinks.filter((d) => d.ts > Date.now() - 7 * DAY_MS).length;
  if (recentEntries > 5) return 'high';
  if (recentEntries > 2) return 'medium';
  return 'low';
}

export function usePersonalization(drinks: Drink[], goals: Goals | undefined): PersonalizationData {
  return useMemo(() => {
    const last30Days = drinks.filter((d) => d.ts > Date.now() - 30 * DAY_MS);
    return {
      preferredDrinkTypes: classifyDrinkTypes(last30Days),
      riskTimes: classifyRiskTimes(last30Days),
      motivationalTrend: classifyTrend(drinks),
      personalityType: classifyPersonality(last30Days, goals),
      engagementLevel: classifyEngagement(drinks),
    };
  }, [drinks, goals]);
}

interface PersonalizedContent {
  greeting: string;
  primaryAction: string;
  secondaryActions: string[];
  motivationalMessage: string;
  focusArea: string;
}

const CONTENT_BY_PERSONALITY: Record<PersonalizationData['personalityType'], PersonalizedContent> = {
  'goal-oriented': {
    greeting: 'How are you today?',
    primaryAction: 'Check goal progress',
    secondaryActions: ['Set a new goal', 'View trends'],
    motivationalMessage: 'Consistency over intensity.',
    focusArea: 'Progress',
  },
  social: {
    greeting: 'How are you today?',
    primaryAction: 'Social alternatives',
    secondaryActions: ['Plan an AF event', 'Set a social goal'],
    motivationalMessage: "Connection doesn't need alcohol.",
    focusArea: 'Social',
  },
  'health-focused': {
    greeting: 'How are you today?',
    primaryAction: 'Mood check-in',
    secondaryActions: ['HALT patterns', 'See trends'],
    motivationalMessage: 'Take care of yourself today.',
    focusArea: 'How you feel',
  },
  casual: {
    greeting: 'How are you today?',
    primaryAction: 'Quick log',
    secondaryActions: ['Look around', 'Set a goal'],
    motivationalMessage: 'One day at a time.',
    focusArea: 'Today',
  },
};

export function getPersonalizedContent(p: PersonalizationData): PersonalizedContent {
  return CONTENT_BY_PERSONALITY[p.personalityType];
}
