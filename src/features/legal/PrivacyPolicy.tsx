import React from 'react';
import { useLanguage } from '../../i18n';

export default function PrivacyPolicy() {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          {t('privacy.policy.title', 'Privacy Policy')}
        </h1>
        <p className="text-muted">
          {t('privacy.policy.lastUpdated', 'Last updated: January 2024')}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('privacy.policy.overview.title', 'Privacy-First Approach')}
        </h2>
        <div className="prose prose-gray dark:prose-invert">
          <p>
            {t('privacy.policy.overview.content', 'Alchohalt is designed with privacy as a core principle. We believe your personal wellness journey should remain completely private and under your control.')}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('privacy.policy.dataStorage.title', 'Local Data Storage')}
        </h2>
        <div className="prose prose-gray dark:prose-invert space-y-3">
          <p>
            {t('privacy.policy.dataStorage.local', 'All your data is stored locally on your device using secure, encrypted storage mechanisms provided by your operating system.')}
          </p>
          <p>
            {t('privacy.policy.dataStorage.noCloud', 'We do not use cloud storage, external databases, or any form of remote data collection. Your information never leaves your device unless you explicitly choose to export it.')}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('privacy.policy.dataCollection.title', 'What Data We Don\'t Collect')}
        </h2>
        <div className="prose prose-gray dark:prose-invert">
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('privacy.policy.dataCollection.personal', 'Personal identifying information (name, email, phone)')}</li>
            <li>{t('privacy.policy.dataCollection.location', 'Location data or GPS coordinates')}</li>
            <li>{t('privacy.policy.dataCollection.usage', 'Usage analytics or behavioral tracking')}</li>
            <li>{t('privacy.policy.dataCollection.device', 'Device identifiers or fingerprinting data')}</li>
            <li>{t('privacy.policy.dataCollection.health', 'Health data beyond what you voluntarily log')}</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('privacy.policy.dataControl.title', 'Your Data Rights')}
        </h2>
        <div className="prose prose-gray dark:prose-invert space-y-3">
          <p>
            {t('privacy.policy.dataControl.ownership', 'You own and control all data stored by Alchohalt. You have the right to:')}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('privacy.policy.dataControl.export', 'Export all your data in a standard JSON format')}</li>
            <li>{t('privacy.policy.dataControl.delete', 'Delete all data permanently at any time')}</li>
            <li>{t('privacy.policy.dataControl.import', 'Import data from backups or other sources')}</li>
            <li>{t('privacy.policy.dataControl.modify', 'Modify or correct any logged information')}</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('privacy.policy.security.title', 'Security Measures')}
        </h2>
        <div className="prose prose-gray dark:prose-invert space-y-3">
          <p>
            {t('privacy.policy.security.encryption', 'Data is encrypted using industry-standard encryption provided by your device\'s secure storage APIs.')}
          </p>
          <p>
            {t('privacy.policy.security.access', 'Only you have access to your data through the app interface. No administrator, developer, or third party can access your information.')}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('privacy.policy.thirdParty.title', 'Third-Party Services')}
        </h2>
        <div className="prose prose-gray dark:prose-invert">
          <p>
            {t('privacy.policy.thirdParty.none', 'Alchohalt does not integrate with any third-party analytics, advertising, or data collection services.')}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('privacy.policy.contact.title', 'Contact Us')}
        </h2>
        <div className="prose prose-gray dark:prose-invert">
          <p>
            {t('privacy.policy.contact.content', 'If you have questions about this privacy policy, please contact us:')}
          </p>
          {/* TODO: Add real contact email before public release */}
          <p>
            <a href="https://github.com/Zcg321/Alchohalt/issues" className="text-primary-600 hover:text-primary-700 underline" target="_blank" rel="noopener noreferrer">
              GitHub Issues
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}