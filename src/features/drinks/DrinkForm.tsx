import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Button } from '../../components/ui/Button';

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
  onAdd(drink: Drink): void;
}

export function DrinkForm({ onAdd }: Props) {
  const [volume, setVolume] = useState('');
  const [abv, setAbv] = useState('');
  const [intention, setIntention] = useState<Intention>('taste');
  const [craving, setCraving] = useState(0);
  const [halt, setHalt] = useState<Halt[]>([]);
  const [alt, setAlt] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(volume);
    const a = parseFloat(abv);
    if (isNaN(v) || isNaN(a)) return;
    onAdd({ volumeMl: v, abvPct: a, intention, craving, halt, alt, ts: Date.now() });
    setVolume('');
    setAbv('');
    setIntention('taste');
    setCraving(0);
    setHalt([]);
    setAlt('');
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div>
        <Label htmlFor="volume">Volume ml</Label>
        <Input
          id="volume"
          type="number"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="abv">ABV %</Label>
        <Input id="abv" type="number" value={abv} onChange={(e) => setAbv(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="intention">Intention</Label>
        <select
          id="intention"
          value={intention}
          onChange={(e) => setIntention(e.target.value as Intention)}
          className="border p-2 rounded w-full"
        >
          {intentions.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="craving">Craving {craving}</Label>
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
        <span className="block font-medium">HALT</span>
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
            {h}
          </label>
        ))}
      </div>
      <div>
        <Label htmlFor="alt">Alternative action</Label>
        <Input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} />
      </div>
      <Button type="submit">Add</Button>
    </form>
  );
}
