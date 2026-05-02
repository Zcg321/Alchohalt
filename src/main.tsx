// @no-smoke
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AlcoholCoachApp } from './app/AlcoholCoachApp';
import ErrorBoundary from './components/ErrorBoundary';
import A11ySkipLink from './components/A11ySkipLink';
import './index.css';
import { registerSW } from './features/pwa/registerSW';
import { bootstrapIAPOnStartup } from './features/iap/restoreEntitlement';
import { installReminderSync } from './lib/notify';
import { installGlobalErrorReporter } from './lib/errorReporter';
import { installFetchWrap } from './lib/trust/receipt';
import { LanguageProvider } from './i18n';
import { useDB } from './store/db';

/* [R8-C] Trust Receipt fetch wrap. Installed before any feature code
 * runs so every outbound request is captured. Pass-through behavior
 * (1:1 with native fetch) — no perf or correctness impact for
 * callers. Buffer stays in memory only and is invisible until the
 * user opens Settings → Privacy → Show trust receipt. */
installFetchWrap();

// [ROUND-5-E] Global error/unhandledrejection capture. No-op shim
// by default (logs to console, no network call). The native build
// can flip on a real reporter via setReporter() AFTER explicit
// user consent — never silently.
installGlobalErrorReporter();

registerSW();
void bootstrapIAPOnStartup();
/* [BUG-MADGE-CYCLE] Wire the reminder-sync subscription once at boot
 * so Zustand reminder mutations trigger native/web reschedules. The
 * old code did this via direct calls inside db.ts setters, which
 * created a db ↔ notify import cycle. */
installReminderSync();

/**
 * [R9-A] App-ready handshake for store-screenshot capture + e2e
 * automation. Playwright / Puppeteer / vanilla CDP scripts can
 * `waitForFunction(() => window.__APP_READY__ === true)` instead of
 * racing arbitrary timeouts that wedge on iPad / Android landscape.
 *
 * Two requirements must both hold before we flip the flag:
 *   1. The first React paint has happened (rAF fires after commit).
 *   2. The persisted DB store has finished hydrating from
 *      Capacitor Preferences — otherwise screenshots may catch the
 *      onboarding modal in mid-hydration.
 *
 * On a fresh install (no persisted store), zustand's persist
 * middleware fires `onFinishHydration` synchronously after
 * `createJSONStorage` resolves, so this is at most one tick slower
 * than the previous "just paint" assumption.
 */
function announceAppReady() {
  if (typeof window === 'undefined') return;
  if ((window as unknown as { __APP_READY__?: boolean }).__APP_READY__) return;
  (window as unknown as { __APP_READY__?: boolean }).__APP_READY__ = true;
  window.dispatchEvent(new Event('alch:app-ready'));
}

if (typeof window !== 'undefined') {
  let painted = false;
  let hydrated = false;
  const maybeFire = () => { if (painted && hydrated) announceAppReady(); };

  const persist = (useDB as unknown as { persist?: { hasHydrated: () => boolean; onFinishHydration: (cb: () => void) => () => void } }).persist;
  if (persist && persist.hasHydrated()) {
    hydrated = true;
  } else if (persist) {
    persist.onFinishHydration(() => { hydrated = true; maybeFire(); });
  } else {
    hydrated = true;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => { painted = true; maybeFire(); });
  });

  // Hard cap at 5s so a stuck hydration doesn't wedge automation.
  setTimeout(() => { painted = true; hydrated = true; maybeFire(); }, 5000);
}

if (typeof document !== 'undefined' && !document.documentElement.hasAttribute('data-theme')) {
  document.documentElement.setAttribute('data-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
}

const isDevTokensRoute = import.meta.env.DEV && typeof window !== 'undefined' && window.location.pathname === '/dev/tokens';

if (isDevTokensRoute) {
  void import('./styles/DevTokensPreview').then(({ default: DevTokensPreview }) => {
    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <React.StrictMode>
        <DevTokensPreview />
      </React.StrictMode>,
    );
  });
} else {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <A11ySkipLink />
      <ErrorBoundary>
        <LanguageProvider>
          <AlcoholCoachApp />
        </LanguageProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
