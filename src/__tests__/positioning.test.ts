import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Positioning regression — pins the non-encryption wedge as the headline.
 *
 * Per Wend+Alchohalt competitive research 2026-04-27 (see
 * docs/marketing/positioning.md): ZK / "cryptographically can't read it"
 * matters to ~5% of TAM as a proof-point, not a headline. Lead with calm,
 * no-gamification, real-crisis-resources — what 95% of users actually feel
 * in the first second of seeing the app.
 *
 * These tests assert the listed HERO surfaces don't lead with the
 * encryption wedge. Encryption phrasing remains allowed elsewhere
 * (onboarding Beat 3, Settings → About, paywall footer, legal pages).
 */

const REPO_ROOT = join(__dirname, '..', '..');
const FORBIDDEN_HERO_LEDE_PATTERNS = [
  /^[^.]*\bencrypted\b/i,
  /^[^.]*\bcryptographically\b/i,
  /^[^.]*\bzero[- ]knowledge\b/i,
  /^[^.]*\bZK\b/,
  /^[^.]*\byour data never leaves\b/i,
  /^[^.]*\bdata never leaves your (device|phone)\b/i,
];

function leadsWithEncryption(line: string): boolean {
  const trimmed = line.trim();
  return FORBIDDEN_HERO_LEDE_PATTERNS.some((p) => p.test(trimmed));
}

describe('non-encryption wedge — hero surfaces', () => {
  it('Today panel "starting" hero subcopy leads with calm, not encryption', () => {
    const src = readFileSync(
      join(REPO_ROOT, 'src/features/homepage/TodayPanel.tsx'),
      'utf-8',
    );
    const match = src.match(
      /const heroSubcopy[\s\S]*?status\.kind === 'starting'\s*\?\s*'([^']+)'/,
    );
    expect(match, 'could not locate starting-state hero subcopy').not.toBeNull();
    const subcopy = match![1];
    expect(leadsWithEncryption(subcopy)).toBe(false);
    // And the calm wedge actually shows up
    expect(subcopy.toLowerCase()).toMatch(/calm|leaderboard|help/);
  });

  it('SubscriptionManager paywall header leads with "more insights, same calm"', () => {
    const src = readFileSync(
      join(REPO_ROOT, 'src/features/subscription/SubscriptionManager.tsx'),
      'utf-8',
    );
    // The header has h2 + tagline. The tagline should be the lede after h2.
    const headerBlock = src.match(/<header[^>]*>([\s\S]*?)<\/header>/);
    expect(headerBlock).not.toBeNull();
    // First <p> in the header is the tagline (after the h2)
    const firstP = headerBlock![1].match(/<p[^>]*>\s*([\s\S]*?)\s*<\/p>/);
    expect(firstP).not.toBeNull();
    const lede = firstP![1].replace(/\s+/g, ' ').trim();
    expect(leadsWithEncryption(lede)).toBe(false);
    expect(lede.toLowerCase()).toMatch(/calm|insights|gamif/);
  });

  it('App Store description opener does not lead with encryption claim', () => {
    const desc = readFileSync(
      join(REPO_ROOT, 'docs/launch/app-store-description.md'),
      'utf-8',
    );
    // Find the search-snippet opener — the first quoted line after the heading
    const m = desc.match(/^>\s*(.+)$/m);
    expect(m, 'expected an App Store opener line marked with `>` blockquote').not.toBeNull();
    expect(leadsWithEncryption(m![1])).toBe(false);
  });

  it('manifest.webmanifest description follows MARKETING-1 (calm, not encryption)', () => {
    const manifest = JSON.parse(
      readFileSync(join(REPO_ROOT, 'public/manifest.webmanifest'), 'utf-8'),
    );
    const desc: string = manifest.description ?? '';
    expect(desc.length).toBeGreaterThan(0);
    expect(leadsWithEncryption(desc)).toBe(false);
    expect(desc.toLowerCase()).toMatch(/calm|leaderboard|crisis support/);
    // Old pre-MARKETING-1 phrasing should be gone
    expect(desc.toLowerCase()).not.toMatch(/100% on-device|offline-first/);
  });

  it('positioning.md exists and pins the wedge order', () => {
    const positioning = readFileSync(
      join(REPO_ROOT, 'docs/marketing/positioning.md'),
      'utf-8',
    );
    // Calm-no-gamification must appear before encryption in the wedge ordering
    const calmIdx = positioning.search(/no gamification/i);
    const encIdx = positioning.search(/cryptographically|encrypted/i);
    expect(calmIdx).toBeGreaterThanOrEqual(0);
    expect(encIdx).toBeGreaterThan(calmIdx);
  });
});
