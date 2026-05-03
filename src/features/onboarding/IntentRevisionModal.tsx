import React, { useEffect, useRef } from 'react';
import { useDB } from '../../store/db';
import { useFocusTrap } from '../../hooks/useFocusTrap';

/**
 * [R10-C] Compact modal that asks just the intent question from
 * onboarding step 1 again. Used by the Diagnostics "Update my intent"
 * button so a long-term user can revise their original answer (e.g.
 * went from "cutting back" to "quitting" at day 90) without resetting
 * the whole onboarding flow or losing the old answer.
 *
 * Writes:
 *   - `onboardingDiagnostics`: replaced with new row, status='completed',
 *      revisedAt=now (so it's visible the row was re-confirmed)
 *   - `onboardingDiagnosticsHistory`: appended with the previous row
 *     (so the audit trail is preserved)
 */

type Intent = 'cut-back' | 'quit' | 'curious';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function IntentRevisionModal({ open, onClose }: Props) {
  const db = useDB((s) => s.db);
  const setSettings = useDB((s) => s.setSettings);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleChoose = (intent: Intent) => {
    const previous = db.settings.onboardingDiagnostics;
    const previousHistory = db.settings.onboardingDiagnosticsHistory ?? [];
    const newRow = {
      status: 'completed' as const,
      intent,
      trackStyle: previous?.trackStyle,
      completedAt: Date.now(),
    };
    const appendedHistory = previous
      ? [...previousHistory, { ...previous, revisedAt: Date.now() }]
      : previousHistory;

    setSettings({
      onboardingDiagnostics: newRow,
      onboardingDiagnosticsHistory: appendedHistory,
    });
    onClose();
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intent-revision-title"
      data-testid="intent-revision-modal"
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center overflow-y-auto bg-neutral-950/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-xl ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2
            id="intent-revision-title"
            className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
          >
            What brings you here today?
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Whatever you pick stays on your phone. Your previous answer is preserved
          in the diagnostics history.
        </p>
        <div className="grid gap-2.5">
          {(
            [
              ['cut-back', 'Trying to drink less'],
              ['quit', 'Trying to stop'],
              ['curious', 'Not sure yet'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => handleChoose(id)}
              data-testid={`intent-revision-${id}`}
              className="w-full rounded-2xl border border-neutral-200/70 bg-white px-5 py-3.5 text-start text-sm font-medium text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-100 dark:hover:bg-neutral-800 transition-colors min-h-[48px]"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
