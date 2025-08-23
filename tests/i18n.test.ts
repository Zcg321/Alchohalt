import { describe, it, expect, vi } from 'vitest';

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn().mockResolvedValue({ value: '"es"' }),
    set: vi.fn(),
  },
}));

import { dictionaries, loadInitialLang } from '../src/i18n';

describe('i18n dictionaries', () => {
  it('provides Spanish translation', () => {
    expect(dictionaries.es.clearAllData).toBe('Borrar todos los datos');
  });

  it('translates undo action', () => {
    expect(dictionaries.es.undo).toBe('Deshacer');
  });
});

describe('loadInitialLang', () => {
  it('uses stored preference when available', async () => {
    await expect(loadInitialLang()).resolves.toBe('es');
  });
});
