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
import { LanguageProvider } from './i18n';

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
