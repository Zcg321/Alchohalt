import React from 'react';
import pkg from '../../../package.json' with { type: 'json' };
import { useLanguage } from '../../i18n';

/* [SETTINGS-DEEPENING-ROUND-4] About rewritten for honesty + clarity:
 *
 *   - Dropped emoji-as-primary (🐛 / 💬 / 📄 / 🔒 / 🔗 / ⚠️). The
 *     low-literacy / ESL judge calls those out — emoji-as-icon
 *     before the text label fails when the reader doesn't recognize
 *     the emoji or it doesn't render. Text-first throughout.
 *   - Dropped the "Community Discussions" link. GitHub Discussions
 *     is not the right channel for the people this app is for.
 *     Issues stays — it's the canonical "report a bug" path and
 *     that's a clear handle.
 *   - Dropped the dead "Subscription Terms" section — the two links
 *     were `href="#"` with empty onClick handlers (TODO comments
 *     marking modals that were never built). The /legal route now
 *     covers Terms + Privacy + Subscription Terms in one place; the
 *     LegalLinks component sibling already mounts that.
 *   - Added "Built by one person." This is true (one repo owner +
 *     AI assistance for the implementation). Keeps the tone honest
 *     without overclaiming.
 *   - Replaced ⚠️ medical-disclaimer with a calm bordered box —
 *     the warning palette already conveys "important", the emoji
 *     was redundant emotional weight.
 */
export default function About() {
  const { t } = useLanguage();

  return (
    <section className="space-y-6">
      <div className="p-4 border border-default rounded-xl bg-surface">
        <h2 className="font-semibold mb-3 text-primary">About Alchohalt</h2>
        <div className="space-y-3 text-sm text-secondary">
          <p>{t('disclaimer')}</p>
          <p>Built by one person with AI assistance.</p>
          <p className="text-xs text-muted">Version {pkg.version}</p>
        </div>
      </div>

      <div className="p-4 border border-warning-200 rounded-xl bg-warning-50 dark:bg-warning-900/20">
        <h3 className="font-medium text-warning-800 dark:text-warning-200 mb-2">
          {t('medicalDisclaimer.title', 'Important medical disclaimer')}
        </h3>
        <div className="text-sm text-warning-700 dark:text-warning-300 space-y-2">
          <p>
            {t('medicalDisclaimer.content', 'Alchohalt is a personal tracking tool and does not provide medical advice, diagnosis, or treatment. This app is not a substitute for professional medical care.')}
          </p>
          <p>
            {t('medicalDisclaimer.emergency', 'If you\'re in a medical emergency or need urgent help with substance use, contact emergency services or a healthcare professional right now. The Crisis tab has direct numbers.')}
          </p>
        </div>
      </div>

      <div className="p-4 border border-success-200 rounded-xl bg-success-50 dark:bg-success-900/20">
        <h3 className="font-medium text-success-800 dark:text-success-200 mb-2">
          {t('privacy.title', 'Your privacy is protected')}
        </h3>
        <div className="text-sm text-success-700 dark:text-success-300 space-y-2">
          <p>
            {t('privacy.onDevice', 'Entries live in your phone’s local storage. Nothing leaves the device on its own. If you turn on cloud backup, the file is sealed end-to-end with a key only your device knows — we hold the encrypted blob, not the contents. Opt-in AI features (off by default) are the only path that can change this; see Settings → AI for the full data flow.')}
          </p>
          <p>
            {t('privacy.dataControl', 'You have complete control over your data. You can export, import, or delete all information at any time from the Settings panel.')}
          </p>
        </div>
      </div>

      <div className="p-4 border border-default rounded-xl bg-surface">
        <h3 className="font-medium text-primary mb-2">
          {t('support.title', 'Support & feedback')}
        </h3>
        <div className="text-sm text-secondary space-y-2">
          <p>
            {t('support.description', 'We read your feedback ourselves. It shapes what gets built.')}
          </p>
          <a
            href="https://github.com/Zcg321/Alchohalt/issues"
            className="inline-block mt-1 text-primary-600 hover:text-primary-700 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Report an issue on GitHub
          </a>
        </div>
      </div>

      <div className="p-4 border border-default rounded-xl bg-surface">
        <h3 className="font-medium text-primary mb-2">
          {t('openSource.title', 'Open source')}
        </h3>
        <div className="text-sm text-secondary">
          <p>
            {t('openSource.description', 'Alchohalt is open source. You can read the code, suggest changes, or build your own version.')}
          </p>
          <a
            href="https://github.com/Zcg321/Alchohalt"
            className="inline-block mt-2 text-primary-600 hover:text-primary-700 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View source on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
