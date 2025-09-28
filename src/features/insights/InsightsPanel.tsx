import React, { useMemo } from 'react';
import { useLanguage } from '../../i18n';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../goals/GoalSettings';
import InsightCard from './InsightCard';
import { getCurrentStreak, analyzeWeekendPattern, analyzeCravingTrend } from './lib';
import { ChartIcon } from './insightGenerators';

interface Props {
  drinks: Drink[];
  goals: Goals;
}

export default function InsightsPanel({ drinks, goals }: Props) {
  const { t } = useLanguage();

  const insights = useMemo(() => {
    if (drinks.length === 0) return [];
    
    const insights = [];
    const streak = getCurrentStreak(drinks);
    const weekendPattern = analyzeWeekendPattern(drinks);
    const cravingTrend = analyzeCravingTrend(drinks);
    
    // Streak achievement
    if (streak > 0) {
      insights.push({
        title: streak >= 7 ? `🎉 ${streak} Day Streak!` : `💪 ${streak} Days Strong`,
        description: streak >= 7 ? 'Amazing work! Keep this momentum going!' : 'Building great habits one day at a time.',
        type: 'achievement',
        icon: <ChartIcon />,
        priority: streak >= 7 ? 3 : 2
      });
    }
    
    // Weekend pattern
    if (weekendPattern.hasPattern) {
      insights.push({
        title: 'Weekend Pattern Detected',
        description: `You drink ${weekendPattern.percentage}% more on weekends. Consider planning alcohol-free weekend activities.`,
        type: 'pattern',
        icon: <ChartIcon />,
        priority: 2
      });
    }
    
    // Craving trend
    if (cravingTrend.direction !== 'stable') {
      insights.push({
        title: cravingTrend.direction === 'improving' ? 'Cravings Improving' : 'Cravings Increasing',
        description: cravingTrend.direction === 'improving' 
          ? `Great news! Your cravings have decreased by ${cravingTrend.percentage.toFixed(0)}%.`
          : `Your cravings have increased by ${cravingTrend.percentage.toFixed(0)}%. Consider stress management techniques.`,
        type: cravingTrend.direction === 'improving' ? 'achievement' : 'warning',
        icon: <ChartIcon />,
        priority: 2
      });
    }
    
    return insights.sort((a, b) => b.priority - a.priority);
  }, [drinks, goals]);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold flex items-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
          Personal Insights
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          AI-powered analysis of your drinking patterns
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