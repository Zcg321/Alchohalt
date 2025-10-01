import React from 'react';
import pkg from '../../../package.json' with { type: 'json' };
import { useLanguage } from '../../i18n';

export default function About() {
  const { t } = useLanguage();
  
  return (
    <section className="space-y-6">
      <div className="p-4 border border-default rounded-xl bg-surface">
        <h2 className="font-semibold mb-3 text-primary">About Alchohalt</h2>
        <div className="space-y-3 text-sm text-secondary">
          <p>{t('disclaimer')}</p>
          <p className="text-xs text-muted">Version {pkg.version}</p>
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="p-4 border border-warning-200 rounded-xl bg-warning-50 dark:bg-warning-900/20">
        <h3 className="font-medium text-warning-800 dark:text-warning-200 mb-2">
          ⚠️ {t('medicalDisclaimer.title', 'Important Medical Disclaimer')}
        </h3>
        <div className="text-sm text-warning-700 dark:text-warning-300 space-y-2">
          <p>
            {t('medicalDisclaimer.content', 'Alchohalt is a personal tracking tool and does not provide medical advice, diagnosis, or treatment. This app is not a substitute for professional medical care.')}
          </p>
          <p>
            {t('medicalDisclaimer.emergency', 'If you are experiencing a medical emergency or need immediate help with substance use, please contact emergency services or a healthcare professional immediately.')}
          </p>
        </div>
      </div>

      {/* Privacy Commitment */}
      <div className="p-4 border border-success-200 rounded-xl bg-success-50 dark:bg-success-900/20">
        <h3 className="font-medium text-success-800 dark:text-success-200 mb-2">
          🔒 {t('privacy.title', 'Your Privacy is Protected')}
        </h3>
        <div className="text-sm text-success-700 dark:text-success-300 space-y-2">
          <p>
            {t('privacy.onDevice', 'All your data is stored locally on your device using secure, encrypted storage. We never collect, transmit, or store your personal information on external servers.')}
          </p>
          <p>
            {t('privacy.dataControl', 'You have complete control over your data. You can export, import, or delete all information at any time from the Settings panel.')}
          </p>
        </div>
      </div>

      {/* Support & Contact */}
      <div className="p-4 border border-default rounded-xl bg-surface">
        <h3 className="font-medium text-primary mb-2">
          💬 {t('support.title', 'Support & Feedback')}
        </h3>
        <div className="text-sm text-secondary space-y-2">
          <p>
            {t('support.description', 'We\'re here to help you on your wellness journey. Your feedback helps us improve the app.')}
          </p>
          <div className="flex flex-col gap-2 mt-3">
            {/* TODO: Update with real support email before public release */}
            <a 
              href="https://github.com/Zcg321/Alchohalt/issues" 
              className="text-primary-600 hover:text-primary-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              🐛 Report Issues on GitHub
            </a>
            <a 
              href="https://github.com/Zcg321/Alchohalt/discussions" 
              className="text-primary-600 hover:text-primary-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 Community Discussions
            </a>
          </div>
        </div>
      </div>

      {/* Subscription Terms */}
      <div className="p-4 border border-default rounded-xl bg-surface">
        <h3 className="font-medium text-primary mb-2">
          💳 {t('subscription.title', 'Subscription Information')}
        </h3>
        <div className="text-sm text-secondary space-y-2">
          <p>
            {t('subscription.coreFeatures', 'Core habit tracking features remain free forever. Premium features enhance your experience with advanced analytics and insights.')}
          </p>
          <p>
            {t('subscription.cancellation', 'Subscriptions can be cancelled anytime through your device\'s subscription settings. No data is lost when downgrading.')}
          </p>
          <div className="mt-3 space-y-1">
            <a 
              href="#" 
              className="block text-primary-600 hover:text-primary-700 underline text-xs"
              onClick={(e) => { e.preventDefault(); /* Open terms modal */ }}
            >
              📄 Terms of Service
            </a>
            <a 
              href="#" 
              className="block text-primary-600 hover:text-primary-700 underline text-xs"
              onClick={(e) => { e.preventDefault(); /* Open privacy modal */ }}
            >
              🔒 Privacy Policy
            </a>
          </div>
        </div>
      </div>

      {/* Open Source */}
      <div className="p-4 border border-default rounded-xl bg-surface">
        <h3 className="font-medium text-primary mb-2">
          🌟 {t('openSource.title', 'Open Source')}
        </h3>
        <div className="text-sm text-secondary">
          <p>
            {t('openSource.description', 'Alchohalt is open source software. You can review our code, contribute improvements, or build your own version.')}
          </p>
          <a 
            href="https://github.com/Zcg321/Alchohalt" 
            className="inline-block mt-2 text-primary-600 hover:text-primary-700 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            🔗 View Source Code
          </a>
        </div>
      </div>
    </section>
  );
}
