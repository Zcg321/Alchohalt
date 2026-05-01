import { useEffect, useState } from 'react';
import type { Drink, Halt, Intention } from './lib';

export type DrinkChipId = 'beer' | 'wine' | 'cocktail' | 'custom';

export interface DrinkChip {
  id: DrinkChipId;
  label: string;
  volumeMl: number;
  abvPct: number;
}

export const CHIPS: DrinkChip[] = [
  { id: 'beer', label: 'Beer', volumeMl: 355, abvPct: 5 },
  { id: 'wine', label: 'Wine', volumeMl: 150, abvPct: 12 },
  { id: 'cocktail', label: 'Cocktail', volumeMl: 60, abvPct: 40 },
  { id: 'custom', label: 'Custom', volumeMl: 0, abvPct: 0 },
];

export function toLocalInput(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(s: string): number {
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : Date.now();
}

export function chipForEntry(d?: Drink): DrinkChipId {
  if (!d) return 'beer';
  const match = CHIPS.find((c) => c.id !== 'custom' && c.volumeMl === d.volumeMl && c.abvPct === d.abvPct);
  return match ? match.id : 'custom';
}

export function useDrinkForm(initial: Drink | undefined, onSubmit: (d: Drink) => void) {
  const [chip, setChip] = useState<DrinkChipId>(() => chipForEntry(initial));
  const [time, setTime] = useState<string>(() => toLocalInput(initial?.ts ?? Date.now()));
  const [volume, setVolume] = useState(initial ? String(initial.volumeMl) : String(CHIPS[0].volumeMl));
  const [abv, setAbv] = useState(initial ? String(initial.abvPct) : String(CHIPS[0].abvPct));
  const [intention, setIntention] = useState<Intention>(initial?.intention ?? 'social');
  const [craving, setCraving] = useState(initial?.craving ?? 0);
  const [halt, setHalt] = useState<Halt[]>(initial?.halt ?? []);
  const [alt, setAlt] = useState(initial?.alt ?? '');

  const editingHasDetail = !!initial && (
    initial.intention !== 'social' ||
    initial.craving > 0 ||
    initial.halt.length > 0 ||
    !!initial.alt
  );
  const editingNonStandard = !!initial && chipForEntry(initial) === 'custom';
  const [showDetail, setShowDetail] = useState<boolean>(editingNonStandard || editingHasDetail);
  const [showMore, setShowMore] = useState<boolean>(editingHasDetail);

  useEffect(() => {
    if (!initial) {
      setShowDetail(false);
      setShowMore(false);
    }
  }, [initial]);

  const applyChip = (id: DrinkChipId) => {
    setChip(id);
    const c = CHIPS.find((x) => x.id === id);
    if (c && id !== 'custom') {
      setVolume(String(c.volumeMl));
      setAbv(String(c.abvPct));
    } else if (id === 'custom') {
      setShowDetail(true);
    }
  };

  const applyPreset = (p: { volumeMl: number; abvPct: number }) => {
    setVolume(String(p.volumeMl));
    setAbv(String(p.abvPct));
    setChip('custom');
    setShowDetail(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(volume);
    const a = parseFloat(abv);
    if (!Number.isFinite(v) || !Number.isFinite(a)) return;
    onSubmit({ volumeMl: v, abvPct: a, intention, craving, halt, alt, ts: fromLocalInput(time) });
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
  };

  return {
    chip, applyChip, applyPreset,
    time, setTime,
    volume, setVolume,
    abv, setAbv,
    intention, setIntention,
    craving, setCraving,
    halt, setHalt,
    alt, setAlt,
    showDetail, setShowDetail,
    showMore, setShowMore,
    submit,
    setChip,
  };
}
