import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** [POLISH] Regression coverage for the per-screen visual /
 *  interaction polish floor. None of these are deep DOM assertions —
 *  they pin invariants in the source CSS so a future contributor
 *  can't silently regress the polish pass. */
describe('[POLISH] visual + interaction floor', () => {
  const repoRoot = resolve(__dirname, '..', '..');
  const indexCss = readFileSync(resolve(repoRoot, 'src/index.css'), 'utf8');
  const themeCss = readFileSync(resolve(repoRoot, 'src/styles/theme.css'), 'utf8');
  const errorBoundary = readFileSync(
    resolve(repoRoot, 'src/components/ErrorBoundary.tsx'),
    'utf8',
  );
  const milestones = readFileSync(
    resolve(repoRoot, 'src/features/milestones/Milestones.tsx'),
    'utf8',
  );

  it('global press feedback uses scale + 80% opacity', () => {
    expect(indexCss).toMatch(/\.btn:active:not\(:disabled\)\s*\{[^}]*scale\(0\.98\)/);
    expect(indexCss).toMatch(/\.btn:active:not\(:disabled\)\s*\{[^}]*opacity:\s*0\.8/);
  });

  it('prefers-reduced-motion zeros out animation + transition', () => {
    expect(indexCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(indexCss).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(indexCss).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
    // theme.css also pins specific animate-* helpers
    expect(themeCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it('ErrorBoundary recovery affordances meet 44px touch-target spec', () => {
    // Inline + top-level "Try again" buttons + the Reload + Report
    // links should all carry min-h-[44px].
    const matches = errorBoundary.match(/min-h-\[44px\]/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(4);
    // No 36px stragglers (the inline fallback used to ship at 36px).
    expect(errorBoundary).not.toMatch(/min-h-\[36px\]/);
  });

  it('ErrorBoundary uses semantic tokens, not legacy text-neutral-* / bg-white', () => {
    expect(errorBoundary).not.toMatch(/text-neutral-/);
    expect(errorBoundary).not.toMatch(/border-neutral-/);
    expect(errorBoundary).not.toMatch(/\bbg-white\b/);
  });

  it('Milestones reached glyph carries the celebration scale-up class', () => {
    expect(milestones).toMatch(/animate-scale-up/);
  });

  it('Inter is the first entry of the Tailwind sans stack', () => {
    const cfg = readFileSync(resolve(repoRoot, 'tailwind.config.cjs'), 'utf8');
    // Match the multi-line `sans: [ 'Inter', '-apple-system', ...]` array.
    expect(cfg).toMatch(/sans:\s*\[\s*['"]Inter['"]/);
  });
});
