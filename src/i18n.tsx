import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getJSON, setJSON } from './lib/storage';
import en from './locales/en.json';

export type Lang = 'en' | 'es';

type Dictionary = Record<string, string>;
export const dictionaries: Partial<Record<Lang, Dictionary>> = { en: en as unknown as Dictionary };

export async function loadLocale(lng: Lang) {
  if (dictionaries[lng]) return;
  const res = await import(`./locales/${lng}.json`);
  dictionaries[lng] = (res.default || res) as Dictionary;
}

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string, fallback?: string) => string;
}>({
  lang: 'en',
  setLang: () => {},
  t: (k: string, fallback?: string) => (dictionaries['en']?.[k] || fallback || k),
});

export async function loadInitialLang(): Promise<Lang> {
  const stored = await getJSON<Lang | null>('lang', null);
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en';
  const lang: Lang = (stored ?? (nav === 'es' ? 'es' : 'en')) as Lang;
  if (lang !== 'en') await loadLocale(lang);
  return lang;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  // Import store inside component to avoid circular deps
  const [useDBStore, setUseDBStore] = useState<typeof import('./store/db').useDB | null>(null);
  
  useEffect(() => {
    import('./store/db').then(({ useDB }) => {
      setUseDBStore(() => useDB);
    });
  }, []);

  useEffect(() => {
    loadInitialLang().then(setLangState);
  }, []);

  // Sync with store when available
  useEffect(() => {
    if (useDBStore) {
      const storeLang = useDBStore.getState().db.settings.language;
      if (storeLang && storeLang !== lang) {
        loadLocale(storeLang as Lang).then(() => {
          setLangState(storeLang as Lang);
        });
      }
    }
  }, [useDBStore, lang]);

  async function setLang(l: Lang) {
    await loadLocale(l);
    setLangState(l);
    setJSON('lang', l);
    
    // Also update the store if available
    if (useDBStore) {
      useDBStore.getState().setLanguage(l);
    }
  }

  const t = (key: string, fallback?: string) => (dictionaries[lang] ?? dictionaries['en'])?.[key] ?? fallback ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
