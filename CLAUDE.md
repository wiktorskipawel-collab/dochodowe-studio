@AGENTS.md

# Marketing OS · Dochodowe Studio — zasady projektu

- Interfejs po polsku, prostym językiem (użytkownicy to właściciele studiów, nie programiści).
- Zewnętrzne AI tylko przez `src/lib/ai.ts` (OpenAI, wywołania wyłącznie po stronie serwera). Nie dodawaj innych dostawców bez decyzji Pawła.
- Klucze i hasła tylko w `.env.local` / ustawieniach Vercel. Nigdy w repozytorium, w kodzie ani w czacie.
- Dane w `src/lib/data.ts` są przykładowe. Nie wpisuj do repozytorium prawdziwych danych klientów ani studiów.
- Materiały źródłowe Bartka (rozmowy z ChatGPT, transkrypcje, audyty) leżą poza repo w `../materialy` i nie trafiają na GitHub.
- Styl: szklane karty (`glass-card` w `globals.css`), ikony Lucide, animacje Motion (`motion/react`), Tailwind. Akcent w jednym miejscu: `--accent`.
- Przed zakończeniem pracy: `npm run lint` i `npm run build` muszą przejść.
