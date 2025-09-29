import { describe, it, expect, vi } from 'vitest';
import { getLanguageDisplayName, loadInitialLang, loadLocale } from '../i18n';

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
    it('does not throw when loading locale', async () => {
      await expect(loadLocale('es')).resolves.not.toThrow();
    });

    it('handles already loaded locales', async () => {
      // Load twice - should not cause issues
      await loadLocale('es');
      await expect(loadLocale('es')).resolves.not.toThrow();
    });
  });
});