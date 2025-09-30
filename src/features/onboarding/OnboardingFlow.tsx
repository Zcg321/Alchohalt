import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { useDB } from '../../store/db';
import { useLanguage } from '../../i18n';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action?: () => void;
}

export default function OnboardingFlow() {
  const { t } = useLanguage();
  const { db, setSettings } = useDB();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: t('onboarding.welcome.title', 'Welcome to Alchohalt'),
      description: t('onboarding.welcome.description', 'Your personal, private wellness companion for building healthier drinking habits.'),
      icon: '🌟'
    },
    {
      id: 'privacy',
      title: t('onboarding.privacy.title', 'Your Privacy Matters'),
      description: t('onboarding.privacy.description', 'All your data stays on your device. We never collect, store, or share your personal information.'),
      icon: '🔒'
    },
    {
      id: 'tracking',
      title: t('onboarding.tracking.title', 'Smart Tracking'),
      description: t('onboarding.tracking.description', 'Log drinks with intentions, HALT triggers, and craving levels to understand your patterns.'),
      icon: '📊'
    },
    {
      id: 'insights',
      title: t('onboarding.insights.title', 'Personalized Insights'),
      description: t('onboarding.insights.description', 'Get AI-powered insights about your habits, triggers, and progress over time.'),
      icon: '🧠'
    },
    {
      id: 'goals',
      title: t('onboarding.goals.title', 'Set Your Goals'),
      description: t('onboarding.goals.description', 'Create personalized goals and track your progress with motivating streak counters.'),
      icon: '🎯'
    },
    {
      id: 'ready',
      title: t('onboarding.ready.title', 'You\'re All Set!'),
      description: t('onboarding.ready.description', 'Ready to start your wellness journey? Your first log is just a tap away.'),
      icon: '🚀'
    }
  ];

  useEffect(() => {
    // Check if user has completed onboarding
    const hasSeenOnboarding = db.settings?.hasCompletedOnboarding;
    if (!hasSeenOnboarding) {
      setIsVisible(true);
    }
  }, [db.settings]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    setSettings({ hasCompletedOnboarding: true });
    setIsVisible(false);
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-w-lg mx-4 bg-surface-elevated rounded-2xl shadow-strong border border-default overflow-hidden animate-scale-up">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-primary-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">{currentStepData.icon}</div>
          
          <h2 className="text-2xl font-bold text-primary mb-4">
            {currentStepData.title}
          </h2>
          
          <p className="text-secondary leading-relaxed mb-8">
            {currentStepData.description}
          </p>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                onClick={prevStep}
                className="px-6"
              >
                {t('onboarding.back', 'Back')}
              </Button>
            )}
            
            <Button
              variant="ghost"
              onClick={skipOnboarding}
              className="px-6"
            >
              {t('onboarding.skip', 'Skip')}
            </Button>
            
            <Button
              onClick={nextStep}
              className="px-6"
            >
              {currentStep === steps.length - 1 
                ? t('onboarding.getStarted', 'Get Started')
                : t('onboarding.next', 'Next')
              }
            </Button>
          </div>
        </div>

        {/* Quick Tips */}
        {currentStep === steps.length - 1 && (
          <div className="px-8 pb-8">
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
              <h4 className="font-medium text-primary-800 dark:text-primary-200 mb-2">
                💡 {t('onboarding.quickTips.title', 'Quick Tips')}
              </h4>
              <ul className="text-sm text-primary-700 dark:text-primary-300 space-y-1">
                <li>• {t('onboarding.quickTips.tip1', 'Start with small, achievable goals')}</li>
                <li>• {t('onboarding.quickTips.tip2', 'Log honestly for better insights')}</li>
                <li>• {t('onboarding.quickTips.tip3', 'Check your progress regularly')}</li>
                <li>• {t('onboarding.quickTips.tip4', 'Export your data anytime for backup')}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}