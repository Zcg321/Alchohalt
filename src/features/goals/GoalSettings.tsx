/**
 * GoalSettings — daily cap / weekly goal / price-per-std / baseline.
 *
 * [BUG-GOALS-EMPTY-ROUND-4] Round 4 6-judge pass turned up that this
 * file had been replaced by a codemod split into `./GoalSettings/{index,
 * TopSection, BehaviorSection, SpendSection}` — and the splits were
 * left as empty `<div data-testid="..." />` stubs. The Goals tab
 * rendered the section heading but no inputs at all; the user could
 * not set their daily cap, weekly goal, price per std, or baseline
 * monthly spend from the UI. AdvancedGoalSetting (rendered just below
 * on the tab) covered named challenge goals, but the canonical
 * dailyCap / weeklyGoal limits — the values used by the Today panel,
 * the Hard-Time panel quiet rule, every cap calculation in lib/calc —
 * had no UI surface. Restored from the pre-codemod implementation.
 *
 * Smoke-test for the splits is removed (the stubs are deleted); the
 * existing GoalSettings.smoke.test.tsx still exercises this file via
 * the same auto-import pattern.
 */

import React from 'react';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import type { Goals } from '../../types/common';
import { useDB } from '../../store/db';

interface Props {
  goals: Goals;
  onChange(goals: Goals): void;
}

export default function GoalSettings({ goals, onChange }: Props) {
  const goalNudgesEnabled = useDB((s) => s.db.settings.goalNudgesEnabled === true);
  const setSettings = useDB((s) => s.setSettings);

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
  function handleNudgesToggle(e: React.ChangeEvent<HTMLInputElement>) {
    setSettings({
      goalNudgesEnabled: e.target.checked,
      goalNudgeDismissedAt: undefined,
    });
  }

  return (
    <div className="space-y-3">
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
      {/* [R15-2] Goal-nudge opt-in. Off by default; renders an in-app
          banner on Insights when trailing-7-day avg exceeds dailyCap.
          One-tap dismiss suppresses for 7 days. No system notification. */}
      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={goalNudgesEnabled}
            onChange={handleNudgesToggle}
            data-testid="goal-nudges-toggle"
            className="mt-0.5 w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
            aria-label="Show goal nudges"
          />
          <span className="space-y-0.5">
            <span className="block text-sm font-medium text-ink">Show goal nudges</span>
            <span className="block text-xs text-ink-soft">
              When your trailing-week average is above your daily cap, show a quiet banner on Insights asking if you want to revisit the goal. Once a week, dismissable.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}
