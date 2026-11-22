# Marketing OS · Dochodowe Studio

Platforma, która prowadzi właściciela studia treningowego przez marketing według metodyki Dochodowego Studia (Bartek): DNA studia → strategia → lejki → wdrożenie → analiza.

## Ekrany

| Adres | Co jest |
|---|---|
| `/` | Pulpit uczestnika: następny krok, wyniki, ścieżka, plan tygodnia, rozliczenie |
| `/sciezka` | Moduły 00–05 i 6 lejków z warunkami wejścia |
| `/rozmowa` | Rozmowa z Marketing OS (działa na żywo po dodaniu klucza OpenAI) |
| `/lekcje` | Biblioteka lekcji Skool i mentoringów |
| `/zespol` | Panel zespołu DS: studia, alerty, koszt AI |

Dane na ekranach są **przykładowe** (`src/lib/data.ts`), dopóki nie podłączymy bazy.

## Jak działa AI

- Zewnętrzne AI to **tylko OpenAI** (modele GPT przez API). Łączy się z nim wyłącznie serwer: `src/app/api/chat/route.ts` → `src/lib/ai.ts`.
- Przeglądarka nigdy nie widzi klucza. Rozmowy nie są zapisywane po stronie OpenAI (`store: false`).
- Wszystko inne (konta, postęp, karty, wyniki, lekcje) zostaje na naszych serwerach: Vercel + Supabase (Frankfurt) + Bunny Stream.
- Model zmieniasz jedną linijką w `.env.local` (`OPENAI_MODEL_CHAT`, `OPENAI_MODEL_WRITER`).
- Instrukcje AI: `src/lib/prompts.ts` (wersja robocza, docelowo prompt główny i playbooki Bartka).

## Uruchomienie lokalnie

```bash
npm install
cp .env.example .env.local   # potem wklej klucz OPENAI_API_KEY w .env.local
npm run dev                  # http://localhost:3000
```

## Zmienne środowiskowe

| Zmienna | Po co |
|---|---|
| `OPENAI_API_KEY` | Klucz OpenAI API. Tylko w `.env.local` i w ustawieniach Vercel, nigdy w repozytorium. |
| `OPENAI_MODEL_CHAT` | Model do rozmowy (domyślnie `gpt-5-mini`). |
| `OPENAI_MODEL_WRITER` | Model do materiałów (domyślnie `gpt-5-mini`). |
| `OPENAI_REASONING_EFFORT` | `low` / `medium` / `high`; puste dla modeli bez tej opcji. |
| `SITE_PASSWORD` | Hasło do całej strony na czas pokazów (puste = bez hasła). |

## Następne kroki

1. Supabase (Frankfurt): logowanie, role (uczestnik, pracownik studia, zespół DS, administrator), zapis kart i postępu.
2. Bunny Stream: przeniesienie 191 lekcji z Looma, odtwarzacz tylko dla zalogowanych.
3. Prompty i playbooki Bartka zamiast wersji roboczej, osobny skrypt dla każdego modułu.
4. Limit kosztu AI na osobę (20 zł / mies.) i licznik w panelu zespołu.
5. Wdrożenie na Vercel (plan Pro, region UE).
