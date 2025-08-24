import { describe, it, expect, vi } from 'vitest';

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn().mockResolvedValue({ value: '"es"' }),
    set: vi.fn(),
  },
}));

import { dictionaries, loadInitialLang, loadLocale } from '../src/i18n';

describe('i18n dictionaries', () => {
  beforeAll(async () => {
    await loadLocale('es');
  });

  it('provides Spanish translation', () => {
    expect(dictionaries.es?.clearAllData).toBe('Borrar todos los datos');
  });

  it('translates undo action', () => {
    expect(dictionaries.es?.undo).toBe('Deshacer');
  });
});

describe('loadInitialLang', () => {
  it('uses stored preference when available', async () => {
    await expect(loadInitialLang()).resolves.toBe('es');
  });
});
