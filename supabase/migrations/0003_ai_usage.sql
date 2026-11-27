-- Marketing OS · Dochodowe Studio — licznik tokenów AI i miesięczny limit asystenta.
-- Uruchom raz w Supabase: SQL Editor → New query → wklej cały plik → Run. Ponowne uruchomienie niczego nie psuje.
--
-- Jak to działa:
-- - Serwer aplikacji (src/lib/usage.ts) przed każdym wywołaniem AI czyta zużycie (get_ai_usage), a po odpowiedzi
--   dopisuje zużyte tokeny (add_ai_usage). Obie funkcje działają tylko dla zalogowanej osoby (auth.uid()).
-- - Uczestnik widzi wyłącznie swoje wiersze i nie może ich sam zmienić ani usunąć: brak polityk insert/update/delete.
--   Jedyny zapis to add_ai_usage, która tylko ZWIĘKSZA licznik (osoba może co najwyżej zawyżyć sobie zużycie).
-- - Miesiąc liczymy w czasie polskim (Europe/Warsaw), licznik zeruje się 1. dnia miesiąca (nowy wiersz).
-- Bez tego pliku aplikacja działa jak dotąd, tylko bez licznika (w ustawieniach: „Licznik ruszy po konfiguracji bazy”).

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'), -- 'YYYY-MM'
  tokens bigint not null default 0 check (tokens >= 0),
  requests integer not null default 0 check (requests >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, month)
);

comment on table public.ai_usage is 'Zużycie AI platformy na osobę i miesiąc (tokeny, liczba zapytań). Zapis tylko przez public.add_ai_usage.';

alter table public.ai_usage enable row level security;

drop policy if exists "Uczestnik widzi swoje zużycie AI" on public.ai_usage;
create policy "Uczestnik widzi swoje zużycie AI" on public.ai_usage
  for select to authenticated using ((select auth.uid()) = user_id);

-- Tylko odczyt dla zalogowanych (RLS i tak zawęża do własnych wierszy). Goście nie mają dostępu.
revoke all on table public.ai_usage from anon, authenticated;
grant select on table public.ai_usage to authenticated;

-- Dopisanie zużycia dla zalogowanej osoby w bieżącym miesiącu. Zwraca nową sumę tokenów w tym miesiącu.
-- p_tokens: 1–200 000 na jedno wywołanie (jedna odpowiedź AI to zwykle kilka–kilkadziesiąt tysięcy).
create or replace function public.add_ai_usage(p_tokens integer)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_month text := to_char(now() at time zone 'Europe/Warsaw', 'YYYY-MM');
  v_total bigint;
begin
  if v_user is null then
    raise exception 'Brak zalogowanej osoby.' using errcode = '42501';
  end if;
  if p_tokens is null or p_tokens <= 0 or p_tokens > 200000 then
    raise exception 'Nieprawidłowa liczba tokenów.' using errcode = '22023';
  end if;

  insert into public.ai_usage as u (user_id, month, tokens, requests, updated_at)
  values (v_user, v_month, p_tokens, 1, now())
  on conflict (user_id, month) do update
    set tokens = u.tokens + excluded.tokens,
        requests = u.requests + 1,
        updated_at = now()
  returning u.tokens into v_total;

  return v_total;
end;
$$;

revoke all on function public.add_ai_usage(integer) from public, anon;
grant execute on function public.add_ai_usage(integer) to authenticated;

-- Bieżące zużycie zalogowanej osoby (zawsze jeden wiersz; 0, gdy w tym miesiącu jeszcze nic).
-- security invoker: działa z uprawnieniami osoby, więc RLS pokazuje tylko jej wiersz.
create or replace function public.get_ai_usage()
returns table (month text, tokens bigint, requests integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select m.month, coalesce(u.tokens, 0)::bigint, coalesce(u.requests, 0)::integer
  from (select to_char(now() at time zone 'Europe/Warsaw', 'YYYY-MM') as month) as m
  left join public.ai_usage as u on u.user_id = (select auth.uid()) and u.month = m.month;
$$;

revoke all on function public.get_ai_usage() from public, anon;
grant execute on function public.get_ai_usage() to authenticated;
