# Enhanced Features for Alchohalt

This document describes the new enhanced features added to Alchohalt to improve user experience, engagement, and support.

## Overview

Six modular features have been implemented to enhance the Alchohalt experience:

1. **Health Integration** - Import activity, sleep, and heart rate data from Apple Health and Google Fit
2. **Voice Logging** - Log drinks hands-free via voice input with natural language processing
3. **AI Recommendations** - Get personalized goal suggestions based on behavior patterns
4. **Journaling with Mood Tagging** - Record thoughts and feelings with mood tracking
5. **Therapy Resources** - Access curated professional resources and coping strategies
6. **Social Features** - *(Planned for future release)*

## Feature Flags

All features are controlled by feature flags and can be enabled/disabled independently:

```typescript
// src/config/features.ts
export const FEATURE_FLAGS = {
  ENABLE_HEALTH_INTEGRATION: false,  // Apple Health & Google Fit
  ENABLE_VOICE_LOGGING: false,       // Voice-activated drink logging
  ENABLE_AI_RECOMMENDATIONS: false,  // Smart goal suggestions
  ENABLE_JOURNALING: false,          // In-app journaling with mood tags
  ENABLE_THERAPY_RESOURCES: false,   // Therapy resources directory
  ENABLE_SOCIAL_FEATURES: false      // (Future: Friends & challenges)
}
```

### Enabling Features

Set environment variables to enable features:

```bash
VITE_ENABLE_HEALTH_INTEGRATION=true
VITE_ENABLE_VOICE_LOGGING=true
VITE_ENABLE_AI_RECOMMENDATIONS=true
VITE_ENABLE_JOURNALING=true
VITE_ENABLE_THERAPY_RESOURCES=true
```

## 1. Health Integration 🏃‍♀️

### Overview
Imports health metrics from Apple Health (iOS) or Google Fit (Android) to enrich the Wellness dashboard with activity, sleep, and heart rate data.

### Components
- **Service**: `src/lib/health.ts`
- **UI**: Enhanced `src/features/wellness/PremiumWellnessDashboard.tsx`
- **Storage**: `HealthMetric` interface in `src/store/db.ts`

### Data Imported
- **Steps**: Daily step count
- **Sleep**: Hours of sleep per night
- **Heart Rate**: Resting heart rate (bpm)

### Usage Example

```typescript
import { requestHealthPermissions, importHealthMetrics } from '@/lib/health';
import { useDB } from '@/store/db';

// Request permissions
const granted = await requestHealthPermissions();

if (granted) {
  // Import last 7 days of data
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date();
  const metrics = await importHealthMetrics(startDate, endDate);
  
  // Store metrics
  metrics.forEach(metric => {
    addHealthMetric(metric);
  });
}
```

### Plugin Installation

To use real health data, install the appropriate plugins:

**iOS (Apple Health):**
```bash
npm install @capacitor-community/apple-health-kit
npx cap sync ios
```

**Android (Google Fit):**
```bash
npm install @capacitor-community/fitness-activity
npx cap sync android
```

Then initialize plugins in your app:

```typescript
import { HealthKit } from '@capacitor-community/apple-health-kit';
import { initializeHealthPlugins } from '@/lib/health';

// Initialize with actual plugin
initializeHealthPlugins(HealthKit);
```

### Wellness Dashboard Display

When health integration is enabled and data is available, the dashboard shows:
- 👟 Daily Steps (with target of 10,000 steps)
- 🛌 Sleep Duration (with target of 8 hours)
- 💓 Resting Heart Rate (with healthy range indicators)

## 2. Voice-Activated Drink Logging 🎤

### Overview
Allows users to log drinks hands-free using voice commands with natural language processing.

### Components
- **Service**: `src/lib/voice.ts`
- **UI**: `src/features/voice/VoiceInput.tsx`

### Supported Voice Commands
- "two beers"
- "one glass of wine"
- "a shot of whiskey"
- "three bottles of beer"
- Number words: one, two, three, four, five, etc.

### Usage Example

```typescript
import VoiceInput from '@/features/voice/VoiceInput';

<VoiceInput
  onVoiceResult={(result) => {
    // result contains: quantity, volumeMl, abvPct, transcript, drinkType
    console.log(`Logging ${result.quantity} ${result.drinkType}(s)`);
    addDrink({
      volumeMl: result.volumeMl,
      abvPct: result.abvPct,
      name: result.transcript
    });
  }}
  onError={(error) => {
    console.error('Voice input error:', error);
  }}
/>
```

### Plugin Installation

```bash
npm install @capacitor-community/speech-recognition
npx cap sync
```

### Natural Language Parsing

The `parseVoiceInput` function extracts:
- **Quantity**: Number of drinks (1-10)
- **Drink Type**: beer, wine, spirits, or custom
- **Volume**: Standard serving size (355ml beer, 148ml wine, 44ml spirits)
- **ABV**: Typical alcohol percentage
- **Confidence**: 0-1 score indicating parsing confidence

Low confidence (< 0.5) results in a fallback to manual entry.

## 3. AI-Powered Goal Recommendations 🤖

### Overview
Generates personalized goal suggestions based on recent behavior patterns, progress, and readiness scores.

### Components
- **Service**: `src/lib/ai-recommendations.ts`
- **UI**: `src/features/recommendations/GoalRecommendations.tsx`

### Recommendation Types
1. **Drink-Free Days**: Suggests weekly alcohol-free day targets
2. **Weekly Limit**: Recommends standard drink limits per week
3. **Craving Management**: Sets targets for reducing craving intensity
4. **Monthly Budget**: Suggests spending reduction goals

### Algorithm

The recommendation engine uses:
- **Readiness Score**: 0-1 score based on recent consistency, cravings, and health
- **Recent Behavior**: Last 7-30 days of activity
- **Goal History**: Current goals and achievement rates
- **Health Metrics**: Sleep, activity levels (if available)

### Usage Example

```typescript
import GoalRecommendations from '@/features/recommendations/GoalRecommendations';
import { useDB } from '@/store/db';

const { db } = useDB();

<GoalRecommendations
  entries={db.entries}
  settings={db.settings}
  onAcceptRecommendation={(recommendation) => {
    // Apply the recommended goal
    setSettings({
      weeklyGoalDrinks: recommendation.suggestedValue
    });
  }}
/>
```

### Recommendation Properties

Each recommendation includes:
- **Title**: Clear goal statement
- **Description**: Brief explanation
- **Rationale**: Why this goal is suggested
- **Difficulty**: easy, moderate, or challenging
- **Estimated Success Rate**: 0-100% likelihood of achievement
- **Confidence**: Algorithm confidence in the recommendation

### Goal Evaluation

After the goal period, evaluate success:

```typescript
import { evaluateGoalSuccess } from '@/lib/ai-recommendations';

const feedback = evaluateGoalSuccess(
  'drink-free-days',  // goal type
  4,                   // target value
  entries,            // recent entries
  7                   // timeframe in days
);

console.log(feedback.achieved);      // true/false
console.log(feedback.difficulty);    // 'too-easy' | 'just-right' | 'too-hard'
```

## 4. In-App Journaling with Mood Tagging 📝

### Overview
Allows users to record thoughts, feelings, and experiences with mood tracking for self-reflection and trigger identification.

### Components
- **UI**: `src/features/journal/JournalEntry.tsx`
- **Storage**: `journal` and `mood` fields in Entry interface

### Mood Options

7 mood states with emojis:
- 😊 Happy
- 😢 Sad
- 😰 Anxious
- 😤 Stressed
- 😌 Calm
- 🤩 Excited
- 😐 Neutral

### Usage Example

**Creating an Entry:**
```typescript
import JournalEntry from '@/features/journal/JournalEntry';

<JournalEntry
  onSave={(journal, mood) => {
    // Save journal entry along with drink data
    addEntry({
      ts: Date.now(),
      kind: 'custom',
      stdDrinks: 0,
      intention: 'other',
      craving: 0,
      halt: { H: false, A: false, L: false, T: false },
      journal,
      mood
    });
  }}
/>
```

**Displaying an Entry:**
```typescript
import { JournalDisplay } from '@/features/journal/JournalEntry';

<JournalDisplay
  journal={entry.journal}
  mood={entry.mood}
  timestamp={entry.ts}
  onEdit={() => {
    // Edit the entry
  }}
/>
```

### Database Schema

```typescript
interface Entry {
  // ... existing fields
  journal?: string;  // Free-form text
  mood?: 'happy' | 'sad' | 'anxious' | 'stressed' | 'calm' | 'excited' | 'neutral';
  voiceTranscript?: string;  // Original voice input if applicable
}
```

### Future Enhancements
- Search and filter journal entries by keyword
- Mood distribution charts
- Identify patterns between mood and drinking behavior
- Cloud sync for Premium users (with privacy controls)

## 5. Therapy & Support Resources 🆘

### Overview
Curated directory of professional resources, hotlines, educational content, and coping strategies.

### Components
- **Data**: `src/data/therapy-resources.json`
- **UI**: `src/features/resources/TherapyResources.tsx`

### Resource Categories

#### 1. Immediate Help 🚨
- **SAMHSA National Helpline**: 1-800-662-4357 (24/7)
- **Alcoholics Anonymous**: Find local meetings
- **Crisis Text Line**: Text HOME to 741741

#### 2. Educational 📚
- NIAAA Rethinking Drinking
- CDC Alcohol and Public Health
- SMART Recovery

#### 3. Professional Help 👨‍⚕️
- Psychology Today Therapist Directory
- SAMHSA Treatment Locator
- BetterHelp Online Therapy

#### 4. Coping Strategies 🛠️
- Mindfulness Meditation
- Physical Exercise
- Reflective Journaling
- Social Support

### Usage Example

```typescript
import TherapyResources from '@/features/resources/TherapyResources';

// Basic usage
<TherapyResources />

// With trigger-specific suggestions
<TherapyResources trigger="stress" />
```

### Trigger-Specific Suggestions

When a trigger is detected (e.g., stress, loneliness, social, boredom), the component shows:
- Tailored tips for managing that specific trigger
- Relevant resources from the directory
- Quick action buttons (Call, Text, Visit Website)

### Actions Available

Resources support multiple action types:
- **Phone Call**: `tel:` link for hotlines
- **SMS**: `sms:` link for crisis text services
- **Web**: Opens educational content or directories
- **Email**: (Future) Direct contact with counselors

### Contextual Integration

The component can be triggered contextually:
```typescript
// Show resources when high craving is logged
if (entry.craving >= 7) {
  showResources({ trigger: entry.intention === 'cope' ? 'stress' : undefined });
}

// Show resources for loneliness-related drinking
if (entry.halt.L) {
  showResources({ trigger: 'loneliness' });
}
```

## Database Schema Extensions

### Entry Interface

```typescript
interface Entry {
  // Existing fields
  id: UUID;
  ts: number;
  kind: DrinkKind;
  stdDrinks: number;
  cost?: number;
  intention: Intention;
  craving: number;
  halt: HALT;
  altAction?: string;
  notes?: string;
  editedAt?: number;
  
  // New enhanced features
  journal?: string;                    // Journaling
  mood?: MoodType;                     // Mood tagging
  voiceTranscript?: string;            // Voice logging
}
```

### HealthMetric Interface

```typescript
interface HealthMetric {
  date: string;                        // YYYY-MM-DD
  steps?: number;                      // Daily steps
  sleepHours?: number;                 // Hours of sleep
  heartRate?: number;                  // Resting heart rate (bpm)
  source: 'manual' | 'apple-health' | 'google-fit';
}
```

### Settings Extensions

```typescript
interface Settings {
  // Existing fields
  // ...
  
  // New settings
  healthPermissionsGranted?: boolean;
  voicePermissionsGranted?: boolean;
  privacySettings?: {
    shareWithFriends?: boolean;
    shareDetailedLogs?: boolean;
    syncJournalEntries?: boolean;
  };
}
```

## Testing

### Unit Tests

**Voice Parsing (`src/lib/__tests__/voice.test.ts`):**
- Parses "two beers" correctly
- Parses "one glass of wine" correctly
- Handles number words (one, two, three, etc.)
- Defaults to quantity 1 for unrecognized input

**AI Recommendations (`src/lib/__tests__/ai-recommendations.test.ts`):**
- Returns empty array for no entries
- Generates recommendations for active users
- Evaluates goal success correctly

### Component Tests

**Smoke tests for:**
- `VoiceInput.tsx`
- `GoalRecommendations.tsx`
- `JournalEntry.tsx` + `JournalDisplay.tsx`
- `TherapyResources.tsx`

Run tests:
```bash
npm test
```

## Privacy & Security

### Data Storage
- All data stored **locally** on device via Capacitor Preferences
- No external AI services used (heuristic-based recommendations)
- Health data never sent to servers without explicit user consent

### Permissions
- Microphone access requested only when using voice input
- Health data access requested only when enabling health integration
- Users can revoke permissions at any time

### Privacy Controls
- Users control what data is shared (future social features)
- Journal entries can be excluded from cloud sync
- Health metrics remain local by default

## Integration Guide

### Adding Voice Input to QuickActions

```typescript
// In src/features/insights/QuickActions.tsx
import VoiceInput from '@/features/voice/VoiceInput';
import { FEATURE_FLAGS } from '@/config/features';

export default function QuickActions({ onAddDrink }) {
  return (
    <div>
      {/* Existing quick actions */}
      
      {FEATURE_FLAGS.ENABLE_VOICE_LOGGING && (
        <VoiceInput
          onVoiceResult={(result) => {
            onAddDrink({
              volumeMl: result.volumeMl,
              abvPct: result.abvPct,
              name: result.transcript,
              voiceTranscript: result.transcript
            });
          }}
        />
      )}
    </div>
  );
}
```

### Adding AI Recommendations to Goals Page

```typescript
// In src/routes/Goals.tsx
import GoalRecommendations from '@/features/recommendations/GoalRecommendations';
import { useDB } from '@/store/db';
import { FEATURE_FLAGS } from '@/config/features';

export default function Goals() {
  const { db, setSettings } = useDB();
  
  return (
    <div>
      {FEATURE_FLAGS.ENABLE_AI_RECOMMENDATIONS && (
        <GoalRecommendations
          entries={db.entries}
          settings={db.settings}
          onAcceptRecommendation={(rec) => {
            // Apply recommendation based on type
            if (rec.type === 'weekly-limit') {
              setSettings({ weeklyGoalDrinks: rec.suggestedValue });
            }
          }}
        />
      )}
      
      {/* Existing goals UI */}
    </div>
  );
}
```

### Adding Therapy Resources to Navigation

```typescript
// In main navigation or settings
import TherapyResources from '@/features/resources/TherapyResources';
import { FEATURE_FLAGS } from '@/config/features';

// Add a "Resources" tab or menu item
{FEATURE_FLAGS.ENABLE_THERAPY_RESOURCES && (
  <Route path="/resources">
    <TherapyResources />
  </Route>
)}
```

## Future Enhancements

### Planned Features
1. **Social Features**: Friend system, activity feed, group challenges
2. **Advanced Analytics**: Correlation analysis between health metrics and drinking
3. **Cloud Sync**: Sync journal entries and health data across devices (Premium)
4. **Export**: PDF reports including health correlations
5. **Smart Notifications**: Context-aware reminders based on triggers and patterns

### API Extensibility

All services are designed to be easily extended:

```typescript
// Add new health metric types
interface HealthMetric {
  date: string;
  steps?: number;
  sleepHours?: number;
  heartRate?: number;
  // Future additions:
  bloodPressure?: { systolic: number; diastolic: number };
  weight?: number;
  mood?: MoodType;
}

// Add new recommendation types
type RecommendationType = 
  | 'drink-free-days'
  | 'weekly-limit'
  | 'monthly-budget'
  | 'craving-management'
  // Future additions:
  | 'hydration-goal'
  | 'exercise-goal'
  | 'social-connection';
```

## Troubleshooting

### Voice Recognition Not Working
1. Check microphone permissions in device settings
2. Verify `VITE_ENABLE_VOICE_LOGGING=true`
3. Test on physical device (may not work in simulator)
4. Install actual plugin if using mock implementation

### Health Data Not Appearing
1. Check health app permissions
2. Verify data exists in Apple Health / Google Fit
3. Import metrics manually using `importHealthMetrics()`
4. Check date range (may not have data for requested dates)

### Recommendations Not Showing
1. Verify `VITE_ENABLE_AI_RECOMMENDATIONS=true`
2. Ensure sufficient entry history (>10 entries recommended)
3. Check if recommendations were dismissed
4. Current goals may already be optimal

## Support

For issues or questions:
1. Check feature flags are enabled
2. Review console logs for errors
3. Verify plugin installations
4. Test on physical device for best results

## License

These features are part of the Alchohalt project and follow the same license as the main application.
