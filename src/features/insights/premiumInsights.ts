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
        const bucket = acc[state] ?? { count: 0, totalDrinks: 0 };
        bucket.count++;
        bucket.totalDrinks += entry.stdDrinks;
        acc[state] = bucket;
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
    const lower = stateNames[maxState as keyof typeof stateNames].toLowerCase();
    insights.push({
      title: `${stateNames[maxState as keyof typeof stateNames]} shows up most`,
      description: `When you log "${lower}" alongside a drink, the count is ${maxAvg.toFixed(1)}x higher than usual. Worth a strategy specifically for those moments.`,
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
    const bucket = hourlyStats[hour];
    if (!bucket) return;
    bucket.count++;
    bucket.totalDrinks += entry.stdDrinks;
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

  const peak = peakHours[0];
  if (peak) {
    const timeDesc = peak.hour < 12 ? 'morning' : peak.hour < 18 ? 'afternoon' : 'evening';

    insights.push({
      title: `${timeDesc.charAt(0).toUpperCase() + timeDesc.slice(1)} runs heavier`,
      description: `Drinks logged around ${peak.hour}:00 tend to be larger. If there's a routine that fits in that hour and doesn't involve alcohol, planting it there usually helps.`,
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
    const highCravingDays = cravingDrinkPairs.filter(p => p.craving >= 7);
    const lowCravingDays = cravingDrinkPairs.filter(p => p.craving <= 3);
    
    if (highCravingDays.length >= 3 && lowCravingDays.length >= 3) {
      const highCravingAvgDrinks = highCravingDays.reduce((sum, p) => sum + p.drinks, 0) / highCravingDays.length;
      const lowCravingAvgDrinks = lowCravingDays.reduce((sum, p) => sum + p.drinks, 0) / lowCravingDays.length;
      
      const difference = highCravingAvgDrinks - lowCravingAvgDrinks;
      
      if (difference > 1) {
        insights.push({
          title: 'Stronger cravings, bigger nights',
          description: `High-craving days are ${difference.toFixed(1)} standard drinks higher on average than low-craving days. When the craving hits hard, try waiting ten minutes — do something else first, then decide.`,
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
      title: 'Monthly spend is adding up',
      description: `At your current pace, around $${monthlyCost.toFixed(0)} per month. Setting a budget on the Goals tab makes the number harder to ignore.`,
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
    const bucket = acc[entry.kind] ?? { count: 0, totalCost: 0 };
    bucket.count++;
    bucket.totalCost += entry.cost || 0;
    acc[entry.kind] = bucket;
    return acc;
  }, {} as Record<string, { count: number; totalCost: number }>);

  const sortedByCost = Object.entries(costByKind)
    .map(([kind, stats]) => ({ kind, avgCost: stats.totalCost / stats.count }))
    .sort((a, b) => b.avgCost - a.avgCost);
  const expensiveKind = sortedByCost[0];

  if (expensiveKind && expensiveKind.avgCost > avgCostPerDrink * 1.5) {
    insights.push({
      title: `${expensiveKind.kind.charAt(0).toUpperCase() + expensiveKind.kind.slice(1)} runs your spend up`,
      description: `${expensiveKind.kind} costs $${expensiveKind.avgCost.toFixed(2)} on average — well above your $${avgCostPerDrink.toFixed(2)} per-drink average. A cheaper version of the same thing makes a noticeable dent.`,
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
    const bucket = acc[intention] ?? { count: 0, totalDrinks: 0, totalCraving: 0 };
    bucket.count++;
    bucket.totalDrinks += entry.stdDrinks;
    bucket.totalCraving += entry.craving;
    acc[intention] = bucket;
    return acc;
  }, {} as Record<string, { count: number; totalDrinks: number; totalCraving: number }>);

  const intentionAnalysis = Object.entries(intentionStats)
    .filter(([, stats]) => stats.count >= 3)
    .map(([intention, stats]) => ({
      intention,
      avgDrinks: stats.totalDrinks / stats.count,
      count: stats.count
    }))
    .sort((a, b) => a.avgDrinks - b.avgDrinks);

  const best = intentionAnalysis[0];
  const worst = intentionAnalysis[intentionAnalysis.length - 1];

  if (best && worst && worst !== best) {
    if (worst.avgDrinks > best.avgDrinks * 1.5) {
      const intentionMap: Record<string, string> = {
        celebrate: 'celebrating',
        social: 'social settings',
        taste: 'wanting the taste',
        bored: 'boredom',
        cope: 'coping with something',
        other: 'other reasons'
      };

      insights.push({
        title: `${(intentionMap[worst.intention] || worst.intention).replace(/^./, c => c.toUpperCase())} runs heaviest`,
        description: `Drinks logged for ${intentionMap[worst.intention] || worst.intention} average ${worst.avgDrinks.toFixed(1)} — vs ${best.avgDrinks.toFixed(1)} for ${intentionMap[best.intention] || best.intention}. The intention column is doing real work here.`,
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
