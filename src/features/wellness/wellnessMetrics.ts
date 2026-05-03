/**
 * wellnessMetrics — pure calculations extracted from
 * PremiumWellnessDashboard as part of the [R17-A] long-function lint
 * sweep. No React. The dashboard component imports computeMetrics +
 * computeInsights and renders the resulting arrays.
 *
 * No behavior change: tile values, trend thresholds, and the HALT
 * filter that intentionally excludes 'hungry' all match the
 * pre-refactor inline implementation.
 */

import type { Drink } from '../drinks/DrinkForm';
import type { HealthMetric } from '../../store/db';

export interface WellnessMetric {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
  icon: string;
}

export interface HealthInsight {
  type: 'sleep' | 'nutrition' | 'exercise' | 'stress' | 'social' | 'liver' | 'mental';
  title: string;
  insight: string;
  recommendation: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

const DAY_MS = 24 * 60 * 60 * 1000;

function aggregateRecentHealth(metrics: HealthMetric[]) {
  const last7DaysDate = new Date(Date.now() - 7 * DAY_MS).toISOString().split('T')[0] ?? '';
  const todayDate = new Date().toISOString().split('T')[0] ?? '';
  const recent = metrics.filter((m) => m.date >= last7DaysDate && m.date <= todayDate);
  if (recent.length === 0) return { recent, avgSteps: 0, avgSleep: 0, avgHeartRate: 0 };
  const avgSteps = Math.round(
    recent.reduce((sum, m) => sum + (m.steps || 0), 0) / Math.max(1, recent.filter((m) => m.steps).length),
  );
  const avgSleep = parseFloat(
    (recent.reduce((sum, m) => sum + (m.sleepHours || 0), 0) /
      Math.max(1, recent.filter((m) => m.sleepHours).length)).toFixed(1),
  );
  const avgHeartRate = Math.round(
    recent.reduce((sum, m) => sum + (m.heartRate || 0), 0) / Math.max(1, recent.filter((m) => m.heartRate).length),
  );
  return { recent, avgSteps, avgSleep, avgHeartRate };
}

function buildBaseMetrics(drinks: Drink[]): WellnessMetric[] {
  const last30Days = drinks.filter((d) => d.ts > Date.now() - 30 * DAY_MS);
  const afDays = Math.max(0, 30 - new Set(last30Days.map((d) => new Date(d.ts).toDateString())).size);
  const avgCraving = last30Days.length > 0
    ? last30Days.reduce((sum, d) => sum + d.craving, 0) / last30Days.length : 0;
  const eveningCount = last30Days.filter((d) => {
    const hour = new Date(d.ts).getHours();
    return hour >= 18 && hour <= 22;
  }).length;
  const haltTaggedCount = last30Days.filter(
    (d) => d.halt?.includes('angry') || d.halt?.includes('lonely') || d.halt?.includes('tired'),
  ).length;
  const socialDrinks = last30Days.filter((d) => d.intention === 'social');
  const socialAlts = socialDrinks.filter((d) => d.alt && d.alt.trim());
  const socialWellness = socialDrinks.length > 0
    ? (socialAlts.length / socialDrinks.length) * 100 : 85;
  return [
    { id: 'alcohol-free-days', name: 'Alcohol-free days', value: afDays, unit: 'days/month',
      trend: afDays >= 20 ? 'up' : afDays >= 15 ? 'stable' : 'down',
      description: 'Days this month with no logged drinks.', icon: '🌟' },
    { id: 'avg-craving', name: 'Average craving',
      value: last30Days.length === 0 ? '—' : avgCraving.toFixed(1),
      unit: last30Days.length === 0 ? 'no drinks logged' : '/ 5',
      trend: last30Days.length === 0 ? 'stable' : avgCraving <= 2 ? 'up' : avgCraving <= 3 ? 'stable' : 'down',
      description: 'Average rating you logged on drinks this month. 1 is low, 5 is strong.', icon: '🛡️' },
    { id: 'evening-drinks', name: 'Drinks after 6pm', value: eveningCount, unit: 'in 30 days',
      trend: eveningCount <= 4 ? 'up' : eveningCount <= 10 ? 'stable' : 'down',
      description: 'Late-evening drinks often lead to lighter sleep.', icon: '😴' },
    { id: 'halt-tagged', name: 'HALT-tagged drinks', value: haltTaggedCount, unit: 'in 30 days',
      trend: haltTaggedCount <= 3 ? 'up' : haltTaggedCount <= 7 ? 'stable' : 'down',
      description: 'Drinks you tagged as angry, lonely, or tired.', icon: '🧘' },
    { id: 'social-with-alts', name: 'Social drinks with an alternative noted',
      value: socialDrinks.length === 0 ? '—' : `${Math.round(socialWellness)}%`,
      unit: socialDrinks.length === 0 ? 'no social drinks logged' : `of ${socialDrinks.length}`,
      trend: socialWellness >= 70 ? 'up' : socialWellness >= 50 ? 'stable' : 'down',
      description: 'Share of social drinks where you also wrote what else helped.', icon: '🤝' },
  ];
}

function buildHealthIntegrationMetrics(
  agg: ReturnType<typeof aggregateRecentHealth>, healthEnabled: boolean,
): WellnessMetric[] {
  if (!healthEnabled || agg.recent.length === 0) return [];
  const out: WellnessMetric[] = [];
  if (agg.avgSteps > 0) out.push({
    id: 'daily-steps', name: 'Daily steps', value: agg.avgSteps.toLocaleString(), unit: 'avg/day',
    trend: agg.avgSteps >= 8000 ? 'up' : agg.avgSteps >= 5000 ? 'stable' : 'down',
    description: 'From your health app — last 7 days.', icon: '👟',
  });
  if (agg.avgSleep > 0) out.push({
    id: 'sleep-hours', name: 'Sleep duration', value: agg.avgSleep, unit: 'hrs/night',
    trend: agg.avgSleep >= 7.5 ? 'up' : agg.avgSleep >= 6.5 ? 'stable' : 'down',
    description: 'From your health app — last 7 days.', icon: '🛌',
  });
  if (agg.avgHeartRate > 0) out.push({
    id: 'heart-rate', name: 'Resting heart rate', value: agg.avgHeartRate, unit: 'bpm',
    trend: agg.avgHeartRate <= 70 ? 'up' : agg.avgHeartRate <= 80 ? 'stable' : 'down',
    description: 'From your health app — last 7 days.', icon: '💓',
  });
  return out;
}

export function computeMetrics(
  drinks: Drink[], healthMetrics: HealthMetric[], healthEnabled: boolean,
): WellnessMetric[] {
  const agg = aggregateRecentHealth(healthMetrics);
  return [...buildBaseMetrics(drinks), ...buildHealthIntegrationMetrics(agg, healthEnabled)];
}

export function computeInsights(drinks: Drink[]): HealthInsight[] {
  const insights: HealthInsight[] = [];
  const recent = drinks.filter((d) => d.ts > Date.now() - 14 * DAY_MS);
  const eveningDrinks = recent.filter((d) => new Date(d.ts).getHours() >= 20);
  if (eveningDrinks.length > 3) insights.push({
    type: 'sleep', title: 'Drinks after 8pm',
    insight: `${eveningDrinks.length} drinks logged after 8pm in the last two weeks. Late drinking tends to fragment sleep, even when you fall asleep faster.`,
    recommendation: 'Even a 3-hour gap between the last drink and bedtime makes a noticeable difference.',
    confidence: 85, priority: 'high',
  });
  const stressfulDays = recent.filter(
    (d) => d.halt?.includes('angry') || d.halt?.includes('lonely') || d.craving >= 4,
  );
  if (stressfulDays.length > 0) insights.push({
    type: 'stress', title: 'Drinks tied to hard moments',
    insight: `${stressfulDays.length} drinks in the last two weeks lined up with anger, loneliness, or a high-craving moment.`,
    recommendation: 'When the urge ties to a feeling, the feeling often passes faster than the urge. Wait ten minutes first — go for a walk, call someone, drink water — and see how it shifts.',
    confidence: 90, priority: 'high',
  });
  const socialDrinks = recent.filter((d) => d.intention === 'social');
  const socialWithAlts = socialDrinks.filter((d) => d.alt && d.alt.trim());
  if (socialDrinks.length > 0) {
    const successRate = (socialWithAlts.length / socialDrinks.length) * 100;
    insights.push({
      type: 'social', title: 'Social drinks, alternatives noted',
      insight: `${Math.round(successRate)}% of social drinks had an alternative action noted alongside.`,
      recommendation: successRate < 50
        ? 'Picking one go-to non-alcoholic order before the event is the simplest move.'
        : "You've got the rhythm of this. The patterns from these entries are good ground to stand on.",
      confidence: 80, priority: successRate < 50 ? 'medium' : 'low',
    });
  }
  return insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  }).slice(0, 3);
}

export function trendIcon(trend: WellnessMetric['trend']): string {
  if (trend === 'up') return '↗️';
  if (trend === 'down') return '↘️';
  return '➡️';
}
