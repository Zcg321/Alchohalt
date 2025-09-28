import React, { useState } from 'react';
import { useLanguage } from '../../i18n';
import { Button } from '../../components/ui/Button';
import type { Goals } from './GoalSettings';
import { goalTypes, type AdvancedGoal } from './types';
import GoalCard from './GoalCard';
import AddGoalModal from './AddGoalModal';

interface Props {
  goals: Goals;
  onChange: (goals: Goals) => void;
}

export default function AdvancedGoalSetting({ goals, onChange }: Props) {
  const { t } = useLanguage();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [advancedGoals, setAdvancedGoals] = useState<AdvancedGoal[]>([
    {
      id: '1',
      type: 'streak',
      title: '30-Day Alcohol-Free Streak',
      description: 'Go alcohol-free for 30 consecutive days',
      target: 30,
      current: 0,
      unit: 'days',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      id: '2',
      type: 'reduction',
      title: 'Reduce Weekly Consumption by 50%',
      description: 'Cut weekly alcohol consumption in half',
      target: goals.weeklyGoal * 0.5,
      current: goals.weeklyGoal,
      unit: 'drinks',
      isActive: false
    }
  ]);

  const handleAddGoal = (newGoal: Omit<AdvancedGoal, 'id'>) => {
    const goal: AdvancedGoal = {
      ...newGoal,
      id: Date.now().toString()
    };
    setAdvancedGoals([...advancedGoals, goal]);
    setShowAddGoal(false);
  };

  const toggleGoal = (goalId: string) => {
    setAdvancedGoals(goals => 
      goals.map(g => 
        g.id === goalId ? { ...g, isActive: !g.isActive } : g
      )
    );
  };

  const deleteGoal = (goalId: string) => {
    setAdvancedGoals(goals => goals.filter(g => g.id !== goalId));
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
              onToggle={() => toggleGoal(goal.id)}
              onDelete={() => deleteGoal(goal.id)}
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