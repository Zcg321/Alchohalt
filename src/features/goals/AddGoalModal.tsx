import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import type { AdvancedGoal, GoalType } from './types';

interface Props {
  goalTypes: GoalType[];
  onAdd: (goal: Omit<AdvancedGoal, 'id'>) => void;
  onClose: () => void;
}

export default function AddGoalModal({ goalTypes, onAdd, onClose }: Props) {
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

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}