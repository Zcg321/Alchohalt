import React, { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Button } from '../../../components/ui/Button';
import { DrinkPreset } from './lib';

interface Props {
  onAdd(preset: DrinkPreset): void;
}

export default function AddPresetForm({ onAdd }: Props) {
  const [name, setName] = useState('');
  const [volume, setVolume] = useState('');
  const [abv, setAbv] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(volume);
    const a = parseFloat(abv);
    if (!name || isNaN(v) || isNaN(a)) return;
    onAdd({ name, volumeMl: v, abvPct: a });
    setName('');
    setVolume('');
    setAbv('');
  }

  return (
    <form onSubmit={submit} className="space-y-1">
      <div>
        <Label htmlFor="preset-name">Name</Label>
        <Input id="preset-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="preset-volume">Volume ml</Label>
          <Input
            id="preset-volume"
            type="number"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="preset-abv">ABV %</Label>
          <Input
            id="preset-abv"
            type="number"
            value={abv}
            onChange={(e) => setAbv(e.target.value)}
          />
        </div>
      </div>
      <Button type="submit">Add preset</Button>
    </form>
  );
}
