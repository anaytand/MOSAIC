-- Apply manually in the Supabase SQL Editor after review. No existing table is altered.
-- Only authenticated account holders may create and read their own one request.
begin;

create table public.keyboard_interest_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 100),
  email text not null check (char_length(email) <= 254 and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  quantity smallint not null default 1 check (quantity between 1 and 10),
  preferred_color text not null check (preferred_color in ('mint', 'lavender', 'sky', 'peach')),
  comments text not null default '' check (char_length(comments) <= 1000),
  interest_acknowledged boolean not null check (interest_acknowledged = true),
  created_at timestamptz not null default now()
);

alter table public.keyboard_interest_requests enable row level security;
revoke all on table public.keyboard_interest_requests from public, anon, authenticated;
grant select, insert on table public.keyboard_interest_requests to authenticated;

create policy keyboard_requests_select_own on public.keyboard_interest_requests
  for select to authenticated using ((select auth.uid()) = user_id);
create policy keyboard_requests_insert_own on public.keyboard_interest_requests
  for insert to authenticated with check ((select auth.uid()) = user_id);

commit;
