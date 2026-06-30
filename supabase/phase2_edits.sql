-- Phase 2: edit suggestions queue + "last updated" freshness.
-- Run once in the Supabase SQL editor.

-- 1) Freshness: track when a facility was last edited.
alter table public.facilities add column if not exists updated_at timestamptz;
update public.facilities set updated_at = created_at where updated_at is null;

-- Auto-bump updated_at whenever you edit a facility (admin edit in the dashboard).
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_touch_updated on public.facilities;
create trigger trg_touch_updated before update on public.facilities
  for each row execute function public.touch_updated_at();

-- 2) Public "Suggest an update" queue.
create table if not exists public.facility_edits (
  id uuid primary key default gen_random_uuid(),
  facility_id text not null references public.facilities(id) on delete cascade,
  message text not null,
  contact_email text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists facility_edits_facility_idx on public.facility_edits (facility_id);

alter table public.facility_edits enable row level security;

-- Anyone can submit a suggestion (always pending). No SELECT policy, so the
-- queue is private: only you can read it via the dashboard / service role.
drop policy if exists "anyone can suggest an edit" on public.facility_edits;
create policy "anyone can suggest an edit" on public.facility_edits
  for insert to anon, authenticated with check (status = 'pending');
