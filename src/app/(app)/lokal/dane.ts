// Kalkulator lokalu (/lokal): pola formularza, obliczenia i lista warunków umowy najmu.
// Na podstawie arkusza Bartka „Tabela analizy lokali” (zakładki „Porównanie lokali” i „Warunki umowy”)
// oraz lekcji „Nie kupujesz sprzętu do lokalu”. Stan zapisuje store (`lokale`, `najem`).
import type { Lokal } from "@/lib/store";

export type TypPola = "tekst" | "zl" | "m2" | "liczba" | "procent" | "ocena" | "wybor" | "dlugi";
export type Pole = { id: string; label: string; typ: TypPola; opcje?: readonly string[]; pomoc?: string; placeholder?: string };
export type Grupa = { id: string; title: string; opis: string; pola: Pole[] };

// Listy wyboru jak w arkuszu Bartka.
export const STATUSY = ["Nowy", "Do kontaktu", "Oglądanie", "Analiza", "Negocjacje", "Finalista", "Odpada"] as const;
export const DECYZJE = ["Do negocjacji", "Finalista", "Wybrany", "Odpada"] as const;
export const TND = ["Tak", "Nie", "Do potwierdzenia"] as const;
export const HALAS = ["Niskie", "Średnie", "Wysokie"] as const;
export const UZGODNIONE = ["Tak", "Częściowo", "Do negocjacji", "Do sprawdzenia", "Nie"] as const;

/** Przychód miesięczny studia, przy którym liczymy udział kosztu lokalu (jak kolumny „Czynsz / 20k, 50k, 70k”). */
export const PRZYCHODY = [20000, 50000, 70000] as const;

// DO ZATWIERDZENIA (Bartek): progi ostrzeżeń. Kolory jak w formatowaniu arkusza (do 15% zielony, powyżej 20% czerwony).
// Arkusz liczy udział od samego czynszu brutto, a tu liczymy od pełnego kosztu miesięcznego (bezpieczniej) — do potwierdzenia.
export const PROGI = { ok: 0.15, ryzyko: 0.2 } as const;
export type Poziom = "ok" | "uwaga" | "ryzyko";
export const poziom = (udzial: number): Poziom => (udzial <= PROGI.ok ? "ok" : udzial <= PROGI.ryzyko ? "uwaga" : "ryzyko");

export const GRUPY: Grupa[] = [
  {
    id: "podstawy",
    title: "Podstawowe informacje",
    opis: "Skąd ten lokal i na jakim jest etapie.",
    pola: [
      { id: "nazwa", label: "Nazwa lub ID lokalu", typ: "tekst", placeholder: "np. L01 albo „przy parku”" },
      { id: "status", label: "Status", typ: "wybor", opcje: STATUSY },
      { id: "adres", label: "Dokładny adres", typ: "tekst", placeholder: "ulica, numer" },
      { id: "lokalizacja", label: "Lokalizacja", typ: "tekst", placeholder: "dzielnica, okolica, co jest obok" },
      { id: "dojazd", label: "Odległość / czas dojazdu", typ: "tekst", placeholder: "np. 12 min autem od centrum" },
      { id: "link", label: "Link do ogłoszenia", typ: "tekst", placeholder: "https://…" },
    ],
  },
  {
    id: "koszty",
    title: "Koszty",
    opis: "Wszystko, co płacisz co miesiąc, i to, co wyłożysz na start.",
    pola: [
      { id: "czynszNetto", label: "Czynsz netto", typ: "zl" },
      { id: "vat", label: "VAT", typ: "procent", pomoc: "Zwykle 23%. Wpisz 0, jeśli czynsz jest bez VAT. Porównujemy kwoty brutto, jak w arkuszu." },
      { id: "oplatyAdmin", label: "Opłaty administracyjne", typ: "zl" },
      { id: "media", label: "Media szacowane", typ: "zl", pomoc: "Prąd, woda, ogrzewanie, internet. Zapytaj o rachunki poprzedniego najemcy." },
      { id: "parking", label: "Parking – koszt", typ: "zl" },
      { id: "inne", label: "Inne stałe opłaty", typ: "zl", pomoc: "Np. śmieci, ochrona, sprzątanie części wspólnych." },
      { id: "kaucja", label: "Kaucja", typ: "zl" },
      { id: "prowizja", label: "Prowizja", typ: "zl" },
      { id: "wakacje", label: "Wakacje czynszowe", typ: "tekst", placeholder: "np. 2 miesiące na adaptację" },
    ],
  },
  {
    id: "metraz",
    title: "Metraż i pojemność",
    opis: "Zarabia sala, a nie recepcja i zaplecze.",
    pola: [
      { id: "metrazCalk", label: "Metraż całkowity", typ: "m2" },
      { id: "metrazSali", label: "Metraż sali", typ: "m2", pomoc: "Tylko przestrzeń, na której trener pracuje z klientami." },
      { id: "maxTrenerow", label: "Maks. trenerów jednocześnie", typ: "liczba" },
      { id: "maxKlientow", label: "Maks. klientów jednocześnie", typ: "liczba" },
      { id: "miejscaParking", label: "Miejsca parkingowe", typ: "liczba" },
      { id: "wejscie", label: "Wejście", typ: "tekst", placeholder: "z ulicy, z podwórza, piętro, winda" },
    ],
  },
  {
    id: "wyposazenie",
    title: "Wyposażenie i otoczenie",
    opis: "Stan techniczny, zaplecze i sąsiedzi.",
    pola: [
      { id: "ogrzewanie", label: "Ogrzewanie", typ: "tekst", placeholder: "rodzaj, kto płaci" },
      { id: "wentylacja", label: "Wentylacja", typ: "tekst", placeholder: "grawitacyjna, mechaniczna, brak" },
      { id: "klimatyzacja", label: "Klimatyzacja", typ: "wybor", opcje: TND },
      { id: "prysznic", label: "Prysznic", typ: "wybor", opcje: TND },
      { id: "szatnie", label: "Szatnie", typ: "tekst", placeholder: "ile, jak duże" },
      { id: "toalety", label: "Toalety", typ: "tekst", placeholder: "ile" },
      { id: "gabinet", label: "Gabinet konsultacyjny", typ: "wybor", opcje: TND, pomoc: "Miejsce na rozmowę sprzedażową: prywatność, ale z widokiem na atmosferę sali." },
      { id: "sasiedzi", label: "Sąsiedzi", typ: "tekst", placeholder: "kto za ścianą, nad i pod lokalem" },
      { id: "halas", label: "Ryzyko hałasu", typ: "wybor", opcje: HALAS },
      { id: "szyld", label: "Możliwość szyldu", typ: "wybor", opcje: TND },
      { id: "godziny", label: "Ograniczenia godzinowe", typ: "tekst", placeholder: "np. cisza od 22:00, zamknięte w niedziele" },
    ],
  },
  {
    id: "umowa",
    title: "Umowa",
    opis: "Najważniejsze warunki. Pełna lista jest w zakładce „Warunki umowy najmu”.",
    pola: [
      { id: "dlugosc", label: "Długość umowy", typ: "tekst", placeholder: "np. 5 lat, czas określony" },
      { id: "wypowiedzenie", label: "Okres wypowiedzenia", typ: "tekst", placeholder: "np. 3 miesiące" },
      { id: "wyjscie", label: "Możliwość wcześniejszego wyjścia", typ: "wybor", opcje: TND },
      { id: "indeksacja", label: "Indeksacja", typ: "tekst", placeholder: "np. raz w roku o inflację" },
      { id: "limitPodwyzki", label: "Limit podwyżki", typ: "tekst", placeholder: "np. maks. 5% rocznie" },
      { id: "cesja", label: "Cesja / podnajem", typ: "wybor", opcje: TND },
      { id: "zgodaStudio", label: "Zgoda na studio", typ: "wybor", opcje: TND },
      { id: "adaptacja", label: "Duża adaptacja", typ: "wybor", opcje: TND, pomoc: "Tak = trzeba dużo przebudować (podłoga, wentylacja, łazienki)." },
    ],
  },
  {
    id: "ocena",
    title: "Ocena i decyzja",
    opis: "Twoje wrażenie po oględzinach.",
    pola: [
      { id: "widocznosc", label: "Widoczność", typ: "ocena" },
      { id: "dojazdOcena", label: "Dojazd", typ: "ocena" },
      // DO ZATWIERDZENIA (Bartek): „Ustawność sali” nie ma w arkuszu, dodana z lekcji („60 m² dobrze zaprojektowane może być lepsze niż 100 m²”).
      { id: "ustawnosc", label: "Ustawność sali", typ: "ocena", pomoc: "Brak martwych metrów, miejsce dla kilku osób naraz, sensowne strefy." },
      { id: "zaleta", label: "Największa zaleta", typ: "tekst" },
      { id: "ryzyko", label: "Największe ryzyko", typ: "tekst" },
      { id: "pytania", label: "Pytania bez odpowiedzi", typ: "dlugi", placeholder: "Co musisz jeszcze sprawdzić albo dopytać właściciela?" },
      { id: "decyzja", label: "Decyzja", typ: "wybor", opcje: DECYZJE },
    ],
  },
];

export const POLA: Pole[] = GRUPY.flatMap((g) => g.pola);
export const OCENY = ["widocznosc", "dojazdOcena", "ustawnosc"] as const;

/** Liczba z pola tekstowego: przyjmuje spacje i przecinek („4 500,50”). Puste = brak. */
export function liczba(v?: string): number | null {
  if (!v?.trim()) return null;
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export type Wynik = {
  brutto: number | null; // czynsz brutto
  pelny: number | null; // pełny koszt miesięczny: czynsz brutto + opłaty + media + parking + inne
  zaM2: number | null; // pełny koszt za m² sali
  start: number | null; // jednorazowo: kaucja + prowizja
  udzialy: { przychod: number; udzial: number | null }[];
  ocena: number | null; // średnia z ocen 1–5
  flagi: string[];
  doPotwierdzenia: number;
  odpada: boolean;
};

// DO ZATWIERDZENIA (Bartek): które odpowiedzi traktujemy jako czerwone flagi.
const FLAGI: { pole: string; gdy: string; tekst: string }[] = [
  { pole: "zgodaStudio", gdy: "Nie", tekst: "Brak zgody na studio treningowe" },
  { pole: "halas", gdy: "Wysokie", tekst: "Wysokie ryzyko hałasu" },
  { pole: "adaptacja", gdy: "Tak", tekst: "Wymaga dużej adaptacji" },
  { pole: "wyjscie", gdy: "Nie", tekst: "Nie da się wcześniej wyjść z umowy" },
  { pole: "szyld", gdy: "Nie", tekst: "Bez szyldu" },
  { pole: "cesja", gdy: "Nie", tekst: "Bez cesji i podnajmu" },
];

export function policz(l: Lokal): Wynik {
  const d = l.dane;
  const netto = liczba(d.czynszNetto);
  const brutto = netto == null ? null : netto * (1 + (liczba(d.vat) ?? 0) / 100);
  const skladniki = [brutto, liczba(d.oplatyAdmin), liczba(d.media), liczba(d.parking), liczba(d.inne)];
  const pelny = skladniki.some((s) => s != null) ? skladniki.reduce<number>((a, s) => a + (s ?? 0), 0) : null;
  const sala = liczba(d.metrazSali);
  const kaucja = liczba(d.kaucja);
  const prowizja = liczba(d.prowizja);
  const oceny = OCENY.map((id) => liczba(d[id])).filter((n): n is number => n != null && n > 0);
  return {
    brutto,
    pelny,
    zaM2: pelny != null && sala ? pelny / sala : null,
    start: kaucja == null && prowizja == null ? null : (kaucja ?? 0) + (prowizja ?? 0),
    udzialy: PRZYCHODY.map((p) => ({ przychod: p, udzial: pelny != null ? pelny / p : null })),
    ocena: oceny.length ? oceny.reduce((a, n) => a + n, 0) / oceny.length : null,
    flagi: FLAGI.filter((f) => d[f.pole] === f.gdy).map((f) => f.tekst),
    doPotwierdzenia: POLA.filter((p) => d[p.id] === "Do potwierdzenia").length,
    odpada: d.status === "Odpada" || d.decyzja === "Odpada",
  };
}

/** Najtańszy i najlepiej oceniony spośród lokali, które nie odpadły (pokazujemy dopiero przy co najmniej 2). */
export function wyroznienia(lokale: Lokal[]) {
  const kandydaci = lokale.map((l) => ({ l, w: policz(l) })).filter(({ w }) => !w.odpada);
  const zKosztem = kandydaci.filter(({ w }) => w.pelny != null && w.pelny > 0);
  const zOcena = kandydaci.filter(({ w }) => w.ocena != null);
  const najtanszy = zKosztem.length >= 2 ? zKosztem.reduce((a, b) => (b.w.pelny! < a.w.pelny! ? b : a)).l.id : null;
  const najlepszy = zOcena.length >= 2
    ? zOcena.reduce((a, b) => (b.w.ocena! > a.w.ocena! || (b.w.ocena === a.w.ocena && (b.w.pelny ?? Infinity) < (a.w.pelny ?? Infinity)) ? b : a)).l.id
    : null;
  return { najtanszy, najlepszy };
}

export const nowyLokal = (lokale: Lokal[]): Lokal => {
  const zajete = new Set(lokale.map((l) => l.dane.nazwa));
  let n = lokale.length + 1;
  while (zajete.has(`L${String(n).padStart(2, "0")}`)) n++;
  return {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    dane: { nazwa: `L${String(n).padStart(2, "0")}`, status: "Nowy", vat: "23" },
    dodano: new Date().toISOString(),
  };
};

const fmtZl = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });
const fmtPct = new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const zl = (n: number | null) => (n == null ? "–" : `${fmtZl.format(Math.round(n))} zł`);
export const proc = (n: number | null) => (n == null ? "–" : `${fmtPct.format(n * 100)}%`);
export const tys = (n: number) => `${n / 1000} tys. zł`;

// ——— Warunki umowy najmu (druga zakładka arkusza) ———
// Elementy i kolumny jak w arkuszu Bartka. DO ZATWIERDZENIA (Bartek): podpowiedzi „na co uważać” i podział na grupy.
export type Warunek = { id: string; label: string; pomoc: string };
export const WARUNKI: { id: string; title: string; pozycje: Warunek[] }[] = [
  {
    id: "czas",
    title: "Czas trwania i wyjście",
    pozycje: [
      { id: "rodzaj", label: "Rodzaj umowy", pomoc: "Na czas określony czy nieokreślony. Umowę na czas określony zwykle wypowiesz tylko z powodów wpisanych w umowę." },
      { id: "dlugosc", label: "Długość umowy", pomoc: "Dłuższa umowa chroni to, co włożysz w adaptację, ale mocniej wiąże." },
      { id: "wypowiedzenie", label: "Okres wypowiedzenia", pomoc: "Ile miesięcy płacisz od decyzji o wyjściu." },
      { id: "wyjscie", label: "Możliwość wyjścia po 12/24/36 miesiącach", pomoc: "Furtka na wypadek, gdyby studio nie ruszyło albo trzeba było się przenieść." },
      { id: "zgody", label: "Warunek uzyskania zgód i odbiorów", pomoc: "Umowa zaczyna działać dopiero, gdy dostaniesz potrzebne zgody i odbiory." },
    ],
  },
  {
    id: "pieniadze",
    title: "Czynsz i opłaty",
    pozycje: [
      { id: "indeksacja", label: "Indeksacja", pomoc: "Według jakiego wskaźnika i jak często rośnie czynsz." },
      { id: "limit", label: "Limit rocznej podwyżki", pomoc: "Górna granica podwyżki w ciągu roku." },
      { id: "innePodwyzki", label: "Inne możliwości podwyżki", pomoc: "Czy właściciel może podnieść czynsz z innych powodów, np. podatków albo opłat." },
      { id: "wakacje", label: "Wakacje czynszowe", pomoc: "Miesiące bez czynszu na adaptację i start." },
      { id: "startCzynszu", label: "Data rozpoczęcia naliczania czynszu", pomoc: "Najlepiej od przekazania gotowego lokalu albo od otwarcia, nie od podpisania umowy." },
      { id: "kaucja", label: "Kaucja", pomoc: "Wysokość, forma i termin zwrotu." },
      { id: "prowizja", label: "Prowizja", pomoc: "Kto płaci pośrednikowi i ile." },
      { id: "media", label: "Rozliczenie mediów", pomoc: "Według podliczników czy ryczałt. Kto podpisuje umowy z dostawcami." },
      { id: "poreczenie", label: "Poręczenie osobiste / weksel", pomoc: "Jeśli musi być, ogranicz kwotę i czas. Inaczej odpowiadasz prywatnym majątkiem." },
    ],
  },
  {
    id: "prawa",
    title: "Przeniesienie umowy",
    pozycje: [
      { id: "cesja", label: "Cesja", pomoc: "Czy możesz przenieść umowę na inną osobę lub firmę." },
      { id: "podnajem", label: "Podnajem", pomoc: "Np. wynajem sali na godziny fizjoterapeucie albo innemu trenerowi." },
      { id: "zmianaNajemcy", label: "Zmiana spółki / najemcy", pomoc: "Czy możesz przepisać umowę na spółkę albo nowego właściciela studia." },
      { id: "pierwszenstwo", label: "Prawo pierwszeństwa przedłużenia", pomoc: "Pierwszeństwo przy przedłużeniu, zanim lokal trafi do kogoś innego." },
      { id: "zmianaWlasciciela", label: "Skutki zmiany właściciela nieruchomości", pomoc: "Co z umową, gdy budynek zmieni właściciela. Zapytaj prawnika o datę pewną umowy." },
      { id: "nowyNajemca", label: "Możliwość wskazania nowego najemcy", pomoc: "Jeśli znajdziesz następcę, wychodzisz bez kar." },
    ],
  },
  {
    id: "studio",
    title: "Działalność studia",
    pozycje: [
      { id: "zgodaStudio", label: "Zgoda na studio treningowe", pomoc: "Wprost w umowie: treningi personalne i w małych grupach, ze sprzętem i muzyką." },
      { id: "godziny", label: "Godziny działalności", pomoc: "Czy możesz pracować rano, wieczorem i w weekendy." },
      { id: "halas", label: "Ograniczenia hałasu", pomoc: "Odkładane ciężary, muzyka, sąsiedzi za ścianą." },
      { id: "szyld", label: "Możliwość szyldu", pomoc: "Gdzie i jak duży. Szyld to codzienna darmowa reklama." },
    ],
  },
  {
    id: "adaptacja",
    title: "Adaptacja i nakłady",
    pozycje: [
      { id: "zgodaAdaptacja", label: "Zgoda na adaptację", pomoc: "Na piśmie, z zakresem prac." },
      { id: "praceWlasciciela", label: "Zakres prac właściciela", pomoc: "Co zrobi właściciel przed przekazaniem i na czyj koszt." },
      { id: "naklady", label: "Rozliczenie trwałych nakładów", pomoc: "Czy dostaniesz zwrot części kosztów np. podłogi, wentylacji, łazienek." },
      { id: "przywrocenie", label: "Obowiązek przywrócenia stanu", pomoc: "Czy po wyjściu musisz wszystko rozebrać na swój koszt." },
    ],
  },
  {
    id: "technika",
    title: "Stan techniczny i przekazanie",
    pozycje: [
      { id: "elektryka", label: "Odpowiedzialność za instalację elektryczną", pomoc: "Kto płaci za awarie i modernizację." },
      { id: "ogrzewanie", label: "Odpowiedzialność za ogrzewanie", pomoc: "Kto naprawia i w jakim czasie." },
      { id: "wentylacja", label: "Odpowiedzialność za wentylację / klimatyzację", pomoc: "Przy kilku osobach na sali to sprawa zdrowia i komfortu." },
      { id: "dach", label: "Odpowiedzialność za dach, przecieki i wilgoć", pomoc: "Wilgoć niszczy podłogę i sprzęt. Ustal, kto usuwa przyczynę." },
      { id: "protokol", label: "Protokół przekazania ze zdjęciami", pomoc: "Zdjęcia ścian, podłóg i liczników chronią Twoją kaucję." },
      { id: "terminPrzekazania", label: "Termin przekazania lokalu", pomoc: "Konkretna data. Dobrze, gdy opóźnienie właściciela przesuwa start czynszu." },
    ],
  },
];
export const WARUNKI_WSZYSTKIE = WARUNKI.flatMap((g) => g.pozycje);

/** Kolejność decyzji z lekcji „Nie kupujesz sprzętu do lokalu”. */
export const KOLEJNOSC = ["Oferta", "Rodzaj klienta", "Sposób prowadzenia treningów", "Liczba osób jednocześnie", "Ruchy, które muszą wykonywać", "Układ sali", "Sprzęt"] as const;

/** Na co patrzeć przy wyborze lokalu (własnymi słowami, z tej samej lekcji). */
export const NA_CO_PATRZEC = [
  "Zarabia sala, na której trener pracuje z klientami. Duża recepcja i zaplecze tylko kosztują.",
  "60 m² dobrze ustawionej sali bywa lepsze niż 100 m² z martwymi metrami.",
  "Strefa konsultacji to miejsce sprzedaży: prywatność, a jednocześnie widok na atmosferę studia.",
  "Parking, łatwe wejście i szatnia dopasowana do prawdziwego ruchu.",
  "Sprzęt dobierasz na końcu: do układu sali i liczby osób trenujących naraz.",
] as const;

/** Wiersze do pliku CSV (otworzy go Excel i Arkusze Google). */
export function doCsv(lokale: Lokal[]) {
  const esc = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const kol = [...POLA.map((p) => p.label), "Czynsz brutto", "Pełny koszt miesięczny", "Koszt za m² sali", ...PRZYCHODY.map((p) => `Koszt / ${p / 1000}k`)];
  const wiersze = lokale.map((l) => {
    const w = policz(l);
    const r = (n: number | null) => (n == null ? "" : String(Math.round(n * 100) / 100).replace(".", ","));
    return [...POLA.map((p) => l.dane[p.id] ?? ""), r(w.brutto), r(w.pelny), r(w.zaM2), ...w.udzialy.map((u) => (u.udzial == null ? "" : proc(u.udzial)))];
  });
  return [kol, ...wiersze].map((row) => row.map(esc).join(";")).join("\n");
}
