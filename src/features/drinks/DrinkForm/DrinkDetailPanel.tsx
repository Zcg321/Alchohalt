import React from 'react';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { useLanguage } from '../../../i18n';

interface Props {
  show: boolean;
  onToggle: () => void;
  volume: string;
  abv: string;
  onVolumeChange: (v: string) => void;
  onAbvChange: (a: string) => void;
}

export function DrinkDetailPanel({ show, onToggle, volume, abv, onVolumeChange, onAbvChange }: Props) {
  const { t } = useLanguage();
  return (
    <div>
      <button
        type="button"
        aria-expanded={show}
        aria-controls="drink-detail-panel"
        onClick={onToggle}
        className="text-caption text-ink-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 rounded"
      >
        {show ? 'Hide detail ▴' : 'Add detail ▾'}
      </button>
      <div
        id="drink-detail-panel"
        aria-hidden={!show}
        hidden={!show}
        className={`mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 ${show ? '' : 'hidden'}`}
      >
        <div className="space-y-1">
          <Label htmlFor="volume" required>
            {t('volume')}
          </Label>
          <Input
            id="volume"
            type="number"
            value={volume}
            onChange={(e) => onVolumeChange(e.target.value)}
            placeholder={t('volume.placeholder')}
            rightIcon={<span className="text-xs text-ink-subtle">mL</span>}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="abv" required>
            {t('abv')}
          </Label>
          <Input
            id="abv"
            type="number"
            step="0.1"
            value={abv}
            onChange={(e) => onAbvChange(e.target.value)}
            placeholder={t('abv.placeholder')}
            rightIcon={<span className="text-xs text-ink-subtle">%</span>}
          />
        </div>
      </div>
    </div>
  );
}
