import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { FormField } from '../../components/ui/FormField';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useLanguage } from '../../i18n';
import type { AdvancedGoal, GoalType } from './types';
import { GOAL_TEMPLATES, type GoalTemplate } from './templates';

interface Props {
  goalTypes: GoalType[];
  onAdd: (goal: Omit<AdvancedGoal, 'id'>) => void;
  onClose: () => void;
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function TemplatePicker({ onApply, onBuildOwn }: {
  onApply: (tpl: GoalTemplate) => void;
  onBuildOwn: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="card-content space-y-4" data-testid="goal-template-picker">
      <div>
        <Label>{t('goalTemplates.heading', 'Templates')}</Label>
        <p className="text-xs text-ink-subtle mt-1">
          {t('goalTemplates.subtitle', 'Start from a common shape. You can still customize everything.')}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {GOAL_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id} type="button" onClick={() => onApply(tpl)}
            data-testid={`goal-template-${tpl.id}`}
            className="w-full rounded-2xl border border-border-soft bg-white px-4 py-3 text-start hover:bg-neutral-50 hover:border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{tpl.icon}</span>
              <span className="font-medium text-sm">{t(`goalTemplates.${tpl.id}.title`, tpl.title)}</span>
            </div>
            <p className="text-xs text-ink-subtle mt-1">
              {t(`goalTemplates.${tpl.id}.description`, tpl.description)}
            </p>
          </button>
        ))}
      </div>
      <Button type="button" variant="secondary" onClick={onBuildOwn} className="w-full">
        {t('goalTemplates.buildMyOwn', 'Build my own')}
      </Button>
    </div>
  );
}

interface DetailFormProps {
  goalTypes: GoalType[];
  selectedType: AdvancedGoal['type'];
  setSelectedType: (t: AdvancedGoal['type']) => void;
  title: string; setTitle: (s: string) => void;
  description: string; setDescription: (s: string) => void;
  target: number; setTarget: (n: number) => void;
  deadline: string; setDeadline: (s: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

function DetailForm(p: DetailFormProps) {
  const selectedGoalType = p.goalTypes.find((gt) => gt.value === p.selectedType);
  return (
    <form onSubmit={p.onSubmit} className="card-content space-y-4">
      <div>
        <Label>Goal Type</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {p.goalTypes.map((type) => (
            <button
              key={type.value} type="button" onClick={() => p.setSelectedType(type.value)}
              className={`p-3 text-start rounded-lg border transition-colors ${
                p.selectedType === type.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-border-soft hover:border-border'
              }`}
            >
              <div className="text-lg mb-1">{type.icon}</div>
              <div className="font-medium text-sm">{type.label}</div>
              <div className="text-xs opacity-70">{type.description}</div>
            </button>
          ))}
        </div>
      </div>
      {/* [R21-C] FormField primitive owns label + input wrapper +
        * description + aria wiring. The visible asterisk for required
        * fields stays in the label text since FormField is type-agnostic
        * about required vs optional. */}
      <FormField id="title" label={<><span>Goal Title</span> <span aria-hidden="true" className="text-crisis-700">*</span></>}>
        <Input value={p.title} onChange={(e) => p.setTitle(e.target.value)}
          placeholder={`e.g., ${selectedGoalType?.label}`} required />
      </FormField>
      <FormField id="description" label="Description">
        <Input value={p.description} onChange={(e) => p.setDescription(e.target.value)}
          placeholder="Optional description of your goal" />
      </FormField>
      <FormField id="target" label={<><span>Target</span> <span aria-hidden="true" className="text-crisis-700">*</span></>}>
        <Input type="number" value={p.target}
          onChange={(e) => p.setTarget(Number(e.target.value))} min={1} required
          rightIcon={<span className="text-xs text-ink-subtle">{p.selectedType === 'streak' ? 'days' : 'drinks'}</span>}
        />
      </FormField>
      <FormField id="deadline" label="Deadline (Optional)">
        <Input type="date" value={p.deadline}
          onChange={(e) => p.setDeadline(e.target.value)}
          min={new Date().toISOString().split('T')[0]} />
      </FormField>
      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">Create Goal</Button>
        <Button type="button" variant="secondary" onClick={p.onClose}>Cancel</Button>
      </div>
    </form>
  );
}

export default function AddGoalModal({ goalTypes, onAdd, onClose }: Props) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<'template' | 'detail'>('template');
  const [selectedType, setSelectedType] = useState<AdvancedGoal['type']>('streak');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState<number>(30);
  const [deadline, setDeadline] = useState('');
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useFocusTrap(dialogRef, true, onClose);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function applyTemplate(tpl: GoalTemplate) {
    setSelectedType(tpl.type);
    setTitle(t(`goalTemplates.${tpl.id}.title`, tpl.title));
    setDescription(t(`goalTemplates.${tpl.id}.description`, tpl.description));
    setTarget(tpl.target);
    setPhase('detail');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !target) return;
    onAdd({
      type: selectedType, title, description, target, current: 0,
      unit: selectedType === 'streak' ? 'days' : 'drinks',
      deadline: deadline ? new Date(deadline) : undefined,
      isActive: true,
    });
  };

  return (
    <div
      ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="add-goal-title"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header flex items-start justify-between gap-3">
          <h3 id="add-goal-title" className="font-semibold flex-1 min-w-0">Create New Goal</h3>
          <button
            type="button" onClick={onClose}
            className="shrink-0 -mt-1 -me-1 p-2 text-ink-subtle hover:text-ink min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        {phase === 'template' ? (
          <TemplatePicker onApply={applyTemplate} onBuildOwn={() => setPhase('detail')} />
        ) : (
          <DetailForm
            goalTypes={goalTypes} selectedType={selectedType} setSelectedType={setSelectedType}
            title={title} setTitle={setTitle}
            description={description} setDescription={setDescription}
            target={target} setTarget={setTarget}
            deadline={deadline} setDeadline={setDeadline}
            onSubmit={handleSubmit} onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
