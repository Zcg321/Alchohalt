import React, { useState } from 'react';
import type { AdvancedGoal } from './types';
import { useLanguage } from '../../i18n';

/**
 * [R10-A] Templates evolve past 30 days. When a streak goal hits or exceeds
 * its target, this surfaces a "What's next?" prompt with three options:
 *
 *   - Keep going: doubles target (30→60, 60→90, 90→180), preserving history.
 *   - Maintenance: switches type to 'habit', target = 1 (a weekly check-in).
 *   - Maintenance budget: switches type to 'reduction', target = 4 drinks/week.
 *
 * The user's choice is applied via `onEvolve` (which calls editAdvancedGoal).
 * If the user dismisses the prompt, an `acknowledgedAt` field is set so we
 * don't re-surface it for this iteration of the goal. Crossing the next
 * doubled target re-arms it.
 */
type Choice = 'extend' | 'maintenance' | 'budget';

interface Props {
  goal: AdvancedGoal;
  onEvolve: (patch: Partial<AdvancedGoal>) => void;
  onDismiss: () => void;
}

export function shouldShowEvolution(goal: AdvancedGoal): boolean {
  if (goal.type !== 'streak') return false;
  if (!goal.isActive) return false;
  if (goal.target <= 0) return false;
  return goal.current >= goal.target;
}

export function evolutionPatch(goal: AdvancedGoal, choice: Choice): Partial<AdvancedGoal> {
  if (choice === 'extend') {
    return { target: Math.max(goal.target * 2, goal.target + 30) };
  }
  if (choice === 'maintenance') {
    return {
      type: 'habit',
      title: 'Weekly maintenance check-in',
      description: 'A weekly nudge to keep the streak honest.',
      target: 1,
      current: 0,
      unit: 'check-ins',
    };
  }
  return {
    type: 'reduction',
    title: 'Maintenance budget — 4 drinks/week',
    description: 'Allow up to four standard drinks in a week.',
    target: 4,
    current: 0,
    unit: 'drinks',
  };
}

export default function GoalEvolution({ goal, onEvolve, onDismiss }: Props) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState<Choice | null>(null);

  const apply = (choice: Choice) => {
    if (busy) return;
    setBusy(choice);
    onEvolve(evolutionPatch(goal, choice));
  };

  return (
    <div
      role="region"
      aria-label={t('goalEvolution.title', 'Outgrew this goal')}
      className="mt-3 p-3 border-t border-current/10 rounded-md bg-current/5"
    >
      <div className="flex items-start space-x-2 mb-2">
        <span aria-hidden="true" className="text-lg">🌳</span>
        <div className="flex-1">
          <h5 className="font-semibold text-sm">
            {t('goalEvolution.title', "You've outgrown this goal")}
          </h5>
          <p className="text-xs opacity-80">
            {t(
              'goalEvolution.subtitle',
              "Day {{n}} alcohol-free. What's next?"
            ).replace('{{n}}', String(goal.current))}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('goalEvolution.dismiss', 'Not now')}
          className="p-1 rounded hover:bg-current/10 text-xs"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        <button
          type="button"
          onClick={() => apply('extend')}
          disabled={busy !== null}
          className="text-start px-3 py-2 rounded-md border border-current/20 hover:bg-current/10 disabled:opacity-50 transition-colors"
        >
          <div className="font-medium text-sm">
            {t('goalEvolution.extend.title', 'Keep going')}
          </div>
          <div className="text-xs opacity-75">
            {t(
              'goalEvolution.extend.detail',
              'New target: {{n}} days'
            ).replace('{{n}}', String(Math.max(goal.target * 2, goal.target + 30)))}
          </div>
        </button>
        <button
          type="button"
          onClick={() => apply('maintenance')}
          disabled={busy !== null}
          className="text-start px-3 py-2 rounded-md border border-current/20 hover:bg-current/10 disabled:opacity-50 transition-colors"
        >
          <div className="font-medium text-sm">
            {t('goalEvolution.maintenance.title', 'Maintenance: weekly check-in')}
          </div>
          <div className="text-xs opacity-75">
            {t(
              'goalEvolution.maintenance.detail',
              'Switch to a once-a-week pulse instead of a streak.'
            )}
          </div>
        </button>
        <button
          type="button"
          onClick={() => apply('budget')}
          disabled={busy !== null}
          className="text-start px-3 py-2 rounded-md border border-current/20 hover:bg-current/10 disabled:opacity-50 transition-colors"
        >
          <div className="font-medium text-sm">
            {t('goalEvolution.budget.title', 'Maintenance budget')}
          </div>
          <div className="text-xs opacity-75">
            {t(
              'goalEvolution.budget.detail',
              'Allow up to 4 standard drinks per week.'
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
