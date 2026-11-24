-- Marketing OS · Dochodowe Studio — postęp uczestnika.
-- Uruchom raz w Supabase: SQL Editor → New query → wklej → Run.

create table if not exists public.journeys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.journeys is 'Ścieżka uczestnika Marketing OS (ankieta, postęp, dokumenty, rozmowy, zdarzenia XP). Jeden wiersz na konto.';

-- Każdy widzi i zmienia wyłącznie swój wiersz.
alter table public.journeys enable row level security;

drop policy if exists "Uczestnik czyta swoją ścieżkę" on public.journeys;
create policy "Uczestnik czyta swoją ścieżkę" on public.journeys
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Uczestnik zakłada swoją ścieżkę" on public.journeys;
create policy "Uczestnik zakłada swoją ścieżkę" on public.journeys
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Uczestnik zapisuje swoją ścieżkę" on public.journeys;
create policy "Uczestnik zapisuje swoją ścieżkę" on public.journeys
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
