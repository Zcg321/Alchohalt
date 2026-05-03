import React, { useState } from 'react';
import { useDB } from '../../store/db';
import {
  buildPayload,
  encodePayload,
  buildShareUrl,
  MAX_MESSAGE_LEN,
  type ShareSelection,
} from './sharePayload';

/**
 * [R10-3] Caregiver/partner read-only sharing panel.
 *
 * Strict opt-in: every field is OFF by default. The user must tick
 * each box explicitly. The link expires in 24 hours and contains
 * only the aggregate values selected — no entries, no journal text,
 * nothing the user didn't tick.
 */
const DEFAULT_SELECTION: ShareSelection = {
  currentStreak: false,
  totalAfDays: false,
  weeklyGoal: false,
  last30dTotal: false,
  activeGoalSummary: false,
  message: '',
};

type Stats = NonNullable<ReturnType<typeof deriveStats>>;

interface SelectionFieldsProps {
  selection: ShareSelection;
  stats: Stats;
  onToggle: (key: keyof Omit<ShareSelection, 'message'>) => void;
}

function SelectionFields({ selection, stats, onToggle }: SelectionFieldsProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Fields to share</legend>
      <Toggle
        label={`Current streak (${stats.currentStreak} days)`}
        checked={selection.currentStreak}
        onToggle={() => onToggle('currentStreak')}
        testId="share-currentStreak"
      />
      <Toggle
        label={`Total AF days ever (${stats.totalAfDays})`}
        checked={selection.totalAfDays}
        onToggle={() => onToggle('totalAfDays')}
        testId="share-totalAfDays"
      />
      <Toggle
        label={`Weekly goal (${stats.weeklyGoal} drinks)`}
        checked={selection.weeklyGoal}
        onToggle={() => onToggle('weeklyGoal')}
        testId="share-weeklyGoal"
      />
      <Toggle
        label={`Last 30 days total (${stats.last30dTotal} drinks)`}
        checked={selection.last30dTotal}
        onToggle={() => onToggle('last30dTotal')}
        testId="share-last30dTotal"
      />
      {stats.activeGoal && (
        <Toggle
          label={`Active goal: ${stats.activeGoal.title} (${stats.activeGoal.current}/${stats.activeGoal.target})`}
          checked={selection.activeGoalSummary}
          onToggle={() => onToggle('activeGoalSummary')}
          testId="share-activeGoalSummary"
        />
      )}
    </fieldset>
  );
}

function MessageField({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="text-xs uppercase tracking-wider text-ink-soft mb-1 block">
        Message (optional, {value.length}/{MAX_MESSAGE_LEN})
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-current/20 bg-surface-elevated text-sm"
        rows={3}
        maxLength={MAX_MESSAGE_LEN}
        data-testid="share-message"
      />
    </label>
  );
}

interface GeneratedLinkProps {
  url: string;
  copyState: 'idle' | 'copied' | 'error';
  onCopy: () => void;
  onReset: () => void;
}

function GeneratedLink({ url, copyState, onCopy, onReset }: GeneratedLinkProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-soft">
        Link expires in 24 hours. Send via the channel you trust — text,
        email, signal. The link contains the data directly (no server).
      </p>
      <input
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        className="w-full px-3 py-2 rounded-md border border-current/20 bg-surface-elevated text-xs font-mono"
        data-testid="share-url"
        aria-label="Share URL"
      />
      <div className="flex gap-2">
        <button type="button" onClick={onCopy} className="btn btn-secondary" data-testid="share-copy">
          {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy'}
        </button>
        <button type="button" onClick={onReset} className="btn btn-secondary" data-testid="share-reset">
          Start over
        </button>
      </div>
    </div>
  );
}

export default function SharingPanel() {
  const { db } = useDB();
  const [selection, setSelection] = useState<ShareSelection>(DEFAULT_SELECTION);
  const [generated, setGenerated] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const stats = db.entries.length > 0 ? deriveStats(db) : null;

  const toggle = (key: keyof Omit<ShareSelection, 'message'>) => {
    setSelection((s) => ({ ...s, [key]: !s[key] }));
    setGenerated(null);
  };

  const setMessage = (m: string) => {
    setSelection((s) => ({ ...s, message: m.slice(0, MAX_MESSAGE_LEN) }));
    setGenerated(null);
  };

  const anySelected =
    selection.currentStreak ||
    selection.totalAfDays ||
    selection.weeklyGoal ||
    selection.last30dTotal ||
    selection.activeGoalSummary;

  const generate = () => {
    if (!stats) return;
    const payload = buildPayload(selection, stats);
    const encoded = encodePayload(payload);
    setGenerated(buildShareUrl(encoded));
  };

  const reset = () => {
    setSelection(DEFAULT_SELECTION);
    setGenerated(null);
    setCopyState('idle');
  };

  const copy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
    }
  };

  return (
    <section className="card" data-testid="sharing-panel" aria-labelledby="sharing-heading">
      <div className="card-header">
        <h3 id="sharing-heading" className="text-lg font-semibold">Share with someone you trust</h3>
        <p className="text-sm text-ink-soft mt-1">
          A read-only link for a partner or therapist. Pick what to include —
          nothing you don&rsquo;t tick is shared. The link expires in 24 hours and
          contains the values directly (no server holds it).
        </p>
      </div>
      <div className="card-content space-y-3">
        {!stats && (
          <p className="text-sm text-ink-soft">Log a drink or AF day before sharing.</p>
        )}
        {stats && <SelectionFields selection={selection} stats={stats} onToggle={toggle} />}
        {stats && <MessageField value={selection.message} onChange={setMessage} />}
        {!generated && stats && (
          <button
            type="button"
            onClick={generate}
            disabled={!anySelected}
            className="btn btn-primary"
            data-testid="share-generate"
          >
            Generate link
          </button>
        )}
        {generated && (
          <GeneratedLink url={generated} copyState={copyState} onCopy={copy} onReset={reset} />
        )}
      </div>
    </section>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  testId: string;
}

function Toggle({ label, checked, onToggle, testId }: ToggleProps) {
  return (
    <label className="flex items-start gap-2 cursor-pointer text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-1"
        data-testid={testId}
      />
      <span>{label}</span>
    </label>
  );
}

function deriveStats(db: ReturnType<typeof useDB.getState>['db']) {
  const now = Date.now();
  const dayMs = 86400000;
  const last30Cutoff = now - 30 * dayMs;
  const last30Entries = db.entries.filter((e) => e.ts >= last30Cutoff);
  const last30dTotal = Math.round(last30Entries.reduce((acc, e) => acc + e.stdDrinks, 0));

  // Total AF days ever: distinct days with no entry between earliest entry and today
  const allDayBuckets = new Set<number>();
  let earliest = now;
  for (const e of db.entries) {
    const d = new Date(e.ts);
    d.setHours(0, 0, 0, 0);
    allDayBuckets.add(d.getTime());
    if (e.ts < earliest) earliest = e.ts;
  }
  const earliestDay = new Date(earliest);
  earliestDay.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const daysSinceEarliest = Math.max(1, Math.round((today.getTime() - earliestDay.getTime()) / dayMs) + 1);
  const totalAfDays = Math.max(0, daysSinceEarliest - allDayBuckets.size);

  // Current streak: days since last drink
  let currentStreak = 0;
  if (db.entries.length > 0) {
    const lastDrink = Math.max(...db.entries.map((e) => e.ts));
    const lastDrinkDay = new Date(lastDrink);
    lastDrinkDay.setHours(0, 0, 0, 0);
    currentStreak = Math.max(0, Math.round((today.getTime() - lastDrinkDay.getTime()) / dayMs));
  }

  const activeGoal = db.advancedGoals.find((g) => g.isActive);
  return {
    currentStreak,
    totalAfDays,
    weeklyGoal: db.settings.weeklyGoalDrinks,
    last30dTotal,
    activeGoal: activeGoal
      ? { title: activeGoal.title, current: activeGoal.current, target: activeGoal.target }
      : null,
  };
}
