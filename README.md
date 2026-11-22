# Marketing OS · Dochodowe Studio

Platforma, która prowadzi właściciela studia treningowego krok po kroku przez marketing według metodyki Dochodowego Studia (Bartek). Treść ścieżki pochodzi z rozmowy Bartka w ChatGPT (`../materialy/spec-marketing-os.md`, poza repozytorium).

## Droga uczestnika

1. **Połącz AI** (`/start`): ChatGPT albo Claude (klucz API uczestnika) albo „Pracuję w swoim czacie” (kopiuje polecenie do ChatGPT Plus / Claude Pro i wkleja wynik).
2. **Ankieta startowa** (`/ankieta`): 10 pytań → rozpoznanie etapu studia → propozycja ścieżki do akceptacji.
3. **Ścieżka** (`/sciezka`, `/krok/<id>`): 12 kroków, każdy kończy się dokumentem do zatwierdzenia. Kolejny krok odblokowuje się po zatwierdzeniu poprzedniego:
   materiały i obraz firmy → diagnoza → DNA studia → awatar → oferta → cel, budżet i czas → strategia i wybór lejka → gotowość lejka → mapa wdrożenia → koncepcje i materiały → analiza wyników → okazje.
4. **Dokumenty** (`/dokumenty`) i **Lekcje** (`/lekcje`): wszystko, co powstało, i lekcje przypięte do kroków.
5. **Panel zespołu DS** (`/zespol`): na razie dane przykładowe.

Postęp (procent, kroki, dokumenty, lekcje) widać na pulpicie i w menu.

## Gdzie co jest

| Plik | Co zawiera |
|---|---|
| `src/lib/journey.ts` | Ankieta, etapy studia, 12 kroków (skrypty asystenta, szablony dokumentów, lekcje), liczenie postępu |
| `src/lib/assistant.ts` | Wspólne zasady asystenta + składanie instrukcji dla kroku (także polecenie do skopiowania) |
| `src/lib/ai.ts` | Jedyne połączenie z zewnętrznym AI (OpenAI / Anthropic), po stronie serwera |
| `src/app/api/assistant/route.ts` | Endpoint asystenta: walidacja, limity, strumień odpowiedzi |
| `src/lib/store.tsx` | Stan uczestnika. **Prototyp: zapis w przeglądarce (localStorage).** Docelowo Supabase |

## AI i dane

- AI jest **zewnętrzne i należy do uczestnika**: jego klucz OpenAI albo Anthropic. Uczestnik sam płaci dostawcy za zużycie.
- Klucz jest w przeglądarce uczestnika i jest wysyłany tylko razem z pytaniem; serwer go nie zapisuje ani nie loguje. OpenAI: `store: false`.
- Abonamentów ChatGPT Plus / Claude Pro nie da się podłączyć automatycznie (dostawcy na to nie pozwalają) — dlatego tryb „kopiuj polecenie / wklej wynik”.
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
