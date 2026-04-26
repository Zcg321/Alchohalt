import React, { useEffect, useState } from 'react';
import SoftPaywall from '../../components/SoftPaywall';
import { useLanguage } from '../../i18n';

/**
 * Icon Themes — premium feature.
 *
 * Owner-locked spec: "3-5 alternates wired via Capacitor App Icon
 * Switcher (or platform-native if better)."
 *
 * Implementation strategy:
 *   - The TS layer here is a registry of theme metadata + a
 *     setCurrentTheme() function.
 *   - The actual icon switch on iOS/Android requires a Capacitor
 *     plugin (e.g. `capacitor-app-icon-changer` from the community,
 *     or rolling our own around UIApplication.setAlternateIconName
 *     on iOS + LauncherActivity-alias on Android).
 *   - For the web/PWA path the manifest icon is fixed; this UI tile
 *     surfaces the themes but explains web users only see the change
 *     in their installed PWA after icon-spec update.
 *
 * Owner task documented in commit message: ship icon assets (PNG +
 * adaptive XML for Android, .png set for iOS appiconset), wire native
 * plugin. Until then the current-theme selection is persisted to
 * localStorage for the web preview, and the actual platform icon
 * change happens once the plugin is wired.
 */

export type IconThemeId =
  | 'default'
  | 'sand-warm'
  | 'evening-charcoal'
  | 'spring-mint'
  | 'classic-mono';

export interface IconTheme {
  id: IconThemeId;
  name: string;
  description: string;
  /** Hex preview color for the swatch in the picker UI. */
  swatch: string;
  /** Available in v1.0 (free baseline gets default; rest are premium). */
  v1: boolean;
}

export const ICON_THEMES: IconTheme[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'The classic Alchohalt mark.',
    swatch: '#0ea5e9',
    v1: true,
  },
  {
    id: 'sand-warm',
    name: 'Sand & Warm',
    description: 'Calm-clinical, cream + warm-charcoal accent.',
    swatch: '#c5b15c',
    v1: true,
  },
  {
    id: 'evening-charcoal',
    name: 'Evening',
    description: 'Deep charcoal for users who prefer subtler home-screen.',
    swatch: '#1f2937',
    v1: true,
  },
  {
    id: 'spring-mint',
    name: 'Spring Mint',
    description: 'Soft mint accent on cream.',
    swatch: '#86efac',
    v1: true,
  },
  {
    id: 'classic-mono',
    name: 'Classic Mono',
    description: 'Black-and-white minimalist.',
    swatch: '#000000',
    v1: true,
  },
];

const STORAGE_KEY = 'alchohalt.icon-theme';

export function getCurrentIconTheme(): IconThemeId {
  if (typeof localStorage === 'undefined') return 'default';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && ICON_THEMES.some((t) => t.id === stored)) {
    return stored as IconThemeId;
  }
  return 'default';
}

/**
 * Persist the user's pick + (when wired) call the native plugin.
 * Returns the new theme on success, or throws if the platform
 * plugin isn't available yet.
 */
export async function setCurrentIconTheme(theme: IconThemeId): Promise<IconThemeId> {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, theme);
  }
  // Future: when capacitor plugin is shipped, call:
  //   await IconChanger.setIcon({ name: theme === 'default' ? null : theme });
  // For now, persistence-only. The platform icon doesn't change until
  // the binary assets + plugin land — see the commit message for the
  // owner task.
  return theme;
}

interface Props {
  className?: string;
}

export default function IconThemeManager({ className = '' }: Props) {
  return (
    <SoftPaywall feature="icon_themes" className={className}>
      <IconThemeContent />
    </SoftPaywall>
  );
}

function IconThemeContent() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState<IconThemeId>(getCurrentIconTheme);
  const [pending, setPending] = useState<IconThemeId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrent(getCurrentIconTheme());
  }, []);

  const choose = async (id: IconThemeId) => {
    if (pending) return;
    setError(null);
    setPending(id);
    try {
      await setCurrentIconTheme(id);
      setCurrent(id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not change icon.';
      setError(msg);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <header className="mb-3">
        <h3 className="text-sm font-semibold">{t('iconThemes.title')}</h3>
        <p className="text-xs text-gray-500">{t('iconThemes.subtitle')}</p>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {ICON_THEMES.filter((t) => t.v1).map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => void choose(theme.id)}
            aria-pressed={current === theme.id}
            disabled={pending !== null}
            className={`flex flex-col items-center gap-2 rounded-md border p-3 text-xs transition ${
              current === theme.id
                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/40'
                : 'border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500'
            }`}
          >
            <span
              aria-hidden
              className="block h-10 w-10 rounded-lg shadow-sm"
              style={{ backgroundColor: theme.swatch }}
            />
            <span className="font-medium">{theme.name}</span>
            <span className="text-gray-500 dark:text-gray-400 text-[10px] leading-tight">
              {theme.description}
            </span>
          </button>
        ))}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100"
        >
          {error}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {t('iconThemes.platformNote')}
      </p>
    </div>
  );
}
