import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Button } from '../../components/ui/Button';

export interface DrinkPreset {
  name: string;
  volumeMl: number;
  abvPct: number;
}

export function updatePreset(
  presets: DrinkPreset[],
  original: string,
  next: DrinkPreset
): DrinkPreset[] {
  return presets.map((p) => (p.name === original ? next : p));
}

interface Props {
  presets: DrinkPreset[];
  onChange(presets: DrinkPreset[]): void;
}

export function DrinkPresets({ presets, onChange }: Props) {
  const [name, setName] = useState('');
  const [volume, setVolume] = useState('');
  const [abv, setAbv] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editVolume, setEditVolume] = useState('');
  const [editAbv, setEditAbv] = useState('');

  function addPreset(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(volume);
    const a = parseFloat(abv);
    if (!name || isNaN(v) || isNaN(a)) return;
    onChange([...presets, { name, volumeMl: v, abvPct: a }]);
    setName('');
    setVolume('');
    setAbv('');
  }

  function removePreset(n: string) {
    onChange(presets.filter((p) => p.name !== n));
  }

  function startEdit(p: DrinkPreset) {
    setEditing(p.name);
    setEditName(p.name);
    setEditVolume(String(p.volumeMl));
    setEditAbv(String(p.abvPct));
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const v = parseFloat(editVolume);
    const a = parseFloat(editAbv);
    if (!editName || isNaN(v) || isNaN(a)) return;
    onChange(updatePreset(presets, editing, { name: editName, volumeMl: v, abvPct: a }));
    setEditing(null);
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Drink presets</h3>
      <ul className="space-y-1">
        {presets.map((p) => (
          <li key={p.name} className="space-y-1">
            {editing === p.name ? (
              <form onSubmit={saveEdit} className="space-y-1">
                <div>
                  <Label htmlFor={`edit-name-${p.name}`}>Name</Label>
                  <Input
                    id={`edit-name-${p.name}`}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`edit-volume-${p.name}`}>Volume ml</Label>
                    <Input
                      id={`edit-volume-${p.name}`}
                      type="number"
                      value={editVolume}
                      onChange={(e) => setEditVolume(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`edit-abv-${p.name}`}>ABV %</Label>
                    <Input
                      id={`edit-abv-${p.name}`}
                      type="number"
                      value={editAbv}
                      onChange={(e) => setEditAbv(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Save</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <span>
                  {p.name} ({p.volumeMl}ml @ {p.abvPct}%)
                </span>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => startEdit(p)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => removePreset(p.name)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
        {presets.length === 0 && (
          <li className="text-sm text-gray-500">No presets yet</li>
        )}
      </ul>
      <form onSubmit={addPreset} className="space-y-1">
        <div>
          <Label htmlFor="preset-name">Name</Label>
          <Input
            id="preset-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
    </div>
  );
}

