import { getPreferences } from "@/shared/capacitor";
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../i18n';

interface ClearDataProps {
  onCleared: () => void;
}

export function ClearData({ onCleared }: ClearDataProps) {
  const { t } = useLanguage();
  const [status, setStatus] = useState('');

  async function handleClick() {
    if (!window.confirm(t('eraseConfirm'))) return;
    await (await getPreferences()).clear();
    onCleared();
    setStatus(t('dataCleared'));
    setTimeout(() => setStatus(''), 3000);
  }

  return (
    <div className="space-y-1">
      <Button variant="danger" onClick={handleClick} aria-label={t('clearAllData')}>
        {t('clearAllData')}
      </Button>
      {status && (
        <p className="text-xs text-gray-500" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
