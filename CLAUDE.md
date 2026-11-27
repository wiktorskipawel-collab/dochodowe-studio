@AGENTS.md

# Marketing OS · Dochodowe Studio — zasady projektu

- Interfejs po polsku, prostym językiem (użytkownicy to właściciele studiów, nie programiści).
- Zewnętrzne AI tylko przez `src/lib/ai.ts`, wywołania wyłącznie po stronie serwera. AI PLATFORMY (decyzja Pawła 2026-11-27): jeden klucz OpenRouter (`OPENROUTER_API_KEY`) i model z `NEXT_PUBLIC_AI_MODEL` (np. DeepSeek), uczestnik niczego nie łączy; rozmawiać mogą tylko zalogowani (`signedIn` w `src/lib/supabase/server.ts`). Model domyślny: `deepseek/deepseek-v3.2` (zmiana przez `NEXT_PUBLIC_AI_MODEL`). Tryb „własny ChatGPT” usunięty z interfejsu (`/polacz` przekierowuje na pulpit). Serwer nie zapisuje ani nie loguje kluczy i treści rozmów. Przed startem: dzienny limit rozmów na uczestnika.
- Treść ścieżki (ankieta, etapy, kroki, szablony, lekcje) tylko w `src/lib/journey.ts`; zasady asystenta w `src/lib/assistant.ts`. Elementy bez decyzji Bartka oznaczaj „DO ZATWIERDZENIA”.
- Klucze i hasła tylko w `.env.local` / ustawieniach Vercel. Nigdy w repozytorium, w kodzie ani w czacie.
- Dane demo tylko w `src/lib/demo.ts` (oznaczone). Nie wpisuj do repozytorium prawdziwych danych klientów ani studiów. Panelu zespołu nie ma (decyzja Pawła).
- Kolejność wejścia pilnuje `src/components/Gate.tsx`: konto → ankieta → pulpit (decyzja Pawła 2026-11-24). Krok prowadzi Bartek: zapowiedź → lekcja (odhaczenie) → rozmowa → dokument → zatwierdzenie (`StepWorkspace.tsx`).
- Materiały źródłowe Bartka (rozmowy z ChatGPT, transkrypcje, audyty, spec) leżą poza repo w `../materialy` i nie trafiają na GitHub.
- Kolory: zieleń z logo DS (`--brand` #72C41C) = kolor główny, biel = drugi, pomarańcz (`--orange`, klasy `text-orange`/`bg-orange`) tylko jako akcent (XP, seria, nagrody). Teksty bez rodzaju gramatycznego (piszemy do właścicielek i właścicieli).
- Pierwsze wejście na pulpit: okienko: animowane intro (linia przechodząca z kształtu w kształt, `WelcomeIntro.tsx`) → wideo powitalne → przewodnik po pulpicie (`Onboarding.tsx`, kotwice `data-tour="…"`; flaga `state.onboarded`). Mapa ścieżki to teren izometryczny (`PathTerrain.tsx` + geometria `src/lib/terrain.ts`). Animacje: Motion (komponenty), GSAP (`useGSAP`, wejście i przechył mapy), „wciśnięcie” przycisków w `globals.css`.
- Transkrypcje „modul1–10” z Dysku (folder „APC - Asystent jako GPT's”) to kurs Mirka Burnejko (Akademia Produktów Cyfrowych), NIE kurs Bartka — nie przenosić ich treści do aplikacji bez decyzji Pawła i Bartka (prawa autorskie).
- Nagrody jak w Duolingo: `Celebration.tsx` (toast z „dzyń” przy drobnych działaniach; pełny ekran po kolei: zatwierdzony krok → odblokowany krok → nowe odznaki → zamknięty etap → nowy poziom), dźwięki syntezowane w `src/lib/sfx.ts` (wyłącznik w menu konta). Co się odblokowało, liczy `commit` w `store.tsx`. Lekcje: GSAP Flip (filtr, odtwarzacz z karty) + ScrollTrigger.
- TRYB POKAZU (`?pokaz=1`) odblokowuje wszystkie kroki na jednym koncie — przed startem usunąć albo ograniczyć do admina.
- Styl: szklane karty (`glass-card` w `globals.css`), ikony Lucide, animacje Motion (`motion/react`), Tailwind. Kolor marki: `--brand` (klasy `bg-brand`, `text-brand`). Gotowe komponenty shadcn/ui (Base UI) w `src/components/ui` — dodawaj je przez `npx shadcn@latest add <nazwa>`; aplikacja działa zawsze w trybie `.dark`. Nazwy `accent`, `primary` itd. należą do shadcn.
- Przed zakończeniem pracy: `npm run lint` i `npm run build` muszą przejść.
