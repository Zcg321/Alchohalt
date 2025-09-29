import type { Insight } from './lib';
import type { Entry } from '../../store/db';

export interface PremiumInsight extends Insight {
  category: 'pattern' | 'correlation' | 'prediction' | 'optimization';
  confidence: number; // 0-100
  actionable: boolean;
  timeframe: string;
}

export function generatePremiumInsights(entries: Entry[]): PremiumInsight[] {
  const insights: PremiumInsight[] = [];
  
  if (entries.length < 7) {
    return insights; // Need at least a week of data for meaningful insights
  }

  // Advanced HALT trigger analysis
  const haltInsights = analyzeHALTPatterns(entries);
  insights.push(...haltInsights);

  // Time-based drinking patterns
  const timePatterns = analyzeTimePatterns(entries);
  insights.push(...timePatterns);

  // Craving correlation analysis
  const cravingCorrelations = analyzeCravingCorrelations(entries);
  insights.push(...cravingCorrelations);

  // Cost impact analysis
  const costInsights = analyzeCostImpacts(entries);
  insights.push(...costInsights);

  // Intention effectiveness analysis
  const intentionInsights = analyzeIntentionEffectiveness(entries);
  insights.push(...intentionInsights);

  return insights.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}

function analyzeHALTPatterns(entries: Entry[]): PremiumInsight[] {
  const insights: PremiumInsight[] = [];
  
  // Analyze which HALT states lead to higher drinking
  const haltStats = entries.reduce((acc, entry) => {
    const { halt } = entry;
    ['H', 'A', 'L', 'T'].forEach(state => {
      if (halt[state as keyof typeof halt]) {
        acc[state] = acc[state] || { count: 0, totalDrinks: 0 };
        acc[state].count++;
        acc[state].totalDrinks += entry.stdDrinks;
      }
    });
    return acc;
  }, {} as Record<string, { count: number; totalDrinks: number }>);

  // Find the most problematic HALT state
  let maxAvg = 0;
  let maxState = '';
  const stateNames = { H: 'Hunger', A: 'Anger', L: 'Loneliness', T: 'Tiredness' };

  Object.entries(haltStats).forEach(([state, stats]) => {
    const avg = stats.totalDrinks / stats.count;
    if (avg > maxAvg) {
      maxAvg = avg;
      maxState = state;
    }
  });

  if (maxState && maxAvg > 1.5) {
    insights.push({
      title: `${stateNames[maxState as keyof typeof stateNames]} Trigger Alert`,
      description: `You tend to drink ${maxAvg.toFixed(1)}x more when experiencing ${stateNames[maxState as keyof typeof stateNames].toLowerCase()}. Consider alternative coping strategies.`,
      type: 'warning',
      icon: '⚠️',
      priority: 90,
      category: 'pattern',
      confidence: Math.min(95, Math.round(maxAvg * 20)),
      actionable: true,
      timeframe: 'Last 30 days'
    });
  }

  return insights;
}

function analyzeTimePatterns(entries: Entry[]): PremiumInsight[] {
  const insights: PremiumInsight[] = [];
  
  // Analyze drinking by hour of day
  const hourlyStats = Array(24).fill(0).map(() => ({ count: 0, totalDrinks: 0 }));
  
  entries.forEach(entry => {
    const hour = new Date(entry.ts).getHours();
    hourlyStats[hour].count++;
    hourlyStats[hour].totalDrinks += entry.stdDrinks;
  });

  // Find peak drinking hours
  const peakHours = hourlyStats
    .map((stats, hour) => ({ 
      hour, 
      avg: stats.count > 0 ? stats.totalDrinks / stats.count : 0,
      count: stats.count 
    }))
    .filter(h => h.count >= 3) // Need significant data
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 2);

  if (peakHours.length > 0) {
    const peak = peakHours[0];
    const timeDesc = peak.hour < 12 ? 'morning' : peak.hour < 18 ? 'afternoon' : 'evening';
    
    insights.push({
      title: `Peak Drinking Time: ${peak.hour}:00`,
      description: `Your ${timeDesc} drinks (around ${peak.hour}:00) tend to be heavier. Consider scheduling alternative activities during this time.`,
      type: 'pattern',
      icon: '🕐',
      priority: 70,
      category: 'pattern',
      confidence: Math.min(85, peak.count * 5),
      actionable: true,
      timeframe: 'Last 60 days'
    });
  }

  return insights;
}

function analyzeCravingCorrelations(entries: Entry[]): PremiumInsight[] {
  const insights: PremiumInsight[] = [];
  
  if (entries.length < 14) return insights;

  // Calculate average craving vs drinks correlation
  const cravingDrinkPairs = entries.map(e => ({ craving: e.craving, drinks: e.stdDrinks }));
  
  if (cravingDrinkPairs.length > 0) {
    // Simple correlation analysis
    const avgCraving = cravingDrinkPairs.reduce((sum, p) => sum + p.craving, 0) / cravingDrinkPairs.length;
    const avgDrinks = cravingDrinkPairs.reduce((sum, p) => sum + p.drinks, 0) / cravingDrinkPairs.length;
    
    const highCravingDays = cravingDrinkPairs.filter(p => p.craving >= 7);
    const lowCravingDays = cravingDrinkPairs.filter(p => p.craving <= 3);
    
    if (highCravingDays.length >= 3 && lowCravingDays.length >= 3) {
      const highCravingAvgDrinks = highCravingDays.reduce((sum, p) => sum + p.drinks, 0) / highCravingDays.length;
      const lowCravingAvgDrinks = lowCravingDays.reduce((sum, p) => sum + p.drinks, 0) / lowCravingDays.length;
      
      const difference = highCravingAvgDrinks - lowCravingAvgDrinks;
      
      if (difference > 1) {
        insights.push({
          title: 'Strong Craving-Consumption Link',
          description: `High craving days lead to ${difference.toFixed(1)} more standard drinks on average. Focus on craving management techniques.`,
          type: 'pattern',
          icon: '🧠',
          priority: 80,
          category: 'correlation',
          confidence: Math.min(90, Math.round(difference * 30)),
          actionable: true,
          timeframe: 'Last 30 days'
        });
      }
    }
  }

  return insights;
}

function analyzeCostImpacts(entries: Entry[]): PremiumInsight[] {
  const insights: PremiumInsight[] = [];
  
  const entriesWithCost = entries.filter(e => e.cost && e.cost > 0);
  if (entriesWithCost.length < 5) return insights;

  const totalCost = entriesWithCost.reduce((sum, e) => sum + (e.cost || 0), 0);
  const avgCostPerDrink = totalCost / entriesWithCost.length;
  const daysSpan = Math.max(1, (Date.now() - Math.min(...entriesWithCost.map(e => e.ts))) / (1000 * 60 * 60 * 24));
  const monthlyCost = (totalCost / daysSpan) * 30;

  if (monthlyCost > 100) {
    insights.push({
      title: 'High Monthly Spending Alert',
      description: `Your current pace suggests $${monthlyCost.toFixed(0)}/month on alcohol. Consider setting a budget or finding cost-effective alternatives.`,
      type: 'warning',
      icon: '💰',
      priority: 75,
      category: 'optimization',
      confidence: 85,
      actionable: true,
      timeframe: 'Last 30 days'
    });
  }

  // Find most expensive drink types
  const costByKind = entriesWithCost.reduce((acc, entry) => {
    acc[entry.kind] = acc[entry.kind] || { count: 0, totalCost: 0 };
    acc[entry.kind].count++;
    acc[entry.kind].totalCost += entry.cost || 0;
    return acc;
  }, {} as Record<string, { count: number; totalCost: number }>);

  const expensiveKind = Object.entries(costByKind)
    .map(([kind, stats]) => ({ kind, avgCost: stats.totalCost / stats.count }))
    .sort((a, b) => b.avgCost - a.avgCost)[0];

  if (expensiveKind && expensiveKind.avgCost > avgCostPerDrink * 1.5) {
    insights.push({
      title: `${expensiveKind.kind.charAt(0).toUpperCase() + expensiveKind.kind.slice(1)} Cost Optimization`,
      description: `${expensiveKind.kind} costs ${expensiveKind.avgCost.toFixed(2)} per drink vs your average of $${avgCostPerDrink.toFixed(2)}. Consider cheaper alternatives.`,
      type: 'tip',
      icon: '💡',
      priority: 60,
      category: 'optimization',
      confidence: 70,
      actionable: true,
      timeframe: 'Last 60 days'
    });
  }

  return insights;
}

function analyzeIntentionEffectiveness(entries: Entry[]): PremiumInsight[] {
  const insights: PremiumInsight[] = [];
  
  // Analyze which intentions lead to better control (lower drinks/craving)
  const intentionStats = entries.reduce((acc, entry) => {
    const intention = entry.intention;
    acc[intention] = acc[intention] || { count: 0, totalDrinks: 0, totalCraving: 0 };
    acc[intention].count++;
    acc[intention].totalDrinks += entry.stdDrinks;
    acc[intention].totalCraving += entry.craving;
    return acc;
  }, {} as Record<string, { count: number; totalDrinks: number; totalCraving: number }>);

  const intentionAnalysis = Object.entries(intentionStats)
    .filter(([_, stats]) => stats.count >= 3)
    .map(([intention, stats]) => ({
      intention,
      avgDrinks: stats.totalDrinks / stats.count,
      avgCraving: stats.totalCraving / stats.count,
      count: stats.count
    }))
    .sort((a, b) => a.avgDrinks - b.avgDrinks);

  if (intentionAnalysis.length >= 2) {
    const best = intentionAnalysis[0];
    const worst = intentionAnalysis[intentionAnalysis.length - 1];
    
    if (worst.avgDrinks > best.avgDrinks * 1.5) {
      const intentionMap: Record<string, string> = {
        celebrate: 'Celebrating',
        social: 'Social drinking',
        taste: 'Taste preference', 
        bored: 'Boredom',
        cope: 'Coping/stress',
        other: 'Other reasons'
      };

      insights.push({
        title: `Intention Pattern: Avoid ${intentionMap[worst.intention] || worst.intention}`,
        description: `${intentionMap[worst.intention] || worst.intention} leads to ${worst.avgDrinks.toFixed(1)} drinks on average vs ${best.avgDrinks.toFixed(1)} for ${intentionMap[best.intention] || best.intention}.`,
        type: 'pattern',
        icon: '🎯',
        priority: 85,
        category: 'pattern',
        confidence: Math.min(90, Math.round((worst.avgDrinks / best.avgDrinks) * 30)),
        actionable: true,
        timeframe: 'Last 90 days'
      });
    }
  }

  return insights;
}