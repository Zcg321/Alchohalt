import React, { useMemo } from 'react';
import { useLanguage } from '../../i18n';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../goals/GoalSettings';
import InsightCard from './InsightCard';
import { generateInsights, ChartIcon } from './insightGenerators';

interface Props {
  drinks: Drink[];
  goals: Goals;
}

export default function InsightsPanel({ drinks, goals }: Props) {
  const { t } = useLanguage();

  const insights = useMemo(() => {
    return generateInsights(drinks, goals);
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