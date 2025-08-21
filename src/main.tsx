import React from 'react';
import ReactDOM from 'react-dom/client';
import { AlcoholCoachApp } from './app/AlcoholCoachApp';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { registerSW } from './features/pwa/registerSW';

registerSW();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AlcoholCoachApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
