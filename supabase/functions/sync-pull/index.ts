// [SYNC-2] sync-pull edge function.
//
// GET ?since=<iso8601>
// Auth: required — JWT resolved via supabase.auth.getUser(); RLS
//       restricts the SELECT to auth.uid() = user_id.
//
// Behavior: returns rows with updated_at > since, ordered by
//           updated_at ASC, capped at 1000 rows per call. The
//           response includes `next_cursor` (the largest updated_at
//           seen, or null if the result set fit in one page) so the
//           client can drive pagination loops.
//
// Runtime: Deno (Supabase Edge Runtime).

// @ts-nocheck — see sync-push/index.ts for rationale.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

const PAGE_SIZE = 1000;

interface PullRow {
  domain: string;
  blob_id: string;
  ciphertext_b64: string;
  updated_at: string;
  created_at: string;
}

interface PullResponse {
  blobs: PullRow[];
  next_cursor: string | null;
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

function encodeB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/** Supabase returns bytea as either `\x...` hex (Postgres default) or
 *  base64 depending on client config. Normalize to Uint8Array. */
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
    // Otherwise assume base64.
    const bin = atob(value);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  if (Array.isArray(value)) return new Uint8Array(value);
  // Buffer-like
  return new Uint8Array(value as ArrayBufferLike);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== 'GET') {
    return badRequest('GET required');
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return unauthorized();

  const url = new URL(req.url);
  const sinceParam = url.searchParams.get('since');
  const since = sinceParam && !Number.isNaN(Date.parse(sinceParam))
    ? new Date(sinceParam).toISOString()
    : new Date(0).toISOString();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return unauthorized();

  // RLS guarantees `user_id = auth.uid()` so we don't add it to the
  // filter explicitly — keeping the WHERE small lets the
  // sync_blobs_user_updated_idx serve the query directly.
  const { data, error } = await supabase
    .from('sync_blobs')
    .select('domain, blob_id, ciphertext, updated_at, created_at')
    .gt('updated_at', since)
    .order('updated_at', { ascending: true })
    .limit(PAGE_SIZE);

  if (error) {
    return new Response(
      JSON.stringify({ error: `db_error: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  const rows: PullRow[] = (data ?? []).map((r) => ({
    domain: r.domain,
    blob_id: r.blob_id,
    ciphertext_b64: encodeB64(bytesFromBytea(r.ciphertext)),
    updated_at: r.updated_at,
    created_at: r.created_at,
  }));

  // If we filled the page, the caller should keep pulling — surface
  // the cursor for the next call. If we got fewer than PAGE_SIZE rows
  // we're caught up; cursor=null tells the client to stop.
  const next_cursor =
    rows.length === PAGE_SIZE ? rows[rows.length - 1]!.updated_at : null;

  const resp: PullResponse = { blobs: rows, next_cursor };
  return new Response(JSON.stringify(resp), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
