import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

/** [FONT-1] Privacy invariant — Inter must be self-hosted, never
 *  fetched from a CDN at first render. These regression checks fail
 *  the build if a future change deletes the woff2 or breaks the
 *  @font-face declaration in theme.css. */
describe('Inter self-host', () => {
  const repoRoot = resolve(__dirname, '..', '..', '..');

  it('public/fonts/inter/InterVariable.woff2 exists', () => {
    const path = resolve(repoRoot, 'public/fonts/inter/InterVariable.woff2');
    const stat = statSync(path);
    expect(stat.isFile()).toBe(true);
    expect(stat.size).toBeGreaterThan(10_000);   // not a 0-byte placeholder
    expect(stat.size).toBeLessThan(120 * 1024);  // budget: ≤120 KB
  });

  it('woff2 file has the wOF2 magic bytes', () => {
    const path = resolve(repoRoot, 'public/fonts/inter/InterVariable.woff2');
    const buf = readFileSync(path);
    expect(buf.subarray(0, 4).toString('ascii')).toBe('wOF2');
  });

  it('theme.css declares an Inter @font-face pointing at the local file', () => {
    const css = readFileSync(resolve(repoRoot, 'src/styles/theme.css'), 'utf8');
    expect(css).toMatch(/@font-face\s*\{[^}]*font-family:\s*['"]Inter['"]/);
    expect(css).toMatch(/InterVariable\.woff2/);
    expect(css).toMatch(/font-display:\s*swap/);
  });

  it('theme.css does NOT pull Inter from any external CDN', () => {
    const css = readFileSync(resolve(repoRoot, 'src/styles/theme.css'), 'utf8');
    expect(css).not.toMatch(/fonts\.googleapis\.com/);
    expect(css).not.toMatch(/fonts\.gstatic\.com/);
    expect(css).not.toMatch(/cdn\.jsdelivr\.net/);
    expect(css).not.toMatch(/rsms\.me/);
  });
});
