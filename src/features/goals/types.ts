export interface AdvancedGoal {
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

export interface GoalType {
  value: AdvancedGoal['type'];
  label: string;
  description: string;
  icon: string;
}

export const goalTypes: GoalType[] = [
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