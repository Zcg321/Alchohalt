/**
 * [R20-C] Regression: bundle entries in dist/index.html carry SRI
 * (integrity="sha384-...") and the hashes match the actual file bytes.
 *
 * Skips if dist/ doesn't exist — local dev tests run before a build,
 * and the test exists primarily to catch SRI plugin regressions in
 * CI. CI runs `npm run build` before `npm run test:bundle-sri` (via
 * the bundle-budget gate that already runs after build).
 *
 * Verifies:
 *   - every <script src="/assets/...js"> and <link rel="stylesheet"
 *     href="/assets/...css"> in dist/index.html has integrity=
 *   - every modulepreload link has integrity= (preloads MUST match
 *     SRI of the eventual fetch, otherwise the preload is dropped
 *     by the UA)
 *   - each integrity hash is the correct sha384 of the file's bytes
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const REPO_ROOT = join(__dirname, '..', '..');
const DIST = join(REPO_ROOT, 'dist');
const distExists = existsSync(join(DIST, 'index.html'));

const describeIfBuilt = distExists ? describe : describe.skip;

describeIfBuilt('[R20-C] Subresource Integrity on bundle entries', () => {
  const html = distExists ? readFileSync(join(DIST, 'index.html'), 'utf-8') : '';

  /* Match every <script src="/assets/X.js" ...>, <link rel="stylesheet"
   * href="/assets/X.css" ...>, and <link rel="modulepreload"
   * href="/assets/X.js" ...>. */
  const tagRe =
    /<(?:script|link)\b[^>]*?(?:src|href)=["'](\/assets\/[^"']+)["'][^>]*?>/g;

  it('every same-origin /assets/ script and link carries integrity=', () => {
    const matches = [...html.matchAll(tagRe)];
    expect(matches.length, 'no script/link tags found in dist/index.html').toBeGreaterThan(0);

    for (const m of matches) {
      const tag = m[0];
      expect(tag, `tag missing integrity: ${tag}`).toMatch(/\bintegrity="sha384-[A-Za-z0-9+/=]+"/);
    }
  });

  it('each integrity hash matches the actual file bytes (sha384)', () => {
    const matches = [...html.matchAll(tagRe)];
    for (const m of matches) {
      const assetPath = m[1]!;          // "/assets/foo.js"
      const tag = m[0];
      const integrityMatch = tag.match(/\bintegrity="sha384-([A-Za-z0-9+/=]+)"/);
      expect(integrityMatch, `tag missing sha384 integrity: ${tag}`).not.toBeNull();
      const claimedHash = integrityMatch![1]!;

      const filePath = join(DIST, assetPath.replace(/^\//, ''));
      const bytes = readFileSync(filePath);
      const actualHash = createHash('sha384').update(bytes).digest('base64');

      expect(actualHash, `SRI mismatch for ${assetPath}`).toBe(claimedHash);
    }
  });

  it('does not place integrity= on cross-origin URLs (CORS would break it)', () => {
    /* Anything not under /assets/ is either same-origin static
     * (icons, manifest) or cross-origin. We don't SRI-mark non-
     * /assets paths because they may be served without CORS
     * Cross-Origin headers, which would block the integrity check
     * altogether. The plugin's regex only targets /assets/ paths. */
    const externalScript = html.match(
      /<script\b[^>]*?src=["']https?:\/\/[^"']+["'][^>]*?integrity=/,
    );
    expect(externalScript).toBeNull();
  });
});
