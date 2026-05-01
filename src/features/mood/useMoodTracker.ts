import { useState } from 'react';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { useAnalytics } from '../analytics/analytics';
import type { EmotionalState, EmotionKey, MoodPattern, MoodStep } from './moodConstants';
import { useMoodPattern } from './useMoodPattern';

const INITIAL_STATE: Partial<EmotionalState> = {
  triggers: [],
  copingStrategies: [],
  notes: '',
};

function toggleListItem<T>(list: T[] | undefined, item: T): T[] {
  const current = list || [];
  return current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
}

function buildState(partial: Partial<EmotionalState>): EmotionalState | null {
  if (!partial.primaryEmotion || !partial.intensity) return null;
  return {
    primaryEmotion: partial.primaryEmotion,
    intensity: partial.intensity,
    triggers: partial.triggers || [],
    cravingLevel: partial.cravingLevel || 0,
    copingStrategies: partial.copingStrategies || [],
    notes: partial.notes || '',
    timestamp: Date.now(),
  };
}

export interface MoodTrackerHookOptions {
  onComplete?: (state: EmotionalState) => void;
  onPatternUpdate?: (pattern: MoodPattern) => void;
  recentEntries: EmotionalState[];
}

export function useMoodTracker({ onComplete, onPatternUpdate, recentEntries }: MoodTrackerHookOptions) {
  const [currentState, setCurrentState] = useState<Partial<EmotionalState>>(() => ({
    ...INITIAL_STATE,
    timestamp: Date.now(),
  }));
  const [step, setStep] = useState<MoodStep>('emotion');
  const [showInsights, setShowInsights] = useState(false);
  const { isPremium } = usePremiumFeatures();
  const { trackFeatureUsage } = useAnalytics();
  const moodPattern = useMoodPattern(recentEntries);

  const handleEmotionSelect = (emotion: EmotionKey) => {
    setCurrentState((prev) => ({ ...prev, primaryEmotion: emotion }));
    setStep('intensity');
    trackFeatureUsage('mood_emotion_selected', { emotion });
  };

  const handleIntensitySelect = (intensity: number) => {
    setCurrentState((prev) => ({ ...prev, intensity }));
    setStep('triggers');
  };

  const handleTriggerToggle = (trigger: string) =>
    setCurrentState((prev) => ({ ...prev, triggers: toggleListItem(prev.triggers, trigger) }));

  const handleCopingToggle = (strategy: string) =>
    setCurrentState((prev) => ({
      ...prev,
      copingStrategies: toggleListItem(prev.copingStrategies, strategy),
    }));

  const handleComplete = () => {
    const completeState = buildState(currentState);
    if (!completeState) return;
    trackFeatureUsage('mood_tracking_completed', {
      emotion: completeState.primaryEmotion,
      intensity: completeState.intensity,
      trigger_count: completeState.triggers.length,
      coping_count: completeState.copingStrategies.length,
    });
    onComplete?.(completeState);
    setStep('complete');
    if (isPremium && moodPattern) {
      onPatternUpdate?.(moodPattern);
      setTimeout(() => setShowInsights(true), 1000);
    }
  };

  const handleRestart = () => {
    setStep('emotion');
    setCurrentState({ ...INITIAL_STATE, timestamp: Date.now() });
    setShowInsights(false);
  };

  return {
    state: currentState,
    setState: setCurrentState,
    step,
    setStep,
    showInsights,
    isPremium,
    moodPattern,
    handlers: {
      handleEmotionSelect,
      handleIntensitySelect,
      handleTriggerToggle,
      handleCopingToggle,
      handleComplete,
      handleRestart,
    },
  };
}
