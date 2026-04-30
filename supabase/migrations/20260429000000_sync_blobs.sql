-- [SYNC-2] Cloud-sync blob storage.
--
-- One row per (user, domain, blob_id). `ciphertext` is the raw bytes
-- produced by src/lib/sync/envelope.ts: nonce(24) || ciphertext + tag(16).
-- Server CANNOT decrypt — masterKey lives client-side only. RLS pins
-- every row to its owner.

create table sync_blobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  domain text not null,
  blob_id text not null,
  ciphertext bytea not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, domain, blob_id)
);

alter table sync_blobs enable row level security;

create policy "users read own blobs"
  on sync_blobs for select using (auth.uid() = user_id);
create policy "users write own blobs"
  on sync_blobs for insert with check (auth.uid() = user_id);
create policy "users update own blobs"
  on sync_blobs for update using (auth.uid() = user_id);
create policy "users delete own blobs"
  on sync_blobs for delete using (auth.uid() = user_id);

-- Pull queries always filter on user_id + updated_at (since-cursor),
-- so this composite index serves both the WHERE filter and the
-- ORDER BY for the cursor advance.
create index sync_blobs_user_updated_idx on sync_blobs (user_id, updated_at);

-- Auto-bump updated_at on every UPDATE so the since-cursor in
-- sync-pull always sees the freshest version of a blob.
create or replace function sync_blobs_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sync_blobs_touch_updated_at_trg
  before update on sync_blobs
  for each row execute function sync_blobs_touch_updated_at();
