// Ścieżka v2 (14 kroków + ankieta): cały program Dochodowego Studia, nie tylko marketing — także obsługa zgłoszeń,
// sprzedaż i utrzymanie klientów (decyzja Pawła 2026-11-27). Specyfikacja: materialy/analiza/sciezka-v2.md (sekcje 3–5).
// Źródła: know-how Bartka (materialy/wiedza: metodyka-bartka, prompty-bartka, asystent-sprzedazy-gpt) i teksty lekcji Skool
// (materialy/skool/tekst). Propozycje z researchu 2025–2026 (materialy/analiza/research-marketing-2026.md, sekcja 5)
// są w skryptach oznaczone „DO ZATWIERDZENIA”. Treść lekcji Bartka nie jest tu kopiowana: tylko zasady i krótkie zwroty.
// Id kroków i dokumentów z wersji 1 zostały bez zmian, żeby zapisane dokumenty uczestników nie przepadły.
import type { JourneyState } from "@/lib/store";
import type { Lesson, Stage, Step, StepStatus, SurveyQuestion } from "@/lib/journey-types";
import { LEKCJE, zrodlo, type IdLekcjiKursu } from "@/lib/kursy";

// ---------- ANKIETA STARTOWA (krok 0) ----------
// DO ZATWIERDZENIA: całość ankiety. Pytania v1 z rozmowy z Bartkiem (cel 89–90, waluta 82, godziny 75, problem wym. 1,
// poziom 73) + pytania z sekcji 4 sciezka-v2.md (cel w liczbach, czerwone linie, reklamy, szybkość kontaktu, konsultacja,
// opinie Google, baza i zgody, źródło klienta). Wszystkie pytania są obowiązkowe, więc każde ma odpowiedź „nie wiem / brak”.
export const SURVEY: SurveyQuestion[] = [
  { id: "studio", intro: "Zacznijmy od podstaw. Jak nazywa się Twoje studio i gdzie jest?", question: "Jak nazywa się Twoje studio i w jakim jest mieście?", placeholder: "np. Studio Forma, Poznań" },
  {
    id: "etap", intro: "Gdzie dziś jesteś? Inaczej prowadzę kogoś przed otwarciem, a inaczej działające studio.", question: "Gdzie dziś jesteś z biznesem?",
    options: [
      { value: "przed", label: "Dopiero otwieram studio, nie mam jeszcze klientów" },
      { value: "dziala", label: "Studio działa, ale klienci przychodzą nieregularnie" },
      { value: "regularnie", label: "Studio działa i mam regularny napływ klientów" },
    ],
  },
  {
    id: "model", intro: "Inaczej pozyskujemy klientów dla właściciela, a inaczej dla zespołu. Jak pracujesz?", question: "Jak pracujesz?",
    help: "Inaczej pozyskujemy klientów dla właściciela, a inaczej dla zespołu.",
    options: [
      { value: "solo", label: "Prowadzę treningi samodzielnie" },
      { value: "trenerzy", label: "Mam 1–3 trenerów" },
      { value: "zespol", label: "Mam zespół z managerem albo kilka lokalizacji" },
    ],
  },
  {
    id: "cel-liczby", intro: "Marketing i sprzedaż mają służyć celowi biznesowemu. Mówmy w liczbach, nawet jeśli to na razie szacunek.",
    question: "Ilu nowych klientów miesięcznie potrzebujesz i do kiedy?",
    help: "Możesz dopisać przychód, który chcesz mieć. Dokładnie przeliczymy to w kroku „Cel, budżet i czas”.",
    placeholder: "np. 6 nowych klientów miesięcznie od lutego, przychód 40 tys. zł",
  },
  {
    id: "zrodla", intro: "Skąd dziś przychodzą klienci? Bez oceniania, potrzebuję prawdy.", question: "Skąd dziś przychodzą do Ciebie klienci?",
    options: [
      { value: "brak", label: "Jeszcze nie mam klientów" },
      { value: "polecenia", label: "Głównie z poleceń i przypadkiem" },
      { value: "social", label: "Z social mediów, bez reklam" },
      { value: "reklamy", label: "Z reklam płatnych" },
      { value: "kilka", label: "Z kilku źródeł naraz" },
      { value: "niewiem", label: "Nie wiem, nie zapisuję, skąd przychodzą" },
    ],
  },
  {
    id: "problem", intro: "Co najbardziej Cię blokuje? Od tego zaczniemy diagnozę.", question: "Co najbardziej Cię dziś blokuje?",
    options: [
      { value: "zgloszenia", label: "Za mało zgłoszeń" },
      { value: "jakosc", label: "Zgłoszenia są drogie albo słabej jakości" },
      { value: "sprzedaz", label: "Zgłoszenia są, ale mało kto kupuje" },
      { value: "oferta", label: "Nie wiem, co i komu sprzedawać" },
      { value: "odchodza", label: "Klienci odchodzą po kilku miesiącach" },
      { value: "czas", label: "Brakuje mi czasu na marketing" },
    ],
  },
  {
    id: "kontakt", intro: "Teraz to, co dzieje się po zgłoszeniu. Właśnie tu studia tracą najwięcej pieniędzy.",
    question: "Jak szybko ktoś ze studia oddzwania do nowego zgłoszenia?",
    help: "Kto to robi i w czym zapisuje zgłoszenia, ustalimy w kroku o obsłudze zgłoszeń.",
    options: [
      { value: "5min", label: "Zwykle w ciągu 5 minut" },
      { value: "godzina", label: "Zwykle w ciągu godziny" },
      { value: "dzien", label: "Tego samego dnia" },
      { value: "pozniej", label: "Później albo różnie, zależy od dnia" },
      { value: "brak", label: "Nie wiem albo nie mam jeszcze zgłoszeń" },
    ],
  },
  {
    id: "konsultacja", intro: "Pierwsze spotkanie decyduje o sprzedaży. Jak to wygląda u Ciebie?",
    question: "Jak wygląda pierwsze spotkanie z nowym klientem?",
    help: "Ile takich spotkań masz w miesiącu, policzymy w diagnozie.",
    options: [
      { value: "bez", label: "Bez konsultacji: podaję cennik albo zapraszam na trening próbny" },
      { value: "nie-licze", label: "Prowadzę konsultację, ale nie liczę, ile osób potem kupuje" },
      { value: "mniej", label: "Prowadzę konsultację i kupuje mniej niż połowa osób" },
      { value: "wiecej", label: "Prowadzę konsultację i kupuje połowa osób albo więcej" },
      { value: "brak", label: "Nie mam jeszcze nowych klientów" },
    ],
  },
  {
    id: "reklamy", intro: "Wydatki na reklamy to dane, nie ocena. Chcę wiedzieć, od czego zaczynamy.", question: "Ile miesięcznie wydajesz dziś na reklamy?",
    options: [
      { value: "0", label: "Nic" },
      { value: "do1k", label: "Do 1 tys. zł" },
      { value: "1-3k", label: "1–3 tys. zł" },
      { value: "3-6k", label: "3–6 tys. zł" },
      { value: "6k+", label: "Więcej niż 6 tys. zł" },
    ],
  },
  {
    id: "opinie", intro: "Zanim ktoś zadzwoni, sprawdza studio w Google.", question: "Ile masz opinii w Google?",
    options: [
      { value: "brak", label: "Nie mam wizytówki Google" },
      { value: "0-9", label: "0–9" },
      { value: "10-19", label: "10–19" },
      { value: "20-49", label: "20–49" },
      { value: "50+", label: "50 i więcej" },
    ],
  },
  {
    id: "baza", intro: "Najtańszy nowy klient to często ktoś, kto już zna studio. Sprawdźmy, kogo masz w bazie.",
    question: "Ilu masz aktywnych klientów, ilu byłych w bazie i na co masz ich zgody?",
    help: "Zgody na kontakt (SMS, telefon, e-mail) i na pokazywanie zdjęć, metamorfoz i opinii. Jeśli nie wiesz, napisz „nie wiem”.",
    placeholder: "np. 30 aktywnych, ok. 200 byłych; zgody na SMS ma część; zgody na pokazanie wyników: 4 osoby",
  },
  {
    id: "waluta", intro: "Masz dwie waluty: czas i pieniądze. Za darmo nie będzie. Czym chcesz płacić?", question: "Czym chcesz płacić za nowych klientów?",
    help: "Masz dwie waluty: czas i pieniądze. Za darmo nie będzie.",
    options: [
      { value: "czas", label: "Bardziej czasem: treści, relacje, rozmowy" },
      { value: "pieniadze", label: "Bardziej pieniędzmi: reklamy" },
      { value: "oba", label: "Jednym i drugim" },
      { value: "policz", label: "Nie wiem, niech system mi to policzy" },
    ],
  },
  {
    id: "godziny", intro: "Ile godzin tygodniowo realnie dasz na marketing i obsługę zgłoszeń? Ułożę plan pod Twój tydzień.",
    question: "Ile godzin tygodniowo realnie dasz na marketing i obsługę zgłoszeń?",
    options: [
      { value: "2", label: "Do 2 godzin" },
      { value: "5", label: "2–5 godzin" },
      { value: "10", label: "5–10 godzin" },
      { value: "10+", label: "Ponad 10 godzin albo ktoś mi pomaga" },
    ],
  },
  {
    id: "czerwone-linie", intro: "Plan ma pasować do Ciebie. Napisz, czego nie chcesz robić. Jeśli coś z tego blokuje cel, powiem to wprost i poszukamy, kto to przejmie.",
    question: "Czego nie chcesz robić w marketingu i sprzedaży?",
    placeholder: "np. nie chcę się nagrywać, nie lubię dzwonić; albo wpisz: nic",
  },
  {
    id: "poziom", intro: "Ostatnie pytanie: jak radzisz sobie z narzędziami? Dopasuję, jak mocno prowadzę Cię za rękę. Materiały o studiu wkleisz w pierwszym kroku, nic nie przepisujesz ręcznie.",
    question: "Jak radzisz sobie z narzędziami (Menedżer reklam, Canva, statystyki)?",
    options: [
      { value: "poczatkujacy", label: "Słabo, prowadź mnie za rękę" },
      { value: "sredni", label: "Średnio, wybiorę z gotowych propozycji" },
      { value: "zaawansowany", label: "Dobrze, chcę liczb i analiz" },
    ],
  },
];

/** Pytania z ankiety v1, których już nie zadajemy. Zostają tylko po to, żeby asystent widział odpowiedzi osób, które je wypełniły. */
const LEGACY_SURVEY: SurveyQuestion[] = [
  {
    id: "cel", question: "Jaki jest Twój główny cel na najbliższe 3 miesiące?",
    options: [
      { value: "otwarcie", label: "Otworzyć studio i zdobyć pierwszych klientów" },
      { value: "grafik", label: "Zapełnić grafik (mój albo nowego trenera)" },
      { value: "przychod", label: "Zwiększyć przychody" },
      { value: "odchodzacy", label: "Zastąpić klientów, którzy odchodzą" },
      { value: "skalowanie", label: "Skalować: kolejna lokalizacja, większy zespół" },
    ],
  },
  {
    id: "materialy", question: "Jakie materiały o studiu już masz?",
    options: [
      { value: "nic", label: "Prawie nic" },
      { value: "oferta", label: "Ofertę i cennik" },
      { value: "wiecej", label: "Ofertę, opis klientów, wyniki" },
      { value: "audyt", label: "Audyt Dochodowego Studia i inne dokumenty" },
    ],
  },
];

// ---------- ETAPY STUDIA (52) ----------
const ALL = [
  "materialy", "diagnoza", "dna", "awatar", "oferta", "cel-budzet", "sprzedaz",
  "strategia", "gotowosc", "materialy-lejka", "plan", "wyniki", "okazje", "utrzymanie",
];

// DO ZATWIERDZENIA: „Przed otwarciem” = kroki 1–11 (sciezka-v2.md, sekcja 3). Wyniki, okazje i utrzymanie dochodzą,
// gdy pojawią się pierwsi klienci i dane. Kroki i tak odblokowują się po kolei (stepStatuses), lista to proponowana ścieżka.
export const STAGES: Stage[] = [
  {
    id: "przed-otwarciem",
    name: "Przed otwarciem",
    description: "Nie masz jeszcze klientów ani danych. Marketing i sprzedaż budujemy od zera.",
    focus: "awatar, oferta 90 dni z płatnym pierwszym spotkaniem, obsługa pierwszych zgłoszeń i strategia zdobycia pierwszych klientów (często event otwarcia)",
    steps: ALL.filter((s) => s !== "wyniki" && s !== "okazje" && s !== "utrzymanie"),
  },
  {
    id: "bez-systemu",
    name: "Działające studio bez przewidywalnego marketingu",
    description: "Masz klientów, ofertę i jakieś działania, ale nie masz systemu, który regularnie przyprowadza nowych klientów i zamienia zgłoszenia w sprzedaż.",
    focus: "diagnoza na liczbach, obsługa zgłoszeń i konsultacja, potem 1–2 dobrze dobrane lejki",
    steps: ALL,
  },
  {
    id: "rozwiniete",
    name: "Studio rozwinięte",
    description: "Marketing już działa. Teraz liczą się rentowność, wąskie gardła i to, jak długo klienci zostają.",
    focus: "wąskie gardła w liczbach, skuteczność sprzedaży, utrzymanie klientów i opłacalność pozyskiwania",
    steps: ALL,
  },
];

/** DO ZATWIERDZENIA: w rozmowie nie ma progów. Docelowo etap potwierdza diagnoza z danych (krok 2), a nie sama deklaracja. */
export function detectStage(a: Record<string, string>): string {
  // a.cel: odpowiedź z ankiety v1 (pytanie już niezadawane), zostaje dla zgodności.
  if (a.etap === "przed" || a.zrodla === "brak" || a.cel === "otwarcie") return "przed-otwarciem";
  const scale = a.model === "zespol" || a.cel === "skalowanie" || a.zrodla === "kilka" || a.zrodla === "reklamy" || a.reklamy === "3-6k" || a.reklamy === "6k+";
  if (a.etap === "regularnie" && scale) return "rozwiniete";
  return "bez-systemu";
}

export function surveySummary(a: Record<string, string> | null): string {
  if (!a) return "";
  return [...SURVEY, ...LEGACY_SURVEY].map((q) => {
    const v = a[q.id];
    if (!v) return null;
    const label = q.options?.find((o) => o.value === v)?.label ?? v;
    return `- ${q.question} ${label}`;
  }).filter(Boolean).join("\n");
}

// ---------- LEKCJE ----------
// Lekcje kroków = nagrania z kursów Bartka na Skool (biblioteka: src/lib/kursy.ts, generowana z materialy/skool/struktura.json).
// sk(id, staryId?, tytuł?): staryId = id lekcji z poprzedniej wersji ścieżki, żeby zapisane „obejrzane” nie przepadło.
// Źródło lekcji: „Skool · <kurs> · <moduł>”. Lekcja bez wideo ma tylko link „Otwórz na Skool” (wolno ją dać, gdy jest kluczowa).
// DO ZATWIERDZENIA (Bartek): wybór i kolejność lekcji w krokach.
function sk(id: IdLekcjiKursu, staryId?: string, title?: string): Lesson {
  const k = LEKCJE[id];
  return { id: staryId ?? k.id, title: title ?? k.title, source: zrodlo(k), video: k.video, skool: k.skool, attachments: k.attachments, opis: k.opis, ref: k.id };
}

const L = {
  // 1. Materiały: start programu i karta progresu (stan wyjściowy)
  dsStart: sk("sk-4b60c34862", "ds-zacznij-tutaj", "Dochodowe Studio: START"),
  kartaProgresu: sk("sk-a7ed7e36ac"),
  // 2. Diagnoza: szybki kontakt i najczęstszy błąd
  szybkiKontakt: sk("sk-3cc7a90977", "szybki-kontakt"),
  najwiekszyBlad: sk("sk-75928383da"),
  // 3. DNA: model biznesowy i filozofia
  playbook: sk("sk-d043034a05", "playbook"),
  filozofia: sk("sk-4a903b57a7", undefined, "Filozofia Dochodowego Studia"),
  // 4. Awatar
  profilKlienta: sk("sk-a81696b2b8", "profil-klienta"),
  segmentacja: sk("sk-a5ec776c62"),
  awatarPlaybook: sk("sk-fc75c5f173", "awatar-klienta-studia"),
  // 5. Oferta
  nieTrening: sk("sk-492368b2a9", "nie-sprzedajesz-treningu"),
  oferta: sk("sk-22c2cbbb06", "oferta-pakiety"),
  matryca: sk("sk-39faca2470", "matryca-oferty"),
  matryca2: sk("sk-2f0ab356c5"),
  semi: sk("sk-44f9d80177", "semi-personalne", "Semi-personal: wprowadzenie"),
  // 6. Cel, budżet i czas
  systemKlientow: sk("sk-b6604ace85", "system-klientow", "System Klientów: zacznij tutaj"),
  coNaStart: sk("sk-0061ec77da"),
  // 7. Obsługa zgłoszeń i konsultacja
  systemSprzedazy: sk("sk-2e6c2eb9e4", "system-sprzedazy"),
  szkolenieDm: sk("sk-02da83d399", "szkolenie-dm"),
  skryptTelefonu: sk("sk-6017aadb64", "skrypt-telefonu"),
  skryptKonsultacji: sk("sk-04870f9197", "skrypt-konsultacji"),
  obiekcje: sk("sk-50379bfda4", "obiekcje"),
  // 8. Strategia
  marketingBezplatny: sk("sk-b3408c6a58"),
  reklamaFormularz: sk("sk-3442052a08"),
  // 9. Gotowość lejka (konto i kampania Meta)
  facebookStart: sk("sk-b5c32cd906"),
  menagerReklam: sk("sk-e20666522a"),
  portfolio: sk("sk-cd93054782"),
  uruchomKampanie: sk("sk-042ef15ad5"),
  // 10. Koncepcje i gotowce
  grafiki: sk("sk-c1b563ed93"),
  film: sk("sk-d79a46b5a7"),
  teksty: sk("sk-ab212ae9f4"),
  profilPodOferte: sk("sk-5fce7e5d7e", "profil-pod-oferte"),
  asystentMarketingu: sk("sk-2e4846e549"),
  // 11. Mapa wdrożenia
  socialMedia: sk("sk-b91b76bea2", "social-media-rytm"),
  crm: sk("sk-63a6a203b0"),
  // 12. Przegląd tygodniowy (1.14 bez wideo, kluczowa: zasady oceny reklam)
  analizaReklam: sk("sk-e163b56723"),
  wynikiAnaliza: sk("sk-6adfab9d8f"),
  ocenaReklam: sk("sk-c32d1296ac", "jak-oceniac-reklamy"),
  spowiedz: sk("sk-fcb50749de"),
  // 13. Okazje
  checklistaOtwarcia: sk("sk-bc5eb842d3", "checklista-otwarcia"),
  event: sk("sk-a8b1606a5f", "otwarcie-event"),
  partnerstwa: sk("sk-9a72e69aee"),
  // 14. Utrzymanie
  spolecznosc: sk("sk-03e9c54610", "spolecznosc"),
  usprawnienia: sk("sk-8667af86e2", "usprawnienia"),
  treningPrzepada: sk("sk-7cbaace360", "trening-przepada"),
  wideoPowitalne: sk("sk-23bd68706a"),
} satisfies Record<string, Lesson>;

// ---------- ZASADY WSPÓLNE DLA SKRYPTÓW ----------
const STATUSES = "Przy każdej istotnej informacji podaj status: POTWIERDZONE / DEKLARACJA / HIPOTEZA / BRAK DANYCH / SPRZECZNOŚĆ.";
// DO ZATWIERDZENIA: konstrukcja „krok 0: czytam Twoje dokumenty i pokazuję, co znalazłem” (sciezka-v2.md, sekcja 5).
const READ_FIRST = "Na start przeczytaj zatwierdzone dokumenty i w 2–3 zdaniach pokaż, co z nich już wiesz. Potem pytaj tylko o braki.";
const PROPOSALS = "Punkty „DO ZATWIERDZENIA” to propozycje spoza materiałów Bartka (research 2025–2026). Podawaj je jako propozycję do decyzji właściciela, nie jako zasadę Dochodowego Studia. Benchmark zewnętrzny podawaj zawsze ze źródłem i oddzielaj od danych studia.";
const RED_LINES = "Uwzględnij czerwone linie z ankiety (czego właściciel nie chce robić). Gdy blokują cel, powiedz to wprost i ustal, kto przejmie to zadanie.";

// Etapy na mapie. Kroki jednego etapu stoją obok siebie (wymóg mapy terenu).
const P = {
  fundament: "Fundament",
  klient: "Klient i oferta",
  sprzedaz: "Cel i sprzedaż",
  strategia: "Strategia i lejek",
  wdrozenie: "Wdrożenie",
  wyniki: "Wyniki i rozwój",
};

// ---------- KROKI ŚCIEŻKI ----------
export const STEPS: Step[] = [
  {
    id: "materialy", no: "1", phase: P.fundament,
    title: "Twoje materiały i obraz firmy",
    goal: "Zebrać w jednym miejscu wszystko, co już wiesz o studiu, zamiast wypełniać formularze.",
    docId: "inwentaryzacja", docTitle: "Inwentaryzacja i wstępny obraz firmy",
    docTemplate: `ETAP 1 — INWENTARYZACJA
Materiał | Jakie informacje zawiera | Data / aktualność | Co z niego wynika | Czego nie można potwierdzić

DANE DO DIAGNOZY (jeśli są)
Ostatnie 30–50 zgłoszeń (data i godzina wpływu, pierwszy kontakt, wynik):
Konsultacje i pierwsze spotkania (ile, ile zakończyło się zakupem):
Wizytówka Google (liczba opinii, ocena, data ostatniej opinii):
Zgody w formularzu i w bazie (SMS, telefon, e-mail, wizerunek):
Metamorfozy i opinie klientów ze zgodą na publikację (ile):

ETAP 2 — WSTĘPNE DNA (ze statusami)
Opis studia i modelu biznesowego:
Grupy klientów i ich problemy:
Oferta, obietnica i mechanizm transformacji:
Cennik oraz ekonomika:
Zespół i przepustowość:
Pozycjonowanie i przewagi:
Materiały dowodowe:
Dotychczasowy marketing:
Proces sprzedaży i obsługi zgłoszeń:
Utrzymanie klientów (jak długo zostają, kontynuacje):
Cele i ograniczenia:

ETAP 3 — LUKI
A. Krytyczne:
B. Ważne:
C. Opcjonalne:

ETAP 4 — PODSUMOWANIE
Co już wiemy:
Mocne strony:
Co może ograniczać marketing i sprzedaż:
5 informacji do uzupełnienia w pierwszej kolejności:`,
    // DO ZATWIERDZENIA: statystyki wizytówki Google i zgody w formularzu (research 5.1, krok 1).
    script: `Prompt 00.1 „Analizator materiałów” (37). Jesteś analitykiem strategicznym. Nie tworzysz jeszcze reklam, lejków, skryptów ani strategii: masz zrozumieć biznes.
- Poproś o wklejenie wszystkiego, co właściciel ma: audyt Dochodowego Studia, oferta i cennik, opis klienta, liczba klientów i trenerów, wyniki sprzedaży, lokalizacja, dotychczasowe kampanie, opinie i historie klientów, proces obsługi zgłoszeń, cele, linki do Instagrama, Facebooka, strony i wizytówki Google. Nie zakładaj, że ma wszystko.
- Poproś też o listę ostatnich 30–50 zgłoszeń (data i godzina wpływu, pierwszy kontakt, wynik) i notatki z konsultacji. Bartek zaczyna od nich diagnozę. Jeśli ich nie ma, zapisz to jako lukę A.
- Nie pytaj o to, co jest w materiałach. Pokaż sprzeczności i ich źródła. Oznacz dane, które mogą być nieaktualne.
- Nie traktuj przykładowego awatara jako opisu prawdziwych klientów. Oddziel obiecane rezultaty od udokumentowanych.
- ${STATUSES}
- DO ZATWIERDZENIA: poproś o zrzut statystyk wizytówki Google (liczba opinii, ocena, data ostatniej) i o informację, jakie zgody zbiera formularz zgłoszeniowy.
- Na końcu zapytaj, czy właściciel zgadza się z obrazem firmy. Nie przechodź dalej bez przedstawienia wyników analizy.
- ${PROPOSALS}`,
    opener: "Zaczynamy od tego, co już masz. Wklej tu wszystko o studiu: audyt, ofertę i cennik, opis klientów, wyniki, opinie, linki do profili, a jeśli masz, także listę ostatnich zgłoszeń. Może być chaotycznie i niekompletnie, ja to uporządkuję. Co masz pod ręką?",
    exitCriteria: [
      "Wszystkie materiały są w jednym miejscu (wklejone w rozmowie)",
      "Każda ważna informacja ma status: potwierdzone, deklaracja, hipoteza albo brak danych",
      "Jest lista braków A / B / C i 5 rzeczy do uzupełnienia najpierw",
      "Obraz firmy jest potwierdzony w rozmowie jako prawdziwy",
    ],
    lessons: [L.dsStart, L.kartaProgresu],
    needs: [],
  },
  {
    id: "diagnoza", no: "2", phase: P.fundament,
    title: "Diagnoza i uzupełnienie braków",
    goal: "Sprawdzić na liczbach, co naprawdę ogranicza studio: oferta, za mało zgłoszeń, słaba sprzedaż, pełny grafik czy odchodzący klienci.",
    docId: "diagnoza", docTitle: "Diagnoza studia",
    docTemplate: `Etap studia (z danych, nie z deklaracji):
Główny typ problemu (oferta / za mało zgłoszeń / słaba sprzedaż / przepustowość / utrzymanie klientów):

AUDYT OSTATNICH 30–50 ZGŁOSZEŃ (przed otwarciem: research rynku)
Liczba zgłoszeń i ich źródła:
Czas do pierwszego kontaktu (mediana, ile zgłoszeń z kontaktem do 5 minut):
Zgłoszenie → rozmowa → umówione spotkanie → obecność → sprzedaż (liczby):
Najczęstsze powody utraty:
Research rynku przed otwarciem (3–5 lokalnych konkurentów: oferta, cena, opinie):

SPRZEDAŻ I UTRZYMANIE
Pierwsze spotkania i konsultacje (ile miesięcznie, ile kończy się zakupem):
Aktywni klienci, odejścia w ostatnich 90 dniach, średni czas współpracy:
Zgody w bazie (kanał, ile osób):
Google (liczba opinii, ocena, data ostatniej):

WNIOSKI
Co już działa:
Wąskie gardła:
Możliwości zespołu i wolne miejsca w grafiku:
Gotowość do obsługi zgłoszeń (kto, w czym zapisuje, jak szybko):
Uzupełnione braki (pytanie → odpowiedź):
Co należy zrobić najpierw:`,
    // DO ZATWIERDZENIA: pola retencji, zgód i Google (research 5.1, krok 2); research rynku przed otwarciem (metodyka-bartka, sekcja 3, „do potwierdzenia”).
    script: `Prompty 00.2 „Diagnosta biznesowy” i 00.3 „Uzupełnianie braków” (36, 37). ${READ_FIRST}
- Oceń według metodyki Dochodowego Studia: ofertę, klienta docelowego, wyróżniki, zespół, proces sprzedaży i ekonomikę. Rozstrzygnij, czy problemem jest oferta, zbyt mała liczba zgłoszeń, słaba sprzedaż, niewykorzystana przepustowość czy odchodzący klienci.
- Audyt na start (Bartek): ostatnie 30–50 zgłoszeń i dotychczasowe konsultacje. Policz medianę czasu do pierwszego kontaktu, ile zgłoszeń miało kontakt do 5 minut, ile umówień, ile osób przyszło, ile kupiło i dlaczego reszta odpadła. Najpierw szukasz etapu, na którym uciekają ludzie, dopiero potem myślisz o reklamie.
- Brak zapisanych zgłoszeń to też wynik diagnozy: pierwszym zadaniem będzie CRM ze statusami (krok „Obsługa zgłoszeń i konsultacja”).
- Studio przed otwarciem: zamiast audytu zgłoszeń research rynku: 3–5 lokalnych konkurentów (oferta, cena, opinie), kto mieszka w okolicy i ilu klientów trzeba na start.
- Pytania: tylko braki z listy A, potem B. Jedno pytanie naraz, przy każdym jednym zdaniem wyjaśnij, do czego potrzebujesz odpowiedzi. Nie pytaj o rzeczy, które nie wpływają na decyzje.
- Potwierdź etap studia na podstawie danych (przed otwarciem / działające bez przewidywalnego marketingu / rozwinięte). Jeśli różni się od ankiety, powiedz to wprost.
- Gdy zgłoszenia są, ale nie zamieniają się w sprzedaż, albo kontakt trwa godzinami: powiedz wprost, że najpierw naprawiamy obsługę zgłoszeń, a dopiero potem kupujemy ruch. Zablokuj rekomendowanie reklam, jeśli studio nie obsłuży zgłoszeń.
- DO ZATWIERDZENIA: dopytaj o utrzymanie (aktywni klienci, odejścia w pierwszych 90 dniach, średni czas współpracy), zgody w bazie (od 11.2024 prawo komunikacji elektronicznej wymaga zgody na każdy kanał, także u byłych klientów) i Google (liczba opinii, ocena, świeżość).
- ${PROPOSALS}`,
    opener: "Mam obraz firmy. Teraz sprawdzę na liczbach, gdzie studio traci klientów. Zacznijmy od ostatnich zgłoszeń: masz je gdzieś zapisane, z datą i tym, co się z nimi stało?",
    exitCriteria: [
      "Główny problem studia jest nazwany i wynika z liczb albo z wyraźnego braku danych",
      "Ostatnie 30–50 zgłoszeń jest policzone: czas kontaktu, umówienia, obecność, sprzedaż (przed otwarciem: research rynku)",
      "Etap studia jest potwierdzony danymi",
      "Braki krytyczne (A) są uzupełnione",
    ],
    lessons: [L.szybkiKontakt, L.najwiekszyBlad],
    needs: ["inwentaryzacja"],
  },
  {
    id: "dna", no: "3", phase: P.fundament,
    title: "DNA marketingowe studia",
    goal: "Jeden dokument o studiu, z którego korzystają wszystkie kolejne kroki: oferta, sprzedaż, lejki i utrzymanie.",
    docId: "dna", docTitle: "DNA marketingowe studia",
    docTemplate: `DNA MARKETINGOWE STUDIA — [NAZWA]
1. Model biznesowy:
2. Awatar klienta (wstępnie):
3. Oferta i transformacja:
4. Pozycjonowanie:
5. Dowody skuteczności (ze zgodą na publikację?):
6. Marketing obecnie:
7. Sprzedaż i obsługa (pierwszy kontakt, pierwsze spotkanie, skuteczność, utrzymanie):
8. Ekonomika i możliwości (przychód na klienta, marża, akceptowalny koszt klienta, wolne miejsca):
9. Cele i ograniczenia (także czego właściciel nie chce robić):
10. Luki i gotowość:

Najważniejsze przewagi studia:
Najważniejsze problemy marketingowe i sprzedażowe:
Zasoby gotowe do wykorzystania:
Brakujące zasoby:
Ograniczenia wdrożeniowe:
Pytania bez odpowiedzi:`,
    script: `Prompt 00.4 „Generator DNA” (31, 36). Złóż ostateczny, uporządkowany dokument studia: punkt odniesienia dla każdego kolejnego kroku. DNA to dane studia przefiltrowane przez metodykę Dochodowego Studia.
- Korzystaj z inwentaryzacji, diagnozy i ankiety. ${STATUSES}
- Najpierw pokaż DNA do zatwierdzenia. Popraw to, co właściciel wskaże.
- DNA to żywy dokument: później będzie aktualizowane wraz z wiedzą o klientach. Zmiany w DNA zatwierdza właściciel.`,
    opener: "Składam teraz DNA studia z tego, co już wiemy. Zanim je przygotuję: czy jest coś ważnego o studiu, czego jeszcze nie ma w naszej rozmowie?",
    exitCriteria: ["DNA ma wszystkie 10 obszarów", "Każda ważna informacja ma status", "DNA jest zatwierdzone jako prawdziwy obraz studia"],
    lessons: [L.playbook, L.filozofia],
    needs: ["inwentaryzacja", "diagnoza"],
  },
  {
    id: "awatar", no: "4", phase: P.klient,
    title: "Awatar klienta",
    goal: "Opisać prawdziwych klientów studia ich własnymi słowami: co ich boli, dlaczego chcą zmiany teraz i co ich zatrzymuje.",
    docId: "awatar", docTitle: "Awatar klienta",
    docTemplate: `Nazwa grupy klientów:
Sytuacja życiowa:
Główne problemy (słowami klienta):
Cel i to, co naprawdę chce zmienić:
Dlaczego teraz (co się ostatnio wydarzyło):
Koszt braku zmiany (za rok, za 3–5 lat):
Wcześniejsze próby i dlaczego nie zadziałały:
Moment, w którym zwykle odpuszcza:
Czego się obawia:
Kto decyduje (samodzielnie, z partnerem, kto płaci):
Obiekcje i odpowiedzi (obiekcja → co odpowiadamy):
Motywacje:
Język klienta (dosłowne zwroty):
3 cytaty klientów (dosłownie, bez imion):
Gdzie można spotkać takich klientów (miejsca, media, pora dnia):
Druga grupa klientów (jeśli jest):
Skąd to wiemy (rozmowy, konsultacje, opinie) i statusy:`,
    // DO ZATWIERDZENIA: „głos klienta” z ankiet i notatek (sciezka-v2.md, krok 4).
    script: `Moduł 01, kroki 1–2 (41). „Awatar przed ofertą”. „Język klienta zamiast języka trenera”. ${READ_FIRST}
- Buduj awatar na podstawie prawdziwych klientów studia: problemy, obawy, motywacje, wcześniejsze próby, rezultaty. Poproś o 2–3 najlepszych klientów, opinie, wiadomości i notatki z rozmów.
- Najlepsze źródło to notatki z telefonów i konsultacji. Pytania ze skryptów Bartka dają brakujące pola: dlaczego teraz, jak brak efektu wpływa na życie, co się stanie, jeśli nic się nie zmieni, w którym momencie zwykle odpuszcza, kto podejmuje decyzję.
- W materiałach DS częsty wniosek brzmi: problemem nie jest brak motywacji, tylko brak środowiska. Sprawdź, czy u tego studia też tak jest, nie zakładaj tego.
- Obiekcje: zbierz 3–5 najczęstszych z rozmów. Do każdej odpowiedź w stylu DS: zrozum → doprecyzuj → znajdź prawdziwą obiekcję → wróć do celu klienta → następny krok. Bez nacisku i bez zawstydzania.
- Awatar ma dawać materiał do 7 przekonań z lekcji o scenariuszach: ból, wątpliwość, koszt braku zmiany, pragnienie, pieniądze, wsparcie, zaufanie. Przyda się w gotowcach.
- Rozróżniaj cele klientów od ich cech. Nie buduj awatara z researchu konkurencji ani z samej demografii. Bez imion i danych zdrowotnych konkretnych osób w dokumencie.
- Gdy studio ma dwie wyraźne grupy, opisz główną i zaznacz drugą.
- DO ZATWIERDZENIA: „głos klienta”: właściciel wkleja odpowiedzi z ankiet i notatki z konsultacji, a Ty grupujesz bóle i powtarzające się zwroty.
- Na końcu kontrola jakości: wypisz, co jest założeniem bez potwierdzenia.
- ${PROPOSALS}`,
    opener: "Teraz klient. Pomyśl o 2–3 najlepszych klientach studia. Jakimi słowami opisali swój problem na pierwszej rozmowie?",
    exitCriteria: [
      "Awatar opiera się na prawdziwych klientach (rozmowy, konsultacje, opinie), nie na domysłach",
      "Są co najmniej 3 dosłowne cytaty klientów",
      "Każda z 3–5 najczęstszych obiekcji ma gotową odpowiedź",
      "Wiadomo, co jest pewne, a co jest hipotezą do sprawdzenia",
    ],
    lessons: [L.profilKlienta, L.segmentacja, L.awatarPlaybook],
    needs: ["dna"],
  },
  {
    id: "oferta", no: "5", phase: P.klient,
    title: "Oferta transformacyjna 90 dni",
    goal: "Sprzedawać zmianę w 90 dni, a nie godziny treningu, i ustalić płatne pierwsze spotkanie.",
    docId: "oferta", docTitle: "Oferta",
    docTemplate: `OFERTA BIZNESOWA (zmienia tylko właściciel)
Nazwa programu:
Dla kogo (sytuacje i pragnienia):
Dla kogo NIE jest:
Czym różni się od siłowni i karnetu:
Metoda w 3 filarach:
Efekty po 90 dniach (bez obietnic nie do udowodnienia):
Warianty (liczba treningów, ile razy w tygodniu, cena):
Co jest w cenie:
Limit miejsc (ile osób naraz na sali, ile nowych osób miesięcznie):
Za co studio odpowiada:

PIERWSZY KROK KLIENTA
Nazwa pierwszego spotkania (np. konsultacja startowa, sesja diagnostyczna):
Co się na nim dzieje (wywiad, część ruchowa, rekomendacja):
Cena pierwszego spotkania i zasada płatności przed terminem:
Kontynuacja po 90 dniach (co i kiedy proponujemy):

OFERTA MARKETINGOWA
Obietnica (jednym zdaniem):
Argumenty:
Dowody (prawdziwe, ze zgodą):
Bonusy (zamiast rabatu):
Filozofia studia:
Wezwanie do działania (z limitem miejsc):

DODATKI DO DECYZJI
Wersja tańsza zamiast rabatu (downsell):
Gwarancja (warunek, co zwracamy):
Ceny 3–5 lokalnych konkurentów:
Karty benefitowe (tak / nie / na jakich zasadach):

BRIEF DO LEJKÓW (kluczowe argumenty, dowody i komunikaty):`,
    // Wzór oferty: „Program Kobiecej Transformacji 90™” [A5]; doktryna pierwszego spotkania: Custom GPT „Asystent sprzedażowy” (Skool).
    // DO ZATWIERDZENIA: sekcja „Dodatki do decyzji”, pytania o wolne miejsca i obecność, kontynuacja w 75.–80. dniu (research 5.1, krok 5).
    // DO ZATWIERDZENIA: reguła wyboru pierwszego kroku (płatne spotkanie 100–250 zł / płatny start / darmowa rozmowa) — sciezka-v2.md, decyzja 3.
    script: `Moduł 01, kroki 3–6 (41, 93). Zasady: „Sprzedajemy zmianę, nie godzinę treningu”, „Jeden produkt główny: program 90 dni”. Metody (EMS, trening personalny, semi-personalny) to sposób realizacji rezultatu, dobierany po poznaniu klienta. ${READ_FIRST}
- Audyt oferty: czy sprzedaje rozwiązanie problemu awatara, czy pakiet treningów. „Pakiet 8 treningów za 900 zł” to cena, nie oferta. Cena bez oferty to licytacja, a w licytacji wygrywa tańszy.
- Wzór oferty DS (kolejność): dla kogo → czym różni się od siłowni → metoda w 3 filarach (np. trening dopasowany, wsparcie żywieniowe bez diet, kameralne środowisko) → efekty po 90 dniach → warianty z liczbą treningów i ceną (np. 2× i 3× w tygodniu) → co jest w cenie → dla kogo program NIE jest → filozofia → wezwanie „umów konsultację” z informacją o ograniczonej liczbie miejsc. Kameralność (1–3 osoby na sali) i brak oceniania to wyróżniki.
- Pierwszy krok (doktryna sprzedaży DS): pierwsza rozmowa sprzedaje płatne pierwsze spotkanie w studiu za 100–250 zł (wywiad, część ruchowa, rekomendacja). Program 90 dni sprzedaje się dopiero na tym spotkaniu. Nie pozycjonuj go jako „treningu próbnego”. Termin rezerwujemy dopiero po płatności.
- Rozwijasz ofertę MARKETINGOWĄ (nazwa, obietnica, argumenty, bonusy, pierwszy krok). Nie zmieniasz samodzielnie ceny, głównego produktu ani modelu biznesowego. Gdy problemem jest sam produkt, zasygnalizuj to i poleć konsultację z zespołem Dochodowego Studia.
- Bez obietnic efektów typu „schudniesz 10 kg”: „celem programu jest…”, „pracujemy nad…”.
- Zaproponuj 2–3 koncepcje oferty marketingowej, poleć jedną i uzasadnij. Na końcu wyłap niepotwierdzone obietnice i sprzeczności.
- DO ZATWIERDZENIA: zapytaj, ile wolnych miejsc tygodniowo studio ma na pierwsze spotkania i ilu umówionych faktycznie przychodzi (reguły wyboru płatnego albo darmowego wejścia Bartek jeszcze nie ustalił, domyślnie trzymaj się płatnego pierwszego spotkania). Zaproponuj: wersję tańszą zamiast rabatu, kontynuację proponowaną na przeglądzie celów ok. 75.–80. dnia, gwarancję tylko z jasnym warunkiem, porównanie z cenami 3–5 lokalnych konkurentów i decyzję o kartach benefitowych. Nazwa programu: dla kogo + cel + czas.
- ${PROPOSALS}`,
    opener: "Mając awatar, sprawdzimy ofertę. Co dziś sprzedajesz najczęściej, za ile i na jak długo?",
    exitCriteria: [
      "Jest jeden produkt główny: program 90 dni z wariantami, liczbą treningów i ceną",
      "Oferta odpowiada na problemy awatara i mówi, dla kogo NIE jest",
      "Pierwsze spotkanie ma nazwę, przebieg i cenę, a termin rezerwujemy po płatności",
      "Nie ma obietnic bez pokrycia ani dowodów bez zgody klienta",
    ],
    lessons: [L.nieTrening, L.oferta, L.matryca, L.matryca2, L.semi],
    needs: ["dna", "awatar"],
  },
  {
    id: "cel-budzet", no: "6", phase: P.sprzedaz,
    title: "Cel, budżet i czas",
    goal: "Przeliczyć cel na klientów, spotkania i zgłoszenia i świadomie wybrać: płacisz czasem czy pieniędzmi.",
    docId: "cel-budzet", docTitle: "Cel, budżet i czas",
    docTemplate: `Cel biznesowy (ilu nowych klientów, jaki przychód, do kiedy):
Wolne miejsca w grafiku (ile nowych osób studio realnie przyjmie miesięcznie):

KALKULATOR LEJKA (liczymy od końca)
Nowi klienci miesięcznie:
Skuteczność sprzedaży na pierwszym spotkaniu (%):
Potrzebne odbyte spotkania:
Obecność na umówionych spotkaniach (%):
Potrzebne umówione spotkania:
Umówienia ze zgłoszeń (%):
Potrzebne zgłoszenia:
Koszt zgłoszenia:
Budżet reklamowy miesięcznie i tygodniowo:
Liczba zestawów reklam na ten budżet:
Które liczby są ze studia, a które z benchmarku (i skąd):

CZAS I PIENIĄDZE
Wartość godziny właściciela (i skąd ta kwota):
Godziny tygodniowo na marketing i obsługę zgłoszeń:
Cały budżet (reklamy, montaż, grafika, narzędzia):
Porównanie: treści organiczne jako koszt czasu vs reklamy jako wydatek:
Wybór: czas / pieniądze / oba:
Scenariusze (ostrożny / realistyczny / optymistyczny) albo budżet testowy, jeśli brak danych:`,
    // DO ZATWIERDZENIA: pełny kalkulator (sprzedaż ← obecność ← umówienia ← zgłoszenia ← budżet) i reguła liczby zestawów (research 5.1, krok 6).
    script: `K6 (81–84, 89–91). Marketing podporządkowany celowi biznesowemu. ${READ_FIRST}
- Ustal cel biznesowy i przelicz go od końca (decyzja 26): potrzebni klienci → odbyte spotkania → umówione spotkania → zgłoszenia → budżet. Bierz skuteczność studia z diagnozy; jeśli jej nie ma, powiedz, że to założenie.
- Benchmarki z warsztatu oceny reklam DS (punkt startowy, nie gwarancja): koszt zgłoszenia z formularza 5–40 zł dobry, powyżej 40–60 zł do diagnozy; obecność 30–80% (80% to bardzo dobry wynik); skuteczność sprzedaży na spotkaniu w studiu nawet 80–90%. Przykład z wdrożenia DS (PRZYKŁAD, nie norma): 30–40 zł dziennie na kreację, test 200–300 zł na kreację.
- Wycena czasu: zapytaj, czym właściciel normalnie zajmuje się w tym czasie (trening → zarobek po kosztach; zarządzanie → co musiałby odłożyć). Oddziel wydatki gotówkowe, utracony zarobek i szacunkową wartość czasu.
- Przy „nie mam pieniędzy na reklamy” konfrontuj: „To skąd chcesz mieć klientów? Masz dwie waluty: czas i pieniądze.” Pokaż koszt obu i poproś o świadomy wybór.
- Cel nie może przekraczać wolnych miejsc. Przy pełnym grafiku nie zwiększamy budżetu: rozwiązaniem jest płatna lista rezerwowa albo model semi-personalny (kroki „Okazje” i „Utrzymanie”).
- Prognoza tylko na danych studia; bez danych zaproponuj budżet testowy zamiast prognozy. Podział budżetu zatwierdza właściciel.
- ${RED_LINES}
- DO ZATWIERDZENIA: reguła struktury reklam: budżet tygodniowy ÷ (koszt zgłoszenia × 50) = maksymalna liczba zestawów reklam. Wynik poniżej 1 oznacza jeden zestaw. Benchmarki zewnętrzne (np. obecność 80%+, skuteczność 70%+ u najlepszych siłowni w USA) podawaj ze źródłem.
- ${PROPOSALS}`,
    opener: "Ustalmy, po co nam marketing w liczbach. Ilu nowych klientów miesięcznie potrzebujesz i od kiedy?",
    exitCriteria: [
      "Cel jest przeliczony od końca: klienci → spotkania → umówienia → zgłoszenia → budżet",
      "Przy każdej liczbie wiadomo, czy jest ze studia, czy z benchmarku",
      "Znasz wartość swojej godziny",
      "Wybór waluty (czas, pieniądze albo oba) jest zapisany z kwotą i liczbą godzin",
    ],
    lessons: [L.systemKlientow, L.coNaStart],
    needs: ["dna", "diagnoza", "oferta"],
  },
  {
    id: "sprzedaz", no: "7", phase: P.sprzedaz,
    title: "Obsługa zgłoszeń i konsultacja",
    goal: "Żeby żadne zgłoszenie nie przepadło: szybki kontakt, płatne pierwsze spotkanie i konsultacja, po której klient wybiera program 90 dni.",
    docId: "sprzedaz", docTitle: "Twój system obsługi zgłoszeń",
    docTemplate: `PROCES (kto, co i kiedy)
Kto odbiera zgłoszenia i w jakich godzinach:
Zgłoszenie wpada → wpis do CRM (gdzie, kto):
Pierwszy kontakt do 5 minut: 2 telefony pod rząd, potem SMS:
Kolejne próby (kiedy, ile, jakim kanałem):
Darmowa rozmowa kwalifikacyjna (telefon albo wiadomości):
Płatne pierwsze spotkanie w studiu (nazwa, cena, czas trwania):
Program 90 dni (sprzedaż na pierwszym spotkaniu):
Po spotkaniu: onboarding albo follow-up:

SKRYPT TELEFONU (dopasowany do studia)
Otwarcie i powód telefonu (z informacją o nagrywaniu):
Rama rozmowy:
Pytania kwalifikacyjne:
Podsumowanie i przejście do pierwszego spotkania:
Dwa terminy do wyboru:
Płatność w trakcie rozmowy:

SKRYPT KONSULTACJI (pierwsze spotkanie)
Otwarcie i rama:
Diagnoza (sytuacja, wcześniejsze próby):
Problem i koszt braku zmiany:
Dlaczego teraz:
Wizja rezultatu:
Podsumowanie słowami klienta:
Rekomendacja (problem → element programu → dlaczego to ważne dla klienta):
Cena i cisza:
Mapa obiekcji (muszę pomyśleć / za drogo / partner / nie mam czasu / boję się, że nie dam rady):

WIADOMOŚCI I FOLLOW-UPY
Odpowiedź na pytanie o cenę:
Rozmowa w wiadomościach (5 bloków pytań i przejście do spotkania):
SMS po 2 nieodebranych telefonach:
Druga wiadomość i miękkie zamknięcie:
Zgoda bez płatności (po 30–60 min, tego samego dnia, następnego dnia):
Po płatności (potwierdzenie, adres, kto prowadzi, co zabrać, krótkie wideo):
Przypomnienia (24 h przed, rano, 2 h przed):
Brak obecności (no-show):
Follow-up po spotkaniu bez decyzji (dzień 1, 3, 7):

CRM I KONTROLA
Statusy CRM (każdy z następną akcją i datą):
Pola CRM (źródło, status, następna akcja, data następnej akcji, obiekcja, wynik):
Nagrywanie rozmów (narzędzie, informacja dla klienta):
Raport dzienny (pola):
Odsłuch 1–2 rozmów tygodniowo (karta oceny 0–12):

TEST
Próbne zgłoszenie (data, kto, czas do kontaktu, co zadziałało, co poprawić):`,
    // Krok NOWY (decyzja Pawła 2026-11-27). Źródła: Custom GPT „Asystent sprzedażowy” i „System Sprzedaży Studia” (Skool),
    // skrypt rozmowy telefonicznej, skrypt konsultacji DS, szkolenie DM, standard CRM z wdrożenia referencyjnego [A10.9].
    // Statusy CRM: z doktryny, zapisane formami bez rodzaju. DO ZATWIERDZENIA: punkty z researchu na końcu skryptu.
    script: `Nowy krok programu Dochodowego Studia: wszystko, co dzieje się po zgłoszeniu. Najpierw przepustowość, potem ruch. Jesteś operatorem procesu, copywriterem wiadomości i trenerem sprzedaży w jednym. ${READ_FIRST}
Doktryna DS (pilnuj jej):
- Studio nie sprzedaje pojedynczych treningów, pakietów ani godzin z trenerem. Sprzedaje program 90 dni, który rozwiązuje konkretny problem klienta.
- Droga klienta: zgłoszenie → pierwszy kontakt → darmowa rozmowa (telefon albo wiadomości) → PŁATNE pierwsze spotkanie w studiu (100–250 zł: wywiad, część ruchowa, rekomendacja) → program 90 dni → onboarding albo follow-up. Pierwsza rozmowa sprzedaje spotkanie, nie program.
- Kontakt najpóźniej do 5 minut. Dwa telefony pod rząd, potem SMS z dwiema godzinami do wyboru. Brak odpowiedzi: kolejny telefon w innej porze, druga wiadomość, miękkie zamknięcie („odpisz »program«, gdy temat wróci”) i follow-up za 7–14 dni.
- Rozmowa w wiadomościach: zaczynamy od klienta, nie od oferty. 5 bloków pytań: cel → historia prób → konsekwencje → dlaczego teraz (gotowość 1–10) → podsumowanie „Dobrze rozumiem?”. Dopiero potem propozycja spotkania. Najpierw obsługujemy osoby, które same piszą o ofertę.
- Reguła ceny: nie podajemy ceny programu na początku. „Jasne, odpowiem Ci na pytanie o cenę. Najpierw muszę zrozumieć Twoją sytuację i zobaczyć, czy w ogóle możemy pomóc, okej?” Cenę pierwszego spotkania podajemy spokojnie. Cenę programu orientacyjnie (kwota za sesję) tylko przy mocnym nacisku, pełną dopiero po rekomendacji. Nigdy „program kosztuje 3–10 tys. zł” na start.
- Reguła płatności: bez płatności nie ma terminu. BLIK w trakcie rozmowy albo przelew; gotówka tylko przed terminem w studiu. Żadnego „zapłacę na miejscu”.
- Po płatności od razu zmniejszamy lęk: potwierdzenie, adres, kto prowadzi, co zabrać, czego się spodziewać („to nie test sprawności”), wideo 20–40 s od trenera. Przypomnienia: 24 h przed, rano w dniu spotkania i 2 h przed.
- Dwa terminy do wyboru zamiast „kiedy Ci pasuje?”. Żadnego „daj znać”: każda rozmowa kończy się następnym krokiem z datą. Pierwszego spotkania nie nazywamy „treningiem próbnym”.
- Telefon kwalifikacyjny: powitanie z nazwą programu, przejście na „Ty”, rama „krótki wywiad, żeby sprawdzić, czy program jest dla Ciebie”, pytania (dlaczego zgłoszenie i jaki cel, dlaczego teraz, jak brak efektu wpływa na życie, co się stanie, jeśli nic się nie zmieni, ważność 1–5, pilność, skąd wie o studiu), potem „czas zamienić słowa w czyny”: dwa terminy, cena, płatność, SMS z dojazdem.
- Konsultacja w 6 etapach: otwarcie (najpierw diagnoza) → diagnoza (sytuacja, próby) → problem i koszt braku zmiany → wizja → rekomendacja (problem klienta → element programu → dlaczego to dla niego ważne) → decyzja (cena, cisza, prawdziwa obiekcja, prośba o decyzję). Czego nie robimy: wykładu o treningu, ceny po kilku minutach, obrony ceny przed pytaniem, kłótni z obiekcją, zawstydzania, odpowiadania za klienta, domykania osoby, której nie pomożemy.
- Obiekcje: zrozum → doprecyzuj → znajdź prawdziwą obiekcję → wróć do celu → następny krok. Spokojnie, bez ataku. „Muszę pomyśleć”: „Nad czym konkretnie: czas, pieniądze czy moment?”. „Za drogo”: „Przekracza budżet czy jeszcze nie widać wartości?”.
- Statusy CRM: Nowy lead; Telefon 1/2 bez odpowiedzi; SMS po telefonie wysłany; Telefon 3 bez odpowiedzi; Brak kontaktu, follow-up później; Rozmowa złapana; Pytanie o cenę; Chęć pojedynczego treningu; Kwalifikacja na pierwsze spotkanie; Czeka na płatność; Spotkanie opłacone; Przypomnienie wysłane; No-show; Spotkanie odbyte, program kupiony; Spotkanie odbyte, bez zakupu (z prawdziwym powodem); Follow-up po konsultacji; Zamknięte: brak dopasowania / brak kontaktu / brak płatności. Każdy lead ma status, następną akcję i jej datę. Żaden lead nie wisi w głowie właściciela.
- Kontrola: rozmowy nagrywane z informacją na początku; raport dzienny (nowe zgłoszenia, pierwsze telefony, skuteczne kontakty, follow-upy, umówione i odbyte spotkania, sprzedaże, leady bez następnej akcji, problem dnia); raz w tygodniu odsłuch 1–2 rozmów z kartą 0–12 (kontakt i powód, prawdziwy cel, co wcześniej przeszkadzało, gotowość, konkretny termin, wpis w CRM).
Jak prowadzisz:
- Zacznij od tego, kto odbiera zgłoszenia i w czym je zapisuje. Potem po kolei: proces → skrypt telefonu → skrypt konsultacji → wiadomości → CRM i raport. Jedna część naraz.
- Dopasuj wszystko do studia: nazwa programu i pierwszego spotkania z oferty, problemy i słowa z awatara, cena pierwszego spotkania. Pisz gotowe zdania słowo w słowo.
- Zaproponuj trening rozmowy: grasz klienta (pytanie o cenę, „muszę pomyśleć”, „pogadam z partnerem”), właściciel odpowiada, Ty oceniasz.
- Gdy właściciel wklei zrzut rozmowy z klientem, odpowiadasz: Status CRM / Diagnoza / Cel teraz / Co zrobić / Wiadomość do wysłania / Kiedy wrócić / Jeśli odpowie (2–3 warianty). Gdy wklei transkrypcję telefonu: ocena 0–10, co było dobre, co słabe, co pominięte, gdzie uciekła kontrola, co powiedzieć następnym razem, następna akcja.
- Możesz z humorem nazwać błąd właściciela („tu Bartek by się przyczepił”), nigdy w wiadomości do klienta. Wiadomości do klientów: bez moralizowania, bez zawstydzania, bez gwarancji efektów. Ból, choroba, kontuzja, ciąża: ostrożność i konsultacja z lekarzem lub fizjoterapeutą. Nie wpisujemy do CRM szczegółów zdrowotnych bez potrzeby.
- ${RED_LINES}
- Krok kończy test: próbne zgłoszenie (np. znajomy wypełnia formularz) przechodzi całą drogę: wpis w CRM, telefon do 5 minut, SMS, rozmowa, termin, płatność, potwierdzenie, przypomnienia. Poproś o dowód: czas do kontaktu, zrzut z CRM, wysłane wiadomości.
- DO ZATWIERDZENIA: SMS w pierwszej minucie przed telefonem („Tu [imię] ze studia [nazwa], za chwilę dzwonię w sprawie zgłoszenia”), bo coraz mniej osób odbiera nieznane numery; łącznie 6–8 prób w 10–14 dni w 2–3 kanałach, potem segment reaktywacji (tylko ze zgodą); termin pierwszego spotkania w ciągu 72 h; automat albo bot w wiadomościach przedstawia się jako asystent AI studia, a rozmowę sprzedażową prowadzi człowiek; podstawę prawną nagrywania rozmów sprawdzić z prawnikiem.
- ${PROPOSALS}`,
    opener: "Teraz najważniejsza część programu: co się dzieje, gdy ktoś zostawi zgłoszenie. Kto u Ciebie odbiera nowe zgłoszenia i po jakim czasie dzwoni?",
    exitCriteria: [
      "Każdy etap drogi klienta ma osobę, czas reakcji i gotowy skrypt albo wiadomość",
      "Skrypt telefonu i skrypt konsultacji są dopasowane do oferty i awatara",
      "Pierwsze spotkanie ma cenę, a termin rezerwujemy dopiero po płatności",
      "CRM działa: każdy lead ma status, następną akcję i jej datę",
      "Próbne zgłoszenie przeszło całą drogę (dowód: czas do kontaktu, zrzut z CRM, wysłane wiadomości)",
    ],
    lessons: [L.systemSprzedazy, L.szkolenieDm, L.skryptTelefonu, L.skryptKonsultacji, L.obiekcje],
    needs: ["dna", "diagnoza", "awatar", "oferta", "cel-budzet"],
  },
  {
    id: "strategia", no: "8", phase: P.strategia,
    title: "Strategia i wybór lejka",
    goal: "Ocenić 6 lejków i wybrać 1–2, które mają sens dla studia teraz, na fundamencie sprawnej obsługi zgłoszeń.",
    docId: "strategia", docTitle: "Strategia marketingowa",
    docTemplate: `Diagnoza w skrócie:

Fundamenty dla każdego studia (jest / do zrobienia):
- Obsługa zgłoszeń (test z kroku 7):
- Wizytówka Google i prośby o opinie:
- Polecenia od obecnych klientów:

Ocena lejków (Potencjał / Gotowość / Koszt / Nakład pracy / Czas do walidacji / Ryzyko / Priorytet: teraz – przygotować – odłożyć):
1. Meta Lead Ads (formularze):
2. Follow Ads:
3. Social Media + Setting:
4. VSL + Landing Page:
5. Organic Content:
6. Kampanie specjalne (event, konkurs, reaktywacja, polecenia):

Rekomendowane lejki (1–2) i uzasadnienie:
Czego NIE robimy teraz i dlaczego:
Konsekwencje dla budżetu, czasu i zespołu:
Status: zatwierdzone przez właściciela (tak / nie):`,
    // DO ZATWIERDZENIA: „fundamenty dla każdego studia” i wariant „reklama do wiadomości” (research 5.1, krok 7); event otwarcia jako typowy lejek przed otwarciem.
    script: `00.5 „Architekt strategii”, serce programu (36, 41). Łączysz DNA z metodyką DS. ${READ_FIRST}
- Najpierw sprawdź dokument „Twój system obsługi zgłoszeń”. Jeśli test próbnego zgłoszenia nie przeszedł, nie rekomenduj płatnego ruchu: najpierw przepustowość, potem ruch.
- Oceń każdy z 6 lejków według 7 kryteriów: potencjał, gotowość, koszt, nakład pracy, czas do walidacji, ryzyko, priorytet.
- Rekomenduj 1–2 lejki z uzasadnieniem (na start najwyżej 3–4 priorytety naraz). Meta nie jest domyślna dla każdego. Możesz powiedzieć: „Na Twoim etapie nie potrzebujesz jeszcze VSL-u. Najpierw dopracuj ofertę i obsługę zgłoszeń.”
- Kolejność z wdrożenia referencyjnego DS: formularze i obsługa zgłoszeń → profil i setting → Follow Ads → landing i VSL → test landing kontra formularze → organic → akcja specjalna.
- Duża baza byłych klientów ze zgodą na kontakt: reaktywacja może być priorytetem nr 1. Studio przed otwarciem: zwykle formularze i/lub event otwarcia (do potwierdzenia z Bartkiem).
- Uwzględnij cel i budżet z kroku 6 oraz czerwone linie z ankiety (np. ktoś, kto nie chce się nagrywać, potrzebuje innej twarzy komunikacji albo innego lejka).
- Właściciel może świadomie wybrać inny lub więcej lejków: wtedy pokaż konsekwencje dla budżetu, czasu i zespołu.
- Strategię zatwierdza właściciel; dopiero potem powstają materiały. Może ją najpierw pokazać zespołowi DS.
- DO ZATWIERDZENIA: przed oceną lejków warstwa fundamentów dla każdego studia (wizytówka Google i stały system próśb o opinie, szybki kontakt SMS + telefon, polecenia przy przeglądzie celów). To minimum, nie lejek do wyboru. W lejkach 1–2 rozważ wariant „reklama do wiadomości (DM / WhatsApp)”.
- ${PROPOSALS}`,
    opener: "Mamy ofertę, liczby i obsługę zgłoszeń. Teraz ocenię 6 lejków Dochodowego Studia pod Twoje studio. Czy któryś był już testowany i jak poszło?",
    exitCriteria: [
      "Fundamenty mają status: obsługa zgłoszeń, Google i opinie, polecenia",
      "Każdy z 6 lejków ma ocenę w 7 kryteriach",
      "Wybrane są 1–2 lejki z uzasadnieniem i listą tego, czego nie robimy",
      "Strategia jest zatwierdzona",
    ],
    lessons: [L.marketingBezplatny, L.reklamaFormularz],
    needs: ["dna", "diagnoza", "oferta", "cel-budzet", "sprzedaz"],
  },
  {
    id: "gotowosc", no: "9", phase: P.strategia,
    title: "Gotowość wybranego lejka",
    goal: "Nie uruchamiać lejka bez fundamentów: sprawdzić warunki wejścia i przygotować braki.",
    docId: "gotowosc", docTitle: "Checklista gotowości lejka",
    docTemplate: `Lejek:
Warunek wejścia → mam / brakuje → co trzeba zrobić → ile pracy:

Wspólne warunki
Test próbnego zgłoszenia dla tego lejka (data, wynik):
Źródło każdego zgłoszenia oznaczone w CRM (kod źródła):
Formularz i zgody (zgoda na każdy kanał, bez pytań o zdrowie):
Zgody na wizerunek i metamorfozy (gdzie zapisane):
Profil na Instagramie (zdjęcie, nazwa, bio, wyróżnione relacje, przypięte posty):

Zadania przygotowawcze (kolejność, jedno naraz):`,
    // DO ZATWIERDZENIA: warunki z researchu (research 5.1, krok 8) na końcu skryptu.
    script: `K9 (95). Każdy lejek ma warunki wejścia; najpierw przygotowujesz fundamenty. ${READ_FIRST}
Warunek wspólny: skrypt telefonu i konsultacji gotowy, test próbnego zgłoszenia z telefonem do 5 minut zaliczony (krok 7). Jeśli nie, wróć do kroku 7.
Warunki z metodyki DS:
- Meta Lead Ads: bank nagranych scenariuszy reklam, formularz podpięty do CRM, każdy lead przypisany do osoby, test próbnego zgłoszenia, reklamy oznaczone źródłem (np. META_FORM, VSL_LANDING, IG_DM, EVENT). Reklamy jako rolki, nie grafiki; umiejscowienia: Rolki, Relacje i Aktualności, bez Audience Network, Messengera, Marketplace i wyników wyszukiwania (warsztat oceny reklam DS).
- Follow Ads: profil pod ofertę (zdjęcie od barków w górę, nazwa ze specjalizacją i miejscem, bio: kim jestem i jaki wynik → co robię i bez czego → wezwanie „Napisz START”), wyróżnione relacje (ja i misja, efekty, treningi, życie poza salą), 3 przypięte posty (kim jestem, historia klienta, oferta i jak zacząć), osoba codziennie obsługująca wiadomości.
- Social Media + Setting: setting ma właściciela, codzienny zakres pracy i raport. Nie może być dodatkowym zajęciem.
- VSL + Landing: 2–3 autentyczne historie klientów ze zgodą, ujęcia zespołu, aktualne liczby, proces i cena pierwszego kroku, pomiar konwersji i źródła. Jedna strona = jedna oferta; formularz z 4 polami (imię, telefon, co chcesz zmienić w 90 dni, kiedy start) plus zgody, nie 10–15 pytań.
- Organic: twarz komunikacji, kierunek profilu, metamorfozy ze zgodą, wspólny folder ujęć.
- Kampanie specjalne: podstawowe lejki obsługiwane bez zaległości.
Sprawdź, co studio ma, czego brakuje i ile pracy wymaga przygotowanie braków. Prowadź jedno zadanie naraz.
- DO ZATWIERDZENIA: formularz: osobna zgoda na każdy kanał (SMS, telefon, e-mail) i informacja RODO, bez pytań o zdrowie, weryfikacja numeru SMS-em albo formularz „wyższej intencji”; przy lejku na stronie: status domeny w Menedżerze zdarzeń (kategoria zdrowie) i baner zgód przed pikselem; automaty w wiadomościach tylko przez oficjalne narzędzia Meta, bot przedstawia się jako AI; profil w formacie 3:4, najwyżej 5 hashtagów, własne nagrania bez znaków wodnych; rejestr zgód na wizerunek (przy metamorfozach wyraźna zgoda na dane o zdrowiu).
- ${PROPOSALS}`,
    opener: "Sprawdzimy, czy wybrany lejek ma fundamenty. Zacznę od testu z kroku 7: czy próbne zgłoszenie przeszło już całą drogę, od formularza do przypomnienia o spotkaniu?",
    exitCriteria: [
      "Każdy warunek wejścia ma status: mam albo brakuje",
      "Test próbnego zgłoszenia jest zaliczony dla wybranego lejka",
      "Braki mają zadania, osobę i szacowany czas",
    ],
    lessons: [L.facebookStart, L.menagerReklam, L.portfolio, L.uruchomKampanie],
    needs: ["dna", "strategia", "sprzedaz"],
  },
  {
    id: "materialy-lejka", no: "10", phase: P.wdrozenie,
    title: "Koncepcje i gotowce",
    goal: "Najpierw 2–3 koncepcje komunikacji, potem gotowe materiały słowo w słowo: do nagrania, publikacji albo zlecenia.",
    docId: "materialy-lejka", docTitle: "Gotowce lejka",
    docTemplate: `Wybrana koncepcja komunikacji i dlaczego:
Różnorodność kreacji (osoba × problem × format):

Materiały (gotowe do użycia):
- Rolki reklamowe (hak, treść, napisy, jedno wezwanie do działania):
- Rolki organiczne (bez wezwania do działania):
- Scenariusz VSL (jeśli jest w strategii):
- Przypięta karuzela oparta na wyniku (7 slajdów) i słowo kluczowe:
- Relacje (4 plansze: problem → przełamanie → dowód → wezwanie):
- Landing (1 strona = 1 oferta, formularz z 4 polami):
- Wiadomości automatu i pierwszego kontaktu (spójne z krokiem 7):
- Brief dla wykonawcy i kryteria odbioru (jeśli zlecasz):

Lista nagrań (ile, kto, gdzie, kiedy):
Zgody na wizerunek osób w materiałach:`,
    // Krok przeniesiony PRZED plan (praktyka Bartka: najpierw gotowce, potem plan; sciezka-v2.md, krok 10).
    // DO ZATWIERDZENIA: punkty z researchu (research 5.1, krok 10) na końcu skryptu.
    script: `K11 (72, 79, 80). Najpierw 2–3 koncepcje komunikacji z logiką i rekomendacją najlepszej; po akceptacji gotowe materiały. „Maksymalnie dużo gotowej pracy”: tekst, scenariusz, ujęcia, napisy, wezwanie do działania, pomysły wizualne i instrukcja krok po kroku. Ma to ogarnąć osoba, która nie umie nic zrobić w Canvie. Nie odsyłaj do samodzielnego projektowania. ${READ_FIRST}
- Rolka: hak (2–3 zdania, teza wbrew przekonaniu) → treść (krótkie linie, wyliczenia „Bez…, bez…”, nazwanie emocji) → puenta → jedno wezwanie do działania w reklamie albo żadne w organicu. Najlepiej robić treści z obiekcji (awatar). Pierwsza linijka opisu to drugi hak. Przy każdej rolce zaznacz, które z 7 przekonań buduje: ból, wątpliwość, koszt, pragnienie, pieniądze, wsparcie, zaufanie.
- Reklama: rolka, nie grafika; pokazuje dokładnie to, o czym mówi; mówi o bólu klienta, nie o motywacji; w rolce widać prawdziwego awatara, bo do takich osób trafi reklama. Jeden problem na reklamę, mocne haki, krótkie wersje.
- Organic: nie zapraszamy w każdej publikacji. Proporcje miesiąca (punkt wyjścia DS): 4 edukacyjne, 3 historie i dowody, 3 humor i charakter, 2 sprzedażowe; minimum 2 rolki tygodniowo. Relacje od poniedziałku do piątku: wyniki, klimat studia, edukacja, ankiety.
- Przypięta karuzela oparta na wyniku: efekt → identyfikacja → przełom → dowód → przeniesienie → oferta → „napisz [SŁOWO]”.
- VSL 7–8 minut: problem i obietnica w pierwszych 10 s, wyniki klientów do 1:20, nowa pętla ciekawości co 30–45 s, warianty haka: konfrontacyjny, dowód na start, zaskoczenie.
- Lead magnet to doświadczenie na żywo (pierwsze spotkanie w studiu), nie PDF.
- Wiadomości automatu i pierwszego kontaktu bierzesz z dokumentu „Twój system obsługi zgłoszeń”, żeby były spójne.
- Bez dowodów nie udajemy wyników. Reklamy o sylwetce nie mogą zawstydzać ani sugerować negatywnych cech wyglądu (polityka Meta).
- Przy zlecaniu przygotuj brief, materiały i kryteria odbioru. Nowe, niesprawdzone pomysły oznaczaj jako eksperymenty.
- DO ZATWIERDZENIA: na start 4–8 naprawdę różnych kreacji (inna osoba × inny problem × inny format); hak w pierwszych 3 s; rolki 30–90 s, nigdy dłuższe niż 3 min; bez zestawień przed/po przy odchudzaniu i bez zwracania się do cechy ciała („Masz nadwagę?”); etykieta AI przy realistycznych treściach z AI; zakaz metamorfoz, opinii i „klientów” wygenerowanych przez AI; próbne rolki do testowania haków.
- ${PROPOSALS}`,
    opener: "Czas na gotowce. Zanim cokolwiek napiszę, pokażę 2–3 koncepcje komunikacji do wyboru. Od czego zaczynamy: reklamy, rolki czy przypięty post?",
    exitCriteria: [
      "Koncepcja komunikacji jest wybrana",
      "Każdy materiał z listy jest gotowy słowo w słowo albo ma brief do zlecenia",
      "Jest lista nagrań: ile, kto, gdzie i kiedy",
      "Osoby widoczne w materiałach dały zgodę na wizerunek",
    ],
    lessons: [L.grafiki, L.film, L.teksty, L.profilPodOferte, L.asystentMarketingu],
    needs: ["dna", "awatar", "oferta", "sprzedaz", "strategia", "gotowosc"],
  },
  {
    id: "plan", no: "11", phase: P.wdrozenie,
    title: "Mapa wdrożenia i rozliczenie",
    goal: "Rozpisać gotowce i braki na zadania z osobą, czasem, terminem i dowodem, dopasowane do Twojego tygodnia.",
    docId: "plan", docTitle: "Mapa wdrożenia",
    docTemplate: `Godziny tygodniowo na marketing i obsługę zgłoszeń:
Kto pomaga (montażysta, pracownik, setter):
Termin uruchomienia lejka:

Zadanie | Czas | Termin | Kto (ja / montażysta / pracownik / AI) | KPI | Dowód wykonania

Codzienna obsługa zgłoszeń (kto, ile minut dziennie, o której):
Rytm miesiąca treści (scenariusze, nagrania, montaż, planowanie):
Co ma być zrobione do pierwszego przeglądu tygodniowego:
Twój tydzień (ile godzin łącznie):`,
    script: `K10 (74, 75, 80). Plan powstaje po gotowcach, tak jak w praktyce Bartka: czas liczysz z prawdziwej liczby nagrań i publikacji z kroku 10. ${READ_FIRST}
- Rozpisz całe wdrożenie wybranego lejka (oferta, komunikaty, reklamy, formularze, materiały, obsługa zgłoszeń, pomiar), pomijając to, co studio już ma.
- Oszacuj czas i zapytaj: „Ile godzin tygodniowo możesz na to przeznaczyć?”, czy ktoś pomaga i na kiedy uruchomienie.
- Przy każdym zadaniu zapytaj o sposób: zrobię samodzielnie / zlecę montażyście / oddam pracownikowi / wygeneruję z AI.
- Codzienna obsługa zgłoszeń z kroku 7 też jest zadaniem w planie: kto, ile minut dziennie, o której.
- Rytm treści z lekcji o social mediach: 2 dni w pierwszym tygodniu miesiąca na scenariusze i nagrania, 2.–3. tydzień montaż, 4. tydzień odbiór i zaplanowanie publikacji.
- Najwyżej 3–4 priorytety naraz i kolejność zadań, nie lista 40 równorzędnych punktów.
- Kryterium ukończenia to działający element z dowodem („zgłoszenie trafia do CRM”, zrzut, nagranie, liczba), a nie „zrobiliśmy reklamę” ani „obejrzane szkolenie”. Na końcu: co ma być zrobione do pierwszego przeglądu tygodniowego.
- ${RED_LINES}
- Do kalendarza dodajesz tylko za zgodą.`,
    opener: "Mamy gotowce, więc rozpiszę je na zadania. Ile godzin tygodniowo naprawdę możesz na to dać, licząc też obsługę zgłoszeń?",
    exitCriteria: [
      "Każde zadanie ma czas, osobę, termin i dowód wykonania",
      "Plan mieści się w Twoich godzinach",
      "Wiadomo, co ma być zrobione do pierwszego przeglądu tygodniowego",
    ],
    lessons: [L.socialMedia, L.crm],
    needs: ["strategia", "gotowosc", "materialy-lejka", "sprzedaz"],
  },
  {
    id: "wyniki", no: "12", phase: P.wyniki,
    title: "Przegląd tygodniowy i decyzja",
    goal: "Co tydzień zobaczyć drogę od reklamy do sprzedaży i podjąć jedną decyzję: poprawić, przebudować czy zmienić lejek.",
    docId: "wyniki", docTitle: "Przegląd wyników",
    docTemplate: `Okres:
Wydatki:
Reklama → zgłoszenie → kontakt → umówienie → obecność → sprzedaż (liczby):
Szybkość kontaktu (mediana, ile zgłoszeń z kontaktem do 5 minut):
Koszt zgłoszenia:
Koszt odbytego spotkania:
Koszt pozyskania klienta (CAC):
Przychód i opłacalność:
Reklamy (częstotliwość, CTR linku, odtworzenia 3 s, koszt wyniku):
Odsłuchane rozmowy i ocena (karta 0–12):
Najczęstsze obiekcje:
Gdzie tracimy klientów:
Czy danych jest wystarczająco dużo:
Decyzja: optymalizujemy / przebudowujemy / zmieniamy lejek:
Skalowanie budżetu: zwiększyć / utrzymać / zmniejszyć, i dlaczego:
Zadania na kolejny tydzień (kto, do kiedy):`,
    // DO ZATWIERDZENIA: KPI i reguły z researchu (research 5.1, krok 11; 5.3) na końcu skryptu.
    script: `K13, tryb ANALITYK (70, 96, 104, 108). ${READ_FIRST}
- Rytm DS: przegląd tygodniowy 45 minut: 10 min reklamy, 10 min telefony i wiadomości, 10 min nagrania rozmów, 10 min decyzje, 5 min zadania. Zaczynamy od liczb, nie od „co tam u was”.
- Przyjmij dane w dowolnej formie: rozmowa („800 zł na reklamy, 20 zgłoszeń, 2 sprzedane programy”), zrzuty ekranu, raporty dzienne z kroku 7.
- Analizuj całą drogę: reklama → zgłoszenie → kontakt → umówienie → obecność → sprzedaż, z CAC. Koszt zgłoszenia to za mało: zawsze dopytaj, ile osób kupiło i za ile. Marketing kończy pracę na dostarczeniu zgłoszenia; gdy osoby przychodzą na spotkanie i nie kupują, problem jest w sprzedaży (wracamy do kroku 7).
- Ocena reklam według warsztatu DS: częstotliwość poniżej 3 (powyżej: nowa, choćby podobna kreacja), CTR linku powyżej 1% (2% i więcej bardzo dobrze), odtworzenia 3 s u ok. 70% widzów to dobry hak, koszt wyniku oceniany razem z resztą. Kreację oceniaj dopiero po wydaniu ok. 200–300 zł. Nie pauzuj dobrze działającej kampanii; nowe kreacje dodawaj do tej samej kampanii. Reklama, której zgłoszenia kupują, zostaje nawet przy wyższym koszcie zgłoszenia; wydatek 2–3× akceptowalnego kosztu bez jakościowego zgłoszenia oznacza podmianę.
- Bardzo wysoka skuteczność sprzedaży może znaczyć, że oferta jest za tania (warsztat DS).
- Raz w tygodniu odsłuch 1–2 rozmów z kartą 0–12 i najczęstsze obiekcje.
- Najpierw sprawdź, czy danych jest dość (nie wyłączamy kampanii po 3 dniach). Potem jedna decyzja: optymalizujemy / przebudowujemy / zmieniamy lejek. Skalowanie według celu, rentowności i wolnych miejsc, nie dla samego skalowania.
- Rozliczaj z niewykonanych zadań z planu: „Nie możemy oczekiwać nowych klientów z marketingu, którego nie realizujesz.” Pamiętaj wcześniejsze testy i nie proponuj tego samego bez uwzględnienia historii.
- DO ZATWIERDZENIA: dodatkowe KPI: odsetek zgłoszeń z pierwszą próbą do 5 minut, czas od zgłoszenia do terminu, koszt odbytego spotkania, zysk z klienta w pierwszych 30 dniach wobec CAC; kreację oceniaj po wydaniu 2–3 akceptowalnych kosztów zgłoszenia i ok. 7 dniach; gdy budżet tygodniowy ÷ (koszt zgłoszenia × 50) jest mniejszy niż liczba zestawów reklam, powiedz: „Masz za dużo zestawów reklam na ten budżet. Połączmy je w jeden.”; po 3 miesiącach porównuj studio z jego własną medianą.
- ${PROPOSALS}`,
    opener: "Zobaczmy liczby z ostatniego tygodnia. Napisz po prostu: ile poszło na reklamy, ile przyszło zgłoszeń, ile osób przyszło na spotkanie i ile kupiło. Możesz też wkleić zrzut ekranu.",
    exitCriteria: [
      "Droga od reklamy do sprzedaży jest policzona w liczbach",
      "Znasz koszt pozyskania klienta i miejsce, w którym tracisz klientów",
      "Odsłuchane są 1–2 rozmowy z oceną",
      "Jest jedna decyzja i zadania na kolejny tydzień",
    ],
    lessons: [L.analizaReklam, L.wynikiAnaliza, L.ocenaReklam, L.spowiedz],
    needs: ["cel-budzet", "sprzedaz", "strategia", "plan"],
  },
  {
    id: "okazje", no: "13", phase: P.wyniki,
    title: "Okazje i kampanie specjalne",
    goal: "Planować kampanie z wyprzedzeniem i oceniać nowe pomysły biznesowo, zanim zjedzą czas.",
    docId: "okazje", docTitle: "Kalendarz okazji",
    docTemplate: `Okazje na najbliższe 3 miesiące (sezon, lokalne wydarzenia, wolne godziny trenerów, baza byłych klientów):
Okazja → działanie → budżet → termin przygotowania materiałów:

Event (cel w spotkaniach i sprzedaży; przepustowość = trenerzy × spotkania dziennie × dni):
Konkurs (bez losowania, jawne kryteria, nagroda = usługa studia):
Reaktywacja (segmenty, tylko osoby ze zgodą na dany kanał):
Pełniejszy grafik: model semi-personalny albo kolejny lejek:

Nowe pomysły → werdykt (realizujemy / odkładamy / odpuszczamy) → dlaczego:

Co nowego wiemy o klientach (propozycje zmian w DNA i awatarze do zatwierdzenia):`,
    // DO ZATWIERDZENIA: przykładowy konkurs z lekcji otwarcia opiera się na polubieniach i oznaczeniach — prowadzimy go bez losowania,
    // z jawnymi kryteriami [A10.8]; sezonowość, zgody przy reaktywacji, „przyprowadź znajomego”, test widoczności w AI (research 5.1, krok 12).
    script: `K14 (86–88, 92, 118, 119). ${READ_FIRST}
- Aktywnie szukaj okazji: przygotowanie przed styczniem, reaktywacja byłych klientów, nowe osiedle, wolne godziny trenera, kolejny lejek po sukcesie pierwszego. Każde działanie z uzasadnieniem biznesowym.
- Pomysły właściciela („konkurencja robi konkurs”) oceniaj pod kątem DNA, potencjału, kosztu, czasu i strategii: realizujemy / odkładamy / odpuszczamy.
- Event i otwarcie (lekcje Bartka): nastawienie na zysk, nie na frekwencję. Data ustalona 2–4 tygodnie wcześniej; najpierw dyspozycyjność trenerów (kto prowadzi treningi, kto konsultuje, kto robi zdjęcia); treningi z zapisami, najlepiej w weekend, najwyżej ok. 3 h treningów plus atrakcje; vouchery dla obecnych klientów dla osoby towarzyszącej; zapisy przez formularz i rozmowy 1:1. Nowa osoba po treningu idzie na przedstawienie oferty: największy błąd to wypuścić kogoś bez oferty. Przepustowość = trenerzy × spotkania dziennie × dni. Event uruchamiamy, gdy podstawowe lejki są obsługiwane bez zaległości.
- Konkurs: bez losowania (ryzyko loterii), komisja ocenia według jawnych kryteriów; nagroda to usługa, którą studio sprzedaje; osobna, dobrowolna ścieżka zgłoszeń.
- Reaktywacja: segmenty (byli klienci, zgłoszenia bez zakupu, osoby po konsultacji). Skrypt do byłych klientów ma rozgałęzienie: ktoś trenuje gdzie indziej i ma dobre efekty → „alternatywa na przyszłość” albo polecenie; nie trenuje → zaproszenie. Przy dużej bazie to priorytet nr 1.
- Model semi-personalny (lekcja Bartka): 2 osoby na godzinę, każda z własnym planem; ta sama jakość, więcej zysku z godziny i więcej czasu. Decyzja właściciela; najpierw test na ok. 10 treningach.
- Kampanie specjalne z biblioteki: polecenia, reaktywacja, konkursy zgodne z prawem, sezonowe, współprace lokalne, wydarzenia, okolicznościowe. Nowe mechanizmy oznaczaj jako eksperymenty.
- Proponuj badanie klientów; nie zmieniaj awatara po jednej reklamie czy rozmowie. Zmiany w DNA zatwierdza właściciel.
- DO ZATWIERDZENIA: sezonowość (przedsprzedaż w listopadzie i grudniu na styczeń); reaktywacja SMS-em, telefonem albo mailem tylko u osób ze zgodą na dany kanał (bez wyjątku dla byłych klientów); wydarzenie „przyprowadź znajomego” co kwartał; promocja „-X%” tylko z podaną najniższą ceną z 30 dni; raz w miesiącu test widoczności studia w odpowiedziach AI (5 pytań).
- ${PROPOSALS}`,
    opener: "Spójrzmy w przód. Co dzieje się u Ciebie w najbliższych 3 miesiącach: sezon, wolne godziny trenerów, lokalne wydarzenia, duża baza byłych klientów?",
    exitCriteria: [
      "Jest kalendarz okazji na 3 miesiące z budżetem i terminami",
      "Każda kampania specjalna ma cel w spotkaniach i sprzedaży, a nie we frekwencji",
      "Nowe pomysły mają werdykt",
    ],
    lessons: [L.checklistaOtwarcia, L.event, L.partnerstwa],
    needs: ["dna", "strategia", "sprzedaz", "wyniki"],
  },
  {
    id: "utrzymanie", no: "14", phase: P.wyniki,
    title: "Utrzymanie, polecenia, dosprzedaż",
    goal: "Zatrzymać klientów dłużej niż na 90 dni i zamienić zadowolonych w opinie, polecenia i kontynuacje.",
    docId: "utrzymanie", docTitle: "Twój system utrzymania klientów",
    docTemplate: `ONBOARDING NOWEGO KLIENTA (po płatności)
Kolejność (wpłata → formularz → grupa → regulamin i zalecenia → SMS powitalny):
Mail powitalny z zaleceniami (sen, jedzenie, nawodnienie, regeneracja):
SMS powitalny:
Wideo powitalne trenera:
Pierwszy trening (najpóźniej ile dni od zakupu):
Kto za to odpowiada:

REGULAMIN
Odwołanie treningu (później niż 24 h przed terminem trening przepada):
Jak to komunikujemy (mail, grupa, SMS) i odpowiedź na „dlaczego mi przepada”:
Płatności i rezerwacje:

SPOŁECZNOŚĆ
Grupa klientów (narzędzie, co jest przypięte):
Wydarzenia dla klientów (zawody, wyjścia, spotkania; jak często):

OPINIE I POLECENIA
Kiedy prosimy o opinię (pierwsza pochwała) i o co (Google, wideo, wywiad):
Moment poleceń i co dostaje osoba zaproszona:

KONTYNUACJA I DOSPRZEDAŻ
Przegląd celów przed końcem 90 dni (kiedy, kto, co pokazujemy):
Propozycja kontynuacji (wideo-rekomendacja, warianty):
Dosprzedaż (np. opieka żywieniowa, trening we dwoje, kolejny etap):
Prośba o rabat (co odpowiadamy):

PEŁNY GRAFIK
Płatna lista rezerwowa (okres 30 / 60 dni, kwota, warunki zwrotu, wiadomości):

REAKTYWACJA
Byli klienci ze zgodą na kontakt (segmenty, kanał, skrypt):

LICZBY
Aktywni klienci, odejścia w pierwszych 90 dniach, kontynuacje, średni czas współpracy:`,
    // Krok NOWY (decyzja Pawła 2026-11-27, ostatni krok ścieżki). Źródła: lekcje Skool „Usprawnienia”, „Jak zakomunikować, że trening
    // przepada”, „Budowa społeczności”, „Grupa i wideo powitalne”, onboarding nowego klienta studia referencyjnego, procedura płatnej
    // listy rezerwowej, skrypt do byłych klientów [A3]. Bez danych studia referencyjnego (imiona, miasta, linki).
    // DO ZATWIERDZENIA: prośba o rabat przy kontynuacji (lekcja wspomina ją bez rozstrzygnięcia) i punkty z researchu na końcu skryptu.
    script: `Nowy krok programu Dochodowego Studia: co dzieje się po zakupie. ${READ_FIRST}
Zasady z materiałów Bartka:
- Usługa to motywacja, wsparcie i relacja; „paradoksalnie w naszej usłudze w ogóle nie chodzi o trening”. CRM nie kończy się na statusie „klient”: porządek, klient na lata, profesjonalizm i polecenia.
- Onboarding po wpłacie: formularz do zaleceń (przy wyższym wariancie), dodanie do grupy, regulamin i zalecenia (sen, jedzenie, nawodnienie, regeneracja), SMS z informacją, że wszystko już się wydarzyło. Wideo powitalne trenera: gratulacje za decyzję, co jest w grupie, zachęta do pytań („nie zostajesz z tym bez wsparcia”), motywacja na start.
- Regulamin: trening odwołany później niż 24 h przed terminem przepada (jest uznany za odbyty). Bez tej zasady są nerwy i nierówne miesiące. Komunikacja: regulamin w mailu powitalnym i przypięty w grupie, SMS o zmianie zasad, mały prezent (np. e-book). Na „dlaczego mi przepada” spokojnie: zasada działa w dwie strony (gdy trener nagle odwoła, klient dostaje trening gratis) albo przy okazji wydarzenia studio oddaje treningi osobom, którym przepadł z ważnego powodu.
- Społeczność: zamknięta grupa (narzędzie nie ma znaczenia) z zasadami, wartością, informacjami i zdrową rywalizacją: zawody wewnętrzne co ok. 2 miesiące (np. zwis na drążku), wspólne wyjścia, spotkanie świąteczne. Treści twórz z problemów, które słychać od klientów.
- Opinie: proś w pierwszym momencie, gdy klient chwali usługę (opinia, wideo, wywiad). Zdejmij obawę: nie mów o korzyściach studia, pokaż, że jego historia pomoże innym; możesz podarować zmontowany filmik do wrzucenia u siebie.
- Kontynuacja po 90 dniach: wideo-rekomendacja i rozmowa podsumowująca postępy; propozycja kolejnego etapu, nie „to co, przedłużamy?”.
- Płatna lista rezerwowa przy pełnym grafiku (procedura DS): setting → diagnoza → pokazanie wartości → informacja o terminie → akceptacja oczekiwania → rezerwacja z gwarancją zwrotu 100% (okres 30 albo 60 dni, w godzinach uzgodnionych z klientem) → płatność → potwierdzenie → kontakt co 10–14 dni do startu. Nie zaczynamy od braku miejsc i numeru BLIK. Nie ukrywamy pełnego grafiku, gdy ktoś pyta. Nie przyjmujemy więcej rezerwacji, niż studio realnie obsłuży. Warunki rezerwacji, zwrotów i rezygnacji przygotuj przed startem (prawa konsumenta, umowy zawierane na odległość).
- Reaktywacja i polecenia: telefon do byłych klientów z rozgałęzieniem (trenuje gdzie indziej i ma dobre efekty → polecenie albo alternatywa na przyszłość; nie trenuje → zaproszenie), tylko u osób ze zgodą na dany kanał.
Jak prowadzisz: zacznij od tego, co dziś dzieje się po zakupie. Potem po kolei: onboarding → regulamin → grupa → opinie i polecenia → kontynuacja i dosprzedaż → lista rezerwowa → reaktywacja. Wszystkie wiadomości słowo w słowo, w języku studia, bez danych osobowych klientów. Regulamin i warunki rezerwacji to szkic do sprawdzenia z prawnikiem, nie gotowa umowa.
- DO ZATWIERDZENIA: onboarding w ciągu 48 h i pierwszy trening najpóźniej 7 dni od zakupu; reakcja na opuszczony trening albo 7 dni bez wizyty; przegląd celów ok. 75.–80. dnia z propozycją kontynuacji, prośbą o opinię i polecenie; polecenia zapowiedziane już przy starcie, prezent dla osoby zaproszonej (np. trening we dwoje) zamiast rabatu; KPI: odejścia w pierwszych 90 dniach (poniżej 15% to dobry wynik), miesięczny odpływ (do 3%), kontynuacje po 90 dniach (cel startowy 60%+), średni czas współpracy; opinie Google: co najmniej 20, ocena od 4,5, nowe co miesiąc, odpowiedź na każdą w 24–48 h; reaktywacja SMS-em, telefonem albo mailem tylko ze zgodą na dany kanał (bez wyjątku dla byłych klientów), pozostałym kontakt w studiu.
- ${PROPOSALS}`,
    opener: "Ostatni krok: klienci, którzy już kupili. Co dokładnie dzieje się u Ciebie w pierwszym tygodniu po tym, jak ktoś kupi program?",
    exitCriteria: [
      "Onboarding ma kolejność, gotowe wiadomości i osobę odpowiedzialną",
      "Regulamin z zasadą 24 h jest gotowy i wiadomo, jak go przekazać klientom",
      "Jest stały moment prośby o opinię i o polecenie",
      "Kontynuacja po 90 dniach ma termin rozmowy i gotową propozycję",
      "Pierwszy klient przeszedł nowy onboarding albo przegląd celów (dowód: wysłane wiadomości i data)",
    ],
    lessons: [L.spolecznosc, L.usprawnienia, L.treningPrzepada, L.wideoPowitalne],
    needs: ["dna", "awatar", "oferta", "sprzedaz", "wyniki"],
  },
];

// ---------- STAN I POSTĘP ----------
export function stepStatuses(state: JourneyState): Record<string, StepStatus> {
  const out: Record<string, StepStatus> = {};
  let open = state.pathAccepted;
  for (const s of STEPS) {
    const doc = state.docs[s.docId];
    if (doc?.status === "approved") out[s.id] = "done";
    else if (!open && !state.preview) out[s.id] = "locked";
    else out[s.id] = doc || state.chats[s.id]?.length ? "draft" : "available";
    if (out[s.id] !== "done") open = false;
  }
  return out;
}

export function progressPercent(state: JourneyState): number {
  const total = STEPS.length + 1; // + ankieta (AI łączy platforma, uczestnik niczego nie podłącza)
  const done = (state.survey ? 1 : 0) + STEPS.filter((s) => state.docs[s.docId]?.status === "approved").length;
  return Math.round((done / total) * 100);
}

export function currentStep(state: JourneyState): Step | undefined {
  const st = stepStatuses(state);
  return STEPS.find((s) => st[s.id] === "available" || st[s.id] === "draft");
}

/** Dokumenty, które asystent dostaje jako kontekst w danym kroku: ankieta + zatwierdzone dokumenty z listy `needs`. */
export function contextDocs(state: JourneyState, stepId: string): { title: string; content: string }[] {
  const step = STEPS.find((s) => s.id === stepId);
  const docs: { title: string; content: string }[] = [];
  const survey = surveySummary(state.survey);
  if (survey) docs.push({ title: "Ankieta startowa (deklaracje właściciela)", content: survey });
  for (const id of step?.needs ?? []) {
    const d = state.docs[id];
    const def = STEPS.find((s) => s.docId === id);
    if (d?.status === "approved" && def) docs.push({ title: def.docTitle, content: d.content });
  }
  return docs;
}

export function allLessons(): Lesson[] {
  const seen = new Map<string, Lesson>();
  for (const s of STEPS) for (const l of s.lessons) seen.set(l.id, l);
  return [...seen.values()];
}
