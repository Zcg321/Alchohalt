// @no-smoke
import React, { useEffect, useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

/**
 * [R11-B] First-enable disclaimer for BAC estimation.
 *
 * Round-10 ethics judge flagged the BAC code path (lib/calc.ts:widmarkBAC,
 * db.settings.showBAC) as legally fraught — Widmark estimates miss food,
 * tolerance, time-since-last-drink jitter, and lab-vs-pocket-formula
 * deltas. They cannot be used to decide whether to drive.
 *
 * The widmarkBAC function exists but is currently unwired (no UI imports
 * it as of round 11). This modal is the gate: any future BAC UI MUST
 * route through `useBACDisclaimer` before the user sees an estimate.
 *
 * Voice: factual, not hand-wavy. The brief specified the wording.
 */

export const BAC_DISCLAIMER_STORAGE_KEY = 'alchohalt.bac_disclaimer_acknowledged_v1';

export const BAC_DISCLAIMER_TITLE = 'About BAC estimates';
export const BAC_DISCLAIMER_BODY =
  'BAC estimates are approximations. They depend on body weight, food, time, and individual metabolism. Do not use to decide whether to drive — the only safe BAC for driving is 0.';

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BACDisclaimerModal({ open, onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bac-disclaimer-title"
      aria-describedby="bac-disclaimer-body"
      data-testid="bac-disclaimer-modal"
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center overflow-y-auto bg-neutral-950/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-xl ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800">
        <h2
          id="bac-disclaimer-title"
          className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-3"
        >
          {BAC_DISCLAIMER_TITLE}
        </h2>
        <p
          id="bac-disclaimer-body"
          className="text-sm text-neutral-700 dark:text-neutral-300 mb-5 leading-relaxed"
        >
          {BAC_DISCLAIMER_BODY}
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            data-testid="bac-disclaimer-cancel"
            className="rounded-2xl border border-neutral-200/70 bg-white px-5 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-100 dark:hover:bg-neutral-800 transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            data-testid="bac-disclaimer-confirm"
            className="rounded-2xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors min-h-[44px]"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Reads localStorage to determine whether the disclaimer has already
 * been acknowledged on this device. Returns false defensively if
 * localStorage is unavailable (private mode, etc.) so the modal will
 * show in those cases — better to show twice than zero times.
 */
export function isBACDisclaimerAcknowledged(): boolean {
  try {
    return localStorage.getItem(BAC_DISCLAIMER_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setBACDisclaimerAcknowledged(): void {
  try {
    localStorage.setItem(BAC_DISCLAIMER_STORAGE_KEY, 'true');
  } catch {
    // localStorage unavailable — the modal will show again next time.
  }
}

/**
 * Test-only helper. Production code should never reset acknowledgement.
 */
export function _resetBACDisclaimerForTests(): void {
  try {
    localStorage.removeItem(BAC_DISCLAIMER_STORAGE_KEY);
  } catch {
    // ignore
  }
}
