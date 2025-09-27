import React, { useState } from 'react';
import { useLanguage } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import type { Goals } from './GoalSettings';

interface Props {
  goals: Goals;
  onChange: (goals: Goals) => void;
}

interface AdvancedGoal {
  id: string;
  type: 'streak' | 'reduction' | 'spending' | 'habit';
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  deadline?: Date;
  isActive: boolean;
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

  const goalTypes = [
    { 
      value: 'streak', 
      label: 'Alcohol-Free Streak',
      description: 'Consecutive days without alcohol',
      icon: '🔥'
    },
    { 
      value: 'reduction', 
      label: 'Consumption Reduction',
      description: 'Reduce drinks by a percentage',
      icon: '📉'
    },
    { 
      value: 'spending', 
      label: 'Budget Goal',
      description: 'Stay under spending limit',
      icon: '💰'
    },
    { 
      value: 'habit', 
      label: 'Healthy Habit',
      description: 'Build positive alternatives',
      icon: '🌱'
    }
  ];

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

function GoalCard({ goal, onToggle, onDelete }: {
  goal: AdvancedGoal;
  onToggle: () => void;
  onDelete: () => void;
}) {
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

function AddGoalModal({ goalTypes, onAdd, onClose }: {
  goalTypes: any[];
  onAdd: (goal: Omit<AdvancedGoal, 'id'>) => void;
  onClose: () => void;
}) {
  const [selectedType, setSelectedType] = useState<AdvancedGoal['type']>('streak');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState<number>(30);
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !target) return;

    onAdd({
      type: selectedType,
      title,
      description,
      target,
      current: 0,
      unit: selectedType === 'streak' ? 'days' : 'drinks',
      deadline: deadline ? new Date(deadline) : undefined,
      isActive: true
    });
  };

  const selectedGoalType = goalTypes.find(gt => gt.value === selectedType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <h3 className="font-semibold">Create New Goal</h3>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
          >
            <CloseIcon />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="card-content space-y-4">
          {/* Goal Type Selection */}
          <div>
            <Label>Goal Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {goalTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    selectedType === type.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <div className="text-lg mb-1">{type.icon}</div>
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs opacity-70">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Goal Details */}
          <div>
            <Label htmlFor="title" required>Goal Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g., ${selectedGoalType?.label}`}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of your goal"
            />
          </div>

          <div>
            <Label htmlFor="target" required>Target</Label>
            <Input
              id="target"
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              min={1}
              required
              rightIcon={
                <span className="text-xs text-neutral-400">
                  {selectedType === 'streak' ? 'days' : 'drinks'}
                </span>
              }
            />
          </div>

          <div>
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Create Goal
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Icon components
function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
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

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}