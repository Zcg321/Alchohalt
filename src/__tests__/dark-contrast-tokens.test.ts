/**
 * Regression for [A11Y-DARK-CONTRAST].
 *
 * Pre-fix `--text-subtle` in dark mode (138 130 120 = #8a8278) failed
 * 4.5:1 against `--surface-elevated` (charcoal-700 = #2a2622) at
 * 3.96:1, generating 6 axe color-contrast violations on every surface.
 * This test pins the token math so a future change can't silently
 * regress contrast — if someone bumps `--text-subtle` darker, this
 * fires before axe ever runs.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '..', '..');
const THEME = readFileSync(join(REPO_ROOT, 'src/styles/theme.css'), 'utf-8');

/** Convert "138 130 120" → relative luminance per WCAG. */
function luminance(triple: string): number {
  const [r, g, b] = triple.trim().split(/\s+/).map(Number);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Extract the value of `--name: <triple>;` from inside the dark-mode block. */
function darkTokenTriple(name: string): string {
  // The dark block is the second occurrence of `[data-theme="dark"]`
  const darkBlockMatch = THEME.match(
    /\[data-theme="dark"\][\s\S]*?\{([\s\S]*?)\n  \}/,
  );
  expect(darkBlockMatch, 'dark-mode block missing in theme.css').not.toBeNull();
  const block = darkBlockMatch![1];
  const re = new RegExp(`--${name}:\\s*([0-9 ]+);`);
  const m = block.match(re);
  expect(m, `--${name} not declared in dark-mode block`).not.toBeNull();
  return m![1];
}

function lightTokenTriple(name: string): string {
  // First [data-theme="light"] (or :root) block
  const m = THEME.match(/:root,\s*\[data-theme="light"\][\s\S]*?\{([\s\S]*?)\n  \}/);
  expect(m).not.toBeNull();
  const block = m![1];
  const re = new RegExp(`--${name}:\\s*([0-9 ]+);`);
  const m2 = block.match(re);
  expect(m2, `--${name} not declared in light-mode block`).not.toBeNull();
  return m2![1];
}

describe('[A11Y-DARK-CONTRAST] dark-mode contrast invariants', () => {
  it('text-subtle vs surface-elevated meets WCAG AA (4.5:1)', () => {
    const text = darkTokenTriple('text-subtle');
    // surface-elevated in dark = charcoal-700 = "42 38 34" (resolved)
    const surface = '42 38 34';
    const ratio = contrast(text, surface);
    expect(ratio, `actual ratio ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });

  it('text-subtle vs surface-base also meets 4.5:1 (charcoal-900)', () => {
    const text = darkTokenTriple('text-subtle');
    const surface = '26 24 20'; // charcoal-900
    const ratio = contrast(text, surface);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('text-soft vs surface-elevated meets 4.5:1 (regression guard)', () => {
    const text = darkTokenTriple('text-soft');
    const surface = '42 38 34';
    const ratio = contrast(text, surface);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('text-default in dark vs surface-elevated meets 4.5:1', () => {
    const text = darkTokenTriple('text-default');
    const surface = '42 38 34';
    const ratio = contrast(text, surface);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('light-mode text-subtle vs surface-elevated still meets 4.5:1', () => {
    const text = lightTokenTriple('text-subtle');
    // surface-elevated in light = "255 255 255"
    const surface = '255 255 255';
    const ratio = contrast(text, surface);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
