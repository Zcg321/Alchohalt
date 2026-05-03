/**
 * [R20-D] Pin the /.well-known/security.txt contract per RFC 9116.
 *
 *   - The file exists at the canonical path public/.well-known/security.txt
 *   - Contact: line is present and non-empty
 *   - Expires: line is present and parses to a future date
 *   - Preferred-Languages: line is present
 *   - The Expires field is at least 30 days out (so we don't ship
 *     a near-stale file that auto-fails RFC 9116 validators)
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '..', '..');
const SECURITY_TXT = join(REPO_ROOT, 'public', '.well-known', 'security.txt');

describe('[R20-D] /.well-known/security.txt (RFC 9116)', () => {
  const content = readFileSync(SECURITY_TXT, 'utf-8');

  it('declares a non-empty Contact field', () => {
    const match = content.match(/^Contact:\s*(.+)$/m);
    expect(match, 'Contact: line missing').not.toBeNull();
    expect(match![1]!.trim().length).toBeGreaterThan(0);
  });

  it('declares an Expires field that parses and is in the future', () => {
    const match = content.match(/^Expires:\s*(.+)$/m);
    expect(match, 'Expires: line missing').not.toBeNull();
    const expiry = new Date(match![1]!.trim());
    expect(Number.isNaN(expiry.getTime()), 'Expires: did not parse as a date').toBe(false);
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });

  it('Expires is at least 30 days out (avoids near-stale ship)', () => {
    const match = content.match(/^Expires:\s*(.+)$/m);
    const expiry = new Date(match![1]!.trim()).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(expiry - Date.now()).toBeGreaterThan(thirtyDaysMs);
  });

  it('declares Preferred-Languages', () => {
    expect(content).toMatch(/^Preferred-Languages:\s*\w+/m);
  });

  it('points to a Policy URL', () => {
    expect(content).toMatch(/^Policy:\s*https?:\/\//m);
  });
});
