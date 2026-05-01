import React, { useMemo } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { Drink } from '../drinks/DrinkForm';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { useAnalytics } from '../analytics/analytics';
import { useDB } from '../../store/db';
import { FEATURE_FLAGS } from '../../config/features';

/* [REFACTOR-LONG-FN] One-tile renderer extracted from the metrics
 * grid. Pure presentation; the parent computes the trend icon and
 * passes it down so this component never needs to know the icon set. */
function MetricCard({
  metric, trendIcon,
}: { metric: WellnessMetric; trendIcon: string }) {
  return (
    <div className="bg-surface-elevated rounded-lg border border-border-soft p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{metric.icon}</span>
          <h3 className="font-semibold text-sm">{metric.name}</h3>
        </div>
        <span className="text-lg">{trendIcon}</span>
      </div>
      <div className="mb-2">
        <div className="flex items-end gap-1">
          <span className="text-2xl font-bold text-ink">{metric.value}</span>
          {metric.unit && (
            <span className="text-sm text-ink-subtle mb-1">{metric.unit}</span>
          )}
        </div>
      </div>
      <p className="text-xs text-ink-soft">{metric.description}</p>
    </div>
  );
}

/* [POLISH-WELLNESS-LABELS] WellnessMetric had a `status` field with
 * categorical buckets (excellent/good/fair/poor). Showing a "POOR"
 * badge over someone's alcohol-free days is exactly the kind of
 * vibes-judgement the voice guidelines call out — hollow praise on
 * one end, soft scolding on the other. The metric value, the trend
 * arrow, and the description already convey the meaning honestly.
 * The badge added a confidence the data does not earn. */
interface WellnessMetric {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
  icon: string;
}

interface HealthInsight {
  type: 'sleep' | 'nutrition' | 'exercise' | 'stress' | 'social' | 'liver' | 'mental';
  title: string;
  insight: string;
  recommendation: string;
  confidence: number; // 0-100
  priority: 'high' | 'medium' | 'low';
}

interface Props {
  drinks?: Drink[];
  className?: string;
}

export default function PremiumWellnessDashboard({ drinks = [], className = '' }: Props) {
  const { isPremium, canAccessAIInsights } = usePremiumFeatures();
  const { trackFeatureUsage } = useAnalytics();
  const { db } = useDB();
  
  // Get health metrics from store if health integration is enabled
  const healthMetrics = FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION ? (db.healthMetrics || []) : [];

  const wellnessMetrics = useMemo((): WellnessMetric[] => {
    const last30Days = drinks.filter(d => d.ts > Date.now() - 30 * 24 * 60 * 60 * 1000);


    // Calculate alcohol-free days
    const afDays = Math.max(0, 30 - new Set(last30Days.map(d => 
      new Date(d.ts).toDateString()
    )).size);
    
    // Calculate average craving level
    const avgCraving = last30Days.length > 0 
      ? last30Days.reduce((sum, d) => sum + d.craving, 0) / last30Days.length 
      : 0;
    
    // Calculate sleep quality proxy (based on evening drinking patterns)
    const eveningDrinks = last30Days.filter(d => {
      const hour = new Date(d.ts).getHours();
      return hour >= 18 && hour <= 22;
    });
    const sleepScore = Math.max(0, 100 - (eveningDrinks.length * 3));
    
    // Calculate stress level (based on HALT patterns)
    const stressIndicators = last30Days.filter(d => 
      d.halt?.includes('angry') || d.halt?.includes('lonely') || d.halt?.includes('tired')
    );
    const stressLevel = Math.min(100, (stressIndicators.length / last30Days.length) * 100);
    
    // Calculate social wellness (based on social drinking vs alternatives)
    const socialDrinks = last30Days.filter(d => d.intention === 'social');
    const socialAlternatives = socialDrinks.filter(d => d.alt && d.alt.trim());
    const socialWellness = socialDrinks.length > 0 
      ? (socialAlternatives.length / socialDrinks.length) * 100 
      : 85;
    
    // [LEGAL-1] Removed liver-health-estimate scoring. We are not a
    // medical device; estimating organ health from drink-tracking
    // patterns is a regulated claim. The corresponding metric tile
    // below is also removed.

    // Get recent health metrics if available
    const last7DaysDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const todayDate = new Date().toISOString().split('T')[0];
    const recentHealthMetrics = healthMetrics.filter(m => m.date >= last7DaysDate && m.date <= todayDate);
    
    // Calculate average health metrics
    const avgSteps = recentHealthMetrics.length > 0
      ? Math.round(recentHealthMetrics.reduce((sum, m) => sum + (m.steps || 0), 0) / recentHealthMetrics.filter(m => m.steps).length)
      : 0;
    const avgSleep = recentHealthMetrics.length > 0
      ? (recentHealthMetrics.reduce((sum, m) => sum + (m.sleepHours || 0), 0) / recentHealthMetrics.filter(m => m.sleepHours).length).toFixed(1)
      : 0;
    const avgHeartRate = recentHealthMetrics.length > 0
      ? Math.round(recentHealthMetrics.reduce((sum, m) => sum + (m.heartRate || 0), 0) / recentHealthMetrics.filter(m => m.heartRate).length)
      : 0;

    const baseMetrics = [
      {
        id: 'alcohol-free-days',
        name: 'Alcohol-free days',
        value: afDays,
        unit: 'days/month',
        trend: afDays >= 20 ? 'up' : afDays >= 15 ? 'stable' : 'down',
        description: 'Days this month with no logged drinks.',
        icon: '🌟'
      },
      {
        id: 'craving-control',
        name: 'Average craving',
        value: Math.round((5 - avgCraving) * 20),
        unit: '%',
        trend: avgCraving <= 2 ? 'up' : avgCraving <= 3 ? 'stable' : 'down',
        description: 'Higher means lower average craving on logged days.',
        icon: '🛡️'
      },
      {
        id: 'sleep-quality',
        name: 'Evening drinking',
        value: Math.round(sleepScore),
        unit: '/100',
        trend: sleepScore >= 80 ? 'up' : sleepScore >= 60 ? 'stable' : 'down',
        description: 'Higher means fewer drinks logged after 6pm. Late drinks correlate with worse sleep.',
        icon: '😴'
      },
      {
        id: 'stress-management',
        name: 'HALT-tagged drinks',
        value: Math.round(Math.max(0, 100 - stressLevel)),
        unit: '/100',
        trend: stressLevel <= 30 ? 'up' : stressLevel <= 50 ? 'stable' : 'down',
        description: 'Higher means fewer drinks tied to angry / lonely / tired.',
        icon: '🧘'
      },
      {
        id: 'social-wellness',
        name: 'Social with alternatives',
        value: Math.round(socialWellness),
        unit: '%',
        trend: socialWellness >= 70 ? 'up' : socialWellness >= 50 ? 'stable' : 'down',
        description: 'Share of social drinks where you also noted an alternative action.',
        icon: '🤝'
      },
      // [LEGAL-1] Liver-health-estimate metric removed.
    ];
    
    // Add health integration metrics if available
    const healthIntegrationMetrics: WellnessMetric[] = [];
    if (FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION && recentHealthMetrics.length > 0) {
      if (avgSteps > 0) {
        healthIntegrationMetrics.push({
          id: 'daily-steps',
          name: 'Daily steps',
          value: avgSteps.toLocaleString(),
          unit: 'avg/day',
          trend: avgSteps >= 8000 ? 'up' : avgSteps >= 5000 ? 'stable' : 'down',
          description: 'From your health app — last 7 days.',
          icon: '👟'
        });
      }
      if (typeof avgSleep === 'number' && avgSleep > 0) {
        const sleepNum = parseFloat(avgSleep.toString());
        healthIntegrationMetrics.push({
          id: 'sleep-hours',
          name: 'Sleep duration',
          value: avgSleep,
          unit: 'hrs/night',
          trend: sleepNum >= 7.5 ? 'up' : sleepNum >= 6.5 ? 'stable' : 'down',
          description: 'From your health app — last 7 days.',
          icon: '🛌'
        });
      }
      if (avgHeartRate > 0) {
        healthIntegrationMetrics.push({
          id: 'heart-rate',
          name: 'Resting heart rate',
          value: avgHeartRate,
          unit: 'bpm',
          trend: avgHeartRate <= 70 ? 'up' : avgHeartRate <= 80 ? 'stable' : 'down',
          description: 'From your health app — last 7 days.',
          icon: '💓'
        });
      }
    }
    
    return [...baseMetrics, ...healthIntegrationMetrics] as WellnessMetric[];
  }, [drinks, healthMetrics]);

  const healthInsights = useMemo((): HealthInsight[] => {
    if (!canAccessAIInsights) return [];

    const insights: HealthInsight[] = [];
    const recent = drinks.filter(d => d.ts > Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    // Sleep insight
    const eveningDrinks = recent.filter(d => {
      const hour = new Date(d.ts).getHours();
      return hour >= 20;
    });
    
    if (eveningDrinks.length > 3) {
      insights.push({
        type: 'sleep',
        title: 'Drinks after 8pm',
        insight: `${eveningDrinks.length} drinks logged after 8pm in the last two weeks. Late drinking tends to fragment sleep, even when you fall asleep faster.`,
        recommendation: 'Even a 3-hour gap between the last drink and bedtime makes a noticeable difference.',
        confidence: 85,
        priority: 'high'
      });
    }

    // Stress insight
    const stressfulDays = recent.filter(d =>
      d.halt?.includes('angry') || d.halt?.includes('lonely') || d.craving >= 4
    );

    if (stressfulDays.length > 0) {
      insights.push({
        type: 'stress',
        title: 'Drinks tied to hard moments',
        insight: `${stressfulDays.length} drinks in the last two weeks lined up with anger, loneliness, or a high-craving moment.`,
        recommendation: 'When the urge ties to a feeling, the feeling tends to pass faster than the urge. Buying ten minutes (a walk, a call, water first) usually helps.',
        confidence: 90,
        priority: 'high'
      });
    }

    // Social insight
    const socialDrinks = recent.filter(d => d.intention === 'social');
    const socialWithAlternatives = socialDrinks.filter(d => d.alt && d.alt.trim());

    if (socialDrinks.length > 0) {
      const successRate = (socialWithAlternatives.length / socialDrinks.length) * 100;
      insights.push({
        type: 'social',
        title: 'Social drinks, alternatives noted',
        insight: `${Math.round(successRate)}% of social drinks had an alternative action noted alongside.`,
        recommendation: successRate < 50
          ? 'Picking one go-to non-alcoholic order before the event is the simplest move.'
          : 'You\'ve got the rhythm of this. The patterns from these entries are good ground to stand on.',
        confidence: 80,
        priority: successRate < 50 ? 'medium' : 'low'
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }).slice(0, 3);
  }, [drinks, canAccessAIInsights]);

  const getTrendIcon = (trend: WellnessMetric['trend']) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '➡️';
    }
  };

  if (!isPremium) {
    return (
      <div className={`bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg p-6 text-center ${className}`}>
        <h2 className="text-xl font-bold mb-2">More patterns, longer view</h2>
        <p className="mb-4 opacity-90">
          A longer view of your trends — sleep timing, stress triggers,
          and how social situations show up. Not medical advice.
        </p>
        {/* [LEGAL-1] "Liver health estimation" was a medical claim
            (organ-health prediction from drink-tracking data) sitting
            directly above a "no medical advice" disclaimer. Replaced
            with honest non-clinical framing. Stress / sleep bullets
            also softened from clinical "analysis" to "patterns". */}
        <ul className="text-sm opacity-90 mb-6 text-left max-w-md mx-auto space-y-1">
          <li>• Trends across months, not just the last week</li>
          <li>• Sleep patterns inferred from your evening logs</li>
          <li>• Which HALT states show up most often</li>
          <li>• Day-by-day comparison views</li>
          <li>• Social situations: when they go well, when they don&rsquo;t</li>
          <li>• Optional AI reflections from anonymized summaries</li>
        </ul>
        <Button
          variant="secondary"
          className="bg-surface-elevated text-primary-600 hover:bg-cream-50"
          onClick={() => trackFeatureUsage('wellness_upgrade_prompt')}
        >
          See plans
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-ink mb-2 flex items-center gap-2">
          Patterns over time
          <Badge variant="primary" className="text-xs">Premium</Badge>
        </h2>
        <p className="text-sm text-ink-soft">
          Patterns from your last 30 days. Not medical advice.
        </p>
      </div>

      {/* Wellness Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {wellnessMetrics.map(metric => (
          <MetricCard key={metric.id} metric={metric} trendIcon={getTrendIcon(metric.trend)} />
        ))}
      </div>

      {/* Health Insights */}
      {healthInsights.length > 0 && (
        <div className="bg-surface-elevated rounded-lg border border-border-soft p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            What stands out
            <Badge variant="primary" className="text-xs">From your last 14 days</Badge>
          </h3>
          
          <div className="space-y-4">
            {healthInsights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.priority === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  insight.priority === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                  'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                        insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {insight.priority.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-ink-subtle">
                      {insight.confidence}% confidence
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-ink mb-3">
                  {insight.insight}
                </p>
                
                <div className="bg-surface-elevated p-3 rounded border border-border-soft">
                  <p className="text-sm font-medium text-ink mb-1">
                    Worth trying
                  </p>
                  <p className="text-sm text-ink">
                    {insight.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() => trackFeatureUsage('wellness_export_report')}
        >
          Export report
        </Button>
        <Button
          variant="outline"
          onClick={() => trackFeatureUsage('wellness_share_with_doctor')}
        >
          Share with a doctor
        </Button>
        <Button
          variant="primary"
          onClick={() => trackFeatureUsage('wellness_set_goals')}
        >
          Set goals
        </Button>
      </div>
    </div>
  );
}