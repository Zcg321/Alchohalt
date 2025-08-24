import React from 'react';
import { Button } from '../../../components/ui/Button';
import { DrinkPreset } from '../DrinkPresets';

interface Props {
  presets: DrinkPreset[];
  onSelect(p: DrinkPreset): void;
}

export default function PresetButtons({ presets, onSelect }: Props) {
  if (!presets || presets.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((p) => (
        <Button key={p.name} type="button" variant="secondary" onClick={() => onSelect(p)}>
          {p.name}
        </Button>
      ))}
    </div>
  );
}
