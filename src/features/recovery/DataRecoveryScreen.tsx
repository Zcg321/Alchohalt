// @no-smoke
import React, { useEffect, useState } from 'react';
import {
  clearCorruption,
  getCorruption,
  subscribeCorruption,
  type RecoveryEvent,
} from '../../lib/dbRecovery';

/**
 * [R11-2] Data corruption recovery screen.
 *
 * Surfaces only when the persisted DB couldn't be validated at
 * hydration time. Three options for the user:
 *
 *   1. Try again — re-hydrate from storage. Useful if the corruption
 *      was a transient (e.g. an extension wrote bad bytes once and
 *      the storage layer might re-read clean now).
 *
 *   2. Save what we can — download the raw blob as JSON so the user
 *      can salvage anything intact. Even if our schema rejected it,
 *      a human can often pull entries out by hand.
 *
 *   3. Start fresh — clear the corrupt blob and let the app start
 *      with default state. Destructive, requires explicit confirmation.
 *
 * The screen renders OVER the app — it doesn't try to coexist with
 * a partially-broken state.
 */
export default function DataRecoveryScreen() {
  const [event, setEvent] = useState<RecoveryEvent | null>(getCorruption());
  const [confirmingFresh, setConfirmingFresh] = useState(false);

  useEffect(() => {
    return subscribeCorruption(setEvent);
  }, []);

  if (!event) return null;

  const handleTryAgain = () => {
    // The cleanest "try again" is a hard reload — Zustand's persist
    // middleware re-reads from storage on app boot.
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleSalvage = () => {
    try {
      const blob = new Blob([JSON.stringify(event.raw, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alchohalt-salvage-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // localStorage / Blob unavailable — fall back to copying to
      // the clipboard.
      try {
        navigator.clipboard.writeText(JSON.stringify(event.raw, null, 2));
        alert('Salvaged data copied to clipboard. Paste it into a text file to save.');
      } catch {
        alert("Couldn't write the salvage file. The raw data is in your browser's storage under the key 'alchohalt.db' — open DevTools → Application → Local Storage to copy it manually.");
      }
    }
  };

  const handleStartFresh = () => {
    try {
      // Clear both web localStorage and the Capacitor-mapped key
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('alchohalt.db');
      }
    } catch {
      // ignore — reload is the next step regardless
    }
    clearCorruption();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="recovery-title"
      aria-describedby="recovery-body"
      data-testid="data-recovery-screen"
      className="fixed inset-0 z-[300] flex items-center justify-center bg-neutral-950/90 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-xl ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800">
        <h2
          id="recovery-title"
          className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
        >
          Your data couldn’t be loaded
        </h2>
        <p
          id="recovery-body"
          className="text-sm text-neutral-700 dark:text-neutral-300 mt-3 leading-relaxed"
        >
          The app found the saved file but it’s in an unexpected shape
          (<span className="font-mono text-xs">{event.reason}</span>).
          This usually means a browser bug, a power loss mid-write, or a
          third-party extension changed it. Your data hasn’t been deleted —
          just not loaded.
        </p>
        <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-3 leading-relaxed">
          Three options. Pick the safest one for your situation.
        </p>
        <div className="mt-5 grid gap-2.5">
          <button
            type="button"
            onClick={handleTryAgain}
            data-testid="recovery-try-again"
            className="w-full rounded-2xl border border-neutral-200/70 bg-white px-5 py-3.5 text-left text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-100 dark:hover:bg-neutral-800 transition-colors min-h-[48px]"
          >
            <div>Try again</div>
            <div className="text-xs font-normal text-neutral-500 dark:text-neutral-400 mt-0.5">
              Reload the app and re-read the saved file.
            </div>
          </button>
          <button
            type="button"
            onClick={handleSalvage}
            data-testid="recovery-salvage"
            className="w-full rounded-2xl border border-neutral-200/70 bg-white px-5 py-3.5 text-left text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-100 dark:hover:bg-neutral-800 transition-colors min-h-[48px]"
          >
            <div>Save what we can</div>
            <div className="text-xs font-normal text-neutral-500 dark:text-neutral-400 mt-0.5">
              Download the raw file as JSON. Open it in any text editor; pull out anything intact.
            </div>
          </button>
          {!confirmingFresh ? (
            <button
              type="button"
              onClick={() => setConfirmingFresh(true)}
              data-testid="recovery-start-fresh"
              className="w-full rounded-2xl border border-rose-200 bg-white px-5 py-3.5 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50 transition-colors min-h-[48px]"
            >
              <div>Start fresh</div>
              <div className="text-xs font-normal text-rose-600/80 dark:text-rose-400/70 mt-0.5">
                Clear the corrupt file and start over. This deletes everything that couldn’t be loaded.
              </div>
            </button>
          ) : (
            <div
              className="w-full rounded-2xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 px-5 py-3.5"
              data-testid="recovery-confirm-fresh"
            >
              <div className="text-sm font-medium text-rose-800 dark:text-rose-200">
                Are you sure? This deletes the saved file.
              </div>
              <div className="text-xs text-rose-700/80 dark:text-rose-300/70 mt-1">
                If you haven’t saved a salvage copy yet, do that first.
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleStartFresh}
                  data-testid="recovery-confirm-fresh-yes"
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                >
                  Yes, start fresh
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingFresh(false)}
                  data-testid="recovery-confirm-fresh-cancel"
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
