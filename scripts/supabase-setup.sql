-- TECHSTORESys — Supabase cloud backup table
-- Run once in Supabase Dashboard → SQL Editor for your project.

create table if not exists public.techstores_snapshots (
  id uuid primary key default gen_random_uuid(),
  machine_id text not null,
  save_revision bigint not null,
  saved_at timestamptz not null,
  saved_by text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_techstores_snapshots_revision
  on public.techstores_snapshots (save_revision desc, saved_at desc);

alter table public.techstores_snapshots enable row level security;

-- The Python server uses the service role key (server-side only).
-- Do not put the service role key in the browser or commit it to git.
