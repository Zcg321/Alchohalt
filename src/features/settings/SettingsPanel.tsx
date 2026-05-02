import React, { Suspense, useState } from 'react';
import { useDB } from '../../store/db';
import type { Theme, Language } from '../../store/db';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import DevTools from './DevTools';
import ExportImport from '../drinks/ExportImport';
import LegalLinks from './LegalLinks';
import About from './About';
import AISettingsPanel from '../ai/AISettingsPanel';
import PrivacyStatus from './PrivacyStatus';
import TrustReceipt from './TrustReceipt';
import { hapticForEvent } from '../../shared/haptics';

/* [BUG-PAYWALL-MOUNT] SubscriptionManager was built but never imported
 * outside of `PremiumFeatureGate` (a named export from the same file).
 * Mount it under Plan & Billing so users can actually see the pricing
 * grid + tap an Upgrade CTA. Lazy-loaded so Settings still opens fast
 * — the paywall surface only pulls in iap/analytics modules when the
 * user scrolls to it. */
const SubscriptionManager = React.lazy(
  () => import('../subscription/SubscriptionManager'),
);

/**
 * [AUDIT-2026-05-01-E] SyncPanel pulls in `libsodium-wrappers-sumo`
 * (~400 KB raw / 196 KB gz) for envelope encryption and BIP-39
 * mnemonic derivation. The vast majority of users never open
 * Settings, and of those who do, most never enable sync — eagerly
 * loading sodium with the main bundle hurts everyone for the sake of
 * a small minority. Lazy-load it so sodium ships in its own chunk
 * that only fetches when the user actually scrolls into the Sync
 * surface.
 *
 * [SYNC-3] Production transport will be a real Supabase client wired
 * from the owner's project URL + anon key. Mounted with a
 * MockSyncTransport here so the surface renders cleanly until that
 * config lands. The transport import is co-located inside the lazy
 * factory so it doesn't drag the eager bundle either — the production
 * swap is one line: replace `MockSyncTransport` with
 * `SupabaseSyncTransport` inside this factory.
 */
const SyncPanelLazy = React.lazy(async () => {
  const [{ default: SyncPanel }, { MockSyncTransport }] = await Promise.all([
    import('../sync/SyncPanel'),
    import('../../lib/sync/transport'),
  ]);
  const transport = new MockSyncTransport();
  return { default: () => <SyncPanel transport={transport} /> };
});

export default function SettingsPanel() {
  const { settings, setTheme, setLanguage, setReminderTimes, setRemindersEnabled } = useDB(s => ({
    settings: s.db.settings, setTheme: s.setTheme, setLanguage: s.setLanguage,
    setReminderTimes: s.setReminderTimes, setRemindersEnabled: s.setRemindersEnabled
  }));
  const [time, setTime] = useState('20:00');
  const add = () => {
    if (!/^\d{2}:\d{2}$/.test(time)) return;
    const t = Array.from(new Set([...(settings.reminders.times||[]), time])).sort();
    setReminderTimes(t); // Store already handles resyncNotifications
  };
  const remove = (t:string) => { setReminderTimes((settings.reminders.times||[]).filter(x=>x!==t)); };

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold tracking-tight">
            Appearance
          </h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="label">Theme</label>
              <select
                aria-label="Theme"
                value={settings.theme}
                onChange={(e) => {
                  setTheme(e.target.value as Theme);
                  hapticForEvent('settings-toggle');
                }}
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
                aria-label="Language"
                value={settings.language}
                onChange={(e) => {
                  setLanguage(e.target.value as Language);
                  hapticForEvent('settings-toggle');
                }}
                className="input cursor-pointer"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold tracking-tight">
            Reminders
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {/* [SETTINGS-DEEPENING-ROUND-4] Reminders are off by default;
                spelling that out beats a user wondering why they're not
                getting any. Adding times alone doesn't enable them — the
                checkbox does. */}
            Off by default. The checkbox below turns daily check-in notifications on.
          </p>
        </div>
        <div className="card-content space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.reminders.enabled}
              onChange={(e) => {
                setRemindersEnabled(e.target.checked);
                hapticForEvent('settings-toggle');
              }}
              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
            />
            <span className="text-sm font-medium">Enable daily reminders</span>
          </label>
          
          <div className="flex items-center gap-3">
            <input 
              aria-label="Reminder time (HH:mm)" 
              type="time" 
              value={time} 
              onChange={e=>setTime(e.target.value)} 
              className="input flex-1"
            />
            <Button onClick={add} size="sm">
              Add time
            </Button>
          </div>
          
          {(settings.reminders.times||[]).length > 0 && (
            <div className="space-y-2">
              <label className="label">Active reminder times</label>
              <div className="flex flex-wrap gap-2">
                {(settings.reminders.times||[]).map(t=>(
                  <span key={t} className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm border border-primary-200 dark:bg-primary-900/50 dark:text-primary-300 dark:border-primary-800">
                    {t}
                    <button 
                      aria-label={`Remove ${t}`} 
                      className="ml-1 text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200 transition-colors" 
                      onClick={()=>remove(t)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold tracking-tight">
            Your data
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {/* [SETTINGS-DEEPENING-ROUND-4] Renamed from "Data Management"
                — warmer, plainer. Section copy now points at the actions
                below (export / import / clear) instead of restating the
                privacy claim, which already sits in About → Privacy. */}
            Export to JSON, import a previous backup, or clear everything on this device.
          </p>
        </div>
        <div className="card-content">
          <ExportImport />
        </div>
      </section>

      <section
        id="plan-and-billing"
        className="card"
        aria-labelledby="plan-and-billing-heading"
      >
        <div className="card-header">
          <h2
            id="plan-and-billing-heading"
            className="text-lg font-semibold tracking-tight"
          >
            Plan &amp; Billing
          </h2>
        </div>
        <div className="card-content">
          <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
            <SubscriptionManager />
          </Suspense>
        </div>
      </section>

      <AISettingsPanel />

      <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl" />}>
        <SyncPanelLazy />
      </Suspense>

      <PrivacyStatus />
      <TrustReceipt />

      <About />
      <LegalLinks />
      <DevTools />
    </div>
  );
}
