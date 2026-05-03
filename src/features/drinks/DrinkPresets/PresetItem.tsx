// @no-smoke
import React, { useEffect, useRef, useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Button } from '../../../components/ui/Button';
import { updatePreset } from './lib';
import type { DrinkPreset } from './lib';

interface Props {
  preset: DrinkPreset;
  presets: DrinkPreset[];
  onChange(next: DrinkPreset[]): void;
}

const CONFIRM_WINDOW_MS = 3000;

export default function PresetItem({ preset, presets, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(preset.name);
  const [editVolume, setEditVolume] = useState(String(preset.volumeMl));
  const [editAbv, setEditAbv] = useState(String(preset.abvPct));
  /* [R13-C] Tap-to-confirm delete. The original handler deleted the
   * preset on a single tap — too easy to nuke "my usual IPA" by
   * mistake. Now the first tap arms a 3-second confirm window; the
   * second tap commits. After 3s the button reverts. No window.confirm
   * dialog (out of place inside a settings list). */
  const [pendingDelete, setPendingDelete] = useState(false);
  const pendingTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (pendingTimer.current !== undefined) {
        window.clearTimeout(pendingTimer.current);
      }
    };
  }, []);

  function handleDeleteClick() {
    if (!pendingDelete) {
      setPendingDelete(true);
      pendingTimer.current = window.setTimeout(() => {
        setPendingDelete(false);
        pendingTimer.current = undefined;
      }, CONFIRM_WINDOW_MS);
      return;
    }
    if (pendingTimer.current !== undefined) {
      window.clearTimeout(pendingTimer.current);
      pendingTimer.current = undefined;
    }
    setPendingDelete(false);
    onChange(presets.filter((p) => p.name !== preset.name));
  }

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
              onClick={handleDeleteClick}
              data-testid={`preset-delete-${preset.name}`}
              aria-label={pendingDelete ? `Confirm delete ${preset.name}` : `Delete ${preset.name}`}
            >
              {pendingDelete ? 'Tap again to delete' : 'Delete'}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
