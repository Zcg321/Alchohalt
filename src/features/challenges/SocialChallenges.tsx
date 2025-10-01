import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { useAnalytics } from '../analytics/analytics';
import type { Drink } from '../drinks/DrinkForm';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'social' | 'health' | 'mindfulness' | 'special';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  duration: string; // e.g., '7 days', '1 month'
  participants: number;
  completionRate: number; // 0-100
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

const ACTIVE_CHALLENGES: Challenge[] = [
  {
    id: 'dry-january-2024',
    title: 'Dry January Challenge',
    description: 'Join thousands in starting the year alcohol-free. Build healthy habits that last.',
    icon: '❄️',
    category: 'special',
    difficulty: 'medium',
    duration: '31 days',
    participants: 12847,
    completionRate: 73,
    rewards: {
      points: 500,
      badge: '🏔️',
      title: 'January Champion'
    },
    requirements: [
      {
        type: 'streak',
        target: 31,
        description: 'Stay alcohol-free for all 31 days of January'
      }
    ],
    startDate: new Date('2024-01-01').getTime(),
    endDate: new Date('2024-01-31').getTime(),
    joined: false,
    premium: false
  },
  {
    id: 'weekend-warrior-feb',
    title: 'Weekend Warrior',
    description: 'Master your weekends - the ultimate test of willpower and social navigation.',
    icon: '🏋️',
    category: 'streak',
    difficulty: 'hard',
    duration: '4 weekends',
    participants: 3245,
    completionRate: 58,
    rewards: {
      points: 300,
      badge: '💪',
      title: 'Weekend Master'
    },
    requirements: [
      {
        type: 'streak',
        target: 4,
        description: 'Stay alcohol-free for 4 consecutive weekends'
      },
      {
        type: 'activity',
        target: 8,
        description: 'Log 8 alternative weekend activities'
      }
    ],
    joined: true,
    progress: 25,
    premium: false
  },
  {
    id: 'mindful-march',
    title: 'Mindful March',
    description: 'Focus on mental wellness with daily check-ins and mindfulness practices.',
    icon: '🧘',
    category: 'mindfulness',
    difficulty: 'easy',
    duration: '31 days',
    participants: 8934,
    completionRate: 82,
    rewards: {
      points: 200,
      badge: '☮️',
      title: 'Zen Achiever'
    },
    requirements: [
      {
        type: 'mood',
        target: 31,
        description: 'Complete daily mood check-ins for all of March'
      },
      {
        type: 'activity',
        target: 15,
        description: 'Practice 15 mindfulness activities'
      }
    ],
    joined: false,
    premium: false
  },
  {
    id: 'social-butterfly-sprint',
    title: 'Social Butterfly Sprint',
    description: 'Navigate 10 social situations while maintaining your alcohol-free commitment.',
    icon: '🦋',
    category: 'social',
    difficulty: 'medium',
    duration: '2 weeks',
    participants: 1876,
    completionRate: 67,
    rewards: {
      points: 150,
      badge: '🌟',
      title: 'Social Navigator'
    },
    requirements: [
      {
        type: 'activity',
        target: 10,
        description: 'Successfully handle 10 social drinking situations'
      },
      {
        type: 'limit',
        target: 0,
        description: 'Maintain zero alcohol consumption during social events'
      }
    ],
    joined: false,
    premium: true
  },
  {
    id: 'health-metrics-challenge',
    title: 'Health Metrics Challenge',
    description: 'Track comprehensive health improvements over 30 days.',
    icon: '📈',
    category: 'health',
    difficulty: 'expert',
    duration: '30 days',
    participants: 567,
    completionRate: 45,
    rewards: {
      points: 400,
      badge: '🏥',
      title: 'Health Data Pro'
    },
    requirements: [
      {
        type: 'mood',
        target: 30,
        description: 'Log daily mood and energy levels'
      },
      {
        type: 'activity',
        target: 20,
        description: 'Track 20 health improvement metrics'
      }
    ],
    joined: false,
    premium: true
  },
  {
    id: 'community-support-challenge',
    title: 'Community Support Challenge',
    description: 'Help and encourage others in their alcohol-free journey.',
    icon: '🤝',
    category: 'social',
    difficulty: 'medium',
    duration: '3 weeks',
    participants: 2341,
    completionRate: 71,
    rewards: {
      points: 250,
      badge: '❤️',
      title: 'Community Champion'
    },
    requirements: [
      {
        type: 'activity',
        target: 15,
        description: 'Provide support or encouragement to community members'
      },
      {
        type: 'streak',
        target: 21,
        description: 'Maintain your own alcohol-free streak'
      }
    ],
    joined: false,
    premium: true
  }
];

interface Props {
  drinks: Drink[];
  currentStreak: number;
  onJoinChallenge: (challengeId: string) => void;
  className?: string;
}

export default function SocialChallenges({ 
  drinks: _drinks, 
  currentStreak: _currentStreak, 
  onJoinChallenge, 
  className = '' 
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showJoined, setShowJoined] = useState(false);
  const { isPremium } = usePremiumFeatures();
  const { trackFeatureUsage } = useAnalytics();

  const filteredChallenges = useMemo(() => {
    let challenges = ACTIVE_CHALLENGES.filter(c => !c.premium || isPremium);
    
    if (selectedCategory !== 'all') {
      challenges = challenges.filter(c => c.category === selectedCategory);
    }
    
    if (showJoined) {
      challenges = challenges.filter(c => c.joined);
    }
    
    // Sort by: joined first, then by participants (popularity)
    return challenges.sort((a, b) => {
      if (a.joined && !b.joined) return -1;
      if (!a.joined && b.joined) return 1;
      return b.participants - a.participants;
    });
  }, [selectedCategory, showJoined, isPremium]);

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'hard': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'expert': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
  };

  const handleJoinChallenge = (challenge: Challenge) => {
    trackFeatureUsage('challenge_join', {
      challenge_id: challenge.id,
      category: challenge.category,
      difficulty: challenge.difficulty,
      participants: challenge.participants
    });
    onJoinChallenge(challenge.id);
  };

  const ChallengeCard = ({ challenge }: { challenge: Challenge }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${
      challenge.joined 
        ? 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/20' 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{challenge.icon}</div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {challenge.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className={`text-xs px-2 py-0 ${getDifficultyColor(challenge.difficulty)}`}>
                {challenge.difficulty}
              </Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {challenge.duration}
              </span>
            </div>
          </div>
        </div>
        
        {challenge.joined && (
          <Badge variant="primary" className="text-xs">
            Joined
          </Badge>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {challenge.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-center">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
          <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
            {challenge.participants.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Participants</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {challenge.completionRate}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Success Rate</div>
        </div>
      </div>

      {/* Requirements Preview */}
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Key Requirements:
        </div>
        <div className="space-y-1">
          {challenge.requirements.slice(0, 2).map((req, index) => (
            <div key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
              <span className="text-primary-500 mt-0.5">•</span>
              <span>{req.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress (for joined challenges) */}
      {challenge.joined && challenge.progress !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{challenge.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${challenge.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Rewards */}
      <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <div className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">
          🎁 Rewards:
        </div>
        <div className="text-xs text-yellow-700 dark:text-yellow-400">
          {challenge.rewards.points} points
          {challenge.rewards.badge && ` • ${challenge.rewards.badge} Badge`}
          {challenge.rewards.title && ` • "${challenge.rewards.title}" Title`}
        </div>
      </div>

      {/* Action Button */}
      <Button
        variant={challenge.joined ? "outline" : "primary"}
        className="w-full text-sm h-9"
        onClick={() => !challenge.joined && handleJoinChallenge(challenge)}
        disabled={challenge.joined}
      >
        {challenge.joined ? 'Already Joined' : 'Join Challenge'}
      </Button>
    </div>
  );

  const categories = [
    { id: 'all', name: 'All', icon: '🌟' },
    { id: 'streak', name: 'Streak', icon: '🔥' },
    { id: 'social', name: 'Social', icon: '👥' },
    { id: 'health', name: 'Health', icon: '💚' },
    { id: 'mindfulness', name: 'Mindfulness', icon: '🧘' },
    { id: 'special', name: 'Special', icon: '🎉' }
  ];

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          🏆 Community Challenges
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Join others in structured challenges to stay motivated and accountable
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'primary' : 'outline'}
            className="text-xs h-8 px-3"
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.icon} {category.name}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showJoined}
            onChange={(e) => setShowJoined(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-gray-700 dark:text-gray-300">Show only joined challenges</span>
        </label>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredChallenges.map(challenge => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>

      {/* No Results */}
      {filteredChallenges.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">🔍</p>
          <p>No challenges found matching your criteria.</p>
          <Button 
            variant="outline" 
            className="mt-3 text-sm"
            onClick={() => {
              setSelectedCategory('all');
              setShowJoined(false);
            }}
          >
            Show All Challenges
          </Button>
        </div>
      )}

      {/* Premium Upsell */}
      {!isPremium && ACTIVE_CHALLENGES.some(c => c.premium) && (
        <div className="mt-6 p-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg text-center">
          <h3 className="font-semibold mb-1">🚀 Premium Challenge Collection</h3>
          <p className="text-sm opacity-90 mb-3">
            Access exclusive challenges with advanced tracking, expert guidance, and premium rewards.
          </p>
          <Button 
            variant="secondary" 
            className="bg-white text-primary-600 hover:bg-gray-100"
            onClick={() => trackFeatureUsage('challenges_upgrade_prompt')}
          >
            Upgrade to Premium
          </Button>
        </div>
      )}
    </div>
  );
}