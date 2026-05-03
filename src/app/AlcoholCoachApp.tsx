import React, { useEffect, useState, useRef } from 'react';
import type { Drink, Goals } from '../types/common';
import { useDB } from '../store/db';
import {
  entryToLegacyDrink,
  settingsToLegacyGoals,
  legacyDrinkToEntry,
  legacyGoalsToSettings,
} from '../lib/data-bridge';
import { migrateLegacyData } from '../lib/migrate-legacy';
import ScrollTopButton from '../components/ScrollTopButton';
import AppHeader from './AppHeader';
import TabShell, { type TabId } from './TabShell';
import TodayHome from '../features/homepage/TodayHome';
import TrackTab from './tabs/TrackTab';
import GoalsTab from './tabs/GoalsTab';
import InsightsTab from './tabs/InsightsTab';
import SettingsTab from './tabs/SettingsTab';
import PWAInstallBanner from './PWAInstallBanner';
import UpdateBanner from './UpdateBanner';
import OnboardingFlow from '../features/onboarding/OnboardingFlow';
import DataRecoveryScreen from '../features/recovery/DataRecoveryScreen';
import CrisisResources from '../features/crisis/CrisisResources';
import HardTimePanel from '../features/crisis/HardTimePanel';
import { isLegalSlug, type LegalSlug } from '../features/legal/slugs';
import { Skeleton } from '../components/ui/Skeleton';

/* [PERF-LAZY-LEGAL] /legal/<slug> is a deep-link surface, not part of
 * the normal app flow. Splitting it off the eager bundle drops marked
 * + 5 markdown payloads from the initial download. The slug type +
 * predicate stay non-lazy because the route resolver needs them. */
const LegalDocPage = React.lazy(() => import('../features/legal/LegalDocPage'));
/* [R10-3] /share is a public read-only viewer that decodes a fragment
 * payload. Lazy-loaded so its bundle doesn't hit the main app on
 * normal use. */
const ShareViewer = React.lazy(() => import('../features/sharing/ShareViewer'));
/* [R8-B] Component gallery — visual-regression baseline. Loaded only
 * when the URL contains ?gallery=1. Lazy so it never enters the
 * eager bundle for normal users. */
const ComponentGallery = React.lazy(() => import('../styles/ComponentGallery'));
import { usePWA } from '../hooks/usePWA';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { hapticForEvent } from '../shared/haptics';
import { getMilestoneStates } from '../features/milestones/Milestones';

/* [REFACTOR-LONG-FN] Crisis dialog extracted as a sibling component to
 * shrink AlcoholCoachApp's render function. The dialog is presentation
 * only — focus-trap + Escape + opener-restore live in the parent so
 * showCrisis stays the single source of truth. The parent passes the
 * dialog ref + close-button ref + onClose. Keeps the Crisis surface
 * inspectable in the same file rather than scattered across imports. */
function CrisisDialog({
  dialogRef,
  closeRef,
  onClose,
}: {
  dialogRef: React.RefObject<HTMLDivElement>;
  closeRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
}) {
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="crisis-dialog-title"
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-charcoal-900/70 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-surface-elevated shadow-strong ring-1 ring-border animate-fade-in">
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
          <h2 id="crisis-dialog-title" className="text-h3 text-ink">
            Need help now?
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-ink-soft hover:bg-cream-50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 transition-colors"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <CrisisResources />
      </div>
    </div>
  );
}
import { useLanguage } from '../i18n';
import { attachForegroundSync } from '../lib/sync/scheduler';
import { attachDbBridge } from '../lib/sync/dbBridge';

/* [HARD-TIME-ROUND-4] Sibling dialog wrapper around HardTimePanel.
 * Same focus-trap + Escape + backdrop-click pattern as CrisisDialog.
 * Inline so the file stays the central inspectable place for all
 * always-on safety surfaces. */
function HardTimeDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hard-time-dialog-title"
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-charcoal-900/70 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="my-8 w-full max-w-md rounded-2xl bg-surface-elevated shadow-strong ring-1 ring-border animate-fade-in">
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
          <h2 id="hard-time-dialog-title" className="text-h3 text-ink">
            Having a hard time?
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-ink-soft hover:bg-cream-50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 transition-colors"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <HardTimePanel onClose={onClose} />
      </div>
    </div>
  );
}

/* [R8-B] Component gallery short-circuit. When ?gallery=1 is in the
 * URL we skip the entire app and render the visual-regression
 * baseline instead. Optional ?theme=dark forces the dark palette so
 * the Playwright spec doesn't have to drive system-color emulation
 * to verify dark-mode tokens. Lifted to its own component so the
 * conditional return runs BEFORE any hooks (rules-of-hooks). */
export function AlcoholCoachApp() {
  const galleryParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  if (galleryParams?.get('gallery') === '1') {
    const theme = galleryParams.get('theme') === 'dark' ? 'dark' : 'light';
    return (
      <React.Suspense fallback={null}>
        <ComponentGallery theme={theme} />
      </React.Suspense>
    );
  }
  return <AlcoholCoachAppInner />;
}

function AlcoholCoachAppInner() {
  const { db, addEntry, editEntry, deleteEntry, undo, setSettings } = useDB();
  const [editing, setEditing] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Drink | null>(null);
  /* [R7-B] Live-region announcement for the screen-reader user after
   * drink-log success. Sighted users see the form clear (and the haptic
   * tap on native), but SR users had no confirmation that the entry
   * landed — surfaced by the new-parent persona walkthrough. The
   * message is short ("Added.") and clears itself after announcement
   * so the region stays empty between events. */
  const [logAnnouncement, setLogAnnouncement] = useState('');
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);
  const [showCrisis, setShowCrisis] = useState(false);
  /* [HARD-TIME-ROUND-4] Hard-Time panel is the urgent-mode subset of
   * crisis support — fewer doors, action-first. Distinct from the
   * full CrisisResources dialog the AppHeader pill opens. The
   * TodayPanel "Having a hard time?" link now opens this. */
  const [showHardTime, setShowHardTime] = useState(false);
  // [IA-2] active tab — controlled here so other surfaces (the Today
  // panel "See progress" CTA) can request a jump to Insights.
  const [activeTab, setActiveTab] = useState<TabId | undefined>(undefined);
  // [SHIP-3.1] /legal/<slug> deep-link state.
  const [legalSlug, setLegalSlug] = useState<LegalSlug | null>(null);
  // [R10-3] /share is the public read-only sharing viewer.
  const [showShareViewer, setShowShareViewer] = useState(false);

  // Crisis modal: Escape closes; focus returns to the element that
  // opened it. Tracked via a ref captured the moment showCrisis flips
  // to true — works whether the trigger came from AppHeader or the
  // Settings tab.
  const crisisOpenerRef = useRef<HTMLElement | null>(null);
  const crisisCloseRef = useRef<HTMLButtonElement | null>(null);
  const crisisDialogRef = useRef<HTMLDivElement | null>(null);
  /* [A11Y-FOCUS-TRAP] Tab inside the Crisis modal now wraps to first
   * focusable on Tab-from-last and to last on Shift-Tab-from-first.
   * Without the trap, Tab could escape to elements behind the modal
   * with no visual cue (a screen-reader user could land on a button
   * underneath the dialog mid-emergency). aria-modal="true" handles
   * the AT-virtual-cursor case; the keyboard case lives here. The
   * existing window-level Escape handler stays — onEscape on the
   * trap is intentionally omitted to avoid double-firing close. */
  useFocusTrap(crisisDialogRef, showCrisis);

  function openCrisis() {
    if (typeof document !== 'undefined') {
      crisisOpenerRef.current = document.activeElement as HTMLElement | null;
    }
    setShowCrisis(true);
  }

  function closeCrisis() {
    setShowCrisis(false);
    // Restore focus to the trigger after the dialog unmounts.
    queueMicrotask(() => crisisOpenerRef.current?.focus?.());
  }

  /* [HARD-TIME-ROUND-4] Hard-Time panel uses the same focus-restore
   * pattern as CrisisDialog. Re-uses crisisOpenerRef since only one of
   * the two dialogs can be open at a time (state is mutually exclusive
   * by design — opening one closes the other implicitly via the
   * mount/unmount cycle below). */
  function openHardTime() {
    if (typeof document !== 'undefined') {
      crisisOpenerRef.current = document.activeElement as HTMLElement | null;
    }
    setShowHardTime(true);
  }

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
    // Move focus into the dialog so subsequent Tab presses cycle inside it.
    crisisCloseRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [showCrisis]);

  const undoTimer = useRef<number>();
  const { isInstallable, isOnline, updateAvailable, promptInstall, updateApp } = usePWA();
  const { t } = useLanguage();

  const drinks = db.entries.map(entryToLegacyDrink);
  const goals = settingsToLegacyGoals(db.settings);

  useEffect(() => {
    migrateLegacyData();
  }, []);

  // [SYNC-3b] Attach the cloud-sync triggers exactly once. The
  // bridges no-op when sync is off, so they're cheap to mount
  // unconditionally.
  useEffect(() => {
    const detachForeground = attachForegroundSync();
    const detachDb = attachDbBridge();
    return () => {
      detachForeground();
      detachDb();
    };
  }, []);

  /* [HAPTICS-ROUND-4] Milestone-reached watcher. Tracks which milestones
   * are currently "reached" and fires a Medium tap on any false→true
   * transition. The first run (prevMilestonesRef === null) seeds the
   * set without firing — important so opening the app on a steady-state
   * Day 30 doesn't bump the user every cold-start. Re-checks on
   * visibility-change so a user who keeps the app backgrounded across
   * midnight gets the celebration when they return. */
  const prevMilestonesRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    function check() {
      const drinksList = db.entries.map(entryToLegacyDrink);
      const reachedNow = new Set(
        getMilestoneStates(drinksList)
          .filter((m) => m.reached)
          .map((m) => m.id),
      );
      if (prevMilestonesRef.current !== null) {
        let isNewlyReached = false;
        reachedNow.forEach((id) => {
          if (!prevMilestonesRef.current!.has(id)) isNewlyReached = true;
        });
        if (isNewlyReached) hapticForEvent('milestone-reached');
      }
      prevMilestonesRef.current = reachedNow;
    }
    check();
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, [db.entries]);

  // [ROUTE-1] /crisis (and #crisis) deep-link.
  // [SHIP-3.1] /legal/<slug> deep-link. The Vercel deployment rewrites
  // any unmatched path back to index.html, so this client-side check
  // is the canonical resolver for both deep-link visits and
  // back/forward nav.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function resolveRoute() {
      const path = window.location.pathname;
      if (path === '/crisis' || window.location.hash === '#crisis') {
        setShowCrisis(true);
        return;
      }
      // [R10-3] /share viewer takes priority over the SPA shell. The
      // payload sits in the fragment, so we don't need to match it
      // here — just the path.
      if (path === '/share') {
        setShowShareViewer(true);
        return;
      }
      setShowShareViewer(false);
      const legalMatch = path.match(/^\/legal\/([^/]+)\/?$/);
      const slug = legalMatch?.[1];
      if (slug && isLegalSlug(slug)) {
        setLegalSlug(slug);
      } else {
        setLegalSlug(null);
      }
    }
    resolveRoute();
    window.addEventListener('popstate', resolveRoute);
    return () => window.removeEventListener('popstate', resolveRoute);
  }, []);

  function addDrink(drink: Drink) {
    const entry = legacyDrinkToEntry(drink);
    addEntry(entry);
    const isAFMark = drink.volumeMl === 0 && drink.abvPct === 0;
    setLogAnnouncement(isAFMark ? 'Marked alcohol-free.' : 'Added.');
    // Clear the announcement so a re-announce of the same message
    // works on the next add — aria-live only re-fires on text change.
    setTimeout(() => setLogAnnouncement(''), 1500);
    /* Haptic map: drink-logged + af-day-marked both fire 'Light'. The
     * AF case (volumeMl=0, abvPct=0) is the same user action — pressing
     * a button — so it gets the same confirmation tap. */
    hapticForEvent(isAFMark ? 'af-day-marked' : 'drink-logged');
    /* [HAPTICS-ROUND-4] Goal-hit fires on a weekly-AF-cycle close:
     * count of std=0 entries in the past 7 days hits a positive
     * multiple of 7. The post-add list is `[...drinks, drink]`. We
     * only check on AF marks because logging a real drink can never
     * "land" a stay-under goal — only abstaining can. */
    if (isAFMark) {
      const sevenAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const after = [...drinks, drink];
      const afCount = after.filter(
        (d) => d.ts >= sevenAgo && d.volumeMl === 0 && d.abvPct === 0,
      ).length;
      if (afCount > 0 && afCount % 7 === 0) {
        hapticForEvent('goal-hit');
      }
    }
  }

  function saveDrink(drink: Drink) {
    if (!editing) return;
    const entry = legacyDrinkToEntry(drink);
    editEntry(editing, entry);
    setEditing(null);
    hapticForEvent('drink-logged');
    setLogAnnouncement('Saved.');
    setTimeout(() => setLogAnnouncement(''), 1500);
  }

  function deleteDrink(drink: Drink) {
    const entry = db.entries.find((e) => e.ts === drink.ts);
    if (entry) {
      setLastDeleted(drink);
      deleteEntry(entry.id);
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = window.setTimeout(() => {
        setLastDeleted(null);
      }, 5000);
    }
  }

  function undoDelete() {
    if (!lastDeleted) return;
    undo();
    setLastDeleted(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    /* [HAPTICS-ROUND-4] Selection tap on undo — same confirmation
     * feel as logging. */
    hapticForEvent('drink-undo');
  }

  function startEdit(drink: Drink) {
    const entry = db.entries.find((e) => e.ts === drink.ts);
    if (entry) setEditing(entry.id);
  }

  function cancelEdit() {
    setEditing(null);
  }

  /* [R12-2] Bulk-edit ops. Each takes a list of legacy ts values
   * (the DrinkList keys) and resolves them to entry IDs before
   * dispatching mutations. Single haptic per batch — n×Light pulses
   * would feel like a malfunction; one confirmation tap reads as the
   * batch landing. */
  function bulkDelete(tsList: number[]) {
    const ids = tsList
      .map((ts) => db.entries.find((e) => e.ts === ts)?.id)
      .filter((id): id is string => id !== undefined);
    for (const id of ids) deleteEntry(id);
    if (ids.length > 0) {
      hapticForEvent('drink-undo');
      setLogAnnouncement(`${ids.length} ${ids.length === 1 ? 'drink' : 'drinks'} deleted.`);
      setTimeout(() => setLogAnnouncement(''), 1500);
    }
  }

  function bulkShiftTime(tsList: number[], deltaMinutes: number) {
    const deltaMs = deltaMinutes * 60_000;
    const updates = tsList
      .map((ts) => {
        const entry = db.entries.find((e) => e.ts === ts);
        return entry ? { id: entry.id, newTs: entry.ts + deltaMs } : null;
      })
      .filter((u): u is { id: string; newTs: number } => u !== null);
    for (const u of updates) editEntry(u.id, { ts: u.newTs });
    if (updates.length > 0) {
      hapticForEvent('drink-logged');
      const sign = deltaMinutes >= 0 ? '+' : '';
      setLogAnnouncement(`${updates.length} drink time${updates.length === 1 ? '' : 's'} shifted ${sign}${deltaMinutes}m.`);
      setTimeout(() => setLogAnnouncement(''), 1500);
    }
  }

  function bulkScaleStd(tsList: number[], factor: number) {
    const updates = tsList
      .map((ts) => {
        const entry = db.entries.find((e) => e.ts === ts);
        return entry ? { id: entry.id, newStd: entry.stdDrinks * factor } : null;
      })
      .filter((u): u is { id: string; newStd: number } => u !== null);
    for (const u of updates) editEntry(u.id, { stdDrinks: u.newStd });
    if (updates.length > 0) {
      hapticForEvent('drink-logged');
      setLogAnnouncement(`${updates.length} drink${updates.length === 1 ? '' : 's'} rescaled.`);
      setTimeout(() => setLogAnnouncement(''), 1500);
    }
  }

  function onGoalsChange(newGoals: Goals) {
    const settingsUpdate = legacyGoalsToSettings(newGoals);
    setSettings(settingsUpdate);
  }

  const editingDrink = editing
    ? entryToLegacyDrink(db.entries.find((e) => e.id === editing)!)
    : null;

  const panels: Record<TabId, React.ReactNode> = {
    today: (
      <TodayHome
        drinks={drinks}
        editing={editingDrink}
        goals={goals}
        presets={db.presets}
        onAddDrink={addDrink}
        onSaveDrink={saveDrink}
        onCancelEdit={cancelEdit}
        onOpenInsights={() => setActiveTab('insights')}
        onRoughNight={openHardTime}
      />
    ),
    track: (
      <TrackTab
        drinks={drinks}
        goals={goals}
        presets={db.presets}
        editing={editingDrink}
        onAddDrink={addDrink}
        onSaveDrink={saveDrink}
        onStartEdit={startEdit}
        onDeleteDrink={deleteDrink}
        onCancelEdit={cancelEdit}
        onBulkDelete={bulkDelete}
        onBulkShiftTime={bulkShiftTime}
        onBulkScaleStd={bulkScaleStd}
      />
    ),
    goals: <GoalsTab goals={goals} onGoalsChange={onGoalsChange} />,
    insights: <InsightsTab drinks={drinks} goals={goals} />,
    settings: <SettingsTab onOpenCrisis={openCrisis} />,
  };

  return (
    <>
      {/* [A11Y-1] Skip-to-content. Visually hidden until focused; lets
          keyboard / SR users jump straight into <main>. */}
      <a href="#main" className="skip-link">Skip to main content</a>

      {/* [R11-2] Renders only if hydration found a corrupt persisted
          DB. Always mounted at the top so it overlays everything. */}
      <DataRecoveryScreen />

      <OnboardingFlow />

      <PWAInstallBanner
        isInstallable={isInstallable && showInstallBanner}
        promptInstall={promptInstall}
        onDismiss={() => setShowInstallBanner(false)}
      />

      <UpdateBanner
        updateAvailable={updateAvailable && showUpdateBanner}
        updateApp={updateApp}
        onDismiss={() => setShowUpdateBanner(false)}
      />

      {!isOnline && (
        <div
          className="fixed bottom-20 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-pill bg-charcoal-900/90 px-3.5 py-2 text-caption font-medium text-white shadow-medium backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <span className="h-1.5 w-1.5 rounded-pill bg-amber-300" aria-hidden />
          {t('status.offline')}
        </div>
      )}

      {/* [R7-B] SR-only live region for drink-log confirmations. */}
      <div role="status" aria-live="polite" className="sr-only">
        {logAnnouncement}
      </div>

      <AppHeader onOpenCrisis={openCrisis} />

      {showCrisis ? (
        <CrisisDialog
          dialogRef={crisisDialogRef}
          closeRef={crisisCloseRef}
          onClose={closeCrisis}
        />
      ) : null}

      {showHardTime ? (
        <HardTimeDialog onClose={closeHardTime} />
      ) : null}

      {showShareViewer ? (
        <React.Suspense fallback={<Skeleton className="mx-auto mt-12 max-w-3xl h-96 rounded-2xl" />}>
          <ShareViewer />
        </React.Suspense>
      ) : legalSlug ? (
        <React.Suspense fallback={<Skeleton className="mx-auto mt-12 max-w-3xl h-96 rounded-2xl" />}>
          <LegalDocPage slug={legalSlug} />
        </React.Suspense>
      ) : (
        <TabShell panels={panels} activeTab={activeTab} onChange={setActiveTab} />
      )}

      {lastDeleted && (
        <div className="fixed bottom-24 lg:bottom-4 start-1/2 transform -translate-x-1/2 bg-charcoal-900 text-white px-6 py-3 rounded-pill shadow-strong flex items-center gap-3 z-50 animate-slide-up">
          <span className="text-caption">{t('drinkDeleted')}</span>
          <button
            type="button"
            onClick={undoDelete}
            className="text-caption underline-offset-4 hover:underline"
          >
            {t('undo')}
          </button>
        </div>
      )}

      <ScrollTopButton />
    </>
  );
}
