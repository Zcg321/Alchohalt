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
    <div className="space-y-2">
      <div>
        <Label htmlFor="dailyCap">Daily cap (std drinks)</Label>
        <Input
          id="dailyCap"
          type="number"
          value={goals.dailyCap}
          onChange={handleDailyCap}
          min={0}
        />
      </div>
      <div>
        <Label htmlFor="weeklyGoal">Weekly goal (std drinks)</Label>
        <Input
          id="weeklyGoal"
          type="number"
          value={goals.weeklyGoal}
          onChange={handleWeeklyGoal}
          min={0}
        />
      </div>
      <div>
        <Label htmlFor="pricePerStd">Price per std drink ($)</Label>
        <Input
          id="pricePerStd"
          type="number"
          value={goals.pricePerStd}
          onChange={handlePricePerStd}
          min={0}
          step="0.01"
        />
      </div>
      <div>
        <Label htmlFor="baselineMonthly">Baseline monthly spend ($)</Label>
        <Input
          id="baselineMonthly"
          type="number"
          value={goals.baselineMonthlySpend}
          onChange={handleBaselineMonthly}
          min={0}
          step="0.01"
        />
      </div>
    </div>
  );
}
