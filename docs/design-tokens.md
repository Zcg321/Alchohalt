# Design tokens

Single source of truth for color, typography, and spacing. Sprint-1 locked.

Source files:

- `src/styles/theme.css` — CSS variable definitions (light + dark + high-contrast)
- `tailwind.config.cjs` — Tailwind utility wiring (every color / spacing / radius / shadow utility resolves through a `var(--…)`)

Live preview (dev only): visit `/dev/tokens` while running `npm run dev`. Tree-shaken from production bundles via `import.meta.env.DEV`.

## Voice

- Trusted-friend, calm. No exclamation marks except on celebration moments (amber).
- Red is reserved for crisis only — never decorative.

## Palette

| Role | Token | Light | Dark |
|---|---|---|---|
| Primary | `sage-700` | `#3f6055` | `#a6c3b5` (300 swap) |
| Surface | `cream-100` | `#F8F5F0` | `--color-charcoal-900` |
| Secondary | `indigo-500` | `#3D4F7A` | `#c0c8de` (lifted) |
| Celebration | `amber-500` | `#E8A87C` | `--color-amber-300` |
| Crisis (only) | `crisis-600` | `#dc2626` | `crisis-500` |
| Dark surface | `charcoal-900` | — | `#1A1814` |

Each scale ships steps `50 / 100 / 300 / 500 / 700 / 900`. Crisis adds `600` for AA-compliant button fills.

## Typography

- Font: Inter (preferred) → platform-native sans (`-apple-system`, `Segoe UI`, `Roboto`, `system-ui`). Inter is **not yet self-hosted** — the stack falls through to system fonts. Adding `public/fonts/inter/*.woff2` + an `@font-face` block in `src/index.css` upgrades to Inter automatically.
- Base: 16px, line-height 1.55.

| Token | Size | Line height | Weight | Use |
|---|---|---|---|---|
| `text-display` | 52 | 1.05 | 600 | Hero day count |
| `text-h1` | 32 | 1.2 | 600 | Page title |
| `text-h2` | 24 | 1.3 | 600 | Section heading |
| `text-h3` | 18 | 1.45 | 500 | Sub-heading |
| `text-body` | 16 | 1.55 | 400 | Default copy |
| `text-caption` | 13 | 1.15rem | 400 | Hint / label |
| `text-micro` | 11 | 1rem | 400 | Uppercase label |

Tabular numerals on stat numerals: add the `stat-num` utility to any element holding a streak / day-count / spend value to lock digit width.

## Spacing

| Token | Value | Use |
|---|---|---|
| `--space-card` | `24px` | Standard card padding |
| `--space-card-tight` | `16px` | Tight cards, list items |
| `--space-section-y-mobile` | `48px` | Vertical rhythm on mobile |
| `--space-section-y-desktop` | `64px` | Vertical rhythm on desktop |

Tailwind utilities: `p-card`, `py-section-y-mobile`, `py-section-y-desktop`. Use `py-section-y-mobile lg:py-section-y-desktop` for the locked rhythm.

## Theme switching

The token system honors **both**:

```html
<html data-theme="dark">    <!-- new -->
<html class="dark">          <!-- legacy, still works -->
```

`tailwind.config.cjs` sets `darkMode: ['class', '[data-theme="dark"]']` so Tailwind's `dark:` variant fires under either signal. New code should set `data-theme="dark"`; existing code that toggles `.dark` keeps working.

## Light → dark example

```html
<!-- Light: cream surface, sage primary, charcoal text -->
<html data-theme="light">
  <body class="bg-surface text-ink">
    <button class="bg-sage-700 text-white">Continue</button>
  </body>
</html>

<!-- Dark: warm-charcoal surface, lifted sage, cream text -->
<html data-theme="dark">
  <body class="bg-surface text-ink">
    <button class="bg-sage-700 text-white">Continue</button>
  </body>
</html>
```

Every utility resolves through CSS variables, so the markup never changes between themes. To verify dark/light parity on a screen, flip `data-theme` and visually inspect — no rebuild, no recompile.

## Adding a token

1. Add the variable to `:root` (and to the dark/HC blocks if it should change) in `src/styles/theme.css`.
2. If you want a Tailwind utility, add the entry under `theme.extend.colors` (or `spacing`, `fontSize`, etc.) in `tailwind.config.cjs`, pointing to the var via `cv('--your-var')`.
3. Document the token here.
4. Reload the dev server. The `/dev/tokens` preview surfaces it immediately if you add it to that catalog.

## Migration notes (legacy → new)

| Legacy class | Resolves to | Long-term replacement |
|---|---|---|
| `bg-primary-600` | `var(--color-primary-600)` → `--color-sage-700` | `bg-sage-700` |
| `bg-accent-500` | `var(--color-amber-500)` | `bg-amber-500` |
| `text-neutral-900` | `var(--color-charcoal-900)` (light: `#1f1d1a`) | `text-ink` |
| `bg-white dark:bg-neutral-900` | — | `bg-surface-elevated` |
| `border-neutral-200` | `var(--border-soft)` | `border-border-soft` |
| `text-red-600` | `var(--color-crisis-600)` (still red) | only for crisis surfaces |

Existing class names keep working. Migrate opportunistically; don't gate sprints on a sweep.
