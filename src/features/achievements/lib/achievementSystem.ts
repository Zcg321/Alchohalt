import type { Drink } from '../../drinks/DrinkForm';
import type { Goals } from '../../../types/common';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'goal' | 'health' | 'social' | 'milestone' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  points: number;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number; // 0-100
  requirement: number;
  current: number;
  premium: boolean;
}

export interface AchievementState {
  achievements: Achievement[];
  totalPoints: number;
  unlockedCount: number;
  level: number;
  nextLevelPoints: number;
}

const BASE_ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress' | 'current'>[] = [
  // Streak Achievements
  {
    id: 'first-day',
    title: 'First Step',
    description: 'Complete your first alcohol-free day',
    icon: '🌱',
    category: 'streak',
    tier: 'bronze',
    points: 10,
    requirement: 1,
    premium: false
  },
  {
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day alcohol-free streak',
    icon: '🗓️',
    category: 'streak',
    tier: 'silver',
    points: 50,
    requirement: 7,
    premium: false
  },
  {
    id: 'month-master',
    title: 'Month Master',
    description: 'Achieve 30 consecutive alcohol-free days',
    icon: '🌙',
    category: 'streak',
    tier: 'gold',
    points: 200,
    requirement: 30,
    premium: false
  },
  {
    id: 'hundred-club',
    title: 'Hundred Club',
    description: 'Reach 100 days alcohol-free',
    icon: '💯',
    category: 'streak',
    tier: 'platinum',
    points: 500,
    requirement: 100,
    premium: true
  },
  {
    id: 'year-champion',
    title: 'Year Champion',
    description: 'Complete a full year alcohol-free',
    icon: '🏆',
    category: 'streak',
    tier: 'diamond',
    points: 2000,
    requirement: 365,
    premium: true
  },

  // Goal Achievements
  {
    id: 'goal-setter',
    title: 'Goal Setter',
    description: 'Set your first personal goal',
    icon: '🎯',
    category: 'goal',
    tier: 'bronze',
    points: 20,
    requirement: 1,
    premium: false
  },
  {
    id: 'goal-crusher',
    title: 'Goal Crusher',
    description: 'Achieve 5 personal goals',
    icon: '⚡',
    category: 'goal',
    tier: 'gold',
    points: 150,
    requirement: 5,
    premium: true
  },

  // Health Achievements
  {
    id: 'mood-tracker',
    title: 'Mood Tracker',
    description: 'Complete 10 mood check-ins',
    icon: '😌',
    category: 'health',
    tier: 'silver',
    points: 40,
    requirement: 10,
    premium: false
  },
  {
    id: 'craving-conqueror',
    title: 'Craving Conqueror',
    description: 'Log 20 entries with craving level 2 or lower',
    icon: '🛡️',
    category: 'health',
    tier: 'gold',
    points: 100,
    requirement: 20,
    premium: true
  },
  {
    id: 'zen-master',
    title: 'Zen Master',
    description: 'Maintain average craving level below 1.0 for 30 days',
    icon: '🧘',
    category: 'health',
    tier: 'platinum',
    points: 300,
    requirement: 30,
    premium: true
  },

  // Social Achievements
  {
    id: 'social-butterfly',
    title: 'Social Butterfly',
    description: 'Log 10 social drinking alternatives',
    icon: '🦋',
    category: 'social',
    tier: 'silver',
    points: 60,
    requirement: 10,
    premium: false
  },
  {
    id: 'influence-expert',
    title: 'Influence Expert',
    description: 'Handle 50 social drinking situations successfully',
    icon: '🌟',
    category: 'social',
    tier: 'gold',
    points: 200,
    requirement: 50,
    premium: true
  },

  // Milestone Achievements
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    description: 'Log 100 drink entries with detailed information',
    icon: '📊',
    category: 'milestone',
    tier: 'silver',
    points: 80,
    requirement: 100,
    premium: false
  },
  {
    id: 'money-saver',
    title: 'Money Saver',
    description: 'Save $500 by tracking avoided alcohol purchases',
    icon: '💰',
    category: 'milestone',
    tier: 'gold',
    points: 150,
    requirement: 500,
    premium: true
  },

  // Special Achievements
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Log a mood check-in before 8 AM for 7 consecutive days',
    icon: '🐦',
    category: 'special',
    tier: 'gold',
    points: 120,
    requirement: 7,
    premium: true
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: 'Stay alcohol-free for 4 consecutive weekends',
    icon: '🏋️',
    category: 'special',
    tier: 'platinum',
    points: 250,
    requirement: 4,
    premium: true
  },
  {
    id: 'holiday-hero',
    title: 'Holiday Hero',
    description: 'Stay alcohol-free during major holidays',
    icon: '🎉',
    category: 'special',
    tier: 'diamond',
    points: 400,
    requirement: 3,
    premium: true
  }
];

interface MoodEntry {
  ts: number;
  mood: number;
}

function getAchievementCurrent(achievementId: string, drinks: Drink[], goals: Goals, currentStreak: number, moodEntries: MoodEntry[], savedMoney: number): number {
  switch (achievementId) {
    case 'first-day':
    case 'week-warrior':
    case 'month-master':
    case 'hundred-club':
    case 'year-champion':
      return currentStreak;

    case 'goal-setter':
      return (goals.dailyCap > 0 ? 1 : 0) + (goals.weeklyGoal > 0 ? 1 : 0);

    case 'goal-crusher':
      return 0; // This would need a more sophisticated goal tracking system

    case 'mood-tracker':
      return moodEntries.length;

    case 'craving-conqueror':
      return drinks.filter(d => d.craving <= 2).length;

    case 'zen-master': {
      const last30Days = drinks.filter(d => d.ts > Date.now() - 30 * 24 * 60 * 60 * 1000);
      const avgCraving = last30Days.length > 0 
        ? last30Days.reduce((sum, d) => sum + d.craving, 0) / last30Days.length 
        : 0;
      return avgCraving <= 1.0 && last30Days.length >= 30 ? 30 : 0;
    }

    case 'social-butterfly':
      return drinks.filter(d => d.intention === 'social' && d.alt).length;

    case 'influence-expert':
      return drinks.filter(d => d.intention === 'social').length;

    case 'data-analyst':
      return drinks.filter(d => d.alt || d.halt?.length).length;

    case 'money-saver':
      return Math.floor(savedMoney);

    case 'weekend-warrior':
      return getConsecutiveAlcoholFreeWeekends(drinks);

    default:
      return 0;
  }
}

export function calculateAchievementProgress(
  drinks: Drink[], 
  goals: Goals,
  moodEntries: MoodEntry[] = [],
  currentStreak: number = 0,
  savedMoney: number = 0
): AchievementState {
  const achievements: Achievement[] = BASE_ACHIEVEMENTS.map(base => {
    const current = getAchievementCurrent(base.id, drinks, goals, currentStreak, moodEntries, savedMoney);
    const unlocked = current >= base.requirement;
    const progress = base.requirement > 0 
      ? Math.min(100, Math.floor((current / base.requirement) * 100))
      : 0;

    return {
      ...base,
      current,
      progress,
      unlocked,
      unlockedAt: unlocked ? Date.now() : undefined
    };
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  // Calculate level (every 100 points = 1 level)
  const level = Math.floor(totalPoints / 100) + 1;
  const nextLevelPoints = (level * 100) - totalPoints;

  return {
    achievements,
    totalPoints,
    unlockedCount,
    level,
    nextLevelPoints
  };
}

function getConsecutiveAlcoholFreeWeekends(drinks: Drink[]): number {
  // Implementation to check consecutive alcohol-free weekends
  const now = new Date();
  let consecutiveWeekends = 0;
  
  for (let i = 0; i < 12; i++) { // Check last 12 weekends
    const weekendStart = new Date(now);
    weekendStart.setDate(now.getDate() - (now.getDay() + 7 * i - 6) % 7); // Saturday
    weekendStart.setHours(0, 0, 0, 0);
    
    const weekendEnd = new Date(weekendStart);
    weekendEnd.setDate(weekendStart.getDate() + 2); // Sunday end
    weekendEnd.setHours(23, 59, 59, 999);
    
    const weekendDrinks = drinks.filter(d => 
      d.ts >= weekendStart.getTime() && d.ts <= weekendEnd.getTime()
    );
    
    if (weekendDrinks.length === 0) {
      consecutiveWeekends++;
    } else {
      break;
    }
  }
  
  return consecutiveWeekends;
}

export function getNewlyUnlockedAchievements(
  previousAchievements: Achievement[],
  currentAchievements: Achievement[]
): Achievement[] {
  return currentAchievements.filter(current => {
    const previous = previousAchievements.find(p => p.id === current.id);
    return current.unlocked && (!previous || !previous.unlocked);
  });
}

export function getAchievementsByCategory(achievements: Achievement[]): Record<string, Achievement[]> {
  return achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) acc[achievement.category] = [];
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);
}

export function getNextMilestones(achievements: Achievement[], limit = 3): Achievement[] {
  return achievements
    .filter(a => !a.unlocked && a.progress > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit);
}