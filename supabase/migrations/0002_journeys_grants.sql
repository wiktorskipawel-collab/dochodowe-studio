-- Marketing OS · Dochodowe Studio — dostęp do tabeli przez API dla zalogowanych.
-- Nowe projekty Supabase nie udostępniają nowych tabel automatycznie (błąd 42501 „permission denied”).
-- Zalogowany uczestnik dostaje prawo czytania i zapisu, a RLS z 0001 i tak ogranicza go do własnego wiersza.
-- Goście (anon) nie mają dostępu. Uruchom raz: SQL Editor → New query → wklej → Run.

grant select, insert, update on table public.journeys to authenticated;
revoke all on table public.journeys from anon;
