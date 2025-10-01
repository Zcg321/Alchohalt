/**
 * AI-Powered Goal Recommendations Component
 * 
 * Displays personalized goal suggestions based on user behavior.
 */

import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FEATURE_FLAGS } from '../../config/features';
import { generateGoalRecommendations, type GoalRecommendation } from '../../lib/ai-recommendations';
import type { Entry, Settings } from '../../store/db';

interface Props {
  entries: Entry[];
  settings: Settings;
  onAcceptRecommendation: (recommendation: GoalRecommendation) => void;
  className?: string;
}

export default function GoalRecommendations({ entries, settings, onAcceptRecommendation, className = '' }: Props) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const recommendations = useMemo(() => {
    if (!FEATURE_FLAGS.ENABLE_AI_RECOMMENDATIONS) {
      return [];
    }
    
    return generateGoalRecommendations(entries, settings, [])
      .filter(rec => !dismissedIds.includes(rec.id));
  }, [entries, settings, dismissedIds]);

  if (!FEATURE_FLAGS.ENABLE_AI_RECOMMENDATIONS || recommendations.length === 0) {
    return null;
  }

  const handleDismiss = (id: string) => {
    setDismissedIds([...dismissedIds, id]);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'moderate': return 'warning';
      case 'challenging': return 'danger';
      default: return 'secondary';
    }
  };

  const getPriorityIcon = (confidence: number) => {
    if (confidence >= 0.8) return '🎯';
    if (confidence >= 0.6) return '💡';
    return '💭';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold">🤖 AI-Powered Recommendations</h3>
        <Badge variant="primary" className="text-xs">Personalized</Badge>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div 
            key={rec.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getPriorityIcon(rec.confidence)}</span>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Based on your recent progress
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant={getDifficultyColor(rec.difficulty)} className="text-xs">
                  {rec.difficulty}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {rec.description}
            </p>

            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Why this goal?
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {rec.rationale}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <span>Success rate:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {rec.estimatedSuccessRate}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Confidence:</span>
                  <span className="font-semibold">
                    {Math.round(rec.confidence * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(rec.id)}
                >
                  Dismiss
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onAcceptRecommendation(rec)}
                >
                  Accept Goal
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p>
          💡 Recommendations are based on your recent behavior patterns and are designed to be achievable yet challenging. 
          You can always adjust goals after accepting them.
        </p>
      </div>
    </div>
  );
}
