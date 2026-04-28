/**
 * DevTokensPreview
 * ================
 *
 * A token catalog page rendered ONLY in dev mode at /dev/tokens. Not
 * shipped to production — the conditional in main.tsx is import.meta
 * .env.DEV-gated and tree-shaken out of the prod bundle.
 *
 * Use it as a quick visual smoke test when you change a token in
 * src/styles/theme.css: every swatch, type sample, and spacing token
 * appears here. Toggle the data-theme switch top right to verify
 * dark/light parity.
 */

import React, { useEffect, useState } from 'react';

const SAGE     = ['50', '100', '300', '500', '700', '900'] as const;
const CREAM    = ['50', '100', '300', '500', '700', '900'] as const;
const INDIGO   = ['50', '100', '300', '500', '700', '900'] as const;
const AMBER    = ['50', '100', '300', '500', '700', '900'] as const;
const CHARCOAL = ['50', '100', '300', '500', '700', '900'] as const;
const CRISIS   = ['50', '100', '500', '600', '700', '900'] as const;

type Theme = 'light' | 'dark';

function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    const v = document.documentElement.getAttribute('data-theme');
    return v === 'dark' ? 'dark' : 'light';
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);
  return [theme, setTheme];
}

function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md bg-surface-elevated border border-border">
      <div
        className="h-10 w-10 rounded-md ring-1 ring-border"
        style={{ background: `var(${varName})` }}
        aria-hidden
      />
      <div className="text-xs">
        <div className="font-medium text-ink">{name}</div>
        <code className="text-ink-subtle">{varName}</code>
      </div>
    </div>
  );
}

function ScaleRow({ label, prefix, steps }: { label: string; prefix: string; steps: readonly string[] }) {
  return (
    <section className="space-y-3">
      <h3 className="text-h3 text-ink">{label}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {steps.map((s) => (
          <Swatch key={s} name={`${label.toLowerCase()}-${s}`} varName={`--color-${prefix}-${s}`} />
        ))}
      </div>
    </section>
  );
}

function SemanticRow({ label, vars }: { label: string; vars: { name: string; varName: string }[] }) {
  return (
    <section className="space-y-3">
      <h3 className="text-h3 text-ink">{label}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {vars.map((v) => (
          <Swatch key={v.varName} name={v.name} varName={v.varName} />
        ))}
      </div>
    </section>
  );
}

export default function DevTokensPreview() {
  const [theme, setTheme] = useTheme();

  return (
    <main className="min-h-screen bg-surface text-ink p-6 sm:p-10 max-w-6xl mx-auto">
      <header className="flex items-start justify-between gap-4 mb-10">
        <div>
          <h1 className="text-h1 text-ink">Design tokens</h1>
          <p className="text-body text-ink-soft mt-1">
            Live preview of the Alchohalt token system. Dev-only route. Flip the
            theme to verify dark/light parity.
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Theme switcher"
          className="inline-flex rounded-pill border border-border bg-surface-elevated p-1 text-sm"
        >
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={theme === t}
              onClick={() => setTheme(t)}
              className={`px-3 py-1 rounded-pill transition-colors ${
                theme === t
                  ? 'bg-sage-700 text-white'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-12">
        <ScaleRow label="Sage"     prefix="sage"     steps={SAGE} />
        <ScaleRow label="Cream"    prefix="cream"    steps={CREAM} />
        <ScaleRow label="Indigo"   prefix="indigo"   steps={INDIGO} />
        <ScaleRow label="Amber"    prefix="amber"    steps={AMBER} />
        <ScaleRow label="Charcoal" prefix="charcoal" steps={CHARCOAL} />
        <ScaleRow label="Crisis"   prefix="crisis"   steps={CRISIS} />

        <SemanticRow
          label="Surfaces"
          vars={[
            { name: 'surface base',     varName: '--surface-base' },
            { name: 'surface elevated', varName: '--surface-elevated' },
            { name: 'surface muted',    varName: '--surface-muted' },
            { name: 'surface inverse',  varName: '--surface-inverse' },
          ]}
        />
        <SemanticRow
          label="Text"
          vars={[
            { name: 'text default', varName: '--text-default' },
            { name: 'text soft',    varName: '--text-soft' },
            { name: 'text subtle',  varName: '--text-subtle' },
          ]}
        />
        <SemanticRow
          label="Borders"
          vars={[
            { name: 'border default', varName: '--border-default' },
            { name: 'border soft',    varName: '--border-soft' },
            { name: 'border strong',  varName: '--border-strong' },
          ]}
        />
        <SemanticRow
          label="Action / status"
          vars={[
            { name: 'action primary',     varName: '--action-primary' },
            { name: 'action secondary',   varName: '--action-secondary' },
            { name: 'action celebration', varName: '--action-celebration' },
            { name: 'action crisis',      varName: '--action-crisis' },
          ]}
        />

        <section className="space-y-3">
          <h3 className="text-h3 text-ink">Type scale</h3>
          <div className="space-y-3 rounded-lg border border-border bg-surface-elevated p-card">
            <p className="text-display text-ink">Display 52</p>
            <p className="text-h1 text-ink">Heading 1 32</p>
            <p className="text-h2 text-ink">Heading 2 24</p>
            <p className="text-h3 text-ink">Heading 3 18</p>
            <p className="text-body text-ink">Body 16. Inter, 1.55 line height.</p>
            <p className="text-caption text-ink-soft">Caption 13. Used for hint text.</p>
            <p className="text-micro uppercase tracking-wide text-ink-subtle">Micro 11 / uppercase</p>
            <p className="stat-num text-h1 text-ink">0123456789 — tabular nums</p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-h3 text-ink">Spacing</h3>
          <div className="rounded-lg border border-border bg-surface-elevated p-card text-caption text-ink-soft">
            <p>section-y mobile = <code>3rem (48px)</code> · desktop = <code>4rem (64px)</code></p>
            <p>card padding = <code>1.5rem (24px)</code></p>
            <p>card tight padding = <code>1rem (16px)</code></p>
          </div>
        </section>
      </div>

      <footer className="mt-12 text-caption text-ink-subtle">
        Source: <code>src/styles/theme.css</code>. Map: <code>tailwind.config.cjs</code>.
      </footer>
    </main>
  );
}
