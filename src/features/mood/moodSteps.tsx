import React from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  COMMON_TRIGGERS,
  COPING_STRATEGIES,
  EMOTIONS,
  INTENSITY_LABELS,
  type EmotionKey,
  type EmotionalState,
  type MoodPattern,
  type MoodStep,
} from './moodConstants';

const STEP_PROGRESS: Record<MoodStep, number> = {
  emotion: 20,
  intensity: 40,
  triggers: 60,
  coping: 80,
  notes: 100,
  complete: 100,
};

const STEP_NUMBER: Record<MoodStep, string> = {
  emotion: '1',
  intensity: '2',
  triggers: '3',
  coping: '4',
  notes: '5',
  complete: '6',
};

export function MoodHeader({ step, isPremium }: { step: MoodStep; isPremium: boolean }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-ink mb-2">Mood check-in</h2>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary">Step {STEP_NUMBER[step]} of 5</Badge>
        {isPremium && (
          <Badge variant="primary" className="text-xs">
            Adapted to you
          </Badge>
        )}
      </div>
      <div className="w-full bg-cream-100 dark:bg-charcoal-700 rounded-full h-2">
        <div
          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${STEP_PROGRESS[step]}%` }}
        />
      </div>
    </div>
  );
}

export function EmotionStep({
  selected,
  onSelect,
}: {
  selected?: EmotionKey | undefined;
  onSelect: (emotion: EmotionKey) => void;
}) {
  return (
    <div>
      <h3 className="text-md font-semibold mb-4">How are you feeling right now?</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {EMOTIONS.map((emotion) => (
          <button
            key={emotion.key}
            onClick={() => onSelect(emotion.key)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
              selected === emotion.key
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-border-soft hover:border-sage-300'
            }`}
          >
            <div className="text-2xl mb-2" aria-hidden="true">
              {emotion.icon}
            </div>
            <div className="text-sm font-medium">{emotion.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function IntensityStep({
  emotion,
  selected,
  onSelect,
  onContinue,
}: {
  emotion: (typeof EMOTIONS)[number];
  selected?: number | undefined;
  onSelect: (intensity: number) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <h3 className="text-md font-semibold mb-4">
        How intense is this {emotion.label.toLowerCase()} feeling?
      </h3>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl" aria-hidden="true">
          {emotion.icon}
        </span>
        <Badge className={emotion.color}>{emotion.label}</Badge>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
              selected === level
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-border-soft hover:border-sage-300'
            }`}
          >
            <div className="text-2xl font-bold">{level}</div>
            <div className="text-xs">{INTENSITY_LABELS[level - 1]}</div>
          </button>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Button onClick={onContinue}>Continue</Button>
      </div>
    </div>
  );
}

function ChipGrid({
  items,
  selected,
  onToggle,
  activeClass,
}: {
  items: readonly string[];
  selected: string[];
  onToggle: (item: string) => void;
  activeClass: string;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onToggle(item)}
          className={`p-2 text-xs rounded-lg border transition-all ${
            selected.includes(item)
              ? activeClass
              : 'border-border-soft hover:border-sage-300'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function TriggersStep({
  selected,
  onToggle,
  onBack,
  onContinue,
}: {
  selected: string[];
  onToggle: (trigger: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <h3 className="text-md font-semibold mb-4">What might have triggered this feeling?</h3>
      <p className="text-sm text-ink-soft mb-4">Select all that apply (optional)</p>
      <ChipGrid
        items={COMMON_TRIGGERS}
        selected={selected}
        onToggle={onToggle}
        activeClass="border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20"
      />
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue}>Continue</Button>
      </div>
    </div>
  );
}

export function CopingStep({
  selectedStrategies,
  onToggleStrategy,
  cravingLevel,
  onCravingChange,
  onBack,
  onContinue,
}: {
  selectedStrategies: string[];
  onToggleStrategy: (strategy: string) => void;
  cravingLevel: number;
  onCravingChange: (level: number) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <h3 className="text-md font-semibold mb-4">What helps you feel better?</h3>
      <p className="text-sm text-ink-soft mb-4">Select strategies you use or want to try</p>
      <ChipGrid
        items={COPING_STRATEGIES}
        selected={selectedStrategies}
        onToggle={onToggleStrategy}
        activeClass="border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20"
      />
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2" htmlFor="mood-craving">
          Alcohol craving level (0 = none, 5 = very strong)
        </label>
        <div className="flex items-center gap-2">
          <input
            id="mood-craving"
            type="range"
            min="0"
            max="5"
            value={cravingLevel}
            onChange={(e) => onCravingChange(parseInt(e.target.value, 10))}
            className="flex-1 h-2 bg-cream-100 rounded-lg appearance-none cursor-pointer dark:bg-charcoal-700"
          />
          <span className="text-lg font-semibold w-8 text-center">{cravingLevel}</span>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue}>Continue</Button>
      </div>
    </div>
  );
}

export function NotesStep({
  notes,
  onNotesChange,
  onBack,
  onSave,
}: {
  notes: string;
  onNotesChange: (text: string) => void;
  onBack: () => void;
  onSave: () => void;
}) {
  return (
    <div>
      <h3 className="text-md font-semibold mb-4">Anything else worth noting?</h3>
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Optional. A line or two — only what you want to write."
        className="w-full p-3 border border-border rounded-lg resize-none bg-surface dark:bg-charcoal-700"
        rows={4}
      />
      <div className="flex gap-3 mt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSave}>Save check-in</Button>
      </div>
    </div>
  );
}

const TREND_BADGE_CLASS: Record<MoodPattern['trendDirection'], string> = {
  improving: 'bg-green-100 text-green-800',
  stable: 'bg-blue-100 text-blue-800',
  concerning: 'bg-orange-100 text-orange-800',
};

export function CompletionStep({
  showInsights,
  pattern,
  isPremium,
  onRestart,
}: {
  showInsights: boolean;
  pattern: MoodPattern | null;
  isPremium: boolean;
  onRestart: () => void;
}) {
  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold mb-2">Logged.</h3>
      <p className="text-ink-soft mb-4">Thanks for taking a minute with this.</p>
      {showInsights && pattern && isPremium && (
        <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-start">
          <h4 className="font-semibold mb-3 text-primary-800 dark:text-primary-300">What stands out</h4>
          {pattern.commonTriggers.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium">Common triggers:</p>
              <p className="text-sm text-ink-soft">{pattern.commonTriggers.join(', ')}</p>
            </div>
          )}
          {pattern.effectiveCoping.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium">Effective strategies:</p>
              <p className="text-sm text-ink-soft">{pattern.effectiveCoping.join(', ')}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium">Trend:</p>
            <Badge className={TREND_BADGE_CLASS[pattern.trendDirection]}>{pattern.trendDirection}</Badge>
          </div>
        </div>
      )}
      <Button onClick={onRestart} className="mt-4">
        New check-in
      </Button>
    </div>
  );
}

export type { EmotionalState, MoodPattern };
