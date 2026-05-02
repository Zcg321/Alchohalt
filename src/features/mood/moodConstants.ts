export interface EmotionalState {
  primaryEmotion: 'happy' | 'calm' | 'stressed' | 'anxious' | 'sad' | 'angry' | 'excited' | 'bored';
  intensity: number;
  triggers: string[];
  cravingLevel: number;
  copingStrategies: string[];
  notes: string;
  timestamp: number;
}

export interface MoodPattern {
  commonTriggers: string[];
  riskTimes: string[];
  effectiveCoping: string[];
  trendDirection: 'improving' | 'stable' | 'concerning';
}

export type EmotionKey = EmotionalState['primaryEmotion'];

export const EMOTIONS: ReadonlyArray<{
  key: EmotionKey;
  label: string;
  icon: string;
  color: string;
}> = [
  { key: 'happy', label: 'Happy', icon: '😊', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30' },
  { key: 'calm', label: 'Calm', icon: '😌', color: 'bg-green-100 text-green-800 dark:bg-green-900/30' },
  { key: 'excited', label: 'Excited', icon: '🤗', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30' },
  { key: 'stressed', label: 'Stressed', icon: '😰', color: 'bg-red-100 text-red-800 dark:bg-red-900/30' },
  { key: 'anxious', label: 'Anxious', icon: '😟', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30' },
  { key: 'sad', label: 'Sad', icon: '😢', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30' },
  { key: 'angry', label: 'Angry', icon: '😠', color: 'bg-red-200 text-red-900 dark:bg-red-900/40' },
  { key: 'bored', label: 'Bored', icon: '😑', color: 'bg-cream-100 text-ink dark:bg-charcoal-700' },
];

export const COMMON_TRIGGERS = [
  'Work stress', 'Social pressure', 'Loneliness', 'Celebration', 'Habit/Routine',
  'Anxiety', 'Boredom', 'Relationship issues', 'Financial worry', 'Health concerns',
  'Weather/Season', 'Social media', 'News/Current events', 'Family dynamics',
];

export const COPING_STRATEGIES = [
  'Deep breathing', 'Exercise/Walk', 'Call a friend', 'Meditation', 'Creative activity',
  'Listen to music', 'Read a book', 'Take a bath', 'Journal writing', 'Healthy snack',
  'Drink water/tea', 'Watch comedy', 'Organize space', 'Learn something new',
];

export const INTENSITY_LABELS = ['Mild', 'Slight', 'Moderate', 'Strong', 'Intense'] as const;

export type MoodStep = 'emotion' | 'intensity' | 'triggers' | 'coping' | 'notes' | 'complete';
