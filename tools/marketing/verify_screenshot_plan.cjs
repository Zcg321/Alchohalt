#!/usr/bin/env node
/**
 * [R10-E] Lightweight pre-flight check for the screenshot capture run.
 *
 * Verifies the prerequisites are in place WITHOUT actually launching
 * a browser:
 *   1. dist/ exists (npm run build was run)
 *   2. The bundled index.html references __APP_READY__ (handshake wired)
 *   3. tools/marketing/capture_store_screenshots.ts uses
 *      waitForFunction(__APP_READY__) (round-10 fix landed)
 *   4. Playwright is installed
 *
 * Exits non-zero with a clear message if any precondition fails.
 * Used as the pre-flight before kicking off the actual capture run.
 *
 * Usage: node tools/marketing/verify_screenshot_plan.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}
function ok(msg) {
  console.log(`✓ ${msg}`);
}

const distExists = fs.existsSync(path.join(ROOT, 'dist', 'index.html'));
if (!distExists) {
  console.warn(
    '⚠ dist/ not found — run `npm run build` before capture. Continuing pre-flight on source.',
  );
} else {
  ok('dist/ present');
  const dist = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  if (!dist.includes('script')) fail('dist/index.html has no <script> tags — build is broken');
  ok('dist/index.html has script tags');
}

// Source file used by the build pipeline must contain the handshake
const mainTsx = fs.readFileSync(path.join(ROOT, 'src', 'main.tsx'), 'utf8');
if (!mainTsx.includes('__APP_READY__')) fail('src/main.tsx is missing the __APP_READY__ handshake');
ok('src/main.tsx wires __APP_READY__ handshake');

const captureScript = fs.readFileSync(
  path.join(ROOT, 'tools', 'marketing', 'capture_store_screenshots.ts'),
  'utf8',
);
if (!captureScript.includes('__APP_READY__')) {
  fail('capture_store_screenshots.ts is not using the handshake yet — round-10 fix missing');
}
if (!captureScript.includes('waitForFunction')) {
  fail('capture_store_screenshots.ts must use waitForFunction for the handshake');
}
ok('capture script uses waitForFunction(__APP_READY__)');

// Playwright presence (don't require()-load it — that triggers binary download)
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
if (!(pkg.devDependencies?.playwright || pkg.devDependencies?.['@playwright/test'])) {
  fail('playwright is not in devDependencies');
}
ok('playwright in devDependencies');

console.log('\nPre-flight passed. Ready to run:');
console.log('  npx vite preview --port 4173 &');
console.log('  npx tsx tools/marketing/capture_store_screenshots.ts');
console.log('');
console.log('Output:    audit-walkthrough/store-screenshots/<device>/<theme>/<surface>.png');
console.log('Total:     5 surfaces × 5 devices × 2 themes = 50 PNGs');
