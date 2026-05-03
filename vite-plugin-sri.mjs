/**
 * [R20-C] Subresource Integrity plugin.
 *
 * Adds `integrity="sha384-..."` to every <script src="..."> and
 * <link href="..."> in the emitted index.html for same-origin /assets/
 * paths, with the hash computed from the actual disk bytes (not
 * `chunk.code`, because Vite injects __vite__mapDeps AFTER
 * transformIndexHtml — chunk.code at that hook does NOT match the
 * eventual disk bytes for the entry chunk).
 *
 * The plugin reads disk in `closeBundle` (after all writes finish)
 * and rewrites dist/index.html in place. modulepreload links MUST
 * carry SRI too, otherwise the browser silently drops the preload
 * when the eventual fetch's integrity wouldn't match an absent
 * preload-time integrity.
 *
 * Why hand-rolled instead of `vite-plugin-sri`:
 *   - Zero new transitive deps. The plugin is ~50 lines.
 *   - We control the algorithm pin. SHA-384 is the spec
 *     recommendation; the third-party plugin defaults to sha256
 *     for some configurations.
 *
 * The hashes are recomputed on every build, so cache busting is
 * automatic — when a chunk changes content, both its filename hash
 * AND its integrity hash change in the new index.html.
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, posix } from 'node:path';

function walkAssets(dir) {
  const out = new Map();
  function walk(p, rel) {
    for (const entry of readdirSync(p)) {
      const sub = join(p, entry);
      const subRel = posix.join(rel, entry);
      if (statSync(sub).isDirectory()) {
        walk(sub, subRel);
      } else {
        out.set(subRel, sub);
      }
    }
  }
  walk(dir, '');
  return out;
}

export default function sriPlugin() {
  let outDir = 'dist';
  return {
    name: 'vite-plugin-sri-r20',
    enforce: 'post',
    apply: 'build',
    configResolved(cfg) {
      outDir = cfg.build?.outDir ?? 'dist';
    },
    closeBundle() {
      const distDir = outDir;
      const indexPath = join(distDir, 'index.html');
      let html;
      try {
        html = readFileSync(indexPath, 'utf-8');
      } catch {
        return; /* No index.html (library mode); skip. */
      }

      /* Build a map: relative-path → sha384 hash, computed from
       * the bytes actually on disk after Vite finished writing. */
      const assetsDir = join(distDir, 'assets');
      const integrities = new Map();
      try {
        const files = walkAssets(assetsDir);
        for (const [rel, abs] of files) {
          const bytes = readFileSync(abs);
          integrities.set(`assets/${rel}`, `sha384-${createHash('sha384').update(bytes).digest('base64')}`);
        }
      } catch {
        return; /* No assets dir; nothing to SRI-mark. */
      }

      /* Patch <script src="/assets/foo.js"> and <link href="/assets/foo.css">.
       * Conservative regex: only same-origin /assets/ paths, never
       * external URLs (CORS would have to be set right or SRI breaks). */
      const patched = html.replace(
        /(<(?:script|link)\b[^>]*?(?:src|href)=["'])\/(assets\/[^"'>]+)(["'][^>]*?>)/g,
        (match, opening, assetPath, closing) => {
          if (closing.includes('integrity=')) return match;
          const hash = integrities.get(assetPath);
          if (!hash) return match;
          return `${opening}/${assetPath}${closing.replace(/>$/, ` integrity="${hash}">`)}`;
        },
      );

      if (patched !== html) {
        writeFileSync(indexPath, patched, 'utf-8');
      }
    },
  };
}
