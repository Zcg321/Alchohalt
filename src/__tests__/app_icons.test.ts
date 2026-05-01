import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '..', '..');

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ICO_MAGIC = Buffer.from([0x00, 0x00, 0x01, 0x00]);

function readPngDimensions(path: string): { width: number; height: number } {
  const buf = readFileSync(path);
  expect(buf.subarray(0, 8).equals(PNG_MAGIC)).toBe(true);
  // PNG IHDR width/height are big-endian uint32 at bytes 16..23
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

const icons = [
  { name: 'icon-1024.png', size: 1024 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-180.png', size: 180 },
  { name: 'icon-rounded-1024.png', size: 1024 },
  { name: 'maskable-512.png', size: 512 },
];

describe('app icon set', () => {
  it.each(icons)('$name exists, has valid PNG magic, and is $size×$size', ({ name, size }) => {
    const p = join(REPO_ROOT, 'public', 'icons', name);
    expect(existsSync(p), `${name} missing`).toBe(true);
    const stat = statSync(p);
    expect(stat.size, `${name} suspiciously small (${stat.size} bytes)`).toBeGreaterThan(500);
    const { width, height } = readPngDimensions(p);
    expect(width).toBe(size);
    expect(height).toBe(size);
  });

  it('favicon.ico exists with valid ICO magic and embeds multiple sizes', () => {
    const p = join(REPO_ROOT, 'public', 'favicon.ico');
    expect(existsSync(p)).toBe(true);
    const buf = readFileSync(p);
    expect(buf.subarray(0, 4).equals(ICO_MAGIC)).toBe(true);
    // ICONDIR header byte 4..5 = number of images
    const numImages = buf.readUInt16LE(4);
    expect(numImages, 'favicon.ico should embed multiple resolutions').toBeGreaterThanOrEqual(2);
  });

  it('manifest.webmanifest references the new icon set', () => {
    const manifest = JSON.parse(
      readFileSync(join(REPO_ROOT, 'public', 'manifest.webmanifest'), 'utf-8'),
    );
    const srcs = (manifest.icons as Array<{ src: string }>).map((i) => i.src);
    expect(srcs).toContain('/icons/icon-192.png');
    expect(srcs).toContain('/icons/icon-512.png');
    expect(srcs).toContain('/icons/icon-1024.png');
    expect(srcs).toContain('/icons/maskable-512.png');
  });

  it('index.html references favicon.ico and apple-touch-icon at 180', () => {
    const html = readFileSync(join(REPO_ROOT, 'index.html'), 'utf-8');
    expect(html).toMatch(/href=["']\/favicon\.ico["']/);
    expect(html).toMatch(/apple-touch-icon[^>]*\/icons\/icon-180\.png/);
  });
});
