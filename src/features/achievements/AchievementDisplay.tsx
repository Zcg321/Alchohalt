import React, { useMemo } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { Achievement, AchievementState } from './achievementSystem';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { useAnalytics } from '../analytics/analytics';

interface Props {
  achievementState?: AchievementState;
  onUpgrade?: () => void;
  showAll?: boolean;
  className?: string;
}

export default function AchievementDisplay({ 
  achievementState, 
  onUpgrade, 
  showAll = false,
  className = '' 
}: Props) {
  const { isPremium } = usePremiumFeatures();
  const { trackFeatureUsage } = useAnalytics();

  // Provide default values if achievementState is undefined
  if (!achievementState) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          No achievement data available
        </div>
      </div>
    );
  }

  const { achievements, totalPoints, unlockedCount, level, nextLevelPoints } = achievementState;

  const displayAchievements = useMemo(() => {
    if (showAll) return achievements;
    
    // Show recently unlocked + next milestones
    const unlocked = achievements.filter(a => a.unlocked).slice(-3);
    const inProgress = achievements
      .filter(a => !a.unlocked && a.progress > 0 && (!a.premium || isPremium))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);
    
    return [...unlocked, ...inProgress];
  }, [achievements, showAll, isPremium]);

  const getTierColor = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
      case 'silver': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
      case 'gold': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'platinum': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
      case 'diamond': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const handleAchievementClick = (achievement: Achievement) => {
    trackFeatureUsage('achievement_viewed', {
      achievement_id: achievement.id,
      unlocked: achievement.unlocked,
      tier: achievement.tier,
      category: achievement.category
    });
  };

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => (
    <div 
      className={`relative p-4 rounded-lg border transition-all duration-200 cursor-pointer group ${
        achievement.unlocked 
          ? 'bg-white dark:bg-gray-800 border-green-200 dark:border-green-800 shadow-sm hover:shadow-md' 
          : achievement.premium && !isPremium
          ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 opacity-75'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800'
      }`}
      onClick={() => handleAchievementClick(achievement)}
    >
      {/* Premium Lock */}
      {achievement.premium && !isPremium && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
            🔒
          </div>
        </div>
      )}

      {/* Achievement Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`text-2xl flex-shrink-0 ${achievement.unlocked ? '' : 'grayscale opacity-60'}`}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold text-sm ${
              achievement.unlocked 
                ? 'text-gray-900 dark:text-white' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {achievement.title}
            </h3>
            <Badge 
              variant="secondary" 
              className={`text-xs px-2 py-0 ${getTierColor(achievement.tier)}`}
            >
              {achievement.tier}
            </Badge>
          </div>
          <p className={`text-xs ${
            achievement.unlocked 
              ? 'text-gray-700 dark:text-gray-300' 
              : 'text-gray-500 dark:text-gray-500'
          }`}>
            {achievement.description}
          </p>
        </div>
      </div>

      {/* Progress */}
      {!achievement.unlocked && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress: {achievement.current}/{achievement.requirement}</span>
            <span>{achievement.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${achievement.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Reward */}
      <div className="flex items-center justify-between">
        <div className={`text-xs font-medium ${
          achievement.unlocked 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-gray-500 dark:text-gray-500'
        }`}>
          {achievement.unlocked ? '✅ Unlocked!' : `${achievement.points} points`}
        </div>
        
        {achievement.unlocked && achievement.unlockedAt && (
          <div className="text-xs text-gray-500 dark:text-gray-500">
            {new Date(achievement.unlockedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={className}>
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-4 rounded-lg mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{level}</div>
            <div className="text-sm opacity-90">Level</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-sm opacity-90">Points</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{unlockedCount}</div>
            <div className="text-sm opacity-90">Unlocked</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{nextLevelPoints}</div>
            <div className="text-sm opacity-90">To Next Level</div>
          </div>
        </div>
        
        {/* Level Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm opacity-90 mb-1">
            <span>Level {level}</span>
            <span>Level {level + 1}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-300"
              style={{ width: `${((totalPoints % 100) / 100) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayAchievements.map(achievement => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {/* Show All Button */}
      {!showAll && achievements.length > displayAchievements.length && (
        <div className="text-center mt-6">
          <Button variant="outline" className="text-sm">
            View All {achievements.length} Achievements
          </Button>
        </div>
      )}

      {/* Premium Upsell */}
      {!isPremium && achievements.some(a => a.premium) && (
        <div className="mt-6 p-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg text-center">
          <h3 className="font-semibold mb-1">🏆 Premium Achievement Collection</h3>
          <p className="text-sm opacity-90 mb-3">
            Unlock {achievements.filter(a => a.premium).length} exclusive premium achievements with advanced tracking and rewards.
          </p>
          <Button 
            variant="secondary" 
            className="bg-white text-primary-600 hover:bg-gray-100"
            onClick={() => {
              trackFeatureUsage('achievement_upgrade_prompt');
              onUpgrade?.();
            }}
          >
            Upgrade to Premium
          </Button>
        </div>
      )}
    </div>
  );
}