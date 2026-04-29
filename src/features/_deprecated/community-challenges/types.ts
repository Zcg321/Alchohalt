/**
 * Community Challenges — DEPRECATED [IA-6].
 *
 * The "Weekend Warrior / Dry January / Mindful March" community-challenge
 * UI was stripped from the app in Sprint 2B. The interactive surface
 * (SocialChallenges.tsx) shipped with hardcoded participant counts,
 * difficulty tiers, and an auto-joined "Weekend Warrior" — none of
 * which have a real backend. The UX was broken and shipping it would
 * be lying to users.
 *
 * The DATA SHAPE is preserved here so a future "Communities" feature
 * (real participants, real progress, real opt-in) can reuse it without
 * reinventing the schema. Do NOT import this from production code.
 */

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'social' | 'health' | 'mindfulness' | 'special';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  /** e.g. '7 days', '1 month' */
  duration: string;
  participants: number;
  /** 0-100 */
  completionRate: number;
  rewards: {
    points: number;
    badge?: string;
    title?: string;
  };
  requirements: {
    type: 'streak' | 'limit' | 'activity' | 'mood';
    target: number;
    description: string;
  }[];
  startDate?: number;
  endDate?: number;
  joined: boolean;
  progress?: number;
  premium: boolean;
}
