import React from 'react';
import ReactDOM from 'react-dom/client';
import { AlcoholCoachApp } from './app/AlcoholCoachApp';
import ErrorBoundary from './components/ErrorBoundary';
import A11ySkipLink from './components/A11ySkipLink';
import './index.css';
import { registerSW } from './features/pwa/registerSW';
import { LanguageProvider } from './i18n';

registerSW();

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
