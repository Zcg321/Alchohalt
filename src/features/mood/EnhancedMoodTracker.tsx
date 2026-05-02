import React from 'react';
import { EMOTIONS, type EmotionalState, type EmotionKey, type MoodPattern, type MoodStep } from './moodConstants';
import { useMoodTracker } from './useMoodTracker';
import {
  CompletionStep,
  CopingStep,
  EmotionStep,
  IntensityStep,
  MoodHeader,
  NotesStep,
  TriggersStep,
} from './moodSteps';

interface Props {
  onComplete?: (state: EmotionalState) => void;
  onPatternUpdate?: (pattern: MoodPattern) => void;
  recentEntries?: EmotionalState[];
  className?: string;
}

interface StepBodyProps {
  step: MoodStep;
  state: Partial<EmotionalState>;
  pattern: MoodPattern | null;
  isPremium: boolean;
  showInsights: boolean;
  setState: React.Dispatch<React.SetStateAction<Partial<EmotionalState>>>;
  setStep: (step: MoodStep) => void;
  onEmotionSelect: (emotion: EmotionKey) => void;
  onIntensitySelect: (intensity: number) => void;
  onTriggerToggle: (trigger: string) => void;
  onCopingToggle: (strategy: string) => void;
  onSave: () => void;
  onRestart: () => void;
}

function StepBody(props: StepBodyProps) {
  const { step, state, setState, setStep } = props;
  const currentEmotion = EMOTIONS.find((e) => e.key === state.primaryEmotion);
  switch (step) {
    case 'emotion':
      return <EmotionStep selected={state.primaryEmotion} onSelect={props.onEmotionSelect} />;
    case 'intensity':
      return currentEmotion ? (
        <IntensityStep
          emotion={currentEmotion}
          selected={state.intensity}
          onSelect={props.onIntensitySelect}
          onContinue={() => setStep('triggers')}
        />
      ) : null;
    case 'triggers':
      return (
        <TriggersStep
          selected={state.triggers || []}
          onToggle={props.onTriggerToggle}
          onBack={() => setStep('intensity')}
          onContinue={() => setStep('coping')}
        />
      );
    case 'coping':
      return (
        <CopingStep
          selectedStrategies={state.copingStrategies || []}
          onToggleStrategy={props.onCopingToggle}
          cravingLevel={state.cravingLevel || 0}
          onCravingChange={(level) => setState((prev) => ({ ...prev, cravingLevel: level }))}
          onBack={() => setStep('triggers')}
          onContinue={() => setStep('notes')}
        />
      );
    case 'notes':
      return (
        <NotesStep
          notes={state.notes || ''}
          onNotesChange={(text) => setState((prev) => ({ ...prev, notes: text }))}
          onBack={() => setStep('coping')}
          onSave={props.onSave}
        />
      );
    case 'complete':
      return (
        <CompletionStep
          showInsights={props.showInsights}
          pattern={props.pattern}
          isPremium={props.isPremium}
          onRestart={props.onRestart}
        />
      );
  }
}

export default function EnhancedMoodTracker({
  onComplete,
  onPatternUpdate,
  recentEntries = [],
  className = '',
}: Props) {
  const { state, setState, step, setStep, showInsights, isPremium, moodPattern, handlers } = useMoodTracker({
    onComplete,
    onPatternUpdate,
    recentEntries,
  });

  return (
    <div className={`bg-surface-elevated rounded-lg border border-border-soft p-6 ${className}`}>
      <MoodHeader step={step} isPremium={isPremium} />
      <StepBody
        step={step}
        state={state}
        pattern={moodPattern}
        isPremium={isPremium}
        showInsights={showInsights}
        setState={setState}
        setStep={setStep}
        onEmotionSelect={handlers.handleEmotionSelect}
        onIntensitySelect={handlers.handleIntensitySelect}
        onTriggerToggle={handlers.handleTriggerToggle}
        onCopingToggle={handlers.handleCopingToggle}
        onSave={handlers.handleComplete}
        onRestart={handlers.handleRestart}
      />
    </div>
  );
}
