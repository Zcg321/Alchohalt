/*
 * Alchohalt Tailwind config
 *
 * Every color is a CSS variable defined in src/styles/theme.css. That
 * file is the single source of truth — flip data-theme="dark" on
 * <html> (or add the legacy `.dark` class) to swap palettes.
 *
 * darkMode honors BOTH class-based dark (legacy) and the new
 * data-theme attribute, so we can migrate code at our own pace.
 *
 * Sprint-1-locked palette: sage / cream / indigo / amber / charcoal,
 * with red reserved for crisis only.
 */

/* eslint-env node */
const cv = (name) => `var(${name})`;

module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // ---------- New scales ----------
        sage: {
          50:  cv('--color-sage-50'),
          100: cv('--color-sage-100'),
          300: cv('--color-sage-300'),
          500: cv('--color-sage-500'),
          700: cv('--color-sage-700'),
          900: cv('--color-sage-900'),
          DEFAULT: cv('--color-sage-700'),
        },
        cream: {
          50:  cv('--color-cream-50'),
          100: cv('--color-cream-100'),
          300: cv('--color-cream-300'),
          500: cv('--color-cream-500'),
          700: cv('--color-cream-700'),
          900: cv('--color-cream-900'),
          DEFAULT: cv('--color-cream-100'),
        },
        indigo: {
          50:  cv('--color-indigo-50'),
          100: cv('--color-indigo-100'),
          300: cv('--color-indigo-300'),
          500: cv('--color-indigo-500'),
          700: cv('--color-indigo-700'),
          900: cv('--color-indigo-900'),
          DEFAULT: cv('--color-indigo-500'),
        },
        amber: {
          50:  cv('--color-amber-50'),
          100: cv('--color-amber-100'),
          300: cv('--color-amber-300'),
          500: cv('--color-amber-500'),
          700: cv('--color-amber-700'),
          900: cv('--color-amber-900'),
          DEFAULT: cv('--color-amber-500'),
        },
        charcoal: {
          50:  cv('--color-charcoal-50'),
          100: cv('--color-charcoal-100'),
          300: cv('--color-charcoal-300'),
          500: cv('--color-charcoal-500'),
          700: cv('--color-charcoal-700'),
          900: cv('--color-charcoal-900'),
          DEFAULT: cv('--color-charcoal-900'),
        },
        crisis: {
          50:  cv('--color-crisis-50'),
          100: cv('--color-crisis-100'),
          500: cv('--color-crisis-500'),
          600: cv('--color-crisis-600'),
          700: cv('--color-crisis-700'),
          900: cv('--color-crisis-900'),
          DEFAULT: cv('--color-crisis-600'),
        },

        // ---------- Semantic ----------
        surface: {
          DEFAULT:  cv('--surface-base'),
          base:     cv('--surface-base'),
          elevated: cv('--surface-elevated'),
          muted:    cv('--surface-muted'),
          inverse:  cv('--surface-inverse'),
        },
        ink: {
          DEFAULT: cv('--text-default'),
          soft:    cv('--text-soft'),
          subtle:  cv('--text-subtle'),
        },
        border: {
          DEFAULT: cv('--border-default'),
          soft:    cv('--border-soft'),
          strong:  cv('--border-strong'),
        },

        // ---------- Legacy aliases ----------
        // Existing utilities (text-primary-700, bg-neutral-50, etc.)
        // continue to resolve. Mapped through CSS vars so the visual
        // result is the new palette.
        primary: {
          50:  cv('--color-primary-50'),
          100: cv('--color-primary-100'),
          200: cv('--color-sage-100'),
          300: cv('--color-sage-300'),
          400: cv('--color-sage-300'),
          500: cv('--color-primary-500'),
          600: cv('--color-primary-600'),
          700: cv('--color-primary-700'),
          800: cv('--color-sage-700'),
          900: cv('--color-primary-900'),
          950: cv('--color-sage-900'),
        },
        accent: {
          50:  cv('--color-amber-50'),
          100: cv('--color-amber-100'),
          200: cv('--color-amber-100'),
          300: cv('--color-amber-300'),
          400: cv('--color-amber-300'),
          500: cv('--color-amber-500'),
          600: cv('--color-amber-700'),
          700: cv('--color-amber-700'),
          800: cv('--color-amber-900'),
          900: cv('--color-amber-900'),
          950: cv('--color-amber-900'),
        },
        success: {
          50:  cv('--color-success-50'),
          100: cv('--color-success-100'),
          200: cv('--color-sage-100'),
          300: cv('--color-sage-300'),
          400: cv('--color-sage-300'),
          500: cv('--color-success-500'),
          600: cv('--color-success-600'),
          700: cv('--color-success-700'),
          800: cv('--color-sage-700'),
          900: cv('--color-success-900'),
        },
        warning: {
          50:  cv('--color-warning-50'),
          100: cv('--color-warning-100'),
          200: cv('--color-amber-100'),
          300: cv('--color-amber-300'),
          400: cv('--color-amber-300'),
          500: cv('--color-warning-500'),
          600: cv('--color-warning-600'),
          700: cv('--color-warning-700'),
          800: cv('--color-amber-900'),
          900: cv('--color-warning-900'),
        },
        // Danger == crisis. Red reserved for crisis only.
        danger: {
          50:  cv('--color-danger-50'),
          100: cv('--color-danger-100'),
          200: cv('--color-crisis-100'),
          300: cv('--color-crisis-500'),
          400: cv('--color-crisis-500'),
          500: cv('--color-danger-500'),
          600: cv('--color-danger-600'),
          700: cv('--color-danger-700'),
          800: cv('--color-crisis-900'),
          900: cv('--color-danger-900'),
        },
        neutral: {
          50:  cv('--color-cream-50'),
          100: cv('--color-cream-100'),
          200: cv('--border-soft'),
          300: cv('--border-default'),
          400: cv('--text-subtle'),
          500: cv('--text-subtle'),
          600: cv('--text-soft'),
          700: cv('--color-charcoal-500'),
          800: cv('--color-charcoal-700'),
          900: cv