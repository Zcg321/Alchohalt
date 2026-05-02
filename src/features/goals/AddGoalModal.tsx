import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { useFocusTrap } from '../../hooks/useFocusTrap';
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
  const dialogRef = useRef<HTMLDivElement | null>(null);

  /* [A11Y-FOCUS-TRAP] Add dialog semantics + Tab focus trap so the
   * goal-creation modal stops leaking focus to the page underneath. */
  useFocusTrap(dialogRef, true, onClose);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-goal-title"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header flex items-start justify-between gap-3">
          <h3 id="add-goal-title" className="font-semibold flex-1 min-w-0">Create New Goal</h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 -mt-1 -mr-1 p-2 text-ink-subtle hover:text-ink min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500"
            aria-label="Close"
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
                      : 'border-border-soft hover:border-border'
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
                <span className="text-xs text-ink-subtle">
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
    <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}