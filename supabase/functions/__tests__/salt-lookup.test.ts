/**
 * [SYNC-3a] Salt-lookup edge function + migration shape tests.
 *
 * Static — pins the SQL invariants and edge-function shape the
 * security model depends on. Drops in a future migration / rewrite
 * fail the build.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '..', '..', '..');

describe('[SYNC-3a] migration: 20260430000000_user_salts.sql', () => {
  const sql = readFileSync(
    resolve(repoRoot, 'supabase/migrations/20260430000000_user_salts.sql'),
    'utf8',
  );

  it('declares the user_salts table keyed on email', () => {
    expect(sql).toMatch(/create table user_salts/);
    expect(sql).toMatch(/email text primary key/);
    expect(sql).toMatch(/salt bytea not null/);
    expect(sql).toMatch(/user_id uuid references auth\.users\(id\) on delete cascade/);
  });

  it('enables RLS', () => {
    expect(sql).toMatch(/alter table user_salts enable row level security/);
  });

  it('insert policy pins both auth.uid() AND auth.email()', () => {
    // The dual check stops a user A from inserting a salt for user
    // B's email by spoofing the email column.
    expect(sql).toMatch(/auth\.uid\(\) = user_id/);
    expect(sql).toMatch(/lower\(auth\.email\(\)\) = lower\(email\)/);
  });

  it('declares select / update policies pinned to auth.uid()', () => {
    expect(sql).toMatch(/for select.*auth\.uid\(\) = user_id/s);
    expect(sql).toMatch(/for update.*auth\.uid\(\) = user_id/s);
  });
});

describe('[SYNC-3a] salt-lookup edge function shape', () => {
  const src = readFileSync(
    resolve(repoRoot, 'supabase/functions/salt-lookup/index.ts'),
    'utf8',
  );

  it('GET-only with `email` query parameter', () => {
    expect(src).toMatch(/method !== 'GET'/);
    expect(src).toMatch(/searchParams\.get\(['"]email['"]\)/);
  });

  it('normalizes email to lowercase + trim before lookup', () => {
    expect(src).toMatch(/\.trim\(\)\.toLowerCase\(\)/);
  });

  it('uses service-role key (bypasses RLS for the pre-auth lookup)', () => {
    expect(src).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('refuses to operate without a SALT_LOOKUP_PEPPER (fails closed)', () => {
    expect(src).toMatch(/SALT_LOOKUP_PEPPER/);
    expect(src).toMatch(/server_misconfigured/);
  });

  it('does BOTH the DB lookup AND the HMAC in parallel — constant-time-ish', () => {
    expect(src).toMatch(/Promise\.all\s*\(/);
    expect(src).toMatch(/from\(['"]user_salts['"]\)/);
    expect(src).toMatch(/pepperedSalt/);
  });

  it('uses HMAC-SHA-256 with crypto.subtle for the fake salt', () => {
    expect(src).toMatch(/crypto\.subtle\.importKey/);
    expect(src).toMatch(/['"]HMAC['"]/);
    expect(src).toMatch(/['"]SHA-256['"]/);
  });

  it('returns 200 with a 16-byte salt (truncated from the HMAC output)', () => {
    expect(src).toMatch(/SALT_BYTES\s*=\s*16/);
    expect(src).toMatch(/\.subarray\(0,\s*SALT_BYTES\)/);
  });

  it('handles CORS preflight', () => {
    expect(src).toMatch(/method === 'OPTIONS'/);
  });
});
