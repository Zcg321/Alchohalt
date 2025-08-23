import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Button } from '../../components/ui/Button';
import type { DrinkPreset } from './DrinkPresets';
import { useLanguage } from '../../i18n';

export const intentions = ['celebrate', 'social', 'taste', 'bored', 'cope'] as const;
export type Intention = (typeof intentions)[number];

export const haltOptions = ['hungry', 'angry', 'lonely', 'tired'] as const;
export type Halt = (typeof haltOptions)[number];

export interface Drink {
  volumeMl: number;
  abvPct: number;
  intention: Intention;
  craving: number;
  halt: Halt[];
  alt: string;
  ts: number;
}

interface Props {
  onSubmit(drink: Drink): void;
  initial?: Drink;
  submitLabel?: string;
  onCancel?: () => void;
  presets?: DrinkPreset[];
}

export function DrinkForm({ onSubmit, initial, submitLabel, onCancel, presets }: Props) {
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
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Button
              key={p.name}
              type="button"
              variant="secondary"
              onClick={() => {
                setVolume(String(p.volumeMl));
                setAbv(String(p.abvPct));
              }}
            >
              {p.name}
            </Button>
          ))}
        </div>
      )}
      <div>
        <Label htmlFor="volume">{t('volume')}</Label>
        <Input
          id="volume"
          type="number"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
        />
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
      <div>
        <span className="block font-medium">{t('haltLabel')}</span>
        {haltOptions.map((h) => (
          <label key={h} className="mr-2">
            <input
              type="checkbox"
              checked={halt.includes(h)}
              onChange={(e) =>
                setHalt((prev) =>
                  e.target.checked ? [...prev, h] : prev.filter((x) => x !== h)
                )
              }
            />{' '}
            {t(`halt_${h}`)}
          </label>
        ))}
      </div>
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
