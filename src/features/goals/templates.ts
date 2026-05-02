import type { AdvancedGoal } from './types';

/**
 * [R9-4] Named goal templates seed common shapes so a new user can
 * pick "Cut to 7 drinks/week" or "30 days clean" instead of building
 * a goal from scratch. Selecting a template prefills the AddGoalModal
 * with type/title/description/target — the user can still edit any
 * field before saving.
 *
 * Localization keys live under `goalTemplates.<id>.title` /
 * `.description` in en/es/fr/de.json. The English strings here serve
 * as both the fallback and the dev-time source of truth.
 *
 * Targets are the proposed default; users can override at any time.
 */
export interface GoalTemplate {
  id:
    | 'monthOff'
    | 'cutToSeven'
    | 'dryWeekdays'
    | 'dryTilThursday'
    | 'halfMyUsual'
    | 'ninetyDayReset';
  type: AdvancedGoal['type'];
  title: string;
  description: string;
  target: number;
  icon: string;
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'monthOff',
    type: 'streak',
    title: '30 days clean',
    description: 'A full alcohol-free month.',
    target: 30,
    icon: '🌱',
  },
  {
    id: 'cutToSeven',
    type: 'reduction',
    title: 'Cut to 7 drinks per week',
    description: 'Reduce weekly total to seven standard drinks.',
    target: 7,
    icon: '📉',
  },
  {
    id: 'dryWeekdays',
    type: 'habit',
    title: 'Dry weekdays',
    description: 'Alcohol-free Monday through Thursday.',
    target: 4,
    icon: '📅',
  },
  {
    id: 'dryTilThursday',
    type: 'habit',
    title: 'Dry-til-Thursday',
    description: 'Push the first drink later in the week.',
    target: 4,
    icon: '⏳',
  },
  {
    id: 'halfMyUsual',
    type: 'reduction',
    title: 'Half my usual',
    description: "Cut weekly intake to half of last month's average.",
    target: 50,
    icon: '✂️',
  },
  {
    id: 'ninetyDayReset',
    type: 'streak',
    title: '90-day reset',
    description: 'A long alcohol-free stretch for a real reset.',
    target: 90,
    icon: '🔥',
  },
];
