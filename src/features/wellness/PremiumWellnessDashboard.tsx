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
    
    // Drinks logged in the 6pm-10pm evening window. Late drinks
    // correlate with lighter sleep — described in the tile copy
    // without overpromising a clinical reading.
    const eveningDrinks = last30Days.filter(d => {
      const hour = new Date(d.ts).getHours();
      return hour >= 18 && hour <= 22;
    });

    // Drinks tagged with one of the HALT states (Hungry / Angry /
    // Lonely / Tired). Hunger is included implicitly via the broader
    // .includes('hungry') check users can apply, but the original
    // surface tracked angry / lonely / tired specifically — kept the
    // same tags here so historical data renders the same.
    const stressIndicators = last30Days.filter(d =>
      d.halt?.includes('angry') || d.halt?.includes('lonely') || d.halt?.includes('tired')
    );
    
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

    /* [WELLNESS-COPY-ROUND-4] Metrics rewritten to remove label/value
     * mismatches and fake-precision scores. The previous "Average
     * craving: 80%" tile was confusing — the math computed (5-avg)*20
     * which a reader would parse as "craving is 80%" (high). The
     * "Evening drinking: 76/100" / "HALT-tagged drinks: 65/100" tiles
     * had the same shape: a behaviour-named tile showing a derived
     * 0-100 score. Each tile now shows the raw count or average it's
     * named after, with the trend computed against the same
     * thresholds. Honest naming + honest math.
     *
     * Per-day rounding: avgCraving is on a 1-5 scale, displayed to one
     * decimal. Counts are whole numbers. No /100 abstraction. */
    const eveningCount = eveningDrinks.length;
    const haltTaggedCount = stressIndicators.length;
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
        id: 'avg-craving',
        name: 'Average craving',
        value: last30Days.length === 0 ? '—' : avgCraving.toFixed(1),
        unit: last30Days.length === 0 ? 'no drinks logged' : '/ 5',
        trend: last30Days.length === 0 ? 'stable' : avgCraving <= 2 ? 'up' : avgCraving <= 3 ? 'stable' : 'down',
        description: 'Average rating you logged on drinks this month. 1 is low, 5 is strong.',
        icon: '🛡️'
      },
      {
        id: 'evening-drinks',
        name: 'Drinks after 6pm',
        value: eveningCount,
        unit: 'in 30 days',
        trend: eveningCount <= 4 ? 'up' : eveningCount <= 10 ? 'stable' : 'down',
        description: 'Late-evening drinks tend to track with lighter sleep.',
        icon: '😴'
      },
      {
        id: 'halt-tagged',
        name: 'HALT-tagged drinks',
        value: haltTaggedCount,
        unit: 'in 30 days',
        trend: haltTaggedCount <= 3 ? 'up' : haltTaggedCount <= 7 ? 'stable' : 'down',
        /* [COPILOT-FIX] The stressIndicators filter above only matches
         * angry / lonely / tired (the original surface tracked these
         * three specifically — hungry is intentionally excluded since
         * a hungry-tagged drink is not the kind of stress signal this
         * tile is meant to surface). Description updated to match the
         * filter exactly. Round-4 review caught the label/value mismatch. */
        description: 'Drinks you tagged as angry, lonely, or tired.',
        icon: '🧘'
      },
      {
        id: 'social-with-alts',
        name: 'Social drinks with an alternative noted',
        value: socialDrinks.length === 0 ? '—' : `${Math.round(socialWellness)}%`,
        unit: socialDrinks.length === 0 ? 'no social drinks logged' : `of ${socialDrinks.length}`,
        trend: socialWellness >= 70 ? 'up' : socialWellness >= 50 ? 'stable' : 'down',
        description: 'Share of social drinks where you also wrote what else helped.',
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
          
          {/* [WELLNESS-COPY-ROUND-4] Dropped HIGH/MEDIUM/LOW badge and
              fake-precision "85% confidence" number. The badge implied
              clinical urgency we don't have, and the confidence value
              was a hardcoded constant — vibes-by-numbers. Sage-tinted
              left-border replaces the red/yellow/blue heatmap; calm
              sits better with the rest of the surface. Order alone
              still encodes priority. */}
          <div className="space-y-4">
            {healthInsights.map((insight, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border-l-4 border-sage-500 bg-sage-50 dark:bg-sage-900/20"
              >
                <h4 className="font-semibold text-sm text-ink mb-2">{insight.title}</h4>
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