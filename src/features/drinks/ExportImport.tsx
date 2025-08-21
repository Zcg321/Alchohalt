import React, { useRef } from 'react';
import { Drink } from './DrinkForm';
import { Button } from '../../components/ui/Button';

interface Props {
  drinks: Drink[];
  onImport: (drinks: Drink[]) => void;
}

export function ExportImport({ drinks, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function exportData() {
    const blob = new Blob([JSON.stringify(drinks, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alchohalt-drinks.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) onImport(data as Drink[]);
      } catch {
        // ignore
      } finally {
        e.target.value = '';
      }
    });
  }

  return (
    <div className="space-x-2">
      <Button onClick={exportData}>Export</Button>
      <Button onClick={() => fileRef.current?.click()} variant="secondary">
        Import
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImport}
      />
    </div>
  );
}
