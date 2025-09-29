import React, { useMemo } from 'react';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../goals/GoalSettings';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { useAnalytics } from '../analytics/analytics';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface Props {
  drinks: Drink[];
  goals: Goals;
  onQuickAction: (action: string) => void;
}

interface PersonalizationData {
  preferredDrinkTypes: string[];
  riskTimes: string[];
  motivationalTrend: 'improving' | 'stable' | 'concerning';
  personalityType: 'goal-oriented' | 'social' | 'health-focused' | 'casual';
  engagementLevel: 'high' | 'medium' | 'low';
}

export default function PersonalizedDashboard({ drinks, goals, onQuickAction }: Props) {
  const { isPremium, canAccessAIInsights } = usePremiumFeatures();
  const { trackFeatureUsage } = useAnalytics();

  const personalization = useMemo((): PersonalizationData => {
    const last30Days = drinks.filter(d => d.ts > Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Analyze drink preferences
    const drinkTypes = last30Days.reduce((acc, drink) => {
      if (drink.volumeMl > 300) acc.beer = (acc.beer || 0) + 1;
      else if (drink.abvPct > 15) acc.spirits = (acc.spirits || 0) + 1;
      else acc.wine = (acc.wine || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredDrinkTypes = Object.entries(drinkTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([type]) => type);

    // Analyze risk times
    const hourCounts = last30Days.reduce((acc, drink) => {
      const hour = new Date(drink.ts).getHours();
      if (hour >= 17 && hour <= 22) acc.evening++;
      else if (hour >= 12 && hour <= 16) acc.afternoon++;
      else if (hour >= 22 || hour <= 2) acc.night++;
      else acc.other++;
      return acc;
    }, { evening: 0, afternoon: 0, night: 0, other: 0 });

    const riskTimes = Object.entries(hourCounts)
      .filter(([, count]) => count > 0)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([time]) => time);

    // Determine motivational trend
    const recent = drinks.slice(0, 7);
    const previous = drinks.slice(7, 14);
    const recentAvg = recent.length > 0 ? recent.reduce((sum, d) => sum + d.craving, 0) / recent.length : 0;
    const previousAvg = previous.length > 0 ? previous.reduce((sum, d) => sum + d.craving, 0) / previous.length : 0;
    
    const motivationalTrend = recentAvg < previousAvg ? 'improving' : 
                             recentAvg === previousAvg ? 'stable' : 'concerning';

    // Determine personality type based on goals and behavior
    let personalityType: PersonalizationData['personalityType'] = 'casual';
    if (goals.dailyCap > 0 || goals.weeklyGoal > 0) personalityType = 'goal-oriented';
    if (last30Days.some(d => d.intention === 'social')) personalityType = 'social';
    if (last30Days.some(d => d.halt?.includes('angry') || d.halt?.includes('lonely'))) {
      personalityType = 'health-focused';
    }

    // Determine engagement level
    const recentEntries = drinks.filter(d => d.ts > Date.now() - 7 * 24 * 60 * 60 * 1000).length;
    const engagementLevel = recentEntries > 5 ? 'high' : recentEntries > 2 ? 'medium' : 'low';

    return {
      preferredDrinkTypes,
      riskTimes,
      motivationalTrend,
      personalityType,
      engagementLevel
    };
  }, [drinks, goals]);

  const personalizedContent = useMemo(() => {
    const content = {
      greeting: '',
      primaryAction: '',
      secondaryActions: [] as string[],
      motivationalMessage: '',
      focusArea: ''
    };

    const timeOfDay = new Date().getHours();
    const greeting = timeOfDay < 12 ? 'Good morning' : timeOfDay < 17 ? 'Good afternoon' : 'Good evening';

    switch (personalization.personalityType) {
      case 'goal-oriented':
        content.greeting = `${greeting}! Ready to crush your goals today?`;
        content.primaryAction = 'Check Goal Progress';
        content.secondaryActions = ['Set New Challenge', 'View Analytics'];
        content.motivationalMessage = 'Consistency builds champions. Every choice counts.';
        content.focusArea = 'Achievement & Progress';
        break;

      case 'social':
        content.greeting = `${greeting}! Planning anything fun today?`;
        content.primaryAction = 'Social Alternatives';
        content.secondaryActions = ['Find AF Events', 'Track Social Goals'];
        content.motivationalMessage = 'Great connections don\'t need alcohol to flourish.';
        content.focusArea = 'Social Wellness';
        break;

      case 'health-focused':
        content.greeting = `${greeting}! How are you feeling today?`;
        content.primaryAction = 'Mood Check-in';
        content.secondaryActions = ['Stress Management', 'Health Insights'];
        content.motivationalMessage = 'Your mental and physical health are your greatest assets.';
        content.focusArea = 'Holistic Wellness';
        break;

      default:
        content.greeting = `${greeting}! Take it one day at a time.`;
        content.primaryAction = 'Quick Log';
        content.secondaryActions = ['Explore Features', 'Set Goals'];
        content.motivationalMessage = 'Small steps lead to big changes.';
        content.focusArea = 'Mindful Living';
    }

    return content;
  }, [personalization]);

  const handlePersonalizedAction = (action: string) => {
    trackFeatureUsage('personalized_dashboard_action', { 
      action, 
      personality_type: personalization.personalityType,
      engagement_level: personalization.engagementLevel
    });
    onQuickAction(action);
  };

  return (
    <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-xl border border-primary-100 dark:border-gray-700 mb-6">
      {/* Personalized Greeting */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {personalizedContent.greeting}
        </h2>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Badge variant="secondary">{personalizedContent.focusArea}</Badge>
          {isPremium && (
            <Badge variant="primary" className="text-xs">
              AI Personalized
            </Badge>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-300 italic">
          {personalizedContent.motivationalMessage}
        </p>
      </div>

      {/* Trend Indicator */}
      <div className="flex justify-center mb-6">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          personalization.motivationalTrend === 'improving' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : personalization.motivationalTrend === 'stable'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
        }`}>
          <span className="text-lg">
            {personalization.motivationalTrend === 'improving' ? '📈' : 
             personalization.motivationalTrend === 'stable' ? '➡️' : '📊'}
          </span>
          <span>
            {personalization.motivationalTrend === 'improving' ? 'Trending Up' : 
             personalization.motivationalTrend === 'stable' ? 'Staying Steady' : 'Needs Attention'}
          </span>
        </div>
      </div>

      {/* Personalized Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Button 
          variant="primary"
          className="h-12 text-base font-medium"
          onClick={() => handlePersonalizedAction(personalizedContent.primaryAction)}
        >
          {personalizedContent.primaryAction}
        </Button>
        
        {personalizedContent.secondaryActions.map((action, index) => (
          <Button 
            key={action}
            variant={index === 0 ? "secondary" : "outline"}
            className="h-12"
            onClick={() => handlePersonalizedAction(action)}
          >
            {action}
          </Button>
        ))}
      </div>

      {/* Premium Upsell for Free Users */}
      {!isPremium && (
        <div className="mt-6 p-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg text-center">
          <h3 className="font-semibold mb-1">🚀 Unlock Advanced Personalization</h3>
          <p className="text-sm opacity-90 mb-3">
            Get AI-powered insights, predictive analytics, and custom coaching tailored to your unique patterns.
          </p>
          <Button 
            variant="secondary" 
            className="bg-white text-primary-600 hover:bg-gray-100"
            onClick={() => handlePersonalizedAction('upgrade')}
          >
            Upgrade to Premium
          </Button>
        </div>
      )}
    </div>
  );
}