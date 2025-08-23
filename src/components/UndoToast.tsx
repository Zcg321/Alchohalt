import React from 'react';
import { useDB } from '../store/db';
import { useLanguage } from '../i18n';

interface Props { show: boolean; onClose?: () => void }

export function UndoToast({ show, onClose }: Props) {
  const undo = useDB((s: any) => s.undo); // eslint-disable-line @typescript-eslint/no-explicit-any
  const { t } = useLanguage();
  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-neutral-800 text-white px-4 py-3 rounded-xl shadow-lg flex gap-4 items-center z-50">
      <span>{t('history.deleted')}</span>
      <button
        aria-label={t('toast.undo')}
        className="bg-white text-black px-3 py-1 rounded-md hover:opacity-90"
        onClick={() => { undo(); onClose?.(); }}
      >
        {t('toast.undo')}
      </button>
      <button
        aria-label={t('toast.dismiss')}
        className="opacity-80 hover:opacity-100"
        onClick={() => onClose?.()}
      >
        {t('toast.dismiss')}
      </button>
    </div>
  );
}
