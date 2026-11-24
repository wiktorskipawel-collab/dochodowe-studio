@AGENTS.md

# Marketing OS · Dochodowe Studio — zasady projektu

- Interfejs po polsku, prostym językiem (użytkownicy to właściciele studiów, nie programiści).
- Zewnętrzne AI tylko przez `src/lib/ai.ts`, wywołania wyłącznie po stronie serwera. Uczestnik przynosi własny klucz (OpenAI albo Anthropic) albo pracuje w trybie kopiuj-wklej. Serwer nie zapisuje ani nie loguje kluczy i treści rozmów.
- Treść ścieżki (ankieta, etapy, kroki, szablony, lekcje) tylko w `src/lib/journey.ts`; zasady asystenta w `src/lib/assistant.ts`. Elementy bez decyzji Bartka oznaczaj „DO ZATWIERDZENIA”.
- Klucze i hasła tylko w `.env.local` / ustawieniach Vercel. Nigdy w repozytorium, w kodzie ani w czacie.
- Dane demo tylko w `src/lib/demo.ts` (oznaczone). Nie wpisuj do repozytorium prawdziwych danych klientów ani studiów. Panelu zespołu nie ma (decyzja Pawła).
- Kolejność wejścia pilnuje `src/components/Gate.tsx`: konto → ankieta → pulpit (decyzja Pawła 2026-11-24). Połączenie AI nie blokuje wejścia: prosimy o nie w kroku, gdy asystent ma rozmawiać (`/polacz?wroc=/krok/<id>`).
- Materiały źródłowe Bartka (rozmowy z ChatGPT, transkrypcje, audyty, spec) leżą poza repo w `../materialy` i nie trafiają na GitHub.
- Styl: szklane karty (`glass-card` w `globals.css`), ikony Lucide, animacje Motion (`motion/react`), Tailwind. Kolor marki: `--brand` (klasy `bg-brand`, `text-brand`). Gotowe komponenty shadcn/ui (Base UI) w `src/components/ui` — dodawaj je przez `npx shadcn@latest add <nazwa>`; aplikacja działa zawsze w trybie `.dark`. Nazwy `accent`, `primary` itd. należą do shadcn.
- Przed zakończeniem pracy: `npm run lint` i `npm run build` muszą przejść.
