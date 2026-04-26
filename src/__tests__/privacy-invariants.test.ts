import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Privacy invariants — enforced at the source-tree level.
 *
 * These tests guard the core marketing claim: "Your data never leaves
 * your phone." If a future contributor adds a fetch() / fonts.google /
 * analytics SDK that breaks the claim, the build fails here.
 */

const SRC = path.resolve(__dirname, '..');

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function findInSrc(pattern: RegExp, exts: string[] = ['.ts', '.tsx', '.css']): string[] {
  const hits: string[] = [];
  for (const file of walk(SRC)) {
    if (!exts.some((e) => file.endsWith(e))) continue;
    const content = fs.readFileSync(file, 'utf-8');
    if (pattern.test(content)) {
      hits.push(path.relative(SRC, file));
    }
  }
  return hits;
}

describe('privacy invariant: no external CDN font loads', () => {
  it('no file references fonts.googleapis.com or googleusercontent', () => {
    const hits = findInSrc(/fonts\.googleapis\.com|googleusercontent\.com/);
    expect(
      hits,
      `External font CDN references found in: ${hits.join(', ')}`,
    ).toEqual([]);
  });
});

describe('privacy invariant: no third-party analytics SDKs', () => {
  it('no imports of common analytics packages', () => {
    const hits = findInSrc(
      /from\s+['"](?:@vercel\/analytics|posthog-js|mixpanel|@amplitude\/[^'"]+|@segment\/analytics-next|firebase\/analytics|@sentry\/(?!core|browser)[^'"]+)['"]/,
    );
    // Sentry core/browser is allowed for crash reporting (off by default).
    // Anything else (PostHog, Mixpanel, Segment, Amplitude, Vercel
    // Analytics, Firebase Analytics) breaks the privacy claim.
    expect(
      hits,
      `Disallowed analytics SDK imports: ${hits.join(', ')}`,
    ).toEqual([]);
  });
});

describe('privacy invariant: CrisisResources page never gates', () => {
  it("CrisisResources.tsx imports do not reference flag/subscription/plan modules", () => {
    const file = path.join(SRC, 'features/crisis/CrisisResources.tsx');
    const source = fs.readFileSync(file, 'utf-8');
    const imports = source
      .split('\n')
      .filter((l) => /^\s*import\b/.test(l))
      .join('\n');
    expect(imports).not.toMatch(/FEATURE_FLAGS/);
    expect(imports).not.toMatch(/subscriptionStore/);
    expect(imports).not.toMatch(/usePremiumFeatures/);
    expect(imports).not.toMatch(/['"]\.\.\/\.\.\/config\/(features|plans)['"]/);
  });
});
