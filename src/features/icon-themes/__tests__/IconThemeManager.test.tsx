import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ICON_THEMES,
  getCurrentIconTheme,
  setCurrentIconTheme,
} from '../IconThemeManager';
import IconThemeManager from '../IconThemeManager';

afterEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.removeItem('alchohalt.icon-theme');
});

describe('ICON_THEMES registry', () => {
  it('has at least 3 themes (owner spec: 3-5)', () => {
    expect(ICON_THEMES.length).toBeGreaterThanOrEqual(3);
    expect(ICON_THEMES.length).toBeLessThanOrEqual(5);
  });

  it('every theme has stable id, name, swatch hex', () => {
    for (const theme of ICON_THEMES) {
      expect(theme.id).toBeTruthy();
      expect(theme.name).toBeTruthy();
      expect(theme.swatch).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    }
  });

  it("'default' is in the registry", () => {
    expect(ICON_THEMES.find((t) => t.id === 'default')).toBeTruthy();
  });

  it('all v1 themes are flagged true', () => {
    expect(ICON_THEMES.every((t) => t.v1)).toBe(true);
  });
});

describe('getCurrentIconTheme / setCurrentIconTheme', () => {
  it('default when nothing stored', () => {
    expect(getCurrentIconTheme()).toBe('default');
  });

  it('round-trips through localStorage', async () => {
    await setCurrentIconTheme('sand-warm');
    expect(getCurrentIconTheme()).toBe('sand-warm');
  });

  it('rejects unknown stored values gracefully → returns default', () => {
    localStorage.setItem('alchohalt.icon-theme', 'NOT-A-VALID-THEME');
    expect(getCurrentIconTheme()).toBe('default');
  });
});

describe('IconThemeManager — soft-paywall behavior', () => {
  it('renders behind SoftPaywall (premium gate visible on free tier)', () => {
    render(<IconThemeManager />);
    // On free tier: SoftPaywall renders the Unlock CTA.
    expect(screen.getByRole('button', { name: /See plans/i })).toBeTruthy();
  });
});
