# Marketing OS · Dochodowe Studio

Platforma, która prowadzi właściciela studia treningowego krok po kroku przez marketing według metodyki Dochodowego Studia (Bartek). Treść ścieżki pochodzi z rozmowy Bartka w ChatGPT (`../materialy/spec-marketing-os.md`, poza repozytorium).

## Droga uczestnika

1. **Logowanie / rejestracja** (`/logowanie`, `/rejestracja`) — PROTOTYP: konto w tej przeglądarce; docelowo Supabase Auth. „Zobacz demo” wczytuje przykładowy postęp.
2. **Połącz AI** (`/polacz`): przede wszystkim **prywatny ChatGPT uczestnika** — w każdym kroku „Otwórz w moim ChatGPT” otwiera jego ChatGPT z gotowym poleceniem (`chatgpt.com/?q=`), wynik wraca na platformę. Alternatywy: logowanie przez OpenRouter (OAuth PKCE, asystent działa w aplikacji) albo własny klucz API.
3. **Ankieta z Bartkiem** (`/ankieta`): asystent (postać Bartka, oznaczona jako AI) prowadzi przez 10 pytań → etap studia → propozycja ścieżki.
4. **Pulpit** (`/`, układ dashboard-01): poziom i XP, karty z liczbami, wykres kołowy etapów, tydzień (słupki piętrowe), aktywność w czasie (interaktywna linia), ścieżka, mapa aktywności, kompletność dokumentów, odznaki.
5. **Ścieżka** (`/sciezka`, `/krok/<id>`): 12 kroków, każdy kończy się dokumentem do zatwierdzenia; rozmowa w dymkach z „Bartek myśli…”.
6. **Dokumenty** i **Lekcje**.

## Gdzie co jest

| Plik | Co zawiera |
|---|---|
| `src/lib/journey.ts` | Ankieta, etapy studia, 12 kroków (skrypty asystenta, szablony dokumentów, lekcje), liczenie postępu |
| `src/lib/assistant.ts` | Wspólne zasady asystenta + składanie instrukcji dla kroku (także polecenie do skopiowania) |
| `src/lib/ai.ts` | Jedyne połączenie z zewnętrznym AI (OpenAI / Anthropic), po stronie serwera |
| `src/app/api/assistant/route.ts` | Endpoint asystenta: walidacja, limity, strumień odpowiedzi |
| `src/lib/store.tsx` | Stan uczestnika (konto, postęp, dokumenty, zdarzenia XP). **Prototyp: localStorage.** Docelowo Supabase |
| `src/lib/gamification.ts` | XP, poziomy, seria dni, odznaki, dane do wykresów |
| `src/lib/secure-cookie.ts` | Szyfrowane ciasteczko z kluczem AI (AES-GCM, httpOnly) |

## AI i dane

- AI jest **zewnętrzne i należy do uczestnika**: jego prywatny ChatGPT/Claude (tryb „Otwórz w moim ChatGPT”) albo jego konto OpenRouter / klucz API. Uczestnik sam płaci dostawcy.
- Klucz (OpenRouter albo własny) jest zaszyfrowany (AES-GCM) w ciasteczku httpOnly — nie trafia do JavaScriptu strony ani do logów. OpenAI: `store: false`.
- „Zaloguj przez ChatGPT” (użycie abonamentu przez aplikację) OpenAI udostępnia tylko wybranym partnerom — wymaga wniosku. Docelowo także aplikacja Dochodowe Studio w ChatGPT (Apps SDK / MCP + OAuth).
- Ścieżka, postęp i dokumenty zostają u nas (docelowo Supabase, Frankfurt).

## Uruchomienie lokalnie

```bash
npm install
npm run dev   # http://localhost:3000
```

Opcjonalnie `.env.local` (wzór: `.env.example`): klucz platformy do pokazów, gdy uczestnik nie poda własnego, oraz `SITE_PASSWORD`.

## Do zatwierdzenia przez Bartka

- Pytania ankiety i reguła rozpoznawania etapu (w rozmowie nie ma ankiety ani progów).
- Prompt główny, prompty 00.2–00.5, 18 promptów lejków i szablony DNA/awatara/oferty — były tylko w plikach jego projektu ChatGPT. Obecne skrypty są złożone z opisów w rozmowie.
- Pełna lista lekcji ze Skoola i przypisanie do kroków.

## Następne kroki

1. Supabase: konta, role (uczestnik, pracownik studia, zespół DS), zapis postępu i dokumentów, panel zespołu na prawdziwych danych.
2. Bunny Stream: 191 lekcji z Looma.
3. Wgranie plików Bartka (prompt główny, lejki) do `journey.ts`.
4. Wdrożenie na Vercel.
