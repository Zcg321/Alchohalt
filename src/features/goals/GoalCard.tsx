import React from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { AdvancedGoal } from './types';

interface Props {
  goal: AdvancedGoal;
  onToggle: () => void;
  onDelete: () => void;
}

export default function GoalCard({ goal, onToggle, onDelete }: Props) {
  const progressPercentage = Math.min((goal.current / goal.target) * 100, 100);
  const isCompleted = goal.current >= goal.target;

  const typeColors = {
    streak: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20',
    reduction: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
    spending: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
    habit: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20'
  };

  return (
    <div className={`p-4 border rounded-lg ${typeColors[goal.type]} ${!goal.isActive ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-semibold">{goal.title}</h4>
            {isCompleted && <span className="text-green-600">✅</span>}
          </div>
          <p className="text-sm opacity-80 mb-3">{goal.description}</p>
          
          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">
                {goal.current} / {goal.target} {goal.unit}
              </span>
              <span className="text-sm opacity-70">
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-green-500' : 'bg-current'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Deadline */}
          {goal.deadline && (
            <div className="text-xs opacity-70">
              Deadline: {goal.deadline.toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
            title={goal.isActive ? 'Pause goal' : 'Resume goal'}
          >
            {goal.isActive ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-500 hover:bg-opacity-20 text-red-600 transition-colors"
            title="Delete goal"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function PauseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}