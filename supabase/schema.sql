-- Tough Tech Map · Europe — Supabase schema
-- Run this FIRST in the Supabase SQL editor, then run seed.sql.

create extension if not exists "pgcrypto";

create table if not exists public.facilities (
  id text primary key default ('X-' || substr(gen_random_uuid()::text, 1, 8)),
  name text not null,
  org text not null,
  type text not null,
  cc text not null,
  city text not null,
  lat double precision not null,
  lng double precision not null,
  sectors text[] not null default '{}',
  capabilities text[] not null default '{}',
  access text not null default 'Open user access (proposal)',
  equipment text not null default '',
  blurb text not null default '',
  website text not null default '',
  status text not null default 'pending',
  submitted_by text,
  created_at timestamptz not null default now()
);

create index if not exists facilities_status_idx on public.facilities (status);
create index if not exists facilities_cc_idx on public.facilities (cc);

alter table public.facilities enable row level security;

-- The public site can read ONLY approved rows...
create policy "public can read approved" on public.facilities
  for select to anon, authenticated using (status = 'approved');

-- ...and can submit, but only as 'pending'.
create policy "public can submit pending" on public.facilities
  for insert to anon, authenticated with check (status = 'pending');

-- Belt and braces: force every public insert to 'pending' regardless of payload.
create or replace function public.force_pending() returns trigger language plpgsql as $$
begin
  new.status := 'pending';
  return new;
end $$;

create trigger trg_force_pending before insert on public.facilities
  for each row execute function public.force_pending();
