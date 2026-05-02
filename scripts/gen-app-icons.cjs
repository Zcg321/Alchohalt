#!/usr/bin/env node
/**
 * [R7-A2] Render the brand SVG into platform-specific PNG sets.
 *
 * Run from repo root:
 *   node scripts/gen-app-icons.cjs
 *
 * Inputs:
 *   public/branding/icon-source/alchohalt-icon.svg       (full-bleed)
 *   public/branding/icon-source/alchohalt-foreground.svg (Android FG)
 *
 * Outputs:
 *   ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png (1024)
 *   android/app/src/main/res/mipmap-{m,h,x,xx,xxx}dpi/ic_launcher{,_round,_foreground}.png
 *   public/pwa-{192,512}x{192,512}.png
 *   public/icons/icon-{192,512}.png (for any legacy PWA references)
 *
 * sharp is the only runtime dep. Install once:
 *   npm install --save-dev --no-save sharp
 *
 * The Android adaptive-icon background is a flat sage swatch defined in
 * android/app/src/main/res/values/ic_launcher_background.xml; this
 * script does NOT touch that file.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SRC_FULL = path.join(ROOT, 'public/branding/icon-source/alchohalt-icon.svg');
const SRC_FG = path.join(ROOT, 'public/branding/icon-source/alchohalt-foreground.svg');

const FULL = fs.readFileSync(SRC_FULL);
const FG = fs.readFileSync(SRC_FG);

/** Make a directory (recursive, no error if exists). */
function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

/** Render an SVG buffer to a PNG of the given square size. */
async function render(svg, size, outPath) {
  mkdirp(path.dirname(outPath));
  await sharp(svg, { density: Math.max(72, Math.ceil(size / 14.22)) })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  const bytes = fs.statSync(outPath).size;
  console.log(`  ${size}x${size}  ${path.relative(ROOT, outPath)}  (${bytes} B)`);
}

const ANDROID_DENSITIES = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

// Android adaptive-icon foreground layer is rendered at 108dp and the
// OS crops the outer 33dp ring. We render the foreground SVG (which
// already insets to the 66% safe area) at the launcher density so the
// stroke lands cleanly inside the OS-applied mask.
const ANDROID_FG_SIZES = ANDROID_DENSITIES.map((d) => ({ ...d, size: Math.round(d.size * (108 / 48)) }));

async function main() {
  console.log('[gen-app-icons] iOS:');
  await render(
    FULL,
    1024,
    path.join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'),
  );

  console.log('[gen-app-icons] Android launcher (full-bleed legacy):');
  for (const { dir, size } of ANDROID_DENSITIES) {
    const out = path.join(ROOT, `android/app/src/main/res/${dir}/ic_launcher.png`);
    await render(FULL, size, out);
    const round = path.join(ROOT, `android/app/src/main/res/${dir}/ic_launcher_round.png`);
    await render(FULL, size, round);
  }

  console.log('[gen-app-icons] Android adaptive foreground:');
  for (const { dir, size } of ANDROID_FG_SIZES) {
    const out = path.join(ROOT, `android/app/src/main/res/${dir}/ic_launcher_foreground.png`);
    await render(FG, size, out);
  }

  console.log('[gen-app-icons] PWA / web:');
  await render(FULL, 192, path.join(ROOT, 'public/pwa-192x192.png'));
  await render(FULL, 512, path.join(ROOT, 'public/pwa-512x512.png'));
  await render(FULL, 192, path.join(ROOT, 'public/icons/icon-192.png'));
  await render(FULL, 512, path.join(ROOT, 'public/icons/icon-512.png'));

  console.log('[gen-app-icons] done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
