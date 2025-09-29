import React from 'react';
import { useLanguage } from '../i18n';

export default function A11ySkipLink() {
  const { t } = useLanguage();

  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-black text-white px-3 py-1 rounded"
    >
      {t('skipToContent')}
    </a>
  );
}
