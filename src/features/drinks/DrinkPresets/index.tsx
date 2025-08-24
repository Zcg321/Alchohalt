// @no-smoke
import React from 'react';
import PresetItem from './PresetItem';
import AddPresetForm from './AddPresetForm';
import { DrinkPreset } from './lib';

interface Props {
  presets: DrinkPreset[];
  onChange(presets: DrinkPreset[]): void;
}

export default function DrinkPresets({ presets, onChange }: Props) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Drink presets</h3>
      <ul className="space-y-1">
        {presets.map((p) => (
          <PresetItem key={p.name} preset={p} presets={presets} onChange={onChange} />
        ))}
        {presets.length === 0 && (
          <li className="text-sm text-gray-500">No presets yet</li>
        )}
      </ul>
      <AddPresetForm onAdd={(preset) => onChange([...presets, preset])} />
    </div>
  );
}

export * from './lib';
