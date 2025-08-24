// @no-smoke
import React, { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Button } from '../../../components/ui/Button';
import { DrinkPreset, updatePreset } from './lib';

interface Props {
  preset: DrinkPreset;
  presets: DrinkPreset[];
  onChange(next: DrinkPreset[]): void;
}

export default function PresetItem({ preset, presets, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(preset.name);
  const [editVolume, setEditVolume] = useState(String(preset.volumeMl));
  const [editAbv, setEditAbv] = useState(String(preset.abvPct));

  function save(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(editVolume);
    const a = parseFloat(editAbv);
    if (!editName || isNaN(v) || isNaN(a)) return;
    onChange(updatePreset(presets, preset.name, { name: editName, volumeMl: v, abvPct: a }));
    setEditing(false);
  }

  return (
    <li className="space-y-1">
      {editing ? (
        <form onSubmit={save} className="space-y-1">
          <div>
            <Label htmlFor={`edit-name-${preset.name}`}>Name</Label>
            <Input
              id={`edit-name-${preset.name}`}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor={`edit-volume-${preset.name}`}>Volume ml</Label>
              <Input
                id={`edit-volume-${preset.name}`}
                type="number"
                value={editVolume}
                onChange={(e) => setEditVolume(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor={`edit-abv-${preset.name}`}>ABV %</Label>
              <Input
                id={`edit-abv-${preset.name}`}
                type="number"
                value={editAbv}
                onChange={(e) => setEditAbv(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <span>
            {preset.name} ({preset.volumeMl}ml @ {preset.abvPct}%)
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => onChange(presets.filter((p) => p.name !== preset.name))}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
