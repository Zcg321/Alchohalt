import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
}

export interface UserSubscription {
  plan: string;
  status: 'active' | 'inactive' | 'cancelled' | 'trial';
  expiresAt?: Date;
  trialEndsAt?: Date;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      'Basic drink logging',
      'Simple streak tracking',
      'Basic goal setting',
      'Limited insights (last 7 days)',
      'Standard mood check-ins'
    ]
  },
  {
    id: 'premium_monthly',
    name: 'Premium',
    price: 9.99,
    interval: 'month',
    popular: true,
    features: [
      'Everything in Free',
      'Advanced AI insights & pattern analysis',
      'Detailed mood tracking with triggers',
      'Custom goal types & deadlines',
      'Advanced progress visualization',
      'Data export (PDF, CSV)',
      'Smart recommendations',
      'Priority customer support',
      'Ad-free experience'
    ]
  },
  {
    id: 'premium_yearly',
    name: 'Premium Annual',
    price: 79.99,
    interval: 'year',
    features: [
      'Everything in Premium Monthly',
      '33% savings vs monthly',
      'Exclusive annual insights report',
      'Priority beta feature access',
      'Extended data history (unlimited)',
      'Custom data analysis requests'
    ]
  }
];

interface Props {
  currentSubscription?: UserSubscription;
  onSubscribe: (planId: string) => Promise<void>;
  onCancel: () => Promise<void>;
  className?: string;
}

export default function SubscriptionManager({ 
  currentSubscription, 
  onSubscribe, 
  onCancel, 
  className 
}: Props) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const isPremium = currentSubscription?.status === 'active' && 
                   (currentSubscription.plan === 'premium_monthly' || 
                    currentSubscription.plan === 'premium_yearly');

  const isTrialActive = currentSubscription?.status === 'trial' && 
                       currentSubscription.trialEndsAt && 
                       new Date() < currentSubscription.trialEndsAt;

  const handleSubscribe = async (planId: string) => {
    if (loading) return;
    setLoading(true);
    try {
      await onSubscribe(planId);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onCancel();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className || ''}`}>
      {/* Trial/Premium Status Banner */}
      {(isPremium || isTrialActive) && (
        <div className={`mb-6 p-4 rounded-lg ${
          isPremium ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                    : 'bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                {isPremium ? '🎉 Premium Active' : '✨ Free Trial Active'}
              </h3>
              <p className="text-sm opacity-90">
                {isPremium 
                  ? 'Your premium subscription is active' 
                  : 'Trial ends in 7 days - upgrade to keep premium features'}
              </p>
            </div>
            {isPremium && (
              <Button variant="secondary" size="sm" onClick={handleCancel} disabled={loading}>
                Manage
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Unlock advanced insights and take control of your wellness journey
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {subscriptionPlans.map((plan) => (
          <div key={plan.id} className={`card relative ${
            plan.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''
          } ${
            currentSubscription?.plan === plan.id ? 'ring-2 ring-green-500' : ''
          }`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="primary" size="sm">Most Popular</Badge>
              </div>
            )}
            
            {currentSubscription?.plan === plan.id && (
              <div className="absolute -top-3 right-4">
                <Badge variant="success" size="sm">Current Plan</Badge>
              </div>
            )}

            <div className="card-header text-center">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  ${plan.price}
                </span>
                <span className="text-gray-500">
                  /{plan.interval}
                </span>
              </div>
              {plan.interval === 'year' && (
                <div className="text-sm text-green-600 font-medium mt-1">
                  Save 33%
                </div>
              )}
            </div>

            <div className="card-content">
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                <Button variant="secondary" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : currentSubscription?.plan === plan.id ? (
                <Button variant="secondary" className="w-full" disabled>
                  Active
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && selectedPlan === plan.id ? 'Processing...' : 
                   !currentSubscription || currentSubscription.plan === 'free' ? 'Start 7-Day Trial' : 'Upgrade'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Premium Features Preview */}
      <div className="mt-12 card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">🌟 Premium Features</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Unlock advanced insights and accelerate your wellness journey
          </p>
        </div>
        
        <div className="card-content">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600">🧠</span>
                </div>
                <div>
                  <h4 className="font-medium">Advanced AI Insights</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get personalized analysis of your patterns, triggers, and progress trends
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600">📊</span>
                </div>
                <div>
                  <h4 className="font-medium">Detailed Analytics</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive charts, mood correlations, and spending analysis
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600">🎯</span>
                </div>
                <div>
                  <h4 className="font-medium">Custom Goals & Challenges</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create personalized challenges with deadlines and milestones
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600">💾</span>
                </div>
                <div>
                  <h4 className="font-medium">Data Export & Reports</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Export progress reports in PDF or CSV format for healthcare providers
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600">🚫</span>
                </div>
                <div>
                  <h4 className="font-medium">Ad-Free Experience</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Focus on your wellness without distractions
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-indigo-600">💬</span>
                </div>
                <div>
                  <h4 className="font-medium">Priority Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get help when you need it with dedicated customer support
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>🔒 Secure payments • Cancel anytime • 7-day free trial for new users</p>
        <p className="mt-2">All data remains private and stored on your device</p>
      </div>
    </div>
  );
}

// Premium feature gate component
export function PremiumFeatureGate({ 
  children, 
  fallback, 
  isPremium 
}: { 
  children: React.ReactNode; 
  fallback: React.ReactNode; 
  isPremium: boolean;
}) {
  return isPremium ? <>{children}</> : <>{fallback}</>;
}