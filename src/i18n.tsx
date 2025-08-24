import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getJSON, setJSON } from './lib/storage';
import en from './locales/en.json';

export type Lang = 'en' | 'es';

type Dictionary = Record<string, string>;
export const dictionaries: Partial<Record<Lang, Dictionary>> = { en: en as Dictionary };

export async function loadLocale(lng: Lang) {
  if (dictionaries[lng]) return;
  const res = await import(`./locales/${lng}.json`);
  dictionaries[lng] = (res.default || res) as Dictionary;
}

const LanguageContext = createContext({
  lang: 'en' as Lang,
  setLang: (_: Lang) => {},
  t: (k: string) => (dictionaries['en']?.[k] || k),
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

  useEffect(() => {
    loadInitialLang().then(setLangState);
  }, []);

  async function setLang(l: Lang) {
    await loadLocale(l);
    setLangState(l);
    setJSON('lang', l);
  }

  const t = (key: string) => (dictionaries[lang] ?? dictionaries['en'])?.[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
