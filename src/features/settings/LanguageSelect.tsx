import { useLanguage, Lang } from '../../i18n';

export function LanguageSelect() {
  const { lang, setLang, t } = useLanguage();
  return (
    <label className="flex items-center space-x-2 text-sm">
      <span>{t('language')}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="border rounded p-1 text-sm"
        aria-label={t('language')}
      >
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
    </label>
  );
}
