import React, { useMemo } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { Drink } from '../drinks/DrinkForm';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { useAnalytics } from '../analytics/analytics';
import { useDB } from '../../store/db';
import { FEATURE_FLAGS } from '../../config/features';

interface WellnessMetric {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'fair' | 'poor';
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
    const last7Days = drinks.filter(d => d.ts > Date.now() - 7 * 24 * 60 * 60 * 1000);
    
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
    
    // Liver health estimate (very simplified)
    const weeklyUnits = last7Days.reduce((sum, d) => sum + (d.volumeMl * d.abvPct / 1000), 0);
    const liverScore = Math.max(0, 100 - (weeklyUnits * 5));

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
        name: 'Alcohol-Free Days',
        value: afDays,
        unit: 'days/month',
        trend: afDays >= 20 ? 'up' : afDays >= 15 ? 'stable' : 'down',
        status: afDays >= 25 ? 'excellent' : afDays >= 20 ? 'good' : afDays >= 15 ? 'fair' : 'poor',
        description: 'Days without alcohol consumption this month',
        icon: '🌟'
      },
      {
        id: 'craving-control',
        name: 'Craving Control',
        value: Math.round((5 - avgCraving) * 20),
        unit: '%',
        trend: avgCraving <= 2 ? 'up' : avgCraving <= 3 ? 'stable' : 'down',
        status: avgCraving <= 1 ? 'excellent' : avgCraving <= 2 ? 'good' : avgCraving <= 3 ? 'fair' : 'poor',
        description: 'How well you\'re managing alcohol cravings',
        icon: '🛡️'
      },
      {
        id: 'sleep-quality',
        name: 'Sleep Quality Index',
        value: Math.round(sleepScore),
        unit: '/100',
        trend: sleepScore >= 80 ? 'up' : sleepScore >= 60 ? 'stable' : 'down',
        status: sleepScore >= 85 ? 'excellent' : sleepScore >= 70 ? 'good' : sleepScore >= 50 ? 'fair' : 'poor',
        description: 'Estimated sleep quality based on drinking patterns',
        icon: '😴'
      },
      {
        id: 'stress-management',
        name: 'Stress Management',
        value: Math.round(Math.max(0, 100 - stressLevel)),
        unit: '/100',
        trend: stressLevel <= 30 ? 'up' : stressLevel <= 50 ? 'stable' : 'down',
        status: stressLevel <= 20 ? 'excellent' : stressLevel <= 40 ? 'good' : stressLevel <= 60 ? 'fair' : 'poor',
        description: 'How effectively you\'re managing stress triggers',
        icon: '🧘'
      },
      {
        id: 'social-wellness',
        name: 'Social Wellness',
        value: Math.round(socialWellness),
        unit: '%',
        trend: socialWellness >= 70 ? 'up' : socialWellness >= 50 ? 'stable' : 'down',
        status: socialWellness >= 80 ? 'excellent' : socialWellness >= 60 ? 'good' : socialWellness >= 40 ? 'fair' : 'poor',
        description: 'Success rate in social situations without alcohol',
        icon: '🤝'
      },
      {
        id: 'liver-health',
        name: 'Liver Health Est.',
        value: Math.round(liverScore),
        unit: '/100',
        trend: liverScore >= 85 ? 'up' : liverScore >= 70 ? 'stable' : 'down',
        status: liverScore >= 90 ? 'excellent' : liverScore >= 75 ? 'good' : liverScore >= 60 ? 'fair' : 'poor',
        description: 'Estimated liver health based on consumption patterns',
        icon: '🫀'
      }
    ];
    
    // Add health integration metrics if available
    const healthIntegrationMetrics: WellnessMetric[] = [];
    if (FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION && recentHealthMetrics.length > 0) {
      if (avgSteps > 0) {
        healthIntegrationMetrics.push({
          id: 'daily-steps',
          name: 'Daily Steps',
          value: avgSteps.toLocaleString(),
          unit: 'avg/day',
          trend: avgSteps >= 8000 ? 'up' : avgSteps >= 5000 ? 'stable' : 'down',
          status: avgSteps >= 10000 ? 'excellent' : avgSteps >= 7000 ? 'good' : avgSteps >= 5000 ? 'fair' : 'poor',
          description: 'Average daily steps from health app',
          icon: '👟'
        });
      }
      if (avgSleep > 0) {
        const sleepNum = parseFloat(avgSleep.toString());
        healthIntegrationMetrics.push({
          id: 'sleep-hours',
          name: 'Sleep Duration',
          value: avgSleep,
          unit: 'hrs/night',
          trend: sleepNum >= 7.5 ? 'up' : sleepNum >= 6.5 ? 'stable' : 'down',
          status: sleepNum >= 8 ? 'excellent' : sleepNum >= 7 ? 'good' : sleepNum >= 6 ? 'fair' : 'poor',
          description: 'Average sleep duration from health app',
          icon: '🛌'
        });
      }
      if (avgHeartRate > 0) {
        healthIntegrationMetrics.push({
          id: 'heart-rate',
          name: 'Resting Heart Rate',
          value: avgHeartRate,
          unit: 'bpm',
          trend: avgHeartRate <= 70 ? 'up' : avgHeartRate <= 80 ? 'stable' : 'down',
          status: avgHeartRate <= 60 ? 'excellent' : avgHeartRate <= 70 ? 'good' : avgHeartRate <= 80 ? 'fair' : 'poor',
          description: 'Average resting heart rate from health app',
          icon: '💓'
        });
      }
    }
    
    return [...baseMetrics, ...healthIntegrationMetrics];
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
        title: 'Late Evening Drinking Pattern',
        insight: `You've had ${eveningDrinks.length} drinks after 8 PM in the last 2 weeks. This can significantly impact sleep quality and REM cycles.`,
        recommendation: 'Consider setting a cut-off time for alcohol consumption, ideally 3-4 hours before bedtime.',
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
        title: 'Stress-Related Drinking Patterns',
        insight: `${stressfulDays.length} drinking episodes were associated with high stress or emotional triggers.`,
        recommendation: 'Consider developing alternative stress management techniques like deep breathing, exercise, or meditation.',
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
        title: 'Social Situation Analysis',
        insight: `You're successfully managing ${Math.round(successRate)}% of social drinking situations with alternatives.`,
        recommendation: successRate < 50 
          ? 'Practice saying no in social situations and have go-to non-alcoholic options ready.'
          : 'Great job! Consider sharing your strategies with others who might benefit.',
        confidence: 80,
        priority: successRate < 50 ? 'medium' : 'low'
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }).slice(0, 3);
  }, [drinks, canAccessAIInsights]);

  const getStatusColor = (status: WellnessMetric['status']) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'fair': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'poor': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
  };

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
        <div className="text-4xl mb-4">🏥</div>
        <h2 className="text-xl font-bold mb-2">Premium Wellness Dashboard</h2>
        <p className="mb-4 opacity-90">
          Get comprehensive health insights, wellness tracking, and AI-powered recommendations
          to optimize your physical and mental wellbeing.
        </p>
        <ul className="text-sm opacity-90 mb-6 text-left max-w-md mx-auto space-y-1">
          <li>• Comprehensive health metrics tracking</li>
          <li>• Sleep quality analysis and recommendations</li>
          <li>• Stress pattern identification</li>
          <li>• Liver health estimation</li>
          <li>• Social wellness scoring</li>
          <li>• AI-powered personalized insights</li>
        </ul>
        <Button 
          variant="secondary" 
          className="bg-white text-primary-600 hover:bg-gray-100"
          onClick={() => trackFeatureUsage('wellness_upgrade_prompt')}
        >
          Upgrade to Access
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          🏥 Wellness Dashboard
          <Badge variant="primary" className="text-xs">Premium</Badge>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Comprehensive health and wellness insights powered by AI analysis
        </p>
      </div>

      {/* Wellness Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {wellnessMetrics.map(metric => (
          <div 
            key={metric.id} 
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{metric.icon}</span>
                <h3 className="font-semibold text-sm">{metric.name}</h3>
              </div>
              <span className="text-lg">{getTrendIcon(metric.trend)}</span>
            </div>
            
            <div className="mb-2">
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </span>
                {metric.unit && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {metric.unit}
                  </span>
                )}
              </div>
            </div>
            
            <Badge variant="secondary" className={`text-xs mb-2 ${getStatusColor(metric.status)}`}>
              {metric.status.toUpperCase()}
            </Badge>
            
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {metric.description}
            </p>
          </div>
        ))}
      </div>

      {/* Health Insights */}
      {healthInsights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🧠 AI Health Insights
            <Badge variant="primary" className="text-xs">Personalized</Badge>
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
                    <span className="text-xs text-gray-500">
                      {insight.confidence}% confidence
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {insight.insight}
                </p>
                
                <div className="bg-white dark:bg-gray-700 p-3 rounded border">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    💡 Recommendation:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
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
          📊 Export Report
        </Button>
        <Button 
          variant="outline"
          onClick={() => trackFeatureUsage('wellness_share_with_doctor')}
        >
          👩‍⚕️ Share with Doctor
        </Button>
        <Button 
          variant="primary"
          onClick={() => trackFeatureUsage('wellness_set_goals')}
        >
          🎯 Set Health Goals
        </Button>
      </div>
    </div>
  );
}