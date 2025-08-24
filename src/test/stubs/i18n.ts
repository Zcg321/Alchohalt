const i18n = { t: (k: string) => k, language: "en", changeLanguage: async () => {} };
export default i18n;
export const useTranslation = () => ({ t: (k: string) => k });
