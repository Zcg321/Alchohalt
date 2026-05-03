/**
 * ResetPreferencesPanel — [R17-3] selective preference reset UI.
 *
 * Three states:
 *   - collapsed: a single "Reset preferences" button in a card.
 *   - picker: checklist of the four reset categories. The user picks
 *     which ones to reset; nothing happens until they tap "Continue".
 *   - confirm: a modal listing exactly which settings will revert.
 *     The user taps "Reset selected" or "Cancel".
 *
 * Pure presentation + state. The math (which patch to send) lives in
 * resetPreferences.ts so it can be unit-tested without rendering.
 *
 * Voice: this surface must read as "selective tidy-up" not "nuke".
 * The Wipe all data surface exists separately for the latter — we
 * never want a user to confuse the two paths.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useDB } from '../../store/db';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { hapticForEvent } from '../../shared/haptics';
import {
  RESET_CATEGORIES,
  buildResetPatch,
  summarizeReset,
  type ResetCategory,
} from './resetPreferences';

function CategoryChecklist({ selected, toggle }: {
  selected: Set<ResetCategory>;
  toggle: (id: ResetCategory) => void;
}) {
  return (
    <div className="space-y-2" data-testid="reset-prefs-categories">
      {RESET_CATEGORIES.map((cat) => (
        <label
          key={cat.id}
          className="flex items-start gap-3 cursor-pointer rounded-lg p-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
        >
          <input
            type="checkbox"
            checked={selected.has(cat.id)}
            onChange={() => toggle(cat.id)}
            className="mt-0.5 w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
            data-testid={`reset-prefs-${cat.id}`}
            aria-label={cat.label}
          />
          <span className="space-y-0.5">
            <span className="block text-sm font-medium">{cat.label}</span>
            <span className="block text-xs text-neutral-600 dark:text-neutral-400">{cat.description}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function ConfirmModal({ summary, onConfirm, onCancel }: {
  summary: string[]; onConfirm: () => void; onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  useFocusTrap(dialogRef, true, onCancel);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onCancel(); }
    window.addEventListener('keydown', onKey);
    cancelRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-prefs-confirm-title"
      data-testid="reset-prefs-confirm"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal-900/70 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-surface-elevated p-card shadow-strong ring-1 ring-border animate-fade-in">
        <h3 id="reset-prefs-confirm-title" className="text-h4 text-ink mb-2">
          Reset these preferences?
        </h3>
        <p className="text-caption text-ink-soft mb-3">
          Your drink entries, presets, advanced goals, and trash will not be touched.
          Only the items below revert to their defaults.
        </p>
        <ul className="text-caption text-ink list-disc list-inside space-y-1 mb-4" data-testid="reset-prefs-summary">
          {summary.map((line, i) => (<li key={i}>{line}</li>))}
        </ul>
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef} type="button" onClick={onCancel}
            className="inline-flex items-center justify-center rounded-pill border border-border bg-surface-elevated px-4 py-2 text-caption text-ink hover:bg-cream-50 min-h-[44px]"
            data-testid="reset-prefs-cancel"
          >
            Cancel
          </button>
          <button
            type="button" onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-pill bg-sage-700 px-4 py-2 text-caption font-medium text-white hover:bg-sage-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
            data-testid="reset-prefs-confirm-btn"
          >
            Reset selected
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResetPreferencesPanel() {
  const setSettings = useDB((s) => s.setSettings);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<ResetCategory>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  function toggle(id: ResetCategory) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyReset() {
    const patch = buildResetPatch(selected);
    if (Object.keys(patch).length > 0) setSettings(patch);
    hapticForEvent('settings-toggle');
    setShowConfirm(false);
    setOpen(false);
    setSelected(new Set());
  }

  return (
    <section className="card" data-testid="reset-prefs-panel">
      <div className="card-header">
        <h3 className="text-base font-semibold tracking-tight">Reset preferences</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Revert specific settings to their defaults without touching your data. Pick which ones below.
        </p>
      </div>
      <div className="card-content space-y-3">
        {!open ? (
          <button
            type="button" onClick={() => setOpen(true)}
            data-testid="reset-prefs-open"
            className="inline-flex items-center justify-center rounded-pill border border-border bg-surface-elevated px-4 py-2 text-caption text-ink hover:bg-cream-50 min-h-[44px]"
          >
            Reset preferences
          </button>
        ) : (
          <>
            <CategoryChecklist selected={selected} toggle={toggle} />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={selected.size === 0}
                data-testid="reset-prefs-continue"
                className="inline-flex items-center justify-center rounded-pill bg-sage-700 px-4 py-2 text-caption font-medium text-white hover:bg-sage-900 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setSelected(new Set()); }}
                data-testid="reset-prefs-collapse"
                className="inline-flex items-center justify-center rounded-pill border border-border bg-surface-elevated px-4 py-2 text-caption text-ink hover:bg-cream-50 min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </>
        )}
        {showConfirm && (
          <ConfirmModal
            summary={summarizeReset(selected)}
            onConfirm={applyReset}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
    </section>
  );
}
