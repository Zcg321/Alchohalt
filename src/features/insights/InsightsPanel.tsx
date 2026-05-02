import React, { useMemo } from 'react';
import type { Drink } from '../drinks/DrinkForm';
import InsightCard from './InsightCard';
import { getCurrentStreak, analyzeWeekendPattern, analyzeCravingTrend, type Insight } from './lib';
import { ChartIcon } from './insightGenerators';
import { generatePremiumInsights } from './premiumInsights';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { useDB } from '../../store/db';

interface Props {
  drinks: Drink[];
}

export default function InsightsPanel({ drinks }: Props) {
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
        title: streak >= 7 ? `${streak} days in a row` : `${streak} days going`,
        description: streak >= 7 ? "Past the first week. The hardest stretch is usually behind you now." : 'Quiet days count.',
        type: 'achievement',
        icon: <ChartIcon />,
        priority: streak >= 7 ? 3 : 2
      });
    }

    // Weekend pattern (basic version)
    if (weekendPattern.hasPattern) {
      basicInsights.push({
        title: 'Weekends run higher',
        description: `Your weekend numbers are ${weekendPattern.percentage}% above weekdays. One non-drinking weekend activity in the rotation usually helps.`,
        type: 'pattern',
        icon: <ChartIcon />,
        priority: 2
      });
    }

    // Craving trend (basic version)
    if (cravingTrend.direction !== 'stable') {
      basicInsights.push({
        title: cravingTrend.direction === 'improving' ? 'Cravings down' : 'Cravings up',
        description: cravingTrend.direction === 'improving'
          ? `Cravings are ${cravingTrend.percentage.toFixed(0)}% lower than before. The patterns you've built are doing the work.`
          : `Cravings are ${cravingTrend.percentage.toFixed(0)}% higher than before. Worth a look at what's been different — sleep, stress, schedule.`,
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
  }, [drinks, canAccessAIInsights, db.entries]);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold tracking-tight">
          Personal insights
        </h2>
        <p className="text-sm leading-relaxed text-ink-soft mt-1">
          {canAccessAIInsights
            ? 'On-device pattern analysis of what you log.'
            : (
                <>
                  Basic pattern analysis. Deeper AI Insights are part of Premium —{' '}
                  <a
                    href="#settings-section"
                    className="underline underline-offset-2 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    see plans
                  </a>
                  .
                </>
              )}
        </p>
      </div>
      
      <div className="card-content space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8 max-w-sm mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sage-50 dark:bg-sage-900/30 flex items-center justify-center">
              <ChartIcon />
            </div>
            <p className="text-ink mb-2">Nothing to read yet.</p>
            <p className="text-caption text-ink-soft">
              Log a drink or mark today AF on the home screen. After about a week,
              this is where weekend bias, craving trends, and time-of-day patterns
              show up — only based on what you log, only on this device.
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