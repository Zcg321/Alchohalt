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
            {t('privacy.policy.dataStorage.local', 'Your wellness data is stored locally on your device using secure, encrypted storage mechanisms provided by your operating system.')}
          </p>
          <p>
            {t('privacy.policy.dataStorage.noCloud', 'We do not use cloud storage, external databases, or any form of remote data collection by default. Your information stays on your device unless you (1) explicitly export it, OR (2) opt in to AI Insights — see "AI Features" below.')}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">
          {t('privacy.policy.ai.title', 'AI Features (Opt-In)')}
        </h2>
        <div className="prose prose-gray dark:prose-invert space-y-3">
          <p>
            {t('privacy.policy.ai.intro', 'AI Insights is an optional, opt-in feature. It is OFF by default. When you turn it on, an anonymized summary of your patterns is sent to our AI provider (Anthropic) through a server-side proxy, and a written reflection is returned to your device.')}
          </p>
          <p className="font-semibold">
            {t('privacy.policy.ai.sentTitle', 'What is sent (only after you opt in):')}
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>{t('privacy.policy.ai.sentBuckets', 'Drink counts grouped by ISO week (no exact timestamps)')}</li>
            <li>{t('privacy.policy.ai.sentMood', 'Mood-tag counts (e.g. "happy: 12, anxious: 4")')}</li>
            <li>{t('privacy.policy.ai.sentHALT', 'HALT trigger counts (hungry, angry, lonely, tired)')}</li>
            <li>{t('privacy.policy.ai.sentIntent', 'Intention counts (celebrate, social, taste, bored, cope, other)')}</li>
            <li>{t('privacy.policy.ai.sentDOW', 'Day-of-week pattern (counts only)')}</li>
            <li>{t('privacy.policy.ai.sentStreak', 'Current streak length')}</li>
            <li>{t('privacy.policy.ai.sentInstance', 'An anonymous device ID generated locally at consent (rotates if you revoke)')}</li>
            <li>{t('privacy.policy.ai.sentLocale', 'Your locale (e.g. "en")')}</li>
          </ul>
          <p className="font-semibold">
            {t('privacy.policy.ai.neverTitle', 'What is NEVER sent, even with AI Insights on:')}
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>{t('privacy.policy.ai.neverIdentity', 'Your name, email, phone, or address — we never collect these')}</li>
            <li>{t('privacy.policy.ai.neverLoc', 'Your location or any GPS data')}</li>
            <li>{t('privacy.policy.ai.neverFreeText', 'Any free-text you write (journal entries, notes, alt-action, voice transcripts)')}</li>
            <li>{t('privacy.policy.ai.neverDrinkNames', 'Custom drink names (which could include personal references)')}</li>
            <li>{t('privacy.policy.ai.neverProfile', 'Your weight, sex, or any other profile data')}</li>
            <li>{t('privacy.policy.ai.neverTs', 'Exact timestamps of when you logged anything')}</li>
          </ul>
          <p>
            {t('privacy.policy.ai.provider', 'Provider: Anthropic (Claude). Anthropic does not train on customer data and retains prompts for up to 30 days for abuse detection only. See https://www.anthropic.com/legal/privacy.')}
          </p>
          <p>
            {t('privacy.policy.ai.control', 'You can revoke consent at any time in Settings → AI. Revoking wipes the anonymous device ID locally; future re-grants generate a new one. We have no account system, so there is nothing for us to delete on the server side beyond the proxy logs (which retain only the anonymous ID and timestamp for rate-limiting, not the prompt body).')}
          </p>
          <p className="text-sm">
            {t('privacy.policy.ai.mhmda', 'If you reside in Washington, Nevada, Connecticut, or Colorado, separate consumer-health-data rights apply. See our Consumer Health Data Privacy Policy for the state-specific disclosures.')}
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
        <div className="prose prose-gray dark:prose-invert space-y-3">
          <p>
            {t('privacy.policy.thirdParty.summary', 'Alchohalt does not integrate with any third-party analytics, advertising, or data collection services. The only third parties that ever see anything from your use of the app are:')}
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>{t('privacy.policy.thirdParty.store', 'Apple App Store / Google Play — when you make a premium purchase. They handle the payment.')}</li>
            <li>{t('privacy.policy.thirdParty.rc', 'RevenueCat — purchase-validation broker. Sees an anonymous purchase token + product ID.')}</li>
            <li>{t('privacy.policy.thirdParty.ai', 'Anthropic — only if you opt in to AI Insights. Sees the anonymized summary described in the AI Features section.')}</li>
          </ul>
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