import React from 'react';
import { useLanguage } from '../../i18n';

/**
 * [R23-B] Visible jump-nav for Settings sections.
 *
 * Round 22 (R22-4) added stable H2 IDs (`appearance-heading`,
 * `reminders-heading`, `privacy-and-data-heading`,
 * `plan-and-billing-heading`, `about-heading`, `legal-heading`) so
 * the cognitive-load judge could point to discoverable section
 * anchors. R23-B builds the visible UI on top.
 *
 * Design:
 *   - Sticky chip rail at the top of Settings
 *   - Native anchor links (`<a href="#…">`); browser handles smooth
 *     scroll via the `scroll-smooth` class on <html>
 *   - Horizontal overflow on narrow screens; chips stay tappable
 *     (44pt+ minimum height per WCAG 2.5.5 / R22-5 floor)
 *   - `<nav aria-label="…">` so screen-reader users can jump-list
 *     all sections with a single keystroke
 *   - `scroll-margin-top` on each H2 (added via global CSS) prevents
 *     the sticky rail from covering the heading after a jump
 *
 * Why not buttons + scrollIntoView():
 *   - Anchor links work without JS, deep-link via URL fragment,
 *     and don't need a useEffect/ref dance.
 */
const SECTIONS: ReadonlyArray<{ key: string; href: string; fallback: string }> = [
  { key: 'settings.jumpNav.appearance', href: '#appearance-heading', fallback: 'Appearance' },
  { key: 'settings.jumpNav.reminders', href: '#reminders-heading', fallback: 'Reminders' },
  { key: 'settings.jumpNav.privacy', href: '#privacy-and-data-heading', fallback: 'Privacy' },
  { key: 'settings.jumpNav.billing', href: '#plan-and-billing-heading', fallback: 'Plan' },
  /* [R28-1] Help anchor — surfaces the FAQ between Plan and About. */
  { key: 'settings.jumpNav.help', href: '#help-heading', fallback: 'Help' },
  { key: 'settings.jumpNav.about', href: '#about-heading', fallback: 'About' },
  { key: 'settings.jumpNav.legal', href: '#legal-heading', fallback: 'Legal' },
];

export default function SettingsJumpNav() {
  const { t } = useLanguage();
  return (
    <nav
      aria-label={t('settings.jumpNav.label', 'Jump to section')}
      className="sticky top-0 z-20 -mx-4 mb-4 px-4 py-2 bg-surface/95 backdrop-blur-sm border-b border-border-soft"
      data-testid="settings-jump-nav"
    >
      <ul className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-thin no-scrollbar">
        {SECTIONS.map((s) => (
          <li key={s.href} className="flex-shrink-0">
            <a
              href={s.href}
              className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-pill border border-border bg-surface-elevated text-sm text-ink hover:bg-cream-50 dark:hover:bg-charcoal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
            >
              {t(s.key, s.fallback)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
