-- [SYNC-3a] Multi-device sign-in salt lookup.
--
-- The userSalt is generated on the FIRST device at signup. Other
-- devices need it before they can derive the same authHash from the
-- user's passphrase, so we have to expose a pre-auth lookup. This
-- table stores the (email -> salt) mapping; the salt-lookup edge
-- function reads it with the service role and falls back to a
-- pepper-derived deterministic salt when the email isn't found
-- (enumeration resistance — every response shape + size + cost
-- looks the same).
--
-- Why a separate table instead of auth.users.raw_user_meta_data:
--   - cleaner RLS story (owner write / nobody else read; the function
--     uses service_role to bypass for lookups),
--   - decouples the salt from Supabase Auth internals so a future
--     auth-provider swap doesn't lose user salts,
--   - the email column is normalized lowercase here so casing
--     differences don't produce spurious "no salt" responses.

create table user_salts (
  email text primary key,
  salt bytea not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

alter table user_salts enable row level security;

-- Owner can write (insert/update) their own row at signup.
create policy "users insert own salt"
  on user_salts for insert
  with check (auth.uid() = user_id and lower(auth.email()) = lower(email));

create policy "users update own salt"
  on user_salts for update
  using (auth.uid() = user_id);

-- Owner can read their own row. Anonymous reads are blocked at the
-- RLS layer; the salt-lookup edge function uses service_role to
-- bypass for the pre-auth lookup.
create policy "users read own salt"
  on user_salts for select
  using (auth.uid() = user_id);

-- Index for the lookup-by-email path the edge function takes. Email
-- is the primary key so this is technically redundant, but spelled
-- out for clarity.
-- (no extra index needed — primary key already covers it)
