/**
 * AI-Powered Goal Recommendations
 * 
 * Provides personalized goal suggestions based on user behavior and wellness metrics.
 * Uses heuristics and pattern analysis rather than external AI services to maintain privacy.
 */

import type { Entry, Settings, HealthMetric } from '../store/db';
import { FEATURE_FLAGS } from '../config/features';
import { computeStats } from './stats';

export interface GoalRecommendation {
  id: string;
  type: 'drink-free-days' | 'weekly-limit' | 'monthly-budget' | 'craving-management';
  title: string;
  description: string;
  rationale: string;
  suggestedValue: number;
  currentValue: number;
  confidence: number; // 0-1
  difficulty: 'easy' | 'moderate' | 'challenging';
  estimatedSuccessRate: number; // 0-100
}

/**
 * Calculate readiness score based on recent behavior
 */
function calculateReadinessScore(entries: Entry[], healthMetrics: HealthMetric[] = []): number {
  if (entries.length === 0) return 0.5;

  const last7Days = entries.filter(e => e.ts > Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = entries.filter(e => e.ts > Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Calculate alcohol-free days
  const uniqueDays7 = new Set(last7Days.map(e => new Date(e.ts).toDateString())).size;
  const alcoholFreeDays7 = 7 - uniqueDays7;

  const uniqueDays30 = new Set(last30Days.map(e => new Date(e.ts).toDateString())).size;
  const alcoholFreeDays30 = 30 - uniqueDays30;

  // Calculate average craving
  const avgCraving = last7Days.length > 0
    ? last7Days.reduce((sum, e) => sum + e.craving, 0) / last7Days.length
    : 5;

  // Calculate streak stability
  const recentConsistency = alcoholFreeDays7 / 7;
  const overallConsistency = alcoholFreeDays30 / 30;

  // Calculate readiness (0-1 scale)
  let readiness = 0;
  readiness += recentConsistency * 0.3; // Recent behavior (30%)
  readiness += overallConsistency * 0.3; // Overall trend (30%)
  readiness += (1 - avgCraving / 10) * 0.2; // Craving control (20%)
  
  // Health metrics bonus (if available)
  if (healthMetrics.length > 0) {
    const avgSleep = healthMetrics.reduce((sum, m) => sum + (m.sleepHours || 0), 0) / healthMetrics.length;
    const sleepScore = Math.min(avgSleep / 8, 1); // 8 hours is optimal
    readiness += sleepScore * 0.2; // Health indicators (20%)
  } else {
    readiness += 0.1; // Baseline if no health data
  }

  return Math.max(0, Math.min(1, readiness));
}

/**
 * Generate drink-free days recommendation
 */
function recommendDrinkFreeDays(entries: Entry[], currentGoal: number, readiness: number): GoalRecommendation | null {
  const last30Days = entries.filter(e => e.ts > Date.now() - 30 * 24 * 60 * 60 * 1000);
  const uniqueDays = new Set(last30Days.map(e => new Date(e.ts).toDateString())).size;
  const alcoholFreeDays = 30 - uniqueDays;

  // Calculate weekly average
  const weeklyFreeDays = Math.round((alcoholFreeDays / 30) * 7);

  let suggestedValue = weeklyFreeDays + 1;
  let difficulty: 'easy' | 'moderate' | 'challenging' = 'moderate';
  let confidence = readiness;

  if (readiness > 0.7) {
    // User is doing well, suggest a more ambitious goal
    suggestedValue = Math.min(weeklyFreeDays + 2, 7);
    difficulty = 'challenging';
    confidence = 0.8;
  } else if (readiness < 0.4) {
    // User is struggling, suggest a more achievable goal
    suggestedValue = Math.max(weeklyFreeDays, 1);
    difficulty = 'easy';
    confidence = 0.6;
  }

  if (suggestedValue <= currentGoal && currentGoal > 0) {
    return null; // Don't recommend lower than current goal
  }

  return {
    id: 'drink-free-days-' + Date.now(),
    type: 'drink-free-days',
    title: `${suggestedValue} Alcohol-Free Days Per Week`,
    description: `Aim for ${suggestedValue} drink-free days each week`,
    rationale: readiness > 0.7
      ? `You've been doing great! You averaged ${weeklyFreeDays} drink-free days recently. You're ready for the next challenge.`
      : `Based on your recent progress (${weeklyFreeDays} drink-free days/week), this goal is within reach and will help build momentum.`,
    suggestedValue,
    currentValue: currentGoal,
    confidence,
    difficulty,
    estimatedSuccessRate: Math.round(readiness * 100)
  };
}

/**
 * Generate weekly limit recommendation
 */
function recommendWeeklyLimit(entries: Entry[], currentGoal: number, readiness: number): GoalRecommendation | null {
  const stats = computeStats(entries, {} as Settings);
  const recentWeeks = stats.weekly.slice(-4); // Last 4 weeks
  
  if (recentWeeks.length === 0) return null;

  const avgWeekly = recentWeeks.reduce((sum, w) => sum + w.stdDrinks, 0) / recentWeeks.length;
  const maxWeekly = Math.max(...recentWeeks.map(w => w.stdDrinks));

  let suggestedValue = Math.round(avgWeekly * 0.8); // Reduce by 20%
  let difficulty: 'easy' | 'moderate' | 'challenging' = 'moderate';

  if (readiness > 0.7) {
    suggestedValue = Math.round(avgWeekly * 0.7); // Reduce by 30%
    difficulty = 'challenging';
  } else if (readiness < 0.4) {
    suggestedValue = Math.round(avgWeekly * 0.9); // Reduce by 10%
    difficulty = 'easy';
  }

  if (suggestedValue >= currentGoal && currentGoal > 0) {
    return null; // Don't recommend higher than current goal
  }

  return {
    id: 'weekly-limit-' + Date.now(),
    type: 'weekly-limit',
    title: `${suggestedValue} Standard Drinks Per Week`,
    description: `Limit your weekly consumption to ${suggestedValue} standard drinks`,
    rationale: `Your recent average is ${Math.round(avgWeekly)} drinks/week. Gradually reducing to ${suggestedValue} is a healthy next step.`,
    suggestedValue,
    currentValue: currentGoal,
    confidence: readiness,
    difficulty,
    estimatedSuccessRate: Math.round(readiness * 100)
  };
}

/**
 * Generate craving management recommendation
 */
function recommendCravingManagement(entries: Entry[]): GoalRecommendation | null {
  const last14Days = entries.filter(e => e.ts > Date.now() - 14 * 24 * 60 * 60 * 1000);
  
  if (last14Days.length === 0) return null;

  const avgCraving = last14Days.reduce((sum, e) => sum + e.craving, 0) / last14Days.length;
  const highCravingEntries = last14Days.filter(e => e.craving >= 7);

  if (avgCraving < 4) return null; // Cravings are already low

  const targetCraving = Math.max(Math.round(avgCraving - 1), 3);

  return {
    id: 'craving-management-' + Date.now(),
    type: 'craving-management',
    title: 'Reduce Average Craving Score',
    description: `Work on reducing your average craving intensity to ${targetCraving}/10`,
    rationale: `Your recent average craving score is ${avgCraving.toFixed(1)}/10. ${highCravingEntries.length > 0 
      ? `You've experienced ${highCravingEntries.length} high-craving moments. ` 
      : ''}Developing coping strategies can help manage these urges.`,
    suggestedValue: targetCraving,
    currentValue: Math.round(avgCraving),
    confidence: 0.7,
    difficulty: 'moderate',
    estimatedSuccessRate: 65
  };
}

/**
 * Generate budget recommendation
 */
function recommendBudget(entries: Entry[], currentBudget: number): GoalRecommendation | null {
  const last30Days = entries.filter(e => e.ts > Date.now() - 30 * 24 * 60 * 60 * 1000);
  const totalSpent = last30Days.reduce((sum, e) => sum + (e.cost || 0), 0);

  if (totalSpent === 0) return null; // No cost data available

  const suggestedValue = Math.round(totalSpent * 0.8); // Reduce spending by 20%

  if (suggestedValue >= currentBudget && currentBudget > 0) {
    return null; // Don't recommend higher than current budget
  }

  const savings = totalSpent - suggestedValue;

  return {
    id: 'monthly-budget-' + Date.now(),
    type: 'monthly-budget',
    title: `$${suggestedValue} Monthly Budget`,
    description: `Set a monthly alcohol budget of $${suggestedValue}`,
    rationale: `You spent $${Math.round(totalSpent)} last month. Reducing to $${suggestedValue} saves $${Math.round(savings)}/month while allowing reasonable enjoyment.`,
    suggestedValue,
    currentValue: currentBudget,
    confidence: 0.75,
    difficulty: 'moderate',
    estimatedSuccessRate: 70
  };
}

/**
 * Generate personalized goal recommendations
 */
export function generateGoalRecommendations(
  entries: Entry[],
  settings: Settings,
  healthMetrics: HealthMetric[] = []
): GoalRecommendation[] {
  if (!FEATURE_FLAGS.ENABLE_AI_RECOMMENDATIONS) {
    return [];
  }

  const readiness = calculateReadinessScore(entries, healthMetrics);
  const recommendations: GoalRecommendation[] = [];

  // Generate different types of recommendations
  const drinkFreeDays = recommendDrinkFreeDays(entries, settings.dailyGoalDrinks, readiness);
  if (drinkFreeDays) recommendations.push(drinkFreeDays);

  const weeklyLimit = recommendWeeklyLimit(entries, settings.weeklyGoalDrinks, readiness);
  if (weeklyLimit) recommendations.push(weeklyLimit);

  const cravingManagement = recommendCravingManagement(entries);
  if (cravingManagement) recommendations.push(cravingManagement);

  const budget = recommendBudget(entries, settings.monthlyBudget);
  if (budget) recommendations.push(budget);

  // Sort by confidence and return top 3
  return recommendations
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

/**
 * Evaluate if a goal was successfully achieved
 */
export interface GoalFeedback {
  goalType: string;
  targetValue: number;
  actualValue: number;
  achieved: boolean;
  difficulty: 'too-easy' | 'just-right' | 'too-hard';
}

export function evaluateGoalSuccess(
  goalType: string,
  targetValue: number,
  entries: Entry[],
  timeframeDays: number = 7
): GoalFeedback {
  const recentEntries = entries.filter(e => e.ts > Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
  
  let actualValue = 0;
  let achieved = false;

  switch (goalType) {
    case 'drink-free-days': {
      const uniqueDays = new Set(recentEntries.map(e => new Date(e.ts).toDateString())).size;
      actualValue = timeframeDays - uniqueDays;
      achieved = actualValue >= targetValue;
      break;
    }
    case 'weekly-limit': {
      actualValue = recentEntries.reduce((sum, e) => sum + e.stdDrinks, 0);
      achieved = actualValue <= targetValue;
      break;
    }
    case 'craving-management': {
      actualValue = recentEntries.length > 0
        ? Math.round(recentEntries.reduce((sum, e) => sum + e.craving, 0) / recentEntries.length)
        : 10;
      achieved = actualValue <= targetValue;
      break;
    }
  }

  // Determine difficulty
  let difficulty: 'too-easy' | 'just-right' | 'too-hard';
  if (achieved) {
    const margin = goalType === 'weekly-limit' 
      ? (targetValue - actualValue) / targetValue
      : (actualValue - targetValue) / targetValue;
    difficulty = margin > 0.3 ? 'too-easy' : 'just-right';
  } else {
    difficulty = 'too-hard';
  }

  return {
    goalType,
    targetValue,
    actualValue,
    achieved,
    difficulty
  };
}
