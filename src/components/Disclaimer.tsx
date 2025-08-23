import { useLanguage } from '../i18n';

export function Disclaimer() {
  const { t } = useLanguage();
  return (
    <footer className="text-xs text-gray-500">{t('disclaimer')}</footer>
  );
}
