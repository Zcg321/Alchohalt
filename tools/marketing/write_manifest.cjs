#!/usr/bin/env node
/**
 * [R10-E] After a successful capture run, scan the output directory and
 * write audit-walkthrough/store-screenshots/MANIFEST.md with each PNG's
 * size + sha256. Acts as the proof-of-capture committed to the repo —
 * the binaries themselves are too large to track in git, but the manifest
 * gives reviewers a way to verify a fresh capture matches.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..', 'audit-walkthrough', 'store-screenshots');

function sha256(file) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(file));
  return h.digest('hex');
}

function walk(dir, base = '') {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    const rel = base ? `${base}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      out.push(...walk(full, rel));
    } else if (ent.isFile() && ent.name.endsWith('.png')) {
      const stat = fs.statSync(full);
      out.push({ rel, size: stat.size, sha: sha256(full) });
    }
  }
  return out;
}

if (!fs.existsSync(ROOT)) {
  console.error(`No screenshots found at ${ROOT}. Run capture first.`);
  process.exit(1);
}

const files = walk(ROOT);
files.sort((a, b) => a.rel.localeCompare(b.rel));

const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
const lines = [];
lines.push('# Store screenshot capture — manifest');
lines.push('');
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push('');
lines.push(`- **Files:** ${files.length}`);
lines.push(`- **Total bytes:** ${totalBytes.toLocaleString()} (${(totalBytes / 1024 / 1024).toFixed(1)} MB)`);
lines.push('');
lines.push('## Why a manifest, not the binaries');
lines.push('');
lines.push(
  '40+ MB of PNGs would triple the repo footprint without earning their keep —'
);
lines.push(
  'they regenerate deterministically from the same seed via'
);
lines.push('`tools/marketing/capture_store_screenshots.ts`. The manifest gives a');
lines.push('reviewer a way to verify a fresh capture matches an audited one:');
lines.push('');
lines.push('```sh');
lines.push('npm run build');
lines.push('npx vite preview --port 4173 &');
lines.push('npx tsx tools/marketing/capture_store_screenshots.ts');
lines.push('node tools/marketing/write_manifest.cjs');
lines.push('git diff audit-walkthrough/store-screenshots/MANIFEST.md');
lines.push('```');
lines.push('');
lines.push('## Files');
lines.push('');
lines.push('| Path | Size (bytes) | SHA-256 |');
lines.push('| --- | ---: | --- |');
for (const f of files) {
  lines.push(`| \`${f.rel}\` | ${f.size.toLocaleString()} | \`${f.sha.slice(0, 16)}…\` |`);
}

const out = path.join(ROOT, 'MANIFEST.md');
fs.writeFileSync(out, lines.join('\n'), 'utf8');
console.log(`Wrote ${out} (${files.length} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MB total)`);
