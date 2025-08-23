import React, { useState } from 'react';
import { useDB, type HALT } from '../store/db';
import { useLanguage } from '../i18n';
import { UndoToast } from '../components/UndoToast';

export default function History() {
  const { entries, deleteEntry } = useDB(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => ({ entries: s.db.entries, deleteEntry: s.deleteEntry })
  );
  const [toast, setToast] = useState(false);
  const { t } = useLanguage();

  const onDelete = (id: string) => {
    deleteEntry(id);
    setToast(true);
  };

  const close = () => setToast(false);

  const sorted = [...entries].sort((a, b) => b.ts - a.ts);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">{t('history.title')}</h1>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-900">
            <tr>
              <th className="p-2 text-left">{t('history.date')}</th>
              <th className="p-2 text-left">{t('history.kind')}</th>
              <th className="p-2 text-left">{t('history.intention')}</th>
              <th className="p-2 text-left">{t('history.craving')}</th>
              <th className="p-2 text-left">{t('history.halt')}</th>
              <th className="p-2 text-left">{t('history.stdDrinks')}</th>
              <th className="p-2 text-left">{t('history.cost')}</th>
              <th className="p-2 text-left">{t('history.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-2">{new Date(e.ts).toLocaleString()}</td>
                <td className="p-2">{e.kind}</td>
                <td className="p-2">{e.intention}</td>
                <td className="p-2">{e.craving}</td>
                <td className="p-2">{
                  Object.keys(e.halt)
                    .filter((k) => (e.halt as HALT)[k as keyof HALT])
                    .join('')
                }</td>
                <td className="p-2">{e.stdDrinks}</td>
                <td className="p-2">{e.cost?.toFixed(2) ?? '-'}</td>
                <td className="p-2">
                  <button className="px-2 py-1 rounded border mr-2">{t('history.edit')}</button>
                  <button className="px-2 py-1 rounded border" onClick={() => onDelete(e.id)}>{t('history.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <UndoToast show={toast} onClose={close} />
    </div>
  );
}
