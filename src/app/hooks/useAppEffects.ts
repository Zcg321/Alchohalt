/**
 * useAppEffects — extracted from AlcoholCoachAppInner as part of the
 * [R17-A] long-function lint sweep. Bundles four mount-time effects:
 *
 *   - migrate legacy localStorage data
 *   - attach foreground sync + DB bridge
 *   - sync std-drink jurisdiction from settings
 *   - milestone-reached haptic watcher
 *   - deep-link route resolver (/crisis, /share, /legal/<slug>)
 *
 * Each effect's behavior is identical to the inline version.
 */

import { useEffect, useRef } from 'react';
import { migrateLegacyData } from '../../lib/migrate-legacy';
import { setActiveStdDrinkSystem } from '../../lib/calc';
import { detectStdDrinkSystemFromNavigator } from '../../lib/detectStdDrinkSystem';
import { attachForegroundSync, attachOnlineSync } from '../../lib/sync/scheduler';
import { attachDbBridge } from '../../lib/sync/dbBridge';
import { entryToLegacyDrink } from '../../lib/data-bridge';
import { hapticForEvent } from '../../shared/haptics';
import { getMilestoneStates } from '../../features/milestones/Milestones';
import { isLegalSlug, type LegalSlug } from '../../features/legal/slugs';
import type { Store } from '../../store/db';

type DBHandle = Store;

export function useMigrateLegacyOnce() {
  useEffect(() => { migrateLegacyData(); }, []);
}

export function useSyncBridges() {
  useEffect(() => {
    const detachForeground = attachForegroundSync();
    const detachOnline = attachOnlineSync();
    const detachDb = attachDbBridge();
    return () => { detachForeground(); detachOnline(); detachDb(); };
  }, []);
}

export function useStdDrinkSystem(dbHandle: DBHandle) {
  const { db } = dbHandle;
  useEffect(() => {
    const sys = db.settings.stdDrinkSystem ?? detectStdDrinkSystemFromNavigator();
    setActiveStdDrinkSystem(sys);
  }, [db.settings.stdDrinkSystem]);
}

export function useMilestoneHaptics(dbHandle: DBHandle) {
  const { db } = dbHandle;
  const prevMilestonesRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    function check() {
      const drinksList = db.entries.map(entryToLegacyDrink);
      const reachedNow = new Set(
        getMilestoneStates(drinksList).filter((m) => m.reached).map((m) => m.id),
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
}

interface DeepLinkSetters {
  setShowCrisis: (v: boolean) => void;
  setShowShareViewer: (v: boolean) => void;
  setLegalSlug: (v: LegalSlug | null) => void;
}

export function useDeepLinkRouting(setters: DeepLinkSetters) {
  const { setShowCrisis, setShowShareViewer, setLegalSlug } = setters;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function resolveRoute() {
      const path = window.location.pathname;
      if (path === '/crisis' || window.location.hash === '#crisis') {
        setShowCrisis(true);
        return;
      }
      if (path === '/share') {
        setShowShareViewer(true);
        return;
      }
      setShowShareViewer(false);
      const legalMatch = path.match(/^\/legal\/([^/]+)\/?$/);
      const slug = legalMatch?.[1];
      if (slug && isLegalSlug(slug)) setLegalSlug(slug);
      else setLegalSlug(null);
    }
    resolveRoute();
    window.addEventListener('popstate', resolveRoute);
    return () => window.removeEventListener('popstate', resolveRoute);
  }, [setShowCrisis, setShowShareViewer, setLegalSlug]);
}
