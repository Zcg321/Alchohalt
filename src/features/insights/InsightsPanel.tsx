import React, { useMemo } from 'react';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../../types/common';
import InsightCard from './InsightCard';
import { getCurrentStreak, analyzeWeekendPattern, analyzeCravingTrend, type Insight } from './lib';
import { ChartIcon } from './insightGenerators';
import { generatePremiumInsights } from './premiumInsights';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { useDB } from '../../store/db';

interface Props {
  drinks: Drink[];
  goals: Goals;
}

export default function InsightsPanel({ drinks, goals }: Props) {
  const { canAccessAIInsights } = usePremiumFeatures();
  const { db } = useDB();

  const insights = useMemo(() => {
    if (drinks.length === 0) return [];
    
    const basicInsights: Insight[] = [];
    const streak = getCurrentStreak(drinks);
    const weekendPattern = analyzeWeekendPattern(drinks);
    const cravingTrend = analyzeCravingTrend(drinks);
    
    // Basic insights available to all users
    if (streak > 0) {
      basicInsights.push({
        title: streak >= 7 ? `🎉 ${streak} Day Streak!` : `💪 ${streak} Days Strong`,
        description: streak >= 7 ? 'Amazing work! Keep this momentum going!' : 'Building great habits one day at a time.',
        type: 'achievement',
        icon: <ChartIcon />,
        priority: streak >= 7 ? 3 : 2
      });
    }
    
    // Weekend pattern (basic version)
    if (weekendPattern.hasPattern) {
      basicInsights.push({
        title: 'Weekend Pattern Detected',
        description: `You drink ${weekendPattern.percentage}% more on weekends. Consider planning alcohol-free weekend activities.`,
        type: 'pattern',
        icon: <ChartIcon />,
        priority: 2
      });
    }
    
    // Craving trend (basic version)
    if (cravingTrend.direction !== 'stable') {
      basicInsights.push({
        title: cravingTrend.direction === 'improving' ? 'Cravings Improving' : 'Cravings Increasing',
        description: cravingTrend.direction === 'improving' 
          ? `Your cravings have decreased by ${cravingTrend.percentage.toFixed(0)}% recently. Great progress!`
          : `Your cravings have increased by ${cravingTrend.percentage.toFixed(0)}% recently. Consider reviewing your coping strategies.`,
        type: cravingTrend.direction === 'improving' ? 'achievement' : 'warning',
        icon: <ChartIcon />,
        priority: cravingTrend.direction === 'improving' ? 2 : 3
      });
    }

    // Add premium insights if available
    if (canAccessAIInsights && db.entries.length >= 7) {
      const premiumInsights = generatePremiumInsights(db.entries);
      // Convert premium insights to basic insight format
      const convertedPremiumInsights = premiumInsights.map(insight => ({
        ...insight,
        icon: <ChartIcon />
      }));
      
      return [...basicInsights, ...convertedPremiumInsights]
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 8); // Limit total insights
    }
    
    return basicInsights.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }, [drinks, goals, canAccessAIInsights, db.entries]);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold flex items-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
          Personal Insights
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          {canAccessAIInsights ? 'AI-powered analysis of your drinking patterns' : 'Basic pattern analysis - upgrade for advanced AI insights'}
        </p>
      </div>
      
      <div className="card-content space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <ChartIcon />
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">
              Keep logging your drinks to unlock personalized insights!
            </p>
          </div>
        ) : (
          insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))
        )}
      </div>
    </div>
  );
}