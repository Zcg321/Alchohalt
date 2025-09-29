import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { useAnalytics } from '../analytics/analytics';

interface EmotionalState {
  primaryEmotion: 'happy' | 'calm' | 'stressed' | 'anxious' | 'sad' | 'angry' | 'excited' | 'bored';
  intensity: number; // 1-5
  triggers: string[];
  cravingLevel: number; // 0-5
  copingStrategies: string[];
  notes: string;
  timestamp: number;
}

interface MoodPattern {
  commonTriggers: string[];
  riskTimes: string[];
  effectiveCoping: string[];
  trendDirection: 'improving' | 'stable' | 'concerning';
}

const EMOTIONS = [
  { key: 'happy', label: 'Happy', icon: '😊', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30' },
  { key: 'calm', label: 'Calm', icon: '😌', color: 'bg-green-100 text-green-800 dark:bg-green-900/30' },
  { key: 'excited', label: 'Excited', icon: '🤗', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30' },
  { key: 'stressed', label: 'Stressed', icon: '😰', color: 'bg-red-100 text-red-800 dark:bg-red-900/30' },
  { key: 'anxious', label: 'Anxious', icon: '😟', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30' },
  { key: 'sad', label: 'Sad', icon: '😢', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30' },
  { key: 'angry', label: 'Angry', icon: '😠', color: 'bg-red-200 text-red-900 dark:bg-red-900/40' },
  { key: 'bored', label: 'Bored', icon: '😑', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30' },
] as const;

const COMMON_TRIGGERS = [
  'Work stress', 'Social pressure', 'Loneliness', 'Celebration', 'Habit/Routine',
  'Anxiety', 'Boredom', 'Relationship issues', 'Financial worry', 'Health concerns',
  'Weather/Season', 'Social media', 'News/Current events', 'Family dynamics'
];

const COPING_STRATEGIES = [
  'Deep breathing', 'Exercise/Walk', 'Call a friend', 'Meditation', 'Creative activity',
  'Listen to music', 'Read a book', 'Take a bath', 'Journal writing', 'Healthy snack',
  'Drink water/tea', 'Watch comedy', 'Organize space', 'Learn something new'
];

interface Props {
  onComplete?: (state: EmotionalState) => void;
  onPatternUpdate?: (pattern: MoodPattern) => void;
  recentEntries?: EmotionalState[];
  className?: string;
}

export default function EnhancedMoodTracker({ 
  onComplete, 
  onPatternUpdate, 
  recentEntries = [],
  className = '' 
}: Props) {
  const [currentState, setCurrentState] = useState<Partial<EmotionalState>>({
    triggers: [],
    copingStrategies: [],
    notes: '',
    timestamp: Date.now()
  });
  const [step, setStep] = useState<'emotion' | 'intensity' | 'triggers' | 'coping' | 'notes' | 'complete'>('emotion');
  const [showInsights, setShowInsights] = useState(false);
  
  const { isPremium, canAccessAIInsights } = usePremiumFeatures();
  const { trackFeatureUsage } = useAnalytics();

  const moodPattern = React.useMemo(() => {
    if (recentEntries.length < 3) return null;
    
    const last7Days = recentEntries.filter(entry => 
      entry.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    
    const triggerCounts = last7Days.reduce((acc, entry) => {
      entry.triggers.forEach(trigger => {
        acc[trigger] = (acc[trigger] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    const copingCounts = last7Days.reduce((acc, entry) => {
      entry.copingStrategies.forEach(strategy => {
        acc[strategy] = (acc[strategy] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    const avgCraving = last7Days.reduce((sum, entry) => sum + entry.cravingLevel, 0) / last7Days.length;
    const previousWeekAvg = recentEntries
      .filter(entry => 
        entry.timestamp > Date.now() - 14 * 24 * 60 * 60 * 1000 &&
        entry.timestamp <= Date.now() - 7 * 24 * 60 * 60 * 1000
      )
      .reduce((sum, entry, _, arr) => sum + entry.cravingLevel / arr.length, 0);
    
    return {
      commonTriggers: Object.entries(triggerCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([trigger]) => trigger),
      riskTimes: [], // Would need time analysis
      effectiveCoping: Object.entries(copingCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([strategy]) => strategy),
      trendDirection: avgCraving < previousWeekAvg ? 'improving' : 
                     avgCraving === previousWeekAvg ? 'stable' : 'concerning'
    } as MoodPattern;
  }, [recentEntries]);

  const handleEmotionSelect = (emotion: 'happy' | 'calm' | 'excited' | 'stressed' | 'anxious' | 'sad' | 'angry' | 'bored') => {
    setCurrentState(prev => ({ ...prev, primaryEmotion: emotion }));
    setStep('intensity');
    trackFeatureUsage('mood_emotion_selected', { emotion });
  };

  const handleIntensitySelect = (intensity: number) => {
    setCurrentState(prev => ({ ...prev, intensity }));
    setStep('triggers');
  };

  const handleTriggerToggle = (trigger: string) => {
    setCurrentState(prev => ({
      ...prev,
      triggers: prev.triggers?.includes(trigger)
        ? prev.triggers.filter(t => t !== trigger)
        : [...(prev.triggers || []), trigger]
    }));
  };

  const handleCopingToggle = (strategy: string) => {
    setCurrentState(prev => ({
      ...prev,
      copingStrategies: prev.copingStrategies?.includes(strategy)
        ? prev.copingStrategies.filter(s => s !== strategy)
        : [...(prev.copingStrategies || []), strategy]
    }));
  };

  const handleComplete = () => {
    if (currentState.primaryEmotion && currentState.intensity) {
      const completeState: EmotionalState = {
        primaryEmotion: currentState.primaryEmotion,
        intensity: currentState.intensity,
        triggers: currentState.triggers || [],
        cravingLevel: currentState.cravingLevel || 0,
        copingStrategies: currentState.copingStrategies || [],
        notes: currentState.notes || '',
        timestamp: Date.now()
      };
      
      trackFeatureUsage('mood_tracking_completed', {
        emotion: completeState.primaryEmotion,
        intensity: completeState.intensity,
        trigger_count: completeState.triggers.length,
        coping_count: completeState.copingStrategies.length
      });
      
      onComplete?.(completeState);
      setStep('complete');
      
      // Auto-advance insights if premium
      if (isPremium && moodPattern) {
        onPatternUpdate?.(moodPattern);
        setTimeout(() => setShowInsights(true), 1000);
      }
    }
  };

  const currentEmotion = EMOTIONS.find(e => e.key === currentState.primaryEmotion);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          🧠 Mood & Emotional Intelligence
        </h2>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">Step {
            step === 'emotion' ? '1' : 
            step === 'intensity' ? '2' : 
            step === 'triggers' ? '3' : 
            step === 'coping' ? '4' : 
            step === 'notes' ? '5' : '6'
          } of 5</Badge>
          {isPremium && <Badge variant="primary" className="text-xs">AI Analysis</Badge>}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${
                step === 'emotion' ? 20 : 
                step === 'intensity' ? 40 : 
                step === 'triggers' ? 60 : 
                step === 'coping' ? 80 : 100
              }%` 
            }}
          />
        </div>
      </div>

      {/* Step 1: Emotion Selection */}
      {step === 'emotion' && (
        <div>
          <h3 className="text-md font-semibold mb-4">How are you feeling right now?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {EMOTIONS.map(emotion => (
              <button
                key={emotion.key}
                onClick={() => handleEmotionSelect(emotion.key)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  currentState.primaryEmotion === emotion.key
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'
                }`}
              >
                <div className="text-2xl mb-2">{emotion.icon}</div>
                <div className="text-sm font-medium">{emotion.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Intensity */}
      {step === 'intensity' && currentEmotion && (
        <div>
          <h3 className="text-md font-semibold mb-4">
            How intense is this {currentEmotion.label.toLowerCase()} feeling?
          </h3>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">{currentEmotion.icon}</span>
            <Badge className={currentEmotion.color}>{currentEmotion.label}</Badge>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                onClick={() => handleIntensitySelect(level)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                  currentState.intensity === level
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'
                }`}
              >
                <div className="text-2xl font-bold">{level}</div>
                <div className="text-xs">
                  {level === 1 ? 'Mild' : 
                   level === 2 ? 'Slight' : 
                   level === 3 ? 'Moderate' : 
                   level === 4 ? 'Strong' : 'Intense'}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button onClick={() => setStep('triggers')}>Continue</Button>
          </div>
        </div>
      )}

      {/* Step 3: Triggers */}
      {step === 'triggers' && (
        <div>
          <h3 className="text-md font-semibold mb-4">What might have triggered this feeling?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select all that apply (optional)</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
            {COMMON_TRIGGERS.map(trigger => (
              <button
                key={trigger}
                onClick={() => handleTriggerToggle(trigger)}
                className={`p-2 text-xs rounded-lg border transition-all ${
                  currentState.triggers?.includes(trigger)
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'
                }`}
              >
                {trigger}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('intensity')}>Back</Button>
            <Button onClick={() => setStep('coping')}>Continue</Button>
          </div>
        </div>
      )}

      {/* Step 4: Coping Strategies */}
      {step === 'coping' && (
        <div>
          <h3 className="text-md font-semibold mb-4">What helps you feel better?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select strategies you use or want to try</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
            {COPING_STRATEGIES.map(strategy => (
              <button
                key={strategy}
                onClick={() => handleCopingToggle(strategy)}
                className={`p-2 text-xs rounded-lg border transition-all ${
                  currentState.copingStrategies?.includes(strategy)
                    ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                }`}
              >
                {strategy}
              </button>
            ))}
          </div>
          
          {/* Craving Level */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Alcohol craving level (0 = none, 5 = very strong)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="5"
                value={currentState.cravingLevel || 0}
                onChange={(e) => setCurrentState(prev => ({ 
                  ...prev, 
                  cravingLevel: parseInt(e.target.value) 
                }))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="text-lg font-semibold w-8 text-center">
                {currentState.cravingLevel || 0}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('triggers')}>Back</Button>
            <Button onClick={() => setStep('notes')}>Continue</Button>
          </div>
        </div>
      )}

      {/* Step 5: Notes */}
      {step === 'notes' && (
        <div>
          <h3 className="text-md font-semibold mb-4">Any additional thoughts?</h3>
          <textarea
            value={currentState.notes}
            onChange={(e) => setCurrentState(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Optional: What's on your mind? How do you want to handle this feeling?"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none dark:bg-gray-700"
            rows={4}
          />
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setStep('coping')}>Back</Button>
            <Button onClick={handleComplete}>Complete Check-in</Button>
          </div>
        </div>
      )}

      {/* Completion & Insights */}
      {step === 'complete' && (
        <div className="text-center">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="text-lg font-semibold mb-2">Check-in Complete!</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Thank you for taking time to understand your emotions.
          </p>
          
          {showInsights && moodPattern && isPremium && (
            <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-left">
              <h4 className="font-semibold mb-3 text-primary-800 dark:text-primary-300">
                🧠 AI Insights
              </h4>
              {moodPattern.commonTriggers.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium">Common triggers:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {moodPattern.commonTriggers.join(', ')}
                  </p>
                </div>
              )}
              {moodPattern.effectiveCoping.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium">Effective strategies:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {moodPattern.effectiveCoping.join(', ')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Trend:</p>
                <Badge className={
                  moodPattern.trendDirection === 'improving' ? 'bg-green-100 text-green-800' :
                  moodPattern.trendDirection === 'stable' ? 'bg-blue-100 text-blue-800' :
                  'bg-orange-100 text-orange-800'
                }>
                  {moodPattern.trendDirection}
                </Badge>
              </div>
            </div>
          )}
          
          <Button 
            onClick={() => {
              setStep('emotion');
              setCurrentState({ triggers: [], copingStrategies: [], notes: '', timestamp: Date.now() });
              setShowInsights(false);
            }}
            className="mt-4"
          >
            New Check-in
          </Button>
        </div>
      )}

      {/* Premium Upsell for Free Users */}
      {!isPremium && step !== 'complete' && (
        <div className="mt-6 p-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg text-center">
          <h3 className="font-semibold mb-1">🧠 Unlock Emotional Intelligence</h3>
          <p className="text-sm opacity-90 mb-3">
            Get AI-powered pattern recognition, personalized insights, and advanced emotional tracking.
          </p>
          <Button 
            variant="secondary" 
            className="bg-white text-primary-600 hover:bg-gray-100"
            onClick={() => trackFeatureUsage('mood_upgrade_prompt')}
          >
            Upgrade to Premium
          </Button>
        </div>
      )}
    </div>
  );
}