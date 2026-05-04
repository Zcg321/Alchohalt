import React, { useEffect, useRef, useState } from 'react';
import type { Goals } from '../types/common';
import { useDB } from '../store/db';
import {
  entryToLegacyDrink,
  settingsToLegacyGoals,
  legacyGoalsToSettings,
} from '../lib/data-bridge';
import ScrollTopButton from '../components/ScrollTopButton';
import A11ySkipLink from '../components/A11ySkipLink';
import AppHeader from './AppHeader';
import TabShell, { type TabId } from './TabShell';
import TodayHome from '../features/homepage/TodayHome';
import TrackTab from './tabs/TrackTab';
import GoalsTab from './tabs/GoalsTab';
import InsightsTab from './tabs/InsightsTab';
import SettingsTab from './tabs/SettingsTab';
import PWAInstallBanner from './PWAInstallBanner';
import UpdateBanner from './UpdateBanner';
import BackupAutoVerifyRibbon from '../features/backup/BackupAutoVerifyRibbon';
import OnboardingFlow from '../features/onboarding/OnboardingFlow';
import OnboardingReentryBanner from '../features/onboarding/OnboardingReentryBanner';
import DataRecoveryScreen from '../features/recovery/DataRecoveryScreen';
import CrisisResources from '../features/crisis/CrisisResources';
import HardTimePanel from '../features/crisis/HardTimePanel';
import { type LegalSlug } from '../features/legal/slugs';
import { Skeleton } from '../components/ui/Skeleton';

const LegalDocPage = React.lazy(() => import('../features/legal/LegalDocPage'));
const ShareViewer = React.lazy(() => import('../features/sharing/ShareViewer'));
const ComponentGallery = React.lazy(() => import('../styles/ComponentGallery'));

import { usePWA } from '../hooks/usePWA';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLanguage } from '../i18n';
import { useCrisisDialogs } from './hooks/useCrisisDialogs';
import { useDrinkActions } from './hooks/useDrinkActions';
import {
  useMigrateLegacyOnce,
  useSyncBridges,
  useStdDrinkSystem,
  useMilestoneHaptics,
  useDeepLinkRouting,
} from './hooks/useAppEffects';

function CrisisDialog({
  dialogRef, closeRef, onClose,
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-surface-elevated shadow-strong ring-1 ring-border animate-fade-in">
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
          <h2 id="crisis-dialog-title" className="text-h3 text-ink">Need help now?</h2>
          <button
            ref={closeRef} type="button" onClick={onClose} aria-label="Close"
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

function HardTimeDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="my-8 w-full max-w-md rounded-2xl bg-surface-elevated shadow-strong ring-1 ring-border animate-fade-in">
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
          <h2 id="hard-time-dialog-title" className="text-h3 text-ink">Having a hard time?</h2>
          <button
            ref={closeRef} type="button" onClick={onClose} aria-label="Close"
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

function buildPanels(opts: {
  drinks: ReturnType<typeof entryToLegacyDrink>[];
  goals: ReturnType<typeof settingsToLegacyGoals>;
  presets: import('../store/db').Store['db']['presets'];
  actions: ReturnType<typeof useDrinkActions>;
  setActiveTab: (t: TabId) => void;
  openHardTime: () => void;
  openCrisis: () => void;
  onGoalsChange: (g: Goals) => void;
}): Record<TabId, React.ReactNode> {
  const { drinks, goals, presets, actions, setActiveTab, openHardTime, openCrisis, onGoalsChange } = opts;
  return {
    today: (
      <TodayHome drinks={drinks} editing={actions.editingDrink} goals={goals} presets={presets}
        onAddDrink={actions.addDrink} onSaveDrink={actions.saveDrink} onCancelEdit={actions.cancelEdit}
        onOpenInsights={() => setActiveTab('insights')} onRoughNight={openHardTime} />
    ),
    track: (
      <TrackTab drinks={drinks} goals={goals} presets={presets} editing={actions.editingDrink}
        onAddDrink={actions.addDrink} onSaveDrink={actions.saveDrink} onStartEdit={actions.startEdit}
        onDeleteDrink={actions.deleteDrink} onCancelEdit={actions.cancelEdit}
        onBulkDelete={actions.bulkDelete} onBulkShiftTime={actions.bulkShiftTime}
        onBulkScaleStd={actions.bulkScaleStd} />
    ),
    goals: <GoalsTab goals={goals} onGoalsChange={onGoalsChange} />,
    insights: <InsightsTab drinks={drinks} goals={goals} />,
    settings: <SettingsTab onOpenCrisis={openCrisis} />,
  };
}

function AppMainSurface({ panels, activeTab, setActiveTab, showShareViewer, legalSlug }: {
  panels: Record<TabId, React.ReactNode>;
  activeTab: TabId | undefined;
  setActiveTab: (t: TabId) => void;
  showShareViewer: boolean;
  legalSlug: LegalSlug | null;
}) {
  if (showShareViewer) {
    return (
      <React.Suspense fallback={<Skeleton className="mx-auto mt-12 max-w-3xl h-96 rounded-2xl" />}>
        <ShareViewer />
      </React.Suspense>
    );
  }
  if (legalSlug) {
    return (
      <React.Suspense fallback={<Skeleton className="mx-auto mt-12 max-w-3xl h-96 rounded-2xl" />}>
        <LegalDocPage slug={legalSlug} />
      </React.Suspense>
    );
  }
  return <TabShell panels={panels} activeTab={activeTab} onChange={setActiveTab} />;
}

function AlcoholCoachAppInner() {
  const dbHandle = useDB();
  const { db, setSettings } = dbHandle;
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId | undefined>(undefined);
  const [legalSlug, setLegalSlug] = useState<LegalSlug | null>(null);
  const [showShareViewer, setShowShareViewer] = useState(false);

  const crisis = useCrisisDialogs();
  const actions = useDrinkActions(dbHandle);
  useFocusTrap(crisis.crisisDialogRef, crisis.showCrisis);

  const { isInstallable, isOnline, updateAvailable, promptInstall, updateApp } = usePWA();
  const { t } = useLanguage();
  const drinks = db.entries.map(entryToLegacyDrink);
  const goals = settingsToLegacyGoals(db.settings);

  useMigrateLegacyOnce();
  useSyncBridges();
  useStdDrinkSystem(dbHandle);
  useMilestoneHaptics(dbHandle);
  useDeepLinkRouting({ setShowCrisis: crisis.setShowCrisis, setShowShareViewer, setLegalSlug });

  const panels = buildPanels({
    drinks, goals, presets: db.presets, actions, setActiveTab,
    openHardTime: crisis.openHardTime, openCrisis: crisis.openCrisis,
    onGoalsChange: (g) => setSettings(legacyGoalsToSettings(g)),
  });

  return (
    <>
      {/* [R22-2] Single skip-link via the i18n'd component. The previous
       * arrangement rendered <A11ySkipLink /> in main.tsx PLUS an inline
       * <a>Skip to main content</a> here — screen-reader users heard
       * two skip targets in a row at page load (both pointed at #main).
       * Co-locating the link with the app means tests render it without
       * needing main.tsx, and there's only one in the AT tree. */}
      <A11ySkipLink />
      <DataRecoveryScreen />
      <OnboardingFlow />
      <OnboardingReentryBanner />
      <PWAInstallBanner isInstallable={isInstallable && showInstallBanner} promptInstall={promptInstall} onDismiss={() => setShowInstallBanner(false)} />
      <UpdateBanner updateAvailable={updateAvailable && showUpdateBanner} updateApp={updateApp} onDismiss={() => setShowUpdateBanner(false)} />
      <BackupAutoVerifyRibbon />
      {!isOnline && (
        <div className="fixed bottom-20 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-pill bg-charcoal-900/90 px-3.5 py-2 text-caption font-medium text-white shadow-medium backdrop-blur-sm" role="status" aria-live="polite">
          <span className="h-1.5 w-1.5 rounded-pill bg-amber-300" aria-hidden />
          {t('status.offline')}
        </div>
      )}
      <div role="status" aria-live="polite" className="sr-only">{actions.logAnnouncement}</div>
      <AppHeader onOpenCrisis={crisis.openCrisis} />
      {crisis.showCrisis ? <CrisisDialog dialogRef={crisis.crisisDialogRef} closeRef={crisis.crisisCloseRef} onClose={crisis.closeCrisis} /> : null}
      {crisis.showHardTime ? <HardTimeDialog onClose={crisis.closeHardTime} /> : null}
      <AppMainSurface panels={panels} activeTab={activeTab} setActiveTab={setActiveTab} showShareViewer={showShareViewer} legalSlug={legalSlug} />
      {actions.lastDeleted && (
        <div className="fixed bottom-24 lg:bottom-4 start-1/2 transform -translate-x-1/2 bg-charcoal-900 text-white px-6 py-3 rounded-pill shadow-strong flex items-center gap-3 z-50 animate-slide-up">
          <span className="text-caption">{t('drinkDeleted')}</span>
          <button
            type="button"
            onClick={actions.undoDelete}
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
