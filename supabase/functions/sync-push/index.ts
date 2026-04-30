// [SYNC-2] sync-push edge function.
//
// POST  body: { blobs: [{ domain, blob_id, ciphertext_b64 }, ...] }
// Auth: required — the function reads `Authorization: Bearer <JWT>`,
//       lets supabase-js resolve it to auth.uid(), and lets RLS
//       guarantee every row is keyed on that uid.
//
// Behavior: upserts each row keyed on (user_id, domain, blob_id).
//           updated_at bumps server-side via the SQL trigger
//           sync_blobs_touch_updated_at_trg. Returns the count of
//           accepted rows + a list of per-row rejection reasons.
//
// Constraints:
//   - 1000 blobs per request hard cap (DoS guard)
//   - 1 MiB per ciphertext (rejected with reason "too_large")
//
// Runtime: Deno (Supabase Edge Runtime). Imports use full URLs.

// @ts-nocheck — Deno runtime types diverge from the project's tsc.
//                The function compiles + runs under `supabase functions
//                serve`; type-check via `deno check`.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

const MAX_BLOBS_PER_REQUEST = 1000;
const MAX_CIPHERTEXT_BYTES = 1024 * 1024; // 1 MiB

interface IncomingBlob {
  domain: string;
  blob_id: string;
  ciphertext_b64: string;
}

interface PushResponse {
  accepted: number;
  rejected: { domain: string; blob_id: string; reason: string }[];
}

function badRequest(reason: string): Response {
  return new Response(JSON.stringify({ error: reason }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function decodeB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return badRequest('POST required');
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return unauthorized();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return unauthorized();
  const userId = userData.user.id;

  let body: { blobs?: IncomingBlob[] };
  try {
    body = await req.json();
  } catch {
    return badRequest('invalid JSON');
  }
  if (!Array.isArray(body?.blobs)) return badRequest('blobs[] required');
  if (body.blobs.length === 0) {
    const empty: PushResponse = { accepted: 0, rejected: [] };
    return new Response(JSON.stringify(empty), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (body.blobs.length > MAX_BLOBS_PER_REQUEST) {
    return badRequest(`too many blobs (max ${MAX_BLOBS_PER_REQUEST})`);
  }

  const rejected: PushResponse['rejected'] = [];
  const rows: { user_id: string; domain: string; blob_id: string; ciphertext: Uint8Array }[] = [];

  for (const b of body.blobs) {
    if (!b || typeof b.domain !== 'string' || typeof b.blob_id !== 'string') {
      rejected.push({
        domain: String(b?.domain ?? ''),
        blob_id: String(b?.blob_id ?? ''),
        reason: 'malformed',
      });
      continue;
    }
    let ciphertext: Uint8Array;
    try {
      ciphertext = decodeB64(b.ciphertext_b64);
    } catch {
      rejected.push({ domain: b.domain, blob_id: b.blob_id, reason: 'bad_base64' });
      continue;
    }
    if (ciphertext.byteLength > MAX_CIPHERTEXT_BYTES) {
      rejected.push({ domain: b.domain, blob_id: b.blob_id, reason: 'too_large' });
      continue;
    }
    rows.push({ user_id: userId, domain: b.domain, blob_id: b.blob_id, ciphertext });
  }

  let accepted = 0;
  if (rows.length > 0) {
    const { error: upsertErr, count } = await supabase
      .from('sync_blobs')
      .upsert(rows, { onConflict: 'user_id,domain,blob_id', count: 'exact' });
    if (upsertErr) {
      // Treat the whole batch as failed but report the reason once.
      for (const r of rows) {
        rejected.push({
          domain: r.domain,
          blob_id: r.blob_id,
          reason: `db_error: ${upsertErr.message}`,
        });
      }
    } else {
      accepted = count ?? rows.length;
    }
  }

  const resp: PushResponse = { accepted, rejected };
  return new Response(JSON.stringify(resp), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
