import React from 'react';
import pkg from '../../../package.json' with { type: 'json' };
import { useLanguage } from '../../i18n';

export default function About() {
  const { t } = useLanguage();
  return (
    <section className="p-4 border rounded-2xl">
      <h2 className="font-semibold mb-2">About</h2>
      <p className="text-sm opacity-80">{t('disclaimer')}</p>
      <p className="text-xs opacity-60 mt-2">Version {pkg.version}</p>
    </section>
  );
}
