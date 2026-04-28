// @no-smoke
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AlcoholCoachApp } from './app/AlcoholCoachApp';
import ErrorBoundary from './components/ErrorBoundary';
import A11ySkipLink from './components/A11ySkipLink';
import './index.css';
import { registerSW } from './features/pwa/registerSW';
import { bootstrapIAPOnStartup } from './features/iap/restoreEntitlement';
import { LanguageProvider } from './i18n';

registerSW();
void bootstrapIAPOnStartup();

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
