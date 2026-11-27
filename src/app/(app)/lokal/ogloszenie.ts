// „Dodaj z ogłoszenia” (/lokal): wspólne dla przeglądarki i serwera — limity, pola wypełniane przez AI i kształt odpowiedzi.
// Trasa: src/app/api/lokal/z-ogloszenia/route.ts. Formularz i obliczenia: dane.ts.

export const LIMITY_OGLOSZENIA = { tekst: 20_000, linki: 3, dlugoscLinku: 2048 } as const;

/** Pola formularza lokalu (id z dane.ts), które AI próbuje znaleźć w ogłoszeniu. Reszta (oceny, decyzja, zgody) zostaje dla właściciela. */
export const POLA_Z_OGLOSZENIA = [
  "adres", "lokalizacja", "link",
  "czynszNetto", "vat", "oplatyAdmin", "media", "parking", "inne", "kaucja", "prowizja", "wakacje",
  "metrazCalk", "metrazSali", "miejscaParking", "wejscie",
  "ogrzewanie", "wentylacja", "klimatyzacja", "prysznic", "szatnie", "toalety", "szyld", "godziny",
  "dlugosc", "wypowiedzenie", "indeksacja",
] as const;
export type PoleZOgloszenia = (typeof POLA_Z_OGLOSZENIA)[number];

/** Odpowiedź POST /api/lokal/z-ogloszenia. Błąd: { error: string }. */
export type WynikOgloszenia = {
  dane: Partial<Record<PoleZOgloszenia, string>>; // wartości jak w formularzu (tekst, liczby z przecinkiem)
  nieZnaleziono: PoleZOgloszenia[];
  uwagi: string[]; // co przeliczyliśmy albo przyjęliśmy (np. czynsz z brutto na netto)
  ostrzezenia: string[]; // linki, których nie udało się pobrać
};

/** Sprawdzenie linku w przeglądarce (to samo, tylko pełniejsze, robi serwer). */
export function linkWygladaOk(v: string) {
  try {
    const u = new URL(v.trim());
    return (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}
