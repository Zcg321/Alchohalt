/**
 * Theme management service with accessibility features
 * Handles light/dark/system themes and high contrast mode
 */

import { useDB } from '../store/db';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ContrastMode = 'normal' | 'high';

export interface ThemeState {
  mode: ThemeMode;
  contrast: ContrastMode;
  reducedMotion: boolean;
}

class ThemeManager {
  private mediaQuery: MediaQueryList | null = null;
  private contrastQuery: MediaQueryList | null = null;
  private motionQuery: MediaQueryList | null = null;

  constructor() {
    this.initializeMediaQueries();
    this.applyTheme();
  }

  private initializeMediaQueries() {
    if (typeof window === 'undefined') return;

    // System theme preference
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', () => this.applyTheme());

    // High contrast preference
    this.contrastQuery = window.matchMedia('(prefers-contrast: high)');
    this.contrastQuery.addEventListener('change', () => this.applyTheme());

    // Reduced motion preference
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.motionQuery.addEventListener('change', () => this.applyTheme());
  }

  public getCurrentTheme(): ThemeState {
    const db = useDB.getState().db;
    const mode = db.settings.theme as ThemeMode;
    
    return {
      mode,
      contrast: this.contrastQuery?.matches ? 'high' : 'normal',
      reducedMotion: this.motionQuery?.matches ?? false
    };
  }

  public setTheme(mode: ThemeMode): void {
    useDB.getState().setTheme(mode);
    this.applyTheme();
  }

  public applyTheme(): void {
    if (typeof document === 'undefined') return;

    const theme = this.getCurrentTheme();
    const html = document.documentElement;

    // Remove existing theme classes
    html.classList.remove('light', 'dark', 'high-contrast');

    // Determine effective theme
    let effectiveTheme = theme.mode;
    if (theme.mode === 'system') {
      effectiveTheme = this.mediaQuery?.matches ? 'dark' : 'light';
    }

    // Apply theme classes
    html.classList.add(effectiveTheme);

    if (theme.contrast === 'high') {
      html.classList.add('high-contrast');
    }

    // Set meta theme color for mobile browsers
    this.updateMetaThemeColor(effectiveTheme);

    // Store theme preference
    try {
      localStorage.setItem('alchohalt-theme', JSON.stringify({
        mode: theme.mode,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  private updateMetaThemeColor(theme: string): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const color = theme === 'dark' ? '#020617' : '#ffffff';
      metaThemeColor.setAttribute('content', color);
    }
  }

  public getSystemTheme(): 'light' | 'dark' {
    return this.mediaQuery?.matches ? 'dark' : 'light';
  }

  public supportsHighContrast(): boolean {
    return this.contrastQuery?.matches ?? false;
  }

  public prefersReducedMotion(): boolean {
    return this.motionQuery?.matches ?? false;
  }

  public getThemeColors() {
    const theme = this.getCurrentTheme();
    const isDark = theme.mode === 'dark' || 
                   (theme.mode === 'system' && this.getSystemTheme() === 'dark');

    return {
      primary: isDark ? '#0ea5e9' : '#0284c7',
      background: isDark ? '#020617' : '#ffffff',
      surface: isDark ? '#0f172a' : '#f8fafc',
      text: isDark ? '#f8fafc' : '#1e293b',
      border: isDark ? '#334155' : '#e2e8f0'
    };
  }

  public cleanup(): void {
    this.mediaQuery?.removeEventListener('change', () => this.applyTheme());
    this.contrastQuery?.removeEventListener('change', () => this.applyTheme());
    this.motionQuery?.removeEventListener('change', () => this.applyTheme());
  }
}

// Singleton instance
export const themeManager = new ThemeManager();

// React hook for theme state
export function useTheme() {
  const { theme, setTheme } = useDB(state => ({
    theme: state.db.settings.theme,
    setTheme: state.setTheme
  }));

  return {
    theme,
    setTheme,
    currentTheme: themeManager.getCurrentTheme(),
    systemTheme: themeManager.getSystemTheme(),
    supportsHighContrast: themeManager.supportsHighContrast(),
    prefersReducedMotion: themeManager.prefersReducedMotion(),
    colors: themeManager.getThemeColors()
  };
}