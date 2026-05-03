import React from 'react';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { useLanguage } from '../../../i18n';
import HaltChecks from './HaltChecks';
import TagsInput from './TagsInput';
import { intentions, type Halt, type Intention } from './lib';

interface Props {
  show: boolean;
  onToggle: () => void;
  intention: Intention;
  setIntention: (i: Intention) => void;
  craving: number;
  setCraving: (c: number) => void;
  halt: Halt[];
  setHalt: (h: Halt[]) => void;
  alt: string;
  setAlt: (a: string) => void;
  tags: string[];
  setTags: (t: string[]) => void;
}

function IntentionRadioGroup({
  selected,
  onSelect,
}: {
  selected: Intention;
  onSelect: (i: Intention) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-2">
      <span id="intention-label" className="block text-caption font-medium text-ink">
        {t('intentionLabel')}
      </span>
      <div role="radiogroup" aria-labelledby="intention-label" className="flex flex-wrap gap-2">
        {intentions.map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={selected === i}
            onClick={() => onSelect(i)}
            className={`px-3 py-2 rounded-pill text-caption transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px] ${
              selected === i
                ? 'bg-sage-700 text-white border-sage-700'
                : 'bg-surface text-ink border border-border-soft hover:bg-cream-50'
            }`}
          >
            {t(`intention_${i}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

function CravingSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-3">
      <Label htmlFor="craving" className="flex items-center justify-between">
        {t('cravingLabel')}
        <span className="text-body font-semibold text-ink tabular-nums">{value}</span>
      </Label>
      <input
        id="craving"
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer slider bg-cream-100 dark:bg-charcoal-700"
      />
      <div className="flex justify-between text-micro text-ink-subtle">
        <span>{t('craving.low')}</span>
        <span>{t('craving.high')}</span>
      </div>
    </div>
  );
}

export function DrinkMorePanel(props: Props) {
  const { t } = useLanguage();
  const { show, onToggle } = props;
  return (
    <div>
      <button
        type="button"
        aria-expanded={show}
        aria-controls="drink-more-panel"
        onClick={onToggle}
        className="text-caption text-ink-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 rounded"
      >
        {show ? 'Hide more ▴' : 'More ▾'}
      </button>
      <div
        id="drink-more-panel"
        aria-hidden={!show}
        hidden={!show}
        className={`mt-3 space-y-6 ${show ? '' : 'hidden'}`}
      >
        <IntentionRadioGroup selected={props.intention} onSelect={props.setIntention} />
        <CravingSlider value={props.craving} onChange={props.setCraving} />
        <HaltChecks selected={props.halt} onChange={props.setHalt} />
        <div className="space-y-1">
          <Label htmlFor="alt">{t('alternative')}</Label>
          <Input
            id="alt"
            value={props.alt}
            onChange={(e) => props.setAlt(e.target.value)}
            placeholder={t('alternativePlaceholder')}
          />
        </div>
        <TagsInput value={props.tags} onChange={props.setTags} />
      </div>
    </div>
  );
}
