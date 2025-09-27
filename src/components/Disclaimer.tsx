import { useLanguage } from '../i18n';

export function Disclaimer() {
  const { t } = useLanguage();
  return (
    <div className="card bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700">
      <div className="card-content text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-warning-100 dark:bg-warning-900/50 flex items-center justify-center">
          <svg className="w-6 h-6 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <footer role="contentinfo" className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {t('disclaimer')}
        </footer>
      </div>
    </div>
  );
}
