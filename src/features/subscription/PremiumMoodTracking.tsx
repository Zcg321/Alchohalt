import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { PremiumFeatureGate } from '../subscription/SubscriptionManager';
import { useDB } from '../../store/db';
import type { Entry, HALT } from '../../store/db';
import { FEATURE_FLAGS } from '../../config/features';

interface MoodTrigger {
  name: string;
  category: 'person' | 'place' | 'situation' | 'emotion' | 'time';
  severity: number; // 1-10
}

interface MoodPattern {
  trigger: string;
  frequency: number;
  avgDrinking: number;
  avgCraving: number;
  lastOccurrence: number;
}

export default function PremiumMoodTracking() {
  const { canTrackMoodTriggers } = usePremiumFeatures();
  const { db } = useDB();
  const [selectedTriggers, setSelectedTriggers] = useState<MoodTrigger[]>([]);
  const [customTrigger, setCustomTrigger] = useState('');

  // Analyze mood patterns from existing data
  const moodPatterns = useMemo(() => {
    return analyzeMoodPatterns(db.entries);
  }, [db.entries]);

  const predefinedTriggers: MoodTrigger[] = [
    { name: 'Work Stress', category: 'situation', severity: 8 },
    { name: 'Social Events', category: 'situation', severity: 5 },
    { name: 'Loneliness', category: 'emotion', severity: 7 },
    { name: 'Boredom', category: 'emotion', severity: 4 },
    { name: 'Anxiety', category: 'emotion', severity: 9 },
    { name: 'Weekend Nights', category: 'time', severity: 6 },
    { name: 'After Arguments', category: 'emotion', severity: 8 },
    { name: 'Celebration', category: 'situation', severity: 3 },
    { name: 'Home Alone', category: 'situation', severity: 6 },
    { name: 'Bad Weather', category: 'situation', severity: 4 }
  ];

  const addCustomTrigger = () => {
    if (customTrigger.trim()) {
      const newTrigger: MoodTrigger = {
        name: customTrigger.trim(),
        category: 'situation',
        severity: 5
      };
      setSelectedTriggers(prev => [...prev, newTrigger]);
      setCustomTrigger('');
    }
  };

  const toggleTrigger = (trigger: MoodTrigger) => {
    setSelectedTriggers(prev => {
      const exists = prev.find(t => t.name === trigger.name);
      if (exists) {
        return prev.filter(t => t.name !== trigger.name);
      } else {
        return [...prev, trigger];
      }
    });
  };

  const freeUserFallback = (
    <Card className="p-6 text-center">
      <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-blue-600 text-2xl">🧠</span>
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS ? 'Premium Mood & Trigger Tracking' : 'Advanced Mood & Trigger Tracking'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS 
          ? 'Identify your drinking triggers and get personalized insights about mood patterns and correlations.'
          : 'This feature is coming soon. Stay tuned for advanced mood pattern analysis and trigger identification.'}
      </p>
      {FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS && (
        <Button variant="primary">Upgrade to Premium</Button>
      )}
    </Card>
  );

  return (
    <PremiumFeatureGate 
      isPremium={canTrackMoodTriggers}
      fallback={freeUserFallback}
    >
      <div className="space-y-6">
        {/* Mood Pattern Analysis */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Mood Pattern Analysis
          </h3>
          
          {moodPatterns.length > 0 ? (
            <div className="space-y-4">
              {moodPatterns.slice(0, 5).map((pattern, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{pattern.trigger}</h4>
                    <Badge 
                      variant={pattern.avgDrinking > 2 ? 'warning' : 'secondary'}
                      size="sm"
                    >
                      {pattern.frequency}x occurrences
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Avg Drinks:</span>
                      <span className="ml-2 font-medium">{pattern.avgDrinking.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Avg Craving:</span>
                      <span className="ml-2 font-medium">{pattern.avgCraving.toFixed(1)}/10</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Last occurrence: {new Date(pattern.lastOccurrence).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <p>Not enough data yet for pattern analysis.</p>
              <p className="text-sm mt-1">Keep logging your mood and triggers to see insights!</p>
            </div>
          )}
        </Card>

        {/* HALT Correlation Analysis */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            HALT Trigger Correlations
          </h3>
          
          <HALTCorrelationView entries={db.entries} />
        </Card>

        {/* Trigger Selection */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Track Your Triggers
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Common Triggers</h4>
              <div className="flex flex-wrap gap-2">
                {predefinedTriggers.map((trigger) => (
                  <button
                    key={trigger.name}
                    onClick={() => toggleTrigger(trigger)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      selectedTriggers.find(t => t.name === trigger.name)
                        ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700'
                    }`}
                  >
                    {trigger.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Add Custom Trigger</h4>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customTrigger}
                  onChange={(e) => setCustomTrigger(e.target.value)}
                  placeholder="e.g., Family visits, Exam stress..."
                  className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomTrigger()}
                />
                <Button onClick={addCustomTrigger} size="sm">
                  Add
                </Button>
              </div>
            </div>

            {selectedTriggers.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Your Active Triggers</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTriggers.map((trigger) => (
                    <div
                      key={trigger.name}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full text-sm"
                    >
                      <span>{trigger.name}</span>
                      <button
                        onClick={() => toggleTrigger(trigger)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PremiumFeatureGate>
  );
}

function analyzeMoodPatterns(entries: Entry[]): MoodPattern[] {
  // Group entries by intention to find patterns
  const intentionGroups = entries.reduce((acc, entry) => {
    const intention = entry.intention;
    if (!acc[intention]) acc[intention] = [];
    acc[intention].push(entry);
    return acc;
  }, {} as Record<string, Entry[]>);

  const patterns: MoodPattern[] = [];

  Object.entries(intentionGroups).forEach(([intention, intentionEntries]) => {
    if (intentionEntries.length >= 3) { // Need at least 3 occurrences for a pattern
      const avgDrinking = intentionEntries.reduce((sum, e) => sum + e.stdDrinks, 0) / intentionEntries.length;
      const avgCraving = intentionEntries.reduce((sum, e) => sum + e.craving, 0) / intentionEntries.length;
      const lastOccurrence = Math.max(...intentionEntries.map(e => e.ts));

      const triggerMap: Record<string, string> = {
        celebrate: 'Celebration/Success',
        social: 'Social Situations',
        taste: 'Taste/Appetite',
        bored: 'Boredom/Nothing to do',
        cope: 'Stress/Coping',
        other: 'Other Situations'
      };

      patterns.push({
        trigger: triggerMap[intention] || intention,
        frequency: intentionEntries.length,
        avgDrinking,
        avgCraving,
        lastOccurrence
      });
    }
  });

  return patterns.sort((a, b) => b.avgDrinking - a.avgDrinking);
}

function HALTCorrelationView({ entries }: { entries: Entry[] }) {
  const haltAnalysis = useMemo(() => {
    const haltStats = ['H', 'A', 'L', 'T'].map(state => {
      const stateEntries = entries.filter(e => e.halt[state as keyof HALT]);
      const nonStateEntries = entries.filter(e => !e.halt[state as keyof HALT]);
      
      if (stateEntries.length === 0) {
        return { state, impact: 0, avgDrinks: 0, count: 0, name: '' };
      }

      const stateAvgDrinks = stateEntries.reduce((sum, e) => sum + e.stdDrinks, 0) / stateEntries.length;
      const nonStateAvgDrinks = nonStateEntries.length > 0 
        ? nonStateEntries.reduce((sum, e) => sum + e.stdDrinks, 0) / nonStateEntries.length 
        : 0;

      const impact = nonStateAvgDrinks > 0 ? ((stateAvgDrinks - nonStateAvgDrinks) / nonStateAvgDrinks) * 100 : 0;

      const names = { H: 'Hunger', A: 'Anger', L: 'Loneliness', T: 'Tiredness' };

      return {
        state,
        name: names[state as keyof typeof names],
        impact: Math.round(impact),
        avgDrinks: stateAvgDrinks,
        count: stateEntries.length
      };
    }).filter(stat => stat.count >= 2); // Need at least 2 occurrences

    return haltStats.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }, [entries]);

  if (haltAnalysis.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        <p>Not enough HALT data yet for correlation analysis.</p>
        <p className="text-sm mt-1">Keep tracking your HALT states to see patterns!</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {haltAnalysis.map(({ state, name, impact, avgDrinks, count }) => (
        <div key={state} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">{name}</h4>
            <Badge 
              variant={Math.abs(impact) > 30 ? 'warning' : 'secondary'}
              size="sm"
            >
              {impact > 0 ? '+' : ''}{impact}%
            </Badge>
          </div>
          <div className="text-sm space-y-1">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Avg drinks when {name.toLowerCase()}:</span>
              <span className="ml-2 font-medium">{avgDrinks.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Occurrences:</span>
              <span className="ml-2 font-medium">{count}</span>
            </div>
          </div>
          {Math.abs(impact) > 20 && (
            <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
              ⚠️ Significant impact detected
            </div>
          )}
        </div>
      ))}
    </div>
  );
}