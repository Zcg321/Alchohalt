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
    <form onSubmit={submit} className="space-y-2">
      {presets && <PresetButtons presets={presets} onSelect={(p) => { setVolume(String(p.volumeMl)); setAbv(String(p.abvPct)); }} />}
      <div>
        <Label htmlFor="volume">{t('volume')}</Label>
        <Input id="volume" type="number" value={volume} onChange={(e) => setVolume(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="abv">{t('abv')}</Label>
        <Input id="abv" type="number" value={abv} onChange={(e) => setAbv(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="intention">{t('intentionLabel')}</Label>
        <select
          id="intention"
          value={intention}
          onChange={(e) => setIntention(e.target.value as Intention)}
          className="border p-2 rounded w-full"
        >
          {intentions.map((i) => (
            <option key={i} value={i}>
              {t(`intention_${i}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="craving">{t('cravingLabel')} {craving}</Label>
        <input
          id="craving"
          type="range"
          min={0}
          max={10}
          value={craving}
          onChange={(e) => setCraving(parseInt(e.target.value))}
          className="w-full"
        />
      </div>
      <HaltChecks selected={halt} onChange={setHalt} />
      <div>
        <Label htmlFor="alt">{t('alternative')}</Label>
        <Input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit">{label}</Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('cancel')}
          </Button>
        )}
      </div>
    </form>
  );
}

export * from './lib';
