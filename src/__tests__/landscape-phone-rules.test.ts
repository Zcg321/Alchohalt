import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * [R22-B] Regression guard for landscape-phone CSS rules.
 *
 * R22 added an `@media (orientation: landscape) and (max-height: 500px)`
 * block to src/index.css that compresses the bottom-nav and the Home-tab
 * hero so the app stays usable when held sideways on a 320-393px-tall
 * phone. The rule is easy to lose track of in a future Tailwind refactor;
 * this test asserts the block is present and constrains the right
 * targets.
 */

const cssPath = path.join(__dirname, '..', 'index.css');
const css = fs.readFileSync(cssPath, 'utf8');

describe('landscape-phone CSS rules', () => {
  it('declares the landscape+max-height media query', () => {
    expect(css).toContain('@media (orientation: landscape) and (max-height: 500px)');
  });

  it('compresses the mobile bottom-nav buttons', () => {
    const block = extractBlock(css, '@media (orientation: landscape) and (max-height: 500px)');
    expect(block).toContain('nav[aria-label="Primary (mobile)"]');
    expect(block).toMatch(/padding-top:\s*0\.25rem/);
    expect(block).toMatch(/padding-bottom:\s*0\.25rem/);
  });

  it('preserves the 44pt touch-target minimum', () => {
    const block = extractBlock(css, '@media (orientation: landscape) and (max-height: 500px)');
    expect(block).toMatch(/min-height:\s*44px/);
  });

  it('caps modal max-height in dvh so the keyboard does not push the submit off-screen', () => {
    const block = extractBlock(css, '@media (orientation: landscape) and (max-height: 500px)');
    expect(block).toContain('[role="dialog"]');
    expect(block).toMatch(/max-height:\s*92dvh/);
  });

  it('compresses the Home-tab hero day number', () => {
    const block = extractBlock(css, '@media (orientation: landscape) and (max-height: 500px)');
    expect(block).toContain('[data-testid="hero-day-number"]');
  });
});

/** Extract everything between the opening `{` of `header` and its
 *  matching closing `}`. Handles nested braces inside the block. */
function extractBlock(text: string, header: string): string {
  const start = text.indexOf(header);
  if (start < 0) throw new Error(`block not found: ${header}`);
  const open = text.indexOf('{', start);
  if (open < 0) throw new Error(`opening brace not found after: ${header}`);
  let depth = 1;
  let i = open + 1;
  while (i < text.length && depth > 0) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  return text.slice(open + 1, i - 1);
}
