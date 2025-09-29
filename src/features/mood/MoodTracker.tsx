import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';

interface MoodEntry {
  id: string;
  mood: 'excellent' | 'good' | 'neutral' | 'stressed' | 'anxious' | 'craving' | 'bored';
  intensity: number; // 1-5 scale
  triggers?: string[];
  notes?: string;
  timestamp: number;
}

interface Props {
  onComplete?: () => void;
  className?: string;
}

const moodOptions = [
  { 
    key: 'excellent' as const, 
    label: 'Excellent', 
    icon: '🌟', 
    color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
    description: 'Feeling amazing, motivated and in control'
  },
  { 
    key: 'good' as const, 
    label: 'Good', 
    icon: '😊', 
    color: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300',
    description: 'Positive and comfortable'
  },
  { 
    key: 'neutral' as const, 
    label: 'Neutral', 
    icon: '😐', 
    color: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/30 dark:text-gray-300',
    description: 'Feeling okay, neither good nor bad'
  },
  { 
    key: 'stressed' as const, 
    label: 'Stressed', 
    icon: '😰', 
    color: 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
    description: 'Under pressure or overwhelmed'
  },
  { 
    key: 'anxious' as const, 
    label: 'Anxious', 
    icon: '😟', 
    color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
    description: 'Worried or uneasy about something'
  },
  { 
    key: 'craving' as const, 
    label: 'Having Cravings', 
    icon: '🤔', 
    color: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300',
    description: 'Feeling urges or cravings for alcohol'
  },
  { 
    key: 'bored' as const, 
    label: 'Bored', 
    icon: '😴', 
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
    description: 'Lacking stimulation or interest'
  }
];

const commonTriggers = [
  'Work stress', 'Social situation', 'Boredom', 'Anxiety', 'Depression',
  'Celebration', 'Habit', 'Peer pressure', 'Relationship issues', 'Financial stress'
];

export default function MoodTracker({ onComplete, className }: Props) {
  const [step, setStep] = useState<'mood' | 'intensity' | 'triggers' | 'notes'>('mood');
  const [selectedMood, setSelectedMood] = useState<MoodEntry['mood'] | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const handleMoodSelect = (mood: MoodEntry['mood']) => {
    setSelectedMood(mood);
    setStep('intensity');
  };

  const handleIntensitySelect = (level: number) => {
    setIntensity(level);
    setStep('triggers');
  };

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev => 
      prev.includes(trigger)
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  const handleSubmit = () => {
    if (!selectedMood) return;

    const moodEntry: MoodEntry = {
      id: Date.now().toString(),
      mood: selectedMood,
      intensity,
      triggers: selectedTriggers,
      notes: notes.trim() || undefined,
      timestamp: Date.now()
    };

    // Save to localStorage for now - in production this would go to a proper database
    const existingMoods = JSON.parse(localStorage.getItem('mood-entries') || '[]');
    localStorage.setItem('mood-entries', JSON.stringify([...existingMoods, moodEntry]));
    
    // Reset form
    setSelectedMood(null);
    setIntensity(3);
    setSelectedTriggers([]);
    setNotes('');
    setStep('mood');
    
    onComplete?.();
  };

  const selectedMoodData = moodOptions.find(m => m.key === selectedMood);

  return (
    <div className={`card max-w-md mx-auto ${className || ''}`}>
      <div className="card-header">
        <h2 className="text-xl font-semibold">How are you feeling?</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Track your mood to gain insights into patterns
        </p>
      </div>
      
      <div className="card-content">
        {step === 'mood' && (
          <div className="space-y-3">
            {moodOptions.map((mood) => (
              <button
                key={mood.key}
                onClick={() => handleMoodSelect(mood.key)}
                className={`w-full p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 transition-all ${mood.color} hover:shadow-md`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{mood.icon}</span>
                  <div>
                    <div className="font-medium">{mood.label}</div>
                    <div className="text-xs opacity-75">{mood.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'intensity' && selectedMoodData && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">{selectedMoodData.icon}</div>
              <h3 className="font-medium">How intense is this feeling?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rate from 1 (mild) to 5 (very strong)</p>
            </div>
            
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => handleIntensitySelect(level)}
                  className={`w-12 h-12 rounded-full border-2 transition-all ${
                    intensity === level
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Mild</span>
              <span>Very Strong</span>
            </div>
          </div>
        )}

        {step === 'triggers' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-medium">What triggered this feeling?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select any that apply (optional)</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {commonTriggers.map((trigger) => (
                <button
                  key={trigger}
                  onClick={() => toggleTrigger(trigger)}
                  className={`p-2 text-xs rounded border transition-all ${
                    selectedTriggers.includes(trigger)
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  {trigger}
                </button>
              ))}
            </div>

            <div className="flex space-x-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setStep('intensity')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={() => setStep('notes')} 
                size="sm"
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'notes' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-medium">Any additional notes?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Optional - helps track patterns</p>
            </div>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's on your mind? Any specific situations or thoughts..."
              className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <div className="flex space-x-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setStep('triggers')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                size="sm"
                className="flex-1"
              >
                Complete Check-in
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}