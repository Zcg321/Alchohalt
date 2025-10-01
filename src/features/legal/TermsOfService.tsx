import React from 'react';
import { useLanguage } from '../../i18n';

export default function TermsOfService() {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          {t('terms.title', 'Terms of Service')}
        </h1>
        <p className="text-muted">
          {t('terms.lastUpdated', 'Last updated: January 2024')}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('terms.acceptance.title', 'Acceptance of Terms')}
        </h2>
        <div className="prose prose-gray dark:prose-invert">
          <p>
            {t('terms.acceptance.content', 'By using Alchohalt, you agree to these terms of service. If you do not agree to these terms, please do not use the application.')}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('terms.description.title', 'Service Description')}
        </h2>
        <div className="prose prose-gray dark:prose-invert space-y-3">
          <p>
            {t('terms.description.purpose', 'Alchohalt is a personal wellness tracking application designed to help users monitor their drinking habits and work toward their personal health goals.')}
          </p>
          <p>
            {t('terms.description.notMedical', 'This application is not a medical device and does not provide medical advice, diagnosis, or treatment. It is a personal tracking tool only.')}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('terms.medical.title', 'Medical Disclaimer')}
        </h2>
        <div className="prose prose-gray dark:prose-invert space-y-3">
          <p>
            {t('terms.medical.noAdvice', 'Alchohalt does not provide medical advice. The information provided by the app is for informational purposes only and should not be considered medical advice.')}
          </p>
          <p>
            {t('terms.medical.consultation', 'Always consult with a qualified healthcare provider before making any decisions about your health, alcohol consumption, or treatment options.')}
          </p>
          <p>
            {t('terms.medical.emergency', 'If you are experiencing a medical emergency, call emergency services immediately. Do not rely on this app for emergency medical assistance.')}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('terms.subscription.title', 'Subscription Terms')}
        </h2>
        <div className="prose prose-gray dark:prose-invert space-y-3">
          <p>
            {t('terms.subscription.freeTier', 'Core features of Alchohalt are available for free. Premium features are available through subscription plans.')}
          </p>
          <p>
            {t('terms.subscription.billing', 'Subscriptions are billed through your device\'s app store (Apple App Store or Google Play Store) according to their terms and conditions.')}
          </p>
          <p>
            {t('terms.subscription.cancellation', 'You may cancel your subscription at any time through your device\'s subscription management settings. Cancellation takes effect at the end of your current billing period.')}
          </p>
          <p>
            {t('terms.subscription.dataRetention', 'All your data remains on your device regardless of subscription status. Downgrading does not result in data loss.')}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('terms.userResponsibilities.title', 'User Responsibilities')}
        </h2>
        <div className="prose prose-gray dark:prose-invert">
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('terms.userResponsibilities.accurate', 'Provide accurate information when logging your activities')}</li>
            <li>{t('terms.userResponsibilities.appropriate', 'Use the app for its intended purpose of personal wellness tracking')}</li>
            <li>{t('terms.userResponsibilities.backup', 'Maintain your own data backups using the export feature')}</li>
            <li>{t('terms.userResponsibilities.security', 'Keep your device secure and protect access to your personal data')}</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('terms.privacy.title', 'Privacy and Data')}
        </h2>
        <div className="prose prose-gray dark:prose-invert space-y-3">
          <p>
            {t('terms.privacy.storage', 'Your data is stored locally on your device and is not transmitted to external servers unless you explicitly choose to export it.')}
          </p>
          <p>
            {t('terms.privacy.control', 'You retain full control and ownership of your data. See our Privacy Policy for detailed information about data handling.')}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('terms.limitations.title', 'Limitations of Liability')}
        </h2>
        <div className="prose prose-gray dark:prose-invert space-y-3">
          <p>
            {t('terms.limitations.noWarranty', 'Alchohalt is provided "as is" without warranties of any kind. We do not guarantee that the app will be error-free or always available.')}
          </p>
          <p>
            {t('terms.limitations.liability', 'To the maximum extent permitted by law, we shall not be liable for any damages arising from your use of the application.')}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('terms.contact.title', 'Contact Information')}
        </h2>
        <div className="prose prose-gray dark:prose-invert">
          <p>
            {t('terms.contact.content', 'For questions about these terms, please contact us at:')}
          </p>
          <p>
            <a href="mailto:legal@alchohalt.com" className="text-primary-600 hover:text-primary-700 underline">
              legal@alchohalt.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}