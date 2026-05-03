import React, { useMemo } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { Drink } from '../drinks/DrinkForm';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { useAnalytics } from '../analytics/analytics';
import { useDB } from '../../store/db';
import { FEATURE_FLAGS } from '../../config/features';
import {
  computeMetrics,
  computeInsights,
  trendIcon,
  type WellnessMetric,
  type HealthInsight,
} from './wellnessMetrics';

function MetricCard({ metric, trend }: { metric: WellnessMetric; trend: string }) {
  return (
    <div className="bg-surface-elevated rounded-lg border border-border-soft p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{metric.icon}</span>
          <h3 className="font-semibold text-sm">{metric.name}</h3>
        </div>
        <span className="text-lg">{trend}</span>
      </div>
      <div className="mb-2">
        <div className="flex items-end gap-1">
          <span className="text-2xl font-bold text-ink">{metric.value}</span>
          {metric.unit && <span className="text-sm text-ink-subtle mb-1">{metric.unit}</span>}
        </div>
      </div>
      <p className="text-xs text-ink-soft">{metric.description}</p>
    </div>
  );
}

function InsightCard({ insight }: { insight: HealthInsight }) {
  return (
    <div className="p-4 rounded-lg border-s-4 border-sage-500 bg-sage-50 dark:bg-sage-900/20">
      <h4 className="font-semibold text-sm text-ink mb-2">{insight.title}</h4>
      <p className="text-sm text-ink mb-3">{insight.insight}</p>
      <div className="bg-surface-elevated p-3 rounded border border-border-soft">
        <p className="text-sm font-medium text-ink mb-1">Worth trying</p>
        <p className="text-sm text-ink">{insight.recommendation}</p>
      </div>
    </div>
  );
}

function UpgradePrompt({ className, onTrack }: { className: string; onTrack: () => void }) {
  return (
    <div className={`bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg p-6 text-center ${className}`}>
      <h2 className="text-xl font-bold mb-2">More patterns, longer view</h2>
      <p className="mb-4 opacity-90">
        A longer view of your trends — sleep timing, stress triggers,
        and how social situations show up. Not medical advice.
      </p>
      <ul className="text-sm opacity-90 mb-6 text-start max-w-md mx-auto space-y-1">
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
        onClick={onTrack}
      >
        See plans
      </Button>
    </div>
  );
}

function MetricsHeader() {
  return (
    <div className="mb-6">
      <span className="inline-block text-[11px] font-medium uppercase tracking-wide text-ink-soft mb-1">Premium</span>
      <h2 className="text-xl font-bold text-ink mb-2">Patterns over time</h2>
      <p className="text-sm text-ink-soft">Patterns from your last 30 days. Not medical advice.</p>
    </div>
  );
}

function InsightsSection({ insights }: { insights: HealthInsight[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="bg-surface-elevated rounded-lg border border-border-soft p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        What stands out
        <Badge variant="primary" className="text-xs">From your last 14 days</Badge>
      </h3>
      <div className="space-y-4">
        {insights.map((insight, index) => (<InsightCard key={index} insight={insight} />))}
      </div>
      {/* [R17-6] Clinician-judge clarifier. The "Worth trying"
          recommendations include coping-skill suggestions (urge
          surfing, alternative-action substitution) that have a
          clinical literature behind them. Naming that these are
          general-purpose, not clinical, prevents a reader from
          interpreting the surface as personalized care. */}
      <p className="mt-4 text-xs text-ink-subtle" data-testid="wellness-insights-disclaimer">
        General suggestions, not personalized clinical guidance. For anything
        intervention-shaped, work with a clinician.
      </p>
    </div>
  );
}

function ActionButtonRow({ track }: { track: (k: string) => void }) {
  return (
    <div className="mt-6 flex gap-3 justify-center">
      <Button variant="outline" onClick={() => track('wellness_export_report')}>Export report</Button>
      <Button variant="outline" onClick={() => track('wellness_share_with_doctor')}>Share with a doctor</Button>
      <Button variant="primary" onClick={() => track('wellness_set_goals')}>Set goals</Button>
    </div>
  );
}

interface Props { drinks?: Drink[]; className?: string }

export default function PremiumWellnessDashboard({ drinks = [], className = '' }: Props) {
  const { isPremium, canAccessAIInsights } = usePremiumFeatures();
  const { trackFeatureUsage } = useAnalytics();
  const { db } = useDB();
  const healthMetrics = useMemo(
    () => (FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION ? (db.healthMetrics || []) : []),
    [db.healthMetrics],
  );
  const wellnessMetrics = useMemo(
    () => computeMetrics(drinks, healthMetrics, FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION),
    [drinks, healthMetrics],
  );
  const healthInsights = useMemo(
    () => (canAccessAIInsights ? computeInsights(drinks) : []),
    [drinks, canAccessAIInsights],
  );

  if (!isPremium) {
    return <UpgradePrompt className={className} onTrack={() => trackFeatureUsage('wellness_upgrade_prompt')} />;
  }

  return (
    <div className={className}>
      <MetricsHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {wellnessMetrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} trend={trendIcon(metric.trend)} />
        ))}
      </div>
      <InsightsSection insights={healthInsights} />
      <ActionButtonRow track={trackFeatureUsage} />
    </div>
  );
}
