import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * [R12-5] RTL prep — guardrail. Once we converted physical-direction
 * Tailwind classes (ml-/mr-/pl-/pr-/text-left/etc.) to their logical
 * equivalents (ms-/me-/ps-/pe-/text-start/etc.), this test prevents
 * regressions: any future PR that re-introduces a physical-direction
 * class fails the suite.
 *
 * Why this matters: when we eventually flip to an RTL locale (Arabic,
 * Hebrew, Persian, Urdu), every margin/padding/text-align that's
 * still anchored to "left" or "right" creates a layout that LOOKS
 * mirrored to RTL readers — content gravitates toward the wrong edge,
 * spacing reads as awkward, the visual hierarchy flips backwards.
 *
 * Allowed exceptions:
 *   - Comments / docstrings explaining a left/right concept
 *   - Capacitor safe-area-inset-{left,right} (anchored to physical
 *     hardware notches)
 *   - SVG path data (M0,0 L10,10) — letters happen to look like our
 *     pattern but they're geometric coordinates
 */

const PROJECT_ROOT = resolve(__dirname, '../..');
const SRC = resolve(PROJECT_ROOT, 'src');

// Files allowed to keep physical directions:
const ALLOWLIST = new Set<string>([
  // This test file itself names the patterns.
  resolve(__dirname, 'rtl-logical-properties.test.ts'),
  // The codemod tool documents the patterns it converts.
  resolve(PROJECT_ROOT, 'tools', 'rtl_logical_sweep.py'),
]);

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) {
      out.push(...listFiles(full));
    } else if (/\.(ts|tsx)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

// Regexes that match a physical-direction Tailwind class inside a
// className-shaped context (anything between word boundaries that
// looks like attribute or string content). We deliberately do NOT
// match comments — line ones (// ...) and block ones (/* ... */)
// are stripped before scanning.
const FORBIDDEN_CLASSES: { pattern: RegExp; name: string }[] = [
  { pattern: /\bml-(?:auto|\d+(?:\.\d+)?)\b/, name: 'ml-* (use ms-*)' },
  { pattern: /\bmr-(?:auto|\d+(?:\.\d+)?)\b/, name: 'mr-* (use me-*)' },
  { pattern: /\bpl-\d+(?:\.\d+)?\b/, name: 'pl-* (use ps-*)' },
  { pattern: /\bpr-\d+(?:\.\d+)?\b/, name: 'pr-* (use pe-*)' },
  { pattern: /\btext-left\b/, name: 'text-left (use text-start)' },
  { pattern: /\btext-right\b/, name: 'text-right (use text-end)' },
  { pattern: /\bborder-l-\d+\b/, name: 'border-l-* (use border-s-*)' },
  { pattern: /\bborder-r-\d+\b/, name: 'border-r-* (use border-e-*)' },
];

function stripCommentsAndStringy(src: string): string {
  // Remove line comments
  let out = src.replace(/\/\/[^\n]*/g, '');
  // Remove block comments
  out = out.replace(/\/\*[\s\S]*?\*\//g, '');
  return out;
}

describe('[R12-5] RTL prep — physical-direction class guardrail', () => {
  it('contains no ml-/mr-/pl-/pr-/text-left/text-right/border-l/border-r classes in src', () => {
    const files = listFiles(SRC);
    const violations: { file: string; class: string; line: number; snippet: string }[] = [];
    for (const f of files) {
      if (ALLOWLIST.has(f)) continue;
      const text = readFileSync(f, 'utf8');
      const stripped = stripCommentsAndStringy(text);
      const lines = stripped.split('\n');
      lines.forEach((line, idx) => {
        for (const { pattern, name } of FORBIDDEN_CLASSES) {
          if (pattern.test(line)) {
            violations.push({
              file: f.replace(PROJECT_ROOT + '/', '').replace(PROJECT_ROOT + '\\', ''),
              class: name,
              line: idx + 1,
              snippet: line.trim().slice(0, 120),
            });
          }
        }
      });
    }
    if (violations.length > 0) {
      const lines = violations
        .slice(0, 20)
        .map((v) => `  ${v.file}:${v.line}  ${v.class}\n    ${v.snippet}`);
      const more = violations.length > 20 ? `\n  ...and ${violations.length - 20} more` : '';
      throw new Error(
        `Found ${violations.length} physical-direction Tailwind class(es). Convert to logical equivalents (ms-*, me-*, ps-*, pe-*, text-start, text-end, border-s-*, border-e-*):\n${lines.join('\n')}${more}`,
      );
    }
    expect(violations).toEqual([]);
  });
});
