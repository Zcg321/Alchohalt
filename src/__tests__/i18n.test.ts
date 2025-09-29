import { describe, it, expect, vi } from 'vitest';
import { getLanguageDisplayName, loadInitialLang, loadLocale } from '../i18n';

// Mock modules
vi.mock('./locales/es.json', () => ({
  default: {
    'test.key': 'prueba',
    'nested': {
      'key': 'valor anidado'
    }
  }
}));

describe('i18n utilities', () => {
  describe('getLanguageDisplayName', () => {
    it('returns display names for supported languages', () => {
      expect(getLanguageDisplayName('en')).toBe('English');
      expect(getLanguageDisplayName('es')).toBe('Español');
    });

    it('returns the language code for unsupported languages', () => {
      expect(getLanguageDisplayName('fr' as any)).toBe('fr');
    });
  });

  describe('loadInitialLang', () => {
    it('returns "en" as default when no navigator language', async () => {
      // Mock navigator to not have language
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true
      });

      const lang = await loadInitialLang();
      expect(lang).toBe('en');
    });

    it('detects Spanish from navigator', async () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'es-ES' },
        writable: true
      });

      const lang = await loadInitialLang();
      expect(lang).toBe('es');
    });

    it('falls back to English for unsupported languages', async () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'fr-FR' },
        writable: true
      });

      const lang = await loadInitialLang();
      expect(lang).toBe('en');
    });
  });

  describe('loadLocale', () => {
    it('loads and caches locale data', async () => {
      // Initially should not be loaded
      const { dictionaries } = await import('../i18n');
      delete dictionaries.es;

      await loadLocale('es');
      
      expect(dictionaries.es).toBeDefined();
      expect(dictionaries.es?.['test.key']).toBe('prueba');
    });

    it('skips loading if already cached', async () => {
      const { dictionaries } = await import('../i18n');
      dictionaries.es = { 'already': 'loaded' };

      await loadLocale('es');
      
      // Should still have the pre-existing data
      expect(dictionaries.es?.['already']).toBe('loaded');
    });
  });
});