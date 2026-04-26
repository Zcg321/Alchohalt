module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary — calm clinical teal-blue. Less generic-SaaS than
        // pure indigo, easier on dark backgrounds, and keeps WCAG AA
        // contrast against neutral-50 / neutral-900 surfaces.
        primary: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Accent — warm muted amber for "premium" / "unlock" signals.
        // Inviting (not warning), distinct from `warning`.
        accent: {
          50:  '#fdf8f4',
          100: '#faeedf',
          200: '#f3d9bb',
          300: '#e9bf8f',
          400: '#dca163',
          500: '#cc8744',
          600: '#b56d2e',
          700: '#945527',
          800: '#774524',
          900: '#623921',
          950: '#371d10',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      fontFamily: {
        // Platform-native sans. SF on Apple, Roboto on Android, Segoe on
        // Windows, with a clean Linux fallback. NEVER fetched from a CDN.
        // (Inter intentionally NOT in this stack — we don't ship a
        // self-hosted Inter woff2 yet. If owner adds public/fonts/inter/
        // and an @font-face block, prepend 'Inter' here.)
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      // Type scale — tightened line-heights at the larger end so display
      // headlines don't feel airy on small viewports. Letter-spacing on
      // the display sizes (-tracking-tight equivalent) is applied via
      // utility classes per-headline, not globally.
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1.05rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem',     { lineHeight: '1.5rem'  }],
        'lg':   ['1.125rem', { lineHeight: '1.6rem'  }],
        'xl':   ['1.25rem',  { lineHeight: '1.65rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '1.85rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.15rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem'  }],
        '5xl':  ['3rem',     { lineHeight: '3.15rem' }],
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      // Shadows tuned for a calmer surface. `card` is the default
      // resting elevation (very soft). `card-hover` adds depth without
      // a perceptible jump. `premium-glow` is reserved for premium
      // tile borders.
      boxShadow: {
        'sm':         '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        'DEFAULT':    '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.04)',
        'md':         '0 2px 4px -1px rgb(15 23 42 / 0.06), 0 4px 6px -2px rgb(15 23 42 / 0.04)',
        'lg':         '0 4px 6px -2px rgb(15 23 42 / 0.05), 0 10px 15px -3px rgb(15 23 42 / 0.06)',
        'xl':         '0 10px 15px -3px rgb(15 23 42 / 0.06), 0 20px 25px -5px rgb(15 23 42 / 0.05)',
        'card':       '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.03)',
        'card-hover': '0 1px 3px 0 rgb(15 23 42 / 0.08), 0 4px 8px -2px rgb(15 23 42 / 0.05)',
        'soft':       '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        'premium-glow': '0 0 0 1px rgb(204 135 68 / 0.18), 0 4px 12px -2px rgb(204 135 68 / 0.18)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-up': 'scaleUp 0.2s ease-out',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-soft': 'linear-gradient(135deg, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
