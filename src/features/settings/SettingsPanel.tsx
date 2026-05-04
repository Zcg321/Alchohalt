import React, { Suspense, useState } from 'react';
import { useDB } from '../../store/db';
import type { Theme, Language } from '../../store/db';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import DevTools from './DevTools';
import SettingsJumpNav from './SettingsJumpNav';
import SelfExperimentDashboard from './SelfExperimentDashboard';
import BackupVerifier from '../backup/BackupVerifier';
import NotificationsSettings from './NotificationsSettings';
import SharingPanel from '../sharing/SharingPanel';
import LegalLinks from './LegalLinks';
import About from './About';
import ReplayOnboardingButton from './ReplayOnboardingButton';
import ResetPreferencesPanel from './ResetPreferencesPanel';
import PrivacyStatus from './PrivacyStatus';

const CrashReportsToggleLazy = React.lazy(() => import('./CrashReportsToggle'));
import { hapticForEvent } from '../../shared/haptics';
import { useLanguage } from '../../i18n';

const ExportImportLazy = React.lazy(() => import('../drinks/ExportImport'));
const TrustReceiptLazy = React.lazy(() => import('./TrustReceipt'));
const AISettingsPanelLazy = React.lazy(() => import('../ai/AISettingsPanel'));
const SubscriptionManager = React.lazy(() => import('../subscription/SubscriptionManager'));

const SyncPanelLazy = React.lazy(async () => {
  const [{ default: SyncPanel }, { MockSyncTransport }] = await Promise.all([
    import('../sync/SyncPanel'),
    import('../../lib/sync/transport'),
  ]);
  const transport = new MockSyncTransport();
  return { default: () => <SyncPanel transport={transport} /> };
});

type Settings = import('../../store/db').Store['db']['settings'];

function AppearanceSection({ settings, setTheme, setLanguage, setSettings }: {
  settings: Settings;
  setTheme: (t: Theme) => void;
  setLanguage: (l: Language) => void;
  setSettings: (p: Partial<Settings>) => void;
}) {
  return (
    <section className="card">
      <div className="card-header">
        <h2 id="appearance-heading" className="text-lg font-semibold tracking-tight">Appearance</h2>
      </div>
      <div className="card-content">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="label">Theme</label>
            <select
              aria-label="Theme" value={settings.theme}
              onChange={(e) => { setTheme(e.target.value as Theme); hapticForEvent('settings-toggle'); }}
              className="input cursor-pointer"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="label">Language</label>
            <select
              aria-label="Language" value={settings.language}
              onChange={(e) => { setLanguage(e.target.value as Language); hapticForEvent('settings-toggle'); }}
              className="input cursor-pointer"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="pl">Polski</option>
              <option value="ru">Русский</option>
            </select>
          </div>
        </div>
        <div className="space-y-1 mt-4" id="stddrink-system">
          <label className="label" htmlFor="std-drink-system">Drink units</label>
          <select
            id="std-drink-system" aria-label="Drink units" data-testid="std-drink-system-select"
            value={settings.stdDrinkSystem ?? 'us'}
            onChange={(e) => {
              setSettings({ stdDrinkSystem: e.target.value as 'us' | 'uk' | 'au' | 'eu' | 'ca' | 'ie' | 'nz' });
              hapticForEvent('settings-toggle');
            }}
            className="input cursor-pointer"
          >
            <option value="us">United States (NIAAA, 14 g)</option>
            <option value="uk">United Kingdom (NHS units, 8 g)</option>
            <option value="au">Australia (NHMRC, 10 g)</option>
            <option value="nz">New Zealand (HPA, 10 g)</option>
            <option value="eu">Europe (10 g)</option>
            <option value="ca">Canada (13.6 g)</option>
            <option value="ie">Ireland (HSE, 10 g)</option>
          </select>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Picks the grams-of-ethanol-per-standard-drink your country uses. Affects every count the app shows.
          </p>
        </div>
        {/* [R23-D] Quick-log toggle. Default 'detailed' (current
            workflow). 'quick' surfaces 3 tap-to-log chips above the
            form for users who want one-tap logging. */}
        <div className="space-y-1 mt-4" id="drink-log-mode">
          <label className="label" htmlFor="drink-log-mode-select">Drink-log style</label>
          <select
            id="drink-log-mode-select"
            aria-label="Drink-log style"
            data-testid="drink-log-mode-select"
            value={settings.drinkLogMode ?? 'detailed'}
            onChange={(e) => {
              setSettings({ drinkLogMode: e.target.value as 'quick' | 'detailed' });
              hapticForEvent('settings-toggle');
            }}
            className="input cursor-pointer"
          >
            <option value="detailed">Detailed form</option>
            <option value="quick">Quick log (1-tap chips)</option>
          </select>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Quick mode shows three tap-to-log chips above the form. The full form stays one tap away.
          </p>
        </div>
        {/* [R25-E] Quick-mode backdating window. Default 'today'
            (matches R24-FF2 behavior). 'yesterday' opens a one-day
            window so users can log forgotten drinks from the night
            before without switching to detailed mode. */}
        <div className="space-y-1 mt-4" id="quick-log-backdating">
          <label className="label" htmlFor="quick-log-backdating-select">Quick-mode backdating window</label>
          <select
            id="quick-log-backdating-select"
            aria-label="Quick-mode backdating window"
            data-testid="quick-log-backdating-select"
            value={settings.quickLogBackdatingWindow ?? 'today'}
            onChange={(e) => {
              setSettings({ quickLogBackdatingWindow: e.target.value as 'today' | 'yesterday' });
              hapticForEvent('settings-toggle');
            }}
            className="input cursor-pointer"
          >
            <option value="today">Today only</option>
            <option value="yesterday">Today + yesterday</option>
          </select>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Detailed mode always allows any timestamp. This setting only affects quick-log chips.
          </p>
        </div>
        {/* [R25-B] Calorie tile opt-in. OFF by default per the
            round-24 competitive matrix recommendation — recovery
            surfaces should not push body-image metrics on users
            who didn't ask for them. */}
        <div className="mt-4" id="calorie-tile-toggle">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              data-testid="calorie-tile-toggle"
              checked={settings.showCalorieTile === true}
              onChange={(e) => {
                setSettings({ showCalorieTile: e.target.checked });
                hapticForEvent('settings-toggle');
              }}
              className="mt-1 w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
            />
            <span>
              <span className="block text-sm font-medium">Show calorie tile in Insights</span>
              <span className="block mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                Estimate from ethanol only — mixers and residual carbs are excluded so the number is a defensible floor, not an averaged guess. Off by default.
              </span>
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}

function RemindersSection({ settings, setRemindersEnabled, setReminderTimes }: {
  settings: Settings;
  setRemindersEnabled: (v: boolean) => void;
  setReminderTimes: (t: string[]) => void;
}) {
  const [time, setTime] = useState('20:00');
  const add = () => {
    if (!/^\d{2}:\d{2}$/.test(time)) return;
    const t = Array.from(new Set([...(settings.reminders.times || []), time])).sort();
    setReminderTimes(t);
  };
  const remove = (t: string) => setReminderTimes((settings.reminders.times || []).filter((x: string) => x !== t));
  return (
    <section className="card">
      <div className="card-header">
        <h2 id="reminders-heading" className="text-lg font-semibold tracking-tight">Reminders</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Off by default. The checkbox below turns daily check-in notifications on.
        </p>
      </div>
      <div className="card-content space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox" checked={settings.reminders.enabled}
            onChange={(e) => { setRemindersEnabled(e.target.checked); hapticForEvent('settings-toggle'); }}
            className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
          />
          <span className="text-sm font-medium">Enable daily reminders</span>
        </label>
        <div className="flex items-center gap-3">
          <input aria-label="Reminder time (HH:mm)" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input flex-1" />
          <Button onClick={add} size="sm">Add time</Button>
        </div>
        <NotificationsSettings />
        {(settings.reminders.times || []).length > 0 && (
          <div className="space-y-2">
            <label className="label">Active reminder times</label>
            <div className="flex flex-wrap gap-2">
              {(settings.reminders.times || []).map((t: string) => (
                <span key={t} className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm border border-primary-200 dark:bg-primary-900/50 dark:text-primary-300 dark:border-primary-800">
                  {t}
                  <button aria-label={`Remove ${t}`} className="ms-1 text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200 transition-colors" onClick={() => remove(t)}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PrivacyAndDataSection() {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="privacy-and-data-heading" data-testid="privacy-section" className="space-y-3">
      <header className="px-1">
        <h2 id="privacy-and-data-heading" className="text-lg font-semibold tracking-tight">
          {t('settings.privacy.heading', 'Privacy & data')}
        </h2>
        <p className="mt-1 text-sm font-medium text-sage-700 dark:text-sage-300">
          {t('settings.privacy.tagline', 'No ads. No analytics. Trust receipt included.')}
        </p>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {t('settings.privacy.subtitle', "Three places this gets controlled. Grouped here so it's one decision instead of three.")}
        </p>
      </header>
      <section className="card">
        <div className="card-header">
          <h3 className="text-base font-semibold tracking-tight">Data Management</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Your data is yours. We cryptographically cannot read it. Not medical advice.
          </p>
        </div>
        <div className="card-content">
          <Suspense fallback={<Skeleton className="h-40 w-full rounded-xl" />}>
            <ExportImportLazy />
          </Suspense>
        </div>
      </section>
      <BackupVerifier />
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl" />}><AISettingsPanelLazy /></Suspense>
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl" />}><SyncPanelLazy /></Suspense>
      <PrivacyStatus />
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-2xl" />}><CrashReportsToggleLazy /></Suspense>
      <Suspense fallback={<Skeleton className="h-32 w-full rounded-2xl" />}><TrustReceiptLazy /></Suspense>
      <SharingPanel />
      {/* [R21-3] Self-experiment dashboard wraps Diagnostics +
        * DiagnosticsAudit + OnboardingFunnelView under one section
        * header so the on-device-only message stays single-source. */}
      <SelfExperimentDashboard />
      <ReplayOnboardingButton />
    </section>
  );
}

function BillingSection() {
  return (
    <section id="plan-and-billing" className="card" aria-labelledby="plan-and-billing-heading">
      <div className="card-header">
        <h2 id="plan-and-billing-heading" className="text-lg font-semibold tracking-tight">Plan &amp; Billing</h2>
      </div>
      <div className="card-content">
        <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
          <SubscriptionManager />
        </Suspense>
      </div>
    </section>
  );
}

export default function SettingsPanel() {
  const { settings, setTheme, setLanguage, setReminderTimes, setRemindersEnabled, setSettings } = useDB((s) => ({
    settings: s.db.settings, setTheme: s.setTheme, setLanguage: s.setLanguage,
    setReminderTimes: s.setReminderTimes, setRemindersEnabled: s.setRemindersEnabled,
    setSettings: s.setSettings,
  }));
  return (
    <div className="space-y-6">
      <SettingsJumpNav />
      <AppearanceSection settings={settings} setTheme={setTheme} setLanguage={setLanguage} setSettings={setSettings} />
      <RemindersSection settings={settings} setRemindersEnabled={setRemindersEnabled} setReminderTimes={setReminderTimes} />
      <PrivacyAndDataSection />
      <ResetPreferencesPanel />
      <BillingSection />
      <About />
      <LegalLinks />
      <DevTools />
    </div>
  );
}
