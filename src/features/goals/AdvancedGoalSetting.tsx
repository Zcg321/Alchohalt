import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import type { Goals } from './GoalSettings';
import { goalTypes, type AdvancedGoal } from './types';
import { useDB } from '../../store/db';
import GoalCard from './GoalCard';
import AddGoalModal from './AddGoalModal';

interface Props {
  goals: Goals;
  onChange: (goals: Goals) => void;
}

export default function AdvancedGoalSetting({ goals, onChange }: Props) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  
  // Use the DB store instead of local state
  const { db: { advancedGoals }, addAdvancedGoal, toggleAdvancedGoal, deleteAdvancedGoal } = useDB();

  const handleAddGoal = (newGoal: Omit<AdvancedGoal, 'id'>) => {
    addAdvancedGoal(newGoal);
    setShowAddGoal(false);
    // Notify parent of changes - advanced goals affect overall goal state
    onChange(goals);
  };

  const handleToggleGoal = (goalId: string) => {
    toggleAdvancedGoal(goalId);
    // Notify parent of changes
    onChange(goals);
  };

  const handleDeleteGoal = (goalId: string) => {
    deleteAdvancedGoal(goalId);
    // Notify parent of changes
    onChange(goals);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold flex items-center">
          <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
          Advanced Goals
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Set personalized challenges and milestones
        </p>
      </div>

      <div className="card-content space-y-4">
        {/* Active Goals */}
        <div className="space-y-3">
          {advancedGoals.map(goal => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              onToggle={() => handleToggleGoal(goal.id)}
              onDelete={() => handleDeleteGoal(goal.id)}
            />
          ))}
        </div>

        {/* Add Goal Button */}
        <Button
          variant="secondary"
          onClick={() => setShowAddGoal(true)}
          className="w-full"
          leftIcon={<PlusIcon />}
        >
          Add New Goal
        </Button>

        {/* Add Goal Modal */}
        {showAddGoal && (
          <AddGoalModal
            goalTypes={goalTypes}
            onAdd={handleAddGoal}
            onClose={() => setShowAddGoal(false)}
          />
        )}
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}