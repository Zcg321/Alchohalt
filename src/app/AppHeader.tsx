import React from 'react';
import { useLanguage } from '../i18n';

export default function AppHeader() {
  const { t } = useLanguage();

  return (
    <header className="text-center mb-6 sm:mb-8 animate-in">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
        {t('appName')}
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto px-4">
        Track your journey towards healthier habits
      </p>
    </header>
  );
}