import React, { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Button } from '../../../components/ui/Button';
import { useLanguage } from '../../../i18n';
import PresetButtons from './PresetButtons';
import HaltChecks from './HaltChecks';
import { Drink, Intention, intentions, Halt } from './lib';
import type { DrinkPreset } from '../DrinkPresets';

interface Props {
  onSubmit(drink: Drink): void;
  initial?: Drink;
  submitLabel?: string;
  onCancel?: () => void;
  presets?: DrinkPreset[];
}

// Helper component for the craving slider section
function CravingSlider({ 
  craving, setCraving, t 
}: { 
  craving: number; 
  setCraving: (c: number) => void; 
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-3">
      <Label htmlFor="craving" className="flex items-center justify-between">
        {t('cravingLabel')}
        <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
          {craving}
        </span>
      </Label>
      <div className="px-1">
        <input
          id="craving"
          type="range"
          min={0}
          max={10}
          value={craving}
          onChange={(e) => setCraving(parseInt(e.target.value))}
          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700 slider"
          style={{
            background: `linear-gradient(to right, #f87171 0%, #fbbf24 50%, #34d399 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-neutral-500 mt-1">
          <span>{t('craving.low')}</span>
          <span>{t('craving.high')}</span>
        </div>
      </div>
    </div>
  );
}

// Helper component for volume/ABV inputs
function VolumeAbvInputs({ 
  volume, setVolume, abv, setAbv, t 
}: { 
  volume: string; 
  setVolume: (v: string) => void; 
  abv: string; 
  setAbv: (a: string) => void; 
  t: (key: string) => string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label htmlFor="volume" required>{t('volume')}</Label>
        <Input 
          id="volume" 
          type="number" 
          value={volume} 
          onChange={(e) => setVolume(e.target.value)}
          placeholder={t('volume.placeholder')}
          rightIcon={<span className="text-xs text-neutral-400">mL</span>}
        />
      </div>
      
      <div className="space-y-1">
        <Label htmlFor="abv" required>{t('abv')}</Label>
        <Input 
          id="abv" 
          type="number" 
          step="0.1"
          value={abv} 
          onChange={(e) => setAbv(e.target.value)}
          placeholder={t('abv.placeholder')}
          rightIcon={<span className="text-xs text-neutral-400">%</span>}
        />
      </div>
    </div>
  );
}

// Helper component for form actions
function FormActions({ 
  volume, abv, label, onCancel, t 
}: { 
  volume: string;
  abv: string;
  label: string;
  onCancel?: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
      <Button 
        type="submit" 
        className="flex-1 sm:flex-none"
        disabled={!volume || !abv}
      >
        {label}
      </Button>
      {onCancel && (
        <Button 
          type="button" 
          variant="secondary"
          onClick={onCancel}
          className="flex-1 sm:flex-none"
        >
          {t('cancel')}
        </Button>
      )}
    </div>
  );
}

export default function DrinkForm({ onSubmit, initial, submitLabel, onCancel, presets }: Props) {
  const { t } = useLanguage();
  const label = submitLabel ?? t('add');
  const [volume, setVolume] = useState(initial ? String(initial.volumeMl) : '');
  const [abv, setAbv] = useState(initial ? String(initial.abvPct) : '');
  const [intention, setIntention] = useState<Intention>(initial?.intention ?? 'taste');
  const [craving, setCraving] = useState(initial?.craving ?? 0);
  const [halt, setHalt] = useState<Halt[]>(initial?.halt ?? []);
  const [alt, setAlt] = useState(initial?.alt ?? '');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(volume);
    const a = parseFloat(abv);
    if (isNaN(v) || isNaN(a)) return;
    onSubmit({ volumeMl: v, abvPct: a, intention, craving, halt, alt, ts: initial?.ts ?? Date.now() });
    if (!initial) {
      setVolume('');
      setAbv('');
      setIntention('taste');
      setCraving(0);
      setHalt([]);
      setAlt('');
    }
  }

  return (
    <form id="drink-form" onSubmit={submit} className="space-y-6">
      {presets && (
        <div className="animate-in">
          <PresetButtons 
            presets={presets} 
            onSelect={(p) => { 
              setVolume(String(p.volumeMl)); 
              setAbv(String(p.abvPct)); 
            }} 
          />
        </div>
      )}
      
      <VolumeAbvInputs volume={volume} setVolume={setVolume} abv={abv} setAbv={setAbv} t={t} />
      
      <div className="space-y-1">
        <Label htmlFor="intention">{t('intentionLabel')}</Label>
        <select
          id="intention"
          value={intention}
          onChange={(e) => setIntention(e.target.value as Intention)}
          className="input cursor-pointer"
        >
          {intentions.map((i) => (
            <option key={i} value={i}>
              {t(`intention_${i}`)}
            </option>
          ))}
        </select>
      </div>
      
      <CravingSlider craving={craving} setCraving={setCraving} t={t} />
      
      <div className="space-y-3">
        <HaltChecks selected={halt} onChange={setHalt} />
      </div>
      
      <div className="space-y-1">
        <Label htmlFor="alt">{t('alternative')}</Label>
        <Input 
          id="alt" 
          value={alt} 
          onChange={(e) => setAlt(e.target.value)}
          placeholder={t('alternativePlaceholder')}
        />
      </div>
      
      <FormActions volume={volume} abv={abv} label={label} onCancel={onCancel} t={t} />
    </form>
  );
}

export * from './lib';
