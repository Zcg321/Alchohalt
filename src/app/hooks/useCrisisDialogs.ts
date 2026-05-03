/**
 * useCrisisDialogs — extracted from AlcoholCoachAppInner as part of
 * the [R17-A] long-function lint sweep. Owns state + open/close +
 * focus restore for the always-on safety surfaces (Crisis dialog +
 * Hard-Time panel). Escape-key handling for the Crisis dialog also
 * lives here so the host component stays a thin shell.
 *
 * Mutual exclusivity is preserved: opening one dialog implicitly
 * shadows the other via the parent's render gate; both share the
 * crisisOpenerRef so focus returns to whichever element triggered
 * the last open.
 */

import { useEffect, useRef, useState } from 'react';

export function useCrisisDialogs() {
  const [showCrisis, setShowCrisis] = useState(false);
  const [showHardTime, setShowHardTime] = useState(false);

  const crisisOpenerRef = useRef<HTMLElement | null>(null);
  const crisisCloseRef = useRef<HTMLButtonElement | null>(null);
  const crisisDialogRef = useRef<HTMLDivElement | null>(null);

  function captureOpener() {
    if (typeof document !== 'undefined') {
      crisisOpenerRef.current = document.activeElement as HTMLElement | null;
    }
  }

  function openCrisis() { captureOpener(); setShowCrisis(true); }
  function closeCrisis() {
    setShowCrisis(false);
    queueMicrotask(() => crisisOpenerRef.current?.focus?.());
  }
  function openHardTime() { captureOpener(); setShowHardTime(true); }
  function closeHardTime() {
    setShowHardTime(false);
    queueMicrotask(() => crisisOpenerRef.current?.focus?.());
  }

  useEffect(() => {
    if (!showCrisis) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeCrisis();
    }
    window.addEventListener('keydown', onKey);
    crisisCloseRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [showCrisis]);

  return {
    showCrisis,
    showHardTime,
    setShowCrisis,
    crisisCloseRef,
    crisisDialogRef,
    openCrisis,
    closeCrisis,
    openHardTime,
    closeHardTime,
  };
}
