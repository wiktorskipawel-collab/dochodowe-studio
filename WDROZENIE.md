# Wdrożenie: Supabase (baza i konta) + Vercel (serwer)

Klucze i hasła wklejasz tylko w panelach Supabase/Vercel i w pliku `.env.local`. Nigdy do czatu ani do repozytorium.

## 1. Supabase: baza danych i konta (ok. 10 min)

1. Wejdź na [supabase.com](https://supabase.com) → **New project**.
   - Nazwa: `dochodowe-studio`
   - Region: **Central EU (Frankfurt)**
   - Hasło bazy: wygeneruj i zapisz w menedżerze haseł.
2. **SQL Editor** → **New query** → wklej całą zawartość pliku `supabase/migrations/0001_journeys.sql` → **Run**.
   Powstaje tabela `journeys`, w której każdy uczestnik widzi tylko swój postęp.
   Potem tak samo plik `supabase/migrations/0002_journeys_grants.sql` (nowe projekty Supabase nie udostępniają tabel automatycznie).
   Na koniec plik `supabase/migrations/0003_ai_usage.sql` (**Supabase → SQL Editor → New query → wklej cały plik → Run**): licznik tokenów AI i miesięczny limit asystenta (tabela `ai_usage`, każdy widzi tylko swoje zużycie i nie może go zmienić). Bez tego pliku asystent działa, ale bez limitu, a w „Ustawieniach konta” widać „Licznik ruszy po konfiguracji bazy”. Plik można uruchomić ponownie, nic się nie zduplikuje.
3. **Project Settings → API Keys**: skopiuj **Project URL** i **Publishable key** do `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```
4. **Authentication → URL Configuration**:
   - Site URL: adres z Vercel (krok 3), np. `https://dochodowe-studio.vercel.app`
   - Redirect URLs (dodaj oba):
     - `http://localhost:3100/auth/callback`
     - `https://TWOJ-ADRES.vercel.app/auth/callback`

## 2. Logowanie przez Google (ok. 10 min)

1. [console.cloud.google.com](https://console.cloud.google.com) → nowy projekt `Dochodowe Studio`.
2. **APIs & Services → OAuth consent screen**: typ **External**, nazwa aplikacji `Dochodowe Studio`, e-mail kontaktowy, logo (opcjonalnie). Zakresy: tylko podstawowe (email, profile).
3. **Credentials → Create credentials → OAuth client ID** → typ **Web application**.
   - Authorized redirect URI: `https://TWOJ-PROJEKT.supabase.co/auth/v1/callback`
     (dokładny adres pokazuje Supabase w kroku 4 poniżej)
4. W Supabase: **Authentication → Sign In / Providers → Google** → włącz, wklej **Client ID** i **Client Secret** → Save.

Od tej chwili przycisk „Kontynuuj z Google” otwiera wybór konta Google i wraca zalogowany.

## 3. Vercel: aplikacja w sieci (ok. 5 min)

1. [vercel.com](https://vercel.com) → **Add New → Project** → importuj repozytorium `wiktorskipawel-collab/dochodowe-studio`.
2. Framework: Next.js (wykryje sam). **Environment Variables** — wpisz:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `COOKIE_SECRET` (skopiuj z `.env.local`, min. 32 znaki)
   - `OPENROUTER_API_KEY` (klucz platformy z openrouter.ai, z limitem wydatków) i `NEXT_PUBLIC_AI_MODEL` (np. `deepseek/deepseek-v3.2`) — asystent działa wtedy na koszt platformy, uczestnik niczego nie łączy
   - opcjonalnie `AI_MONTHLY_TOKEN_LIMIT` — miesięczny limit tokenów AI na jedną osobę (puste = 2 000 000; DO ZATWIERDZENIA). Liczą się rozmowy w krokach, narzędzia AI, zdjęcia, transkrypcje i lokal z ogłoszenia. Po przekroczeniu asystent odpowiada „Wykorzystano miesięczny limit asystenta. Odnowi się 1 …” aż do 1. dnia następnego miesiąca (czas polski). Zużycie widać w aplikacji: menu konta → **Ustawienia konta**, a wszystkich osób: Supabase → **Table Editor → ai_usage**. Działa po uruchomieniu `0003_ai_usage.sql` (krok 1.2).
   - opcjonalnie `NEXT_PUBLIC_AI_VISION_MODEL` (zdjęcia w czacie) i `NEXT_PUBLIC_AI_AUDIO_MODEL` (transkrypcja nagrań); puste = domyślne modele Gemini z `src/lib/models.ts`. Dyktowanie głosem korzysta z rozpoznawania mowy przeglądarki (Chrome/Edge wysyłają głos do Google/Microsoft).
   - opcjonalnie `NEXT_PUBLIC_BARTEK_KALENDARZ` (link do umawiania rozmów 30 min) i `NEXT_PUBLIC_WIDEO_POWITALNE` (adres wideo powitalnego)
   - opcjonalnie `SITE_PASSWORD` — hasło na całą stronę na czas testów
3. **Deploy**. Region serwera: Frankfurt (`vercel.json`).
4. Wróć do Supabase (krok 1.4) i wpisz adres z Vercel.

## 4. Sprawdzenie

- Rejestracja e-mailem → przychodzi mail z potwierdzeniem → link wraca do ankiety z Bartkiem → pulpit.
- „Kontynuuj z Google” → wybór konta → ankieta z Bartkiem → pulpit.
- W kroku ścieżki: zapowiedź Bartka → lekcja („Obejrzane, lecimy do pytań”) → rozmowa z asystentem → „Przygotuj dokument z rozmowy” → Zatwierdzam / Pobierz.
- W nagłówku pulpitu: „Zapisano w chmurze”. Postęp zostaje po zalogowaniu na innym komputerze.
- Menu konta → **Ustawienia konta**: po jednej rozmowie z asystentem licznik pokazuje „Zostało … z … tokenów” (wymaga `0003_ai_usage.sql`). Tam też zmiana imienia i hasła.

## Uwagi

- Wbudowana poczta Supabase wysyła tylko kilka maili na godzinę — wystarczy do testów. Przed startem: własny SMTP (np. Resend) w **Authentication → SMTP**.
- Plan Vercel Hobby jest do użytku niekomercyjnego. Przed sprzedażą: Vercel Pro.
- Bez kluczy Supabase aplikacja działa w trybie lokalnym (konto w przeglądarce).
