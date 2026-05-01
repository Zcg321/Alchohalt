// [SYNC-3a] salt-lookup edge function.
//
// GET ?email=<email>  → 200 { salt: <base64> }
//
// Pre-auth lookup. Used by the multi-device sign-in flow on the
// client: the user types their email + passphrase; the client calls
// this function to fetch the salt that was minted on the FIRST device
// at signup, then re-derives the same authHash + masterKey locally
// and signs in to Supabase Auth with the matching authHash.
//
// Enumeration resistance posture
// ──────────────────────────────
// An unauthenticated endpoint that returns "yes/no this email is on
// the platform" would let anyone enumerate the user base. So this
// function NEVER returns a "no such user" status:
//
//   - If the email exists in `user_salts`, return its real salt.
//   - If it does NOT exist, return a deterministic FAKE salt computed
//     as HMAC-SHA256(SALT_LOOKUP_PEPPER, email)[:16]. The pepper is
//     a server secret; the client cannot tell a real salt apart from
//     a peppered one without a sign-in attempt that subsequently
//     fails on the auth layer.
//   - Either path performs one round of HMAC + one DB read attempt,
//     so latency + payload size are constant within ~1 ms variance
//     (exact constant-time is impossible in a JS runtime; we get
//     "indistinguishable to a remote observer over the network").
//
// The pepper does NOT need to be the master server secret — it is a
// 32+ byte random string set in Supabase's function env. Rotating it
// changes the fake salts for non-existent emails (harmless: those
// emails would still fail sign-in either way).
//
// Runtime: Deno (Supabase Edge Runtime).

// @ts-nocheck — Deno runtime types diverge from project tsc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

const SALT_BYTES = 16;

function badRequest(reason: string): Response {
  return new Response(JSON.stringify({ error: reason }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function encodeB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function bytesFromBytea(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (typeof value === 'string') {
    if (value.startsWith('\\x')) {
      const hex = value.slice(2);
      const out = new Uint8Array(hex.length / 2);
      for (let i = 0; i < out.length; i++) {
        out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      }
      return out;
    }
    const bin = atob(value);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(value as ArrayBufferLike);
}

async function pepperedSalt(pepper: string, email: string): Promise<Uint8Array> {
  // HMAC-SHA-256(pepper, email)[:16] — Web Crypto, available in Deno.
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(email));
  return new Uint8Array(sig).subarray(0, SALT_BYTES);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== 'GET') {
    return badRequest('GET required');
  }

  const url = new URL(req.url);
  const rawEmail = url.searchParams.get('email');
  if (!rawEmail || !rawEmail.includes('@')) {
    return badRequest('email required');
  }
  const email = rawEmail.trim().toLowerCase();

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const PEPPER = Deno.env.get('SALT_LOOKUP_PEPPER') ?? '';
  if (!PEPPER || PEPPER.length < 16) {
    // Fail closed — refuse to operate without a pepper rather than
    // leak that emails are or aren't on the platform.
    return new Response(
      JSON.stringify({ error: 'server_misconfigured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // Always do BOTH the DB lookup AND the HMAC, regardless of which
  // we ultimately return. This keeps latency between real and fake
  // paths within a few hundred microseconds — indistinguishable to
  // a remote observer over typical mobile RTTs.
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const [dbResult, fakeSalt] = await Promise.all([
    supabase.from('user_salts').select('salt').eq('email', email).maybeSingle(),
    pepperedSalt(PEPPER, email),
  ]);

  let saltBytes: Uint8Array;
  if (dbResult.data?.salt) {
    saltBytes = bytesFromBytea(dbResult.data.salt);
  } else {
    saltBytes = fakeSalt;
  }

  return new Response(JSON.stringify({ salt: encodeB64(saltBytes) }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
