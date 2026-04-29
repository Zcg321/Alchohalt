/**
 * DrinkForm — progressive disclosure ([IA-3], Sprint 2B).
 *
 * Default surface = drink-type chip + time. Add button.
 * "Add detail ▾" expands volume + ABV (defaulted from the chip).
 * "More ▾" expands intention chips, craving slider, HALT vector, and
 * the alternative-action input.
 *
 * Disclosure state is session-only — every fresh log starts collapsed
 * at the simplest level. Submitting closes both expansions.
 */

import React, { useEffect, useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Button } from '../../../components/ui/Button';
import { useLanguage } from '../../../i18n';
import PresetButtons from './PresetButtons';
import HaltChecks from './HaltChecks';
import { Drink, Intention, intentions, Halt } from './lib';
import type { DrinkPreset } from '../DrinkPresets';

interface Props {
  onSubmit(drink: Drink): void;
  initial?: Drink;
  submitLabel?: string;
  onCancel?: () => void;
  presets?: DrinkPreset[];
}

type DrinkChipId = 'beer' | 'wine' | 'cocktail' | 'custom';

interface DrinkChip {
  id: DrinkChipId;
  label: string;
  volumeMl: number;
  abvPct: number;
}

const CHIPS: DrinkChip[] = [
  { id: 'beer',     label: 'Beer',     volumeMl: 355, abvPct: 5 },
  { id: 'wine',     label: 'Wine',     volumeMl: 150, abvPct: 12 },
  { id: 'cocktail', label: 'Cocktail', volumeMl: 60,  abvPct: 40 },
  { id: 'custom',   label: 'Custom',   volumeMl: 0,   abvPct: 0 },
];

function toLocalInput(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(s: string): number {
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : Date.now();
}

/** Pick the chip that matches an existing entry's volume/abv (used in
 * edit mode). Falls back to "custom" if nothing matches. */
function chipForEntry(d?: Drink): DrinkChipId {
  if (!d) return 'beer';
  const match = CHIPS.find((c) => c.id !== 'custom' && c.volumeMl === d.volumeMl && c.abvPct === d.abvPct);
  return match ? match.id : 'custom';
}

export default function DrinkForm({ onSubmit, initial, submitLabel, onCancel, presets }: Props) {
  const { t } = useLanguage();
  const label = submitLabel ?? t('add');

  const [chip, setChip] = useState<DrinkChipId>(() => chipForEntry(initial));
  const [time, setTime] = useState<string>(() => toLocalInput(initial?.ts ?? Date.now()));
  const [volume, setVolume] = useState(initial ? String(initial.volumeMl) : String(CHIPS[0].volumeMl));
  const [abv, setAbv] = useState(initial ? String(initial.abvPct) : String(CHIPS[0].abvPct));
  const [intention, setIntention] = useState<Intention>(initial?.intention ?? 'social');
  const [craving, setCraving] = useState(initial?.craving ?? 0);
  const [halt, setHalt] = useState<Halt[]>(initial?.halt ?? []);
  const [alt, setAlt] = useState(initial?.alt ?? '');

  // If editing pre-existing detail data, open the relevant disclosures
  // so the user can see what they're editing. New entries start collapsed.
  const editingHasDetail = !!initial && (initial.intention !== 'social' || initial.craving > 0 || initial.halt.length > 0 || !!initial.alt);
  const editingNonStandard = !!initial && chipForEntry(initial) === 'custom';
  const [showDetail, setShowDetail] = useState<boolean>(editingNonStandard || editingHasDetail);
  const [showMore, setShowMore]     = useState<boolean>(editingHasDetail);

  function applyChip(id: DrinkChipId) {
    setChip(id);
    const c = CHIPS.find((x) => x.id === id);
    if (c && id !== 'custom') {
      setVolume(String(c.volumeMl));
      setAbv(String(c.abvPct));
    } else if (id === 'custom') {
      setShowDetail(true); // custom forces detail open
    }
  }

  function applyPreset(p: DrinkPreset) {
    setVolume(String(p.volumeMl));
    setAbv(String(p.abvPct));
    setChip('custom');
    setShowDetail(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(volume);
    const a = parseFloat(abv);
    if (!Number.isFinite(v) || !Number.isFinite(a)) return;
    onSubmit({
      volumeMl: v,
      abvPct: a,
      intention,
      craving,
      halt,
      alt,
      ts: fromLocalInput(time),
    });
    if (!initial) {
      setChip('beer');
      setTime(toLocalInput(Date.now()));
      setVolume(String(CHIPS[0].volumeMl));
      setAbv(String(CHIPS[0].abvPct));
      setIntention('social');
      setCraving(0);
      setHalt([]);
      setAlt('');
      setShowDetail(false);
      setShowMore(false);
    }
  }

  // If the parent swaps `initial` (edit mode → fresh add), reset session
  // disclosure to collapsed.
  useEffect(() => {
    if (!initial) {
      setShowDetail(false);
      setShowMore(false);
    }
  }, [initial]);

  const submitDisabled = chip === 'custom' && (!volume || !abv);

  return (
    <form id="drink-form" onSubmit={submit} className="space-y-6">
      {/* L0 — Drink-type chips */}
      <div className="space-y-2">
        <span id="drink-type-label" className="block text-caption font-medium text-ink">
          What did you have?
        </span>
        <div role="radiogroup" aria-labelledby="drink-type-label" className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={chip === c.id}
              onClick={() => applyChip(c.id)}
              className={`px-4 py-2 rounded-pill text-caption transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px] ${
                chip === c.id
                  ? 'bg-sage-700 text-white border-sage-700'
                  : 'bg-surface text-ink border border-border-soft hover:bg-cream-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {presets && presets.length > 0 && (
        <div>
          <span className="block text-caption text-ink-soft mb-2">Saved presets</span>
          <PresetButtons presets={presets} onSelect={applyPreset} />
        </div>
      )}

      {/* L0 — Time */}
      <div className="space-y-1">
        <Label htmlFor="drink-time">When?</Label>
        <Input
          id="drink-time"
          type="datetime-local"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>

      {/* L1 — Add detail (volume + ABV) */}
      <div>
        <button
          type="button"
          aria-expanded={showDetail}
          aria-controls="drink-detail-panel"
          onClick={() => setShowDetail((s) => !s)}
          className="text-caption text-ink-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 rounded"
        >
          {showDetail ? 'Hide detail ▴' : 'Add detail ▾'}
        </button>
        <div
          id="drink-detail-panel"
          aria-hidden={!showDetail}
          hidden={!showDetail}
          className={`mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 ${showDetail ? '' : 'hidden'}`}
        >
          <div className="space-y-1">
            <Label htmlFor="volume" required>{t('volume')}</Label>
            <Input
              id="volume"
              type="number"
              value={volume}
              onChange={(e) => { setVolume(e.target.value); setChip('custom'); }}
              placeholder={t('volume.placeholder')}
              rightIcon={<span className="text-xs text-ink-subtle">mL</span>}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="abv" required>{t('abv')}</Label>
            <Input
              id="abv"
              type="number"
              step="0.1"
              value={abv}
              onChange={(e) => { setAbv(e.target.value); setChip('custom'); }}
              placeholder={t('abv.placeholder')}
              rightIcon={<span className="text-xs text-ink-subtle">%</span>}
            />
          </div>
        </div>
      </div>

      {/* L2 — More (intention, craving, HALT, alt) */}
      <div>
        <button
          type="button"
          aria-expanded={showMore}
          aria-controls="drink-more-panel"
          onClick={() => setShowMore((s) => !s)}
          className="text-caption text-ink-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 rounded"
        >
          {showMore ? 'Hide more ▴' : 'More ▾'}
        </button>
        <div
          id="drink-more-panel"
          aria-hidden={!showMore}
          hidden={!showMore}
          className={`mt-3 space-y-6 ${showMore ? '' : 'hidden'}`}
        >
          <div className="space-y-2">
            <span id="intention-label" className="block text-caption font-medium text-ink">
              {t('intentionLabel')}
            </span>
            <div role="radiogroup" aria-labelledby="intention-label" className="flex flex-wrap gap-2">
              {intentions.map((i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={intention === i}
                  onClick={() => setIntention(i)}
                  className={`px-3 py-2 rounded-pill text-caption transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px] ${
                    intention === i
                      ? 'bg-sage-700 text-white border-sage-700'
                      : 'bg-surface text-ink border border-border-soft hover:bg-cream-50'
                  }`}
                >
                  {t(`intention_${i}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="craving" className="flex items-center justify-between">
              {t('cravingLabel')}
              <span className="text-body font-semibold text-ink tabular-nums">{craving}</span>
            </Label>
            <input
              id="craving"
              type="range"
              min={0}
              max={10}
              value={craving}
              onChange={(e) => setCraving(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer slider bg-cream-100 dark:bg-charcoal-700"
            />
            <div className="flex justify-between text-micro text-ink-subtle">
              <span>{t('craving.low')}</span>
              <span>{t('craving.high')}</span>
            </div>
          </div>

          <HaltChecks selected={halt} onChange={setHalt} />

          <div className="space-y-1">
            <Label htmlFor="alt">{t('alternative')}</Label>
            <Input
              id="alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder={t('alternativePlaceholder')}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border-soft">
        <Button
          type="submit"
          className="flex-1 sm:flex-none min-h-[44px]"
          disabled={submitDisabled}
        >
          {label}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1 sm:flex-none min-h-[44px]"
          >
            {t('cancel')}
          </Button>
        )}
      </div>
    </form>
  );
}

export * from './lib';
