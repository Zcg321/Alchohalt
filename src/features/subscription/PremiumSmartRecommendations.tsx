import React, { useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { PremiumFeatureGate } from '../subscription/SubscriptionManager';
import { useDB } from '../../store/db';
import type { Entry } from '../../store/db';

interface SmartRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'behavioral' | 'environmental' | 'social' | 'therapeutic' | 'lifestyle';
  priority: number;
  confidence: number;
  actionable: boolean;
  timeframe: string;
  icon: string;
}

export default function PremiumSmartRecommendations() {
  const { canAccessAIInsights } = usePremiumFeatures();
  const { db } = useDB();

  const recommendations = useMemo(() => {
    return generateSmartRecommendations(db.entries);
  }, [db.entries]);

  const freeUserFallback = (
    <Card className="p-6 text-center">
      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-green-600 text-2xl">🤖</span>
      </div>
      <h3 className="text-lg font-semibold mb-2">AI Smart Recommendations</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Get personalized, actionable recommendations based on advanced analysis of your patterns and triggers.
      </p>
      <Button variant="primary">Upgrade to Premium</Button>
    </Card>
  );

  return (
    <PremiumFeatureGate 
      isPremium={canAccessAIInsights}
      fallback={freeUserFallback}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              <span className="mr-2">🤖</span>
              AI Smart Recommendations
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Personalized suggestions based on your patterns and proven strategies
            </p>
          </div>
          {recommendations.length > 0 && (
            <Badge variant="primary" size="sm">
              {recommendations.length} recommendations
            </Badge>
          )}
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <p>Not enough data yet for personalized recommendations.</p>
            <p className="text-sm mt-1">Keep tracking for 1-2 weeks to unlock AI insights!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        )}
      </Card>
    </PremiumFeatureGate>
  );
}

function RecommendationCard({ recommendation }: { recommendation: SmartRecommendation }) {
  const categoryColors = {
    behavioral: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20',
    environmental: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20',
    social: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20',
    therapeutic: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20',
    lifestyle: 'bg-pink-50 border-pink-200 text-pink-800 dark:bg-pink-900/20'
  };

  const priorityText = {
    1: 'Low Priority',
    2: 'Medium Priority', 
    3: 'High Priority',
    4: 'Critical'
  };

  return (
    <div className={`p-4 rounded-lg border ${categoryColors[recommendation.category]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/50">
            <span>{recommendation.icon}</span>
          </div>
          <div>
            <h4 className="font-semibold">{recommendation.title}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <Badge 
                variant={recommendation.priority >= 3 ? 'warning' : 'secondary'}
                size="sm"
              >
                {priorityText[recommendation.priority as keyof typeof priorityText]}
              </Badge>
              <span className="text-xs opacity-75">
                {recommendation.confidence}% confidence
              </span>
            </div>
          </div>
        </div>
        <div className="text-xs opacity-75">
          {recommendation.timeframe}
        </div>
      </div>
      
      <p className="text-sm opacity-90 mb-3">
        {recommendation.description}
      </p>
      
      {recommendation.actionable && (
        <div className="flex space-x-2">
          <Button size="sm" variant="secondary">
            Try This
          </Button>
          <Button size="sm" variant="ghost">
            Remind Later
          </Button>
        </div>
      )}
    </div>
  );
}

function generateSmartRecommendations(entries: Entry[]): SmartRecommendation[] {
  if (entries.length < 7) return [];

  const recommendations: SmartRecommendation[] = [];
  
  // Analyze HALT patterns for behavioral recommendations
  const haltRecommendations = generateHALTRecommendations(entries);
  recommendations.push(...haltRecommendations);

  // Analyze timing patterns for environmental recommendations
  const timingRecommendations = generateTimingRecommendations(entries);
  recommendations.push(...timingRecommendations);

  // Analyze intention patterns for therapeutic recommendations
  const intentionRecommendations = generateIntentionRecommendations(entries);
  recommendations.push(...intentionRecommendations);

  // Analyze spending patterns for lifestyle recommendations
  const spendingRecommendations = generateSpendingRecommendations(entries);
  recommendations.push(...spendingRecommendations);

  // Analyze craving patterns for additional behavioral recommendations
  const cravingRecommendations = generateCravingRecommendations(entries);
  recommendations.push(...cravingRecommendations);

  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6); // Limit to top 6 recommendations
}

function generateHALTRecommendations(entries: Entry[]): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  
  // Analyze HALT triggers
  const haltStats = entries.reduce((acc, entry) => {
    ['H', 'A', 'L', 'T'].forEach(state => {
      if (entry.halt[state as keyof typeof entry.halt]) {
        acc[state] = acc[state] || { count: 0, totalDrinks: 0 };
        acc[state].count++;
        acc[state].totalDrinks += entry.stdDrinks;
      }
    });
    return acc;
  }, {} as Record<string, { count: number; totalDrinks: number }>);

  // Find problematic HALT states
  Object.entries(haltStats).forEach(([state, stats]) => {
    if (stats.count >= 3) {
      const avgDrinks = stats.totalDrinks / stats.count;
      
      if (avgDrinks > 1.5) {
    let recommendation: SmartRecommendation;
        
        switch (state) {
          case 'H':
            recommendation = {
              id: `halt-${state}`,
              title: 'Address Hunger Before It Hits',
              description: 'You tend to drink more when hungry. Try eating regular meals and keep healthy snacks available. Consider setting meal reminders.',
              category: 'behavioral',
              priority: 3,
              confidence: Math.min(90, Math.round(avgDrinks * 30)),
              actionable: true,
              timeframe: 'Immediate',
              icon: '🍎'
            };
            break;
          case 'A':
            recommendation = {
              id: `halt-${state}`,
              title: 'Anger Management Strategy',
              description: 'Anger appears to be a drinking trigger for you. Try deep breathing, physical exercise, or calling a friend when you feel angry.',
              category: 'therapeutic',
              priority: 4,
              confidence: Math.min(95, Math.round(avgDrinks * 25)),
              actionable: true,
              timeframe: 'Next week',
              icon: '😤'
            };
            break;
          case 'L':
            recommendation = {
              id: `halt-${state}`,
              title: 'Combat Loneliness Actively',
              description: 'Loneliness triggers heavier drinking for you. Consider joining social groups, scheduling regular calls with friends, or trying community activities.',
              category: 'social',
              priority: 3,
              confidence: Math.min(85, Math.round(avgDrinks * 28)),
              actionable: true,
              timeframe: 'This month',
              icon: '👥'
            };
            break;
          case 'T':
            recommendation = {
              id: `halt-${state}`,
              title: 'Improve Sleep Hygiene',
              description: 'Tiredness leads to increased drinking. Focus on getting 7-9 hours of sleep, avoid screens before bed, and consider a relaxing bedtime routine.',
              category: 'lifestyle',
              priority: 2,
              confidence: Math.min(80, Math.round(avgDrinks * 32)),
              actionable: true,
              timeframe: 'Next 2 weeks',
              icon: '😴'
            };
            break;
          default:
            return;
        }
        
        recommendations.push(recommendation);
      }
    }
  });

  return recommendations;
}

function generateTimingRecommendations(entries: Entry[]): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  
  // Analyze drinking by hour
  const hourlyStats = Array(24).fill(0).map(() => ({ count: 0, totalDrinks: 0 }));
  
  entries.forEach(entry => {
    const hour = new Date(entry.ts).getHours();
    hourlyStats[hour].count++;
    hourlyStats[hour].totalDrinks += entry.stdDrinks;
  });

  // Find peak hours with concerning patterns
  const peakHours = hourlyStats
    .map((stats, hour) => ({ 
      hour, 
      avg: stats.count > 0 ? stats.totalDrinks / stats.count : 0,
      count: stats.count 
    }))
    .filter(h => h.count >= 3 && h.avg > 1.5)
    .sort((a, b) => b.avg - a.avg);

  if (peakHours.length > 0) {
    const peak = peakHours[0];
    let suggestion;
    
    if (peak.hour >= 17 && peak.hour <= 20) {
      suggestion = 'Try scheduling exercise, cooking, or hobby time during your peak drinking hours.';
    } else if (peak.hour >= 21) {
      suggestion = 'Consider establishing a calming nighttime routine without alcohol, like reading or meditation.';
    } else if (peak.hour >= 12 && peak.hour <= 16) {
      suggestion = 'Plan engaging activities for your afternoon drinking window, like walks or social calls.';
    } else {
      suggestion = 'Morning drinking may indicate deeper concerns. Consider speaking with a healthcare provider.';
    }
    
    recommendations.push({
      id: 'timing-peak',
      title: `Address ${peak.hour}:00 Drinking Pattern`,
      description: `You consistently drink more around ${peak.hour}:00 (${peak.avg.toFixed(1)} drinks avg). ${suggestion}`,
      category: 'environmental',
      priority: peak.hour < 12 ? 4 : 3,
      confidence: Math.min(90, peak.count * 8),
      actionable: true,
      timeframe: 'This week',
      icon: '🕒'
    });
  }

  return recommendations;
}

function generateIntentionRecommendations(entries: Entry[]): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  
  const intentionStats = entries.reduce((acc, entry) => {
    const intention = entry.intention;
    acc[intention] = acc[intention] || { count: 0, totalDrinks: 0, totalCraving: 0 };
    acc[intention].count++;
    acc[intention].totalDrinks += entry.stdDrinks;
    acc[intention].totalCraving += entry.craving;
    return acc;
  }, {} as Record<string, { count: number; totalDrinks: number; totalCraving: number }>);

  // Find problematic intentions
  const problematicIntentions = Object.entries(intentionStats)
    .filter(([, stats]) => stats.count >= 3)
    .map(([intention, stats]) => ({
      intention,
      avgDrinks: stats.totalDrinks / stats.count,
      count: stats.count
    }))
    .filter(i => i.avgDrinks > 1.5)
    .sort((a, b) => b.avgDrinks - a.avgDrinks);

  problematicIntentions.forEach(({ intention, avgDrinks, count }) => {
    let rec: SmartRecommendation | null = null;

    switch (intention) {
      case 'cope':
        rec = {
          id: 'intention-cope',
          title: 'Develop Healthier Coping Strategies',
          description: `Stress-coping leads to ${avgDrinks.toFixed(1)} drinks on average. Try journaling, meditation, exercise, or speaking with a counselor.`,
          category: 'therapeutic',
          priority: 4,
          confidence: Math.min(95, count * 12),
          actionable: true,
          timeframe: 'Next 2 weeks',
          icon: '🧘'
        };
        break;
      case 'bored':
        rec = {
          id: 'intention-bored',
          title: 'Create an Engaging Activity List',
          description: `Boredom triggers ${avgDrinks.toFixed(1)} drinks on average. Prepare a list of engaging activities: hobbies, calls to friends, walks, or creative projects.`,
          category: 'behavioral',
          priority: 2,
          confidence: Math.min(80, count * 10),
          actionable: true,
          timeframe: 'This week',
          icon: '🎨'
        };
        break;
      case 'social':
        rec = {
          id: 'intention-social',
          title: 'Plan Alcohol-Light Social Activities',
          description: `Social drinking averages ${avgDrinks.toFixed(1)} drinks. Suggest activities like coffee meetups, hiking, or morning social activities.`,
          category: 'social',
          priority: 2,
          confidence: Math.min(75, count * 8),
          actionable: true,
          timeframe: 'Next month',
          icon: '☕'
        };
        break;
      case 'celebrate':
        rec = {
          id: 'intention-celebrate',
          title: 'Alternative Celebration Ideas',
          description: `Celebrations lead to ${avgDrinks.toFixed(1)} drinks on average. Consider special meals, experiences, or non-alcoholic toasts for achievements.`,
          category: 'lifestyle',
          priority: 1,
          confidence: Math.min(70, count * 6),
          actionable: true,
          timeframe: 'Future events',
          icon: '🎉'
        };
        break;
    }

    if (rec) {
      recommendations.push(rec);
    }
  });

  return recommendations;
}

function generateSpendingRecommendations(entries: Entry[]): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  
  const entriesWithCost = entries.filter(e => e.cost && e.cost > 0);
  if (entriesWithCost.length < 5) return recommendations;

  const totalCost = entriesWithCost.reduce((sum, e) => sum + (e.cost || 0), 0);
  const daysSpan = Math.max(1, (Date.now() - Math.min(...entriesWithCost.map(e => e.ts))) / (1000 * 60 * 60 * 24));
  const monthlyCost = (totalCost / daysSpan) * 30;

  if (monthlyCost > 80) {
    recommendations.push({
      id: 'spending-budget',
      title: 'Set a Monthly Alcohol Budget',
      description: `At your current pace, you're spending $${monthlyCost.toFixed(0)}/month. Setting a budget could help you make more conscious choices and save money.`,
      category: 'lifestyle',
      priority: 2,
      confidence: 85,
      actionable: true,
      timeframe: 'This month',
      icon: '💰'
    });
  }

  // Analyze cost by drink type for optimization
  const costByKind = entriesWithCost.reduce((acc, entry) => {
    acc[entry.kind] = acc[entry.kind] || { count: 0, totalCost: 0 };
    acc[entry.kind].count++;
    acc[entry.kind].totalCost += entry.cost || 0;
    return acc;
  }, {} as Record<string, { count: number; totalCost: number }>);

  const avgCostPerDrink = totalCost / entriesWithCost.length;
  const expensiveTypes = Object.entries(costByKind)
    .map(([kind, stats]) => ({ kind, avgCost: stats.totalCost / stats.count, count: stats.count }))
    .filter(t => t.count >= 2 && t.avgCost > avgCostPerDrink * 1.3)
    .sort((a, b) => b.avgCost - a.avgCost);

  if (expensiveTypes.length > 0) {
    const expensive = expensiveTypes[0];
    recommendations.push({
      id: 'spending-optimize',
      title: `Optimize ${expensive.kind} Spending`,
      description: `${expensive.kind} costs $${expensive.avgCost.toFixed(2)} per drink vs your average of $${avgCostPerDrink.toFixed(2)}. Consider switching brands or venues for cost savings.`,
      category: 'lifestyle',
      priority: 1,
      confidence: 70,
      actionable: true,
      timeframe: 'Next purchase',
      icon: '🛒'
    });
  }

  return recommendations;
}

function generateCravingRecommendations(entries: Entry[]): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  
  const highCravingEntries = entries.filter(e => e.craving >= 7);
  if (highCravingEntries.length < 3) return recommendations;

  const avgHighCravingDrinks = highCravingEntries.reduce((sum, e) => sum + e.stdDrinks, 0) / highCravingEntries.length;
  const recentHighCravings = highCravingEntries.filter(e => Date.now() - e.ts < 7 * 24 * 60 * 60 * 1000).length;

  if (avgHighCravingDrinks > 2) {
    recommendations.push({
      id: 'craving-management',
      title: 'Develop Craving Management Techniques',
      description: `High craving episodes (7+/10) lead to ${avgHighCravingDrinks.toFixed(1)} drinks on average. Try the "urge surfing" technique: observe the craving without acting for 10 minutes.`,
      category: 'therapeutic',
      priority: 3,
      confidence: 85,
      actionable: true,
      timeframe: 'Next craving',
      icon: '🌊'
    });
  }

  if (recentHighCravings >= 2) {
    recommendations.push({
      id: 'craving-recent',
      title: 'Address Recent Craving Spike',
      description: `You've had ${recentHighCravings} high-craving episodes this week. Consider what stressors or changes might be contributing and adjust your coping strategies.`,
      category: 'behavioral',
      priority: 3,
      confidence: 80,
      actionable: true,
      timeframe: 'This week',
      icon: '📈'
    });
  }

  return recommendations;
}