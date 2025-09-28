// @no-smoke
import React from 'react';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';

export interface Goals {
  dailyCap: number;
  weeklyGoal: number;
  pricePerStd: number;
  baselineMonthlySpend: number;
}

interface Props {
  goals: Goals;
  onChange(goals: Goals): void;
}

export function GoalSettings({ goals, onChange }: Props) {
  function handleDailyCap(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...goals, dailyCap: Number(e.target.value) });
  }

  function handleWeeklyGoal(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...goals, weeklyGoal: Number(e.target.value) });
  }

  function handlePricePerStd(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...goals, pricePerStd: Number(e.target.value) });
  }

  function handleBaselineMonthly(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...goals, baselineMonthlySpend: Number(e.target.value) });
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold flex items-center">
          <span className="w-2 h-2 bg-warning-500 rounded-full mr-3"></span>
          Goals & Budget
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Set your personal targets and spending limits
        </p>
      </div>
      
      <div className="card-content">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="dailyCap">Daily limit</Label>
            <Input
              id="dailyCap"
              type="number"
              value={goals.dailyCap}
              onChange={handleDailyCap}
              min={0}
              rightIcon={
                <span className="text-xs text-neutral-400">drinks</span>
              }
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="weeklyGoal">Weekly goal</Label>
            <Input
              id="weeklyGoal"
              type="number"
              value={goals.weeklyGoal}
              onChange={handleWeeklyGoal}
              min={0}
              rightIcon={
                <span className="text-xs text-neutral-400">drinks</span>
              }
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="pricePerStd">Price per drink</Label>
            <Input
              id="pricePerStd"
              type="number"
              value={goals.pricePerStd}
              onChange={handlePricePerStd}
              min={0}
              step="0.01"
              leftIcon={
                <span className="text-xs text-neutral-400">$</span>
              }
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="baselineMonthly">Monthly budget</Label>
            <Input
              id="baselineMonthly"
              type="number"
              value={goals.baselineMonthlySpend}
              onChange={handleBaselineMonthly}
              min={0}
              step="0.01"
              leftIcon={
                <span className="text-xs text-neutral-400">$</span>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
