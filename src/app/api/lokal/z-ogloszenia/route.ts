// „Dodaj z ogłoszenia” (/lokal): treść ogłoszenia i/lub link(i) → AI platformy → pola formularza lokalu.
// Kolejność: kształt zapytania i linki (400, bez sieci) → logowanie (401) i miesięczny limit AI (429) → klucz AI (503) → pobranie stron (SSRF: pobierz.ts) → AI.
// Serwer nie zapisuje i nie loguje treści ogłoszeń ani odpowiedzi AI.
import { resolveKey, AiError } from "@/lib/ai";
import { completeJson } from "@/lib/ai-json";
import { PLATFORM_MODEL } from "@/lib/models";
import { aiAccess, recordUsage } from "@/lib/usage";
import { LIMITY_OGLOSZENIA, type WynikOgloszenia } from "@/app/(app)/lokal/ogloszenie";
import { KOMUNIKAT_BLOKADA, pobierzOgloszenie, sprawdzLink } from "./pobierz";
import { INSTRUKCJA, normalizuj } from "./wyciagnij";

// pobieranie stron (równolegle, maks. 8 s) + odpowiedź AI
export const maxDuration = 60;

const MAX_BAJTOW_ZAPYTANIA = 100_000;

const json = (body: WynikOgloszenia | { error: string }, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const blad = (error: string, status: number) => json({ error }, status);

export async function POST(request: Request) {
  // 1. Kształt zapytania — bez sieci i bez sprawdzania sesji
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BAJTOW_ZAPYTANIA) return blad("Za dużo tekstu naraz. Wklej sam opis i parametry lokalu.", 413);
  let body: { tekst?: unknown; linki?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > MAX_BAJTOW_ZAPYTANIA) return blad("Za dużo tekstu naraz. Wklej sam opis i parametry lokalu.", 413);
    body = JSON.parse(raw);
  } catch {
    return blad("Nieprawidłowe zapytanie.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return blad("Nieprawidłowe zapytanie.", 400);

  if (body.tekst !== undefined && typeof body.tekst !== "string") return blad("Nieprawidłowe zapytanie.", 400);
  const tekst = (body.tekst ?? "").trim();
  if (tekst.length > LIMITY_OGLOSZENIA.tekst) {
    return blad(`Tekst ogłoszenia jest za długi (maks. ${LIMITY_OGLOSZENIA.tekst.toLocaleString("pl-PL")} znaków). Wklej sam opis i parametry lokalu.`, 400);
  }

  if (body.linki !== undefined && !Array.isArray(body.linki)) return blad("Nieprawidłowe zapytanie.", 400);
  const surowe = ((body.linki ?? []) as unknown[]).filter((l) => !(typeof l === "string" && !l.trim()));
  if (surowe.some((l) => typeof l !== "string")) return blad("Nieprawidłowe zapytanie.", 400);
  if (surowe.length > LIMITY_OGLOSZENIA.linki) return blad(`Możesz podać najwyżej ${LIMITY_OGLOSZENIA.linki} linki naraz.`, 400);
  const linki: URL[] = [];
  for (const [i, l] of (surowe as string[]).entries()) {
    const s = sprawdzLink(l);
    if (!s.ok) return blad(surowe.length > 1 ? `Link ${i + 1}: ${s.blad}` : s.blad, 400);
    if (!linki.some((u) => u.href === s.url.href)) linki.push(s.url);
  }
  if (!tekst && !linki.length) return blad("Wklej treść ogłoszenia albo link do niego.", 400);
  if (!linki.length && tekst.length < 30) return blad("To za mało tekstu. Wklej cały opis ogłoszenia razem z parametrami (cena, metraż).", 400);

  // 2. Tylko zalogowani i w ramach miesięcznego limitu AI (src/lib/usage.ts) — za AI płaci platforma,
  //    a pobieranie stron to praca serwera
  const access = await aiAccess();
  if (!access.ok) {
    return access.reason === "limit" ? blad(`${access.message} Lokal możesz dodać ręcznie.`, 429) : blad("Zaloguj się, żeby wypełnić lokal z ogłoszenia.", 401);
  }

  // 3. Klucz AI platformy
  const { key, platform } = await resolveKey("openrouter");
  if (!key) return blad("Asystent jest chwilowo niedostępny. Spróbuj ponownie za kilka minut. Lokal możesz dodać ręcznie.", 503);

  // 4. Strony ogłoszeń (równolegle; każda ma własny limit 8 s)
  const pobrane = await Promise.all(linki.map((u) => pobierzOgloszenie(u)));
  const ostrzezenia = pobrane.flatMap((p) => (p.ok ? [] : [`${new URL(p.url).hostname.replace(/^www\./, "")}: ${p.blad}`]));
  const strony = pobrane.flatMap((p) => (p.ok ? [p] : []));
  if (!tekst && !strony.length) {
    const nieudane = pobrane.flatMap((p) => (p.ok ? [] : [p]));
    if (nieudane.every((p) => p.rodzaj === "adres")) return blad(nieudane.length === 1 ? nieudane[0].blad : ostrzezenia.join(" "), 400);
    if (nieudane.some((p) => p.rodzaj === "blokada")) return blad(KOMUNIKAT_BLOKADA, 422);
    return blad(nieudane.length === 1 ? nieudane[0].blad : ostrzezenia.join(" "), 422);
  }

  // 5. AI: treść wklejona + strony, każde źródło w wyraźnych znacznikach
  const zrodla = [
    ...(tekst ? [`<<<OGŁOSZENIE WKLEJONE PRZEZ WŁAŚCICIELA>>>\n${tekst}\n<<<KONIEC>>>`] : []),
    ...strony.map((s, i) => `<<<STRONA OGŁOSZENIA ${i + 1}: ${s.url}>>>\n${s.tekst}\n<<<KONIEC>>>`),
  ];
  const usage = platform ? recordUsage(access.addUsage) : null;
  try {
    const odp = await completeJson({ apiKey: key, model: PLATFORM_MODEL, system: INSTRUKCJA, user: zrodla.join("\n\n"), maxTokens: 1500, onUsage: usage?.report });
    // do pola „Link do ogłoszenia” trafia pierwszy link podany przez właściciela
    return json({ ...normalizuj(odp, linki[0]?.href ?? null), ostrzezenia });
  } catch (err) {
    usage?.cancel(); // gdy AI odpowiedziało (np. zły format), zużycie jest już zgłoszone — cancel niczego nie zmienia
    if (err instanceof AiError) return blad(err.message, err.status);
    return blad("Coś poszło nie tak po stronie serwera. Spróbuj jeszcze raz.", 500);
  }
}
