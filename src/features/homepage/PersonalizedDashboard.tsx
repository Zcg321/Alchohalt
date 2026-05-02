import React from 'react';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../../types/common';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { useAnalytics } from '../analytics/analytics';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  type PersonalizationData,
  getPersonalizedContent,
  usePersonalization,
} from './usePersonalization';

interface Props {
  drinks?: Drink[];
  goals?: Goals;
  onQuickAction?: (action: string) => void;
}

const TREND_GLYPH: Record<PersonalizationData['motivationalTrend'], string> = {
  improving: '↗',
  stable: '→',
  concerning: '↘',
};

const TREND_LABEL: Record<PersonalizationData['motivationalTrend'], string> = {
  improving: 'Trending up',
  stable: 'Steady',
  concerning: 'Worth a closer look',
};

const TREND_PILL_CLASS: Record<PersonalizationData['motivationalTrend'], string> = {
  improving: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  stable: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  concerning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

function DashboardGreeting({
  greeting,
  focusArea,
  motivationalMessage,
  isPremium,
}: {
  greeting: string;
  focusArea: string;
  motivationalMessage: string;
  isPremium: boolean;
}) {
  return (
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{greeting}</h2>
      <div className="flex items-center justify-center gap-2 mb-3">
        <Badge variant="secondary">{focusArea}</Badge>
        {isPremium && (
          <Badge variant="primary" className="text-xs">
            Adapted to you
          </Badge>
        )}
      </div>
      <p className="text-gray-600 dark:text-gray-300 italic">{motivationalMessage}</p>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: PersonalizationData['motivationalTrend'] }) {
  return (
    <div className="flex justify-center mb-6">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${TREND_PILL_CLASS[trend]}`}>
        <span className="text-lg" aria-hidden>
          {TREND_GLYPH[trend]}
        </span>
        <span>{TREND_LABEL[trend]}</span>
      </div>
    </div>
  );
}

function ActionGrid({
  primaryAction,
  secondaryActions,
  onAction,
}: {
  primaryAction: string;
  secondaryActions: string[];
  onAction: (action: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Button variant="primary" className="h-12 text-base font-medium" onClick={() => onAction(primaryAction)}>
        {primaryAction}
      </Button>
      {secondaryActions.map((action, index) => (
        <Button
          key={action}
          variant={index === 0 ? 'secondary' : 'outline'}
          className="h-12"
          onClick={() => onAction(action)}
        >
          {action}
        </Button>
      ))}
    </div>
  );
}

export default function PersonalizedDashboard({ drinks = [], goals, onQuickAction = () => {} }: Props) {
  const { isPremium } = usePremiumFeatures();
  const { trackFeatureUsage } = useAnalytics();
  const personalization = usePersonalization(drinks, goals);
  const content = getPersonalizedContent(personalization);

  const handleAction = (action: string) => {
    trackFeatureUsage('personalized_dashboard_action', {
      action,
      personality_type: personalization.personalityType,
      engagement_level: personalization.engagementLevel,
    });
    onQuickAction(action);
  };

  return (
    <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-xl border border-primary-100 dark:border-gray-700 mb-6">
      <DashboardGreeting
        greeting={content.greeting}
        focusArea={content.focusArea}
        motivationalMessage={content.motivationalMessage}
        isPremium={isPremium}
      />
      <TrendIndicator trend={personalization.motivationalTrend} />
      <ActionGrid
        primaryAction={content.primaryAction}
        secondaryActions={content.secondaryActions}
        onAction={handleAction}
      />
    </div>
  );
}
