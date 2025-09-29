import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getJSON, setJSON } from './lib/storage';
import en from './locales/en.json';

export type Lang = 'en' | 'es';

type Dictionary = Record<string, string | Dictionary>;
export const dictionaries: Partial<Record<Lang, Dictionary>> = { en: en as Dictionary };

export type TranslationValues = Record<string, string | number>;

function interpolate(template: string, vars?: TranslationValues): string {
  if (!vars) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return String(vars[key]);
    }
    return '';
  });
}

function resolve(dictionary: Dictionary | undefined, key: string): string | undefined {
  if (!dictionary) return undefined;
  const parts = key.split('.');
  let current: string | Dictionary | undefined = dictionary;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part] as string | Dictionary;
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export async function loadLocale(lng: Lang) {
  if (dictionaries[lng]) return;
  const res = await import(`./locales/${lng}.json`);
  dictionaries[lng] = (res.default || res) as Dictionary;
}

export const LanguageContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string, vars?: TranslationValues) => string;
}>({
  lang: 'en',
  setLang: () => {},
  t: (k: string, vars?: TranslationValues) => {
    const template = resolve(dictionaries['en'], k) ?? k;
    return interpolate(template, vars);
  },
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
  const [useDBStore, setUseDBStore] = useState<any>(null);
  
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

  const t = (key: string, vars?: TranslationValues) => {
    const template = resolve(dictionaries[lang], key) ?? resolve(dictionaries['en'], key) ?? key;
    return interpolate(template, vars);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
