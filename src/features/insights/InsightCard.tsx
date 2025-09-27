import React from 'react';
import { Badge } from '../../components/ui/Badge';
import type { Insight } from './lib';

interface Props {
  insight: Insight;
}

export default function InsightCard({ insight }: Props) {
  const typeStyles = {
    tip: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
    achievement: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    pattern: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300'
  };
  
  const badges = {
    tip: <Badge variant="secondary" size="sm">Tip</Badge>,
    warning: <Badge variant="warning" size="sm">Warning</Badge>,
    achievement: <Badge variant="success" size="sm">Achievement</Badge>,
    pattern: <Badge variant="primary" size="sm">Pattern</Badge>
  };

  return (
    <div className={`p-4 rounded-lg border ${typeStyles[insight.type]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {insight.icon}
          </div>
          <h3 className="font-semibold">{insight.title}</h3>
        </div>
        {badges[insight.type]}
      </div>
      <p className="text-sm opacity-90 ml-9">{insight.description}</p>
    </div>
  );
}