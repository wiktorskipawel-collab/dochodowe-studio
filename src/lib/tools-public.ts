// PUBLICZNE dane narzędzi AI (/narzedzia, panel w kroku, paleta Ctrl+K). Ten plik importuje przeglądarka:
// NIE MA tu instrukcji dla AI (prompty zostają w src/lib/tools.ts, tylko serwer).
//
// DO ZATWIERDZENIA (Bartek): lista, kolejność i nazwy narzędzi oraz kategorii, pierwsze wiadomości, teksty „Jak to działa”,
// przypisanie narzędzi do kroków ścieżki (STEP_TOOLS) i to, które akcje są dostępne od początku.
import { CHAT_LIMITS } from "@/lib/models";

export type ToolCategory = "sprzedaz" | "marketing" | "zespol" | "utrzymanie";

export type ToolId =
  | "asystent-sprzedazy" | "audyt-rozmowy" | "trening-rozmowy" | "ctr" | "rolki" | "vsl" | "nowy-awatar"
  | "ogloszenie-trener" | "podrecznik-standardow" | "sciezka-kariery" | "opinie-polecenia" | "lista-rezerwowa";

/** Nazwy ikon Lucide (mapa w src/components/ToolIcon.tsx). */
export type ToolIconName =
  | "MessagesSquare" | "ClipboardCheck" | "Drama" | "MousePointerClick" | "Film" | "Clapperboard" | "UserPlus"
  | "Megaphone" | "BookCheck" | "TrendingUp" | "Star" | "CalendarClock" | "Handshake" | "Users" | "HeartHandshake";

/** Co można dodać do wiadomości oprócz tekstu i dyktowania (dyktowanie jest zawsze). */
export type ToolInput = "zdjecia" | "nagranie" | "transkrypcja";

/** Okienko „Jak to działa” przy pierwszym otwarciu i panel obok rozmowy. */
export type ToolIntro = {
  wklej: string; // co wkleić albo nagrać
  dostaniesz: string; // co dostaniesz
  przyklad: string; // przykład
  prywatnosc: string; // prywatność (do tego zawsze dochodzi MEDIA_PRIVACY)
};

/** To, co dostaje przeglądarka (bez instrukcji systemowej). */
export type ToolMeta = {
  id: ToolId; // adres /narzedzia/<id>, kotwica karty /narzedzia#<id>, rozmowa w state.chats["tool:<id>"]
  title: string;
  category: ToolCategory;
  desc: string; // opis na karcie
  icon: ToolIconName;
  opener: string; // pierwsza wiadomość asystenta na ekranie
  placeholder: string; // podpowiedź w polu wiadomości
  hint: string; // „jak to działa” obok rozmowy (jedno zdanie o metodzie)
  uses: string[]; // docId z journey.ts (np. „sprzedaz”, „utrzymanie”); docId, którego nie ma w STEPS, jest pomijany
  starters?: { label: string; text: string }[]; // gotowe początki do wstawienia w pole
  copyHeadings?: string[]; // sekcje odpowiedzi z osobnym przyciskiem „Kopiuj”
  intro: ToolIntro;
  inputs: ToolInput[];
  maxChars: number; // limit jednej wiadomości (ten sam sprawdza /api/assistant)
};

export type ToolGroup = { id: ToolCategory; title: string; desc: string; icon: ToolIconName; tools: ToolMeta[] };

export const TOOL_CATEGORIES: Omit<ToolGroup, "tools">[] = [
  { id: "sprzedaz", title: "Sprzedaż", desc: "Rozmowy z leadami: od pierwszej wiadomości do płatnego spotkania i programu 90 dni.", icon: "Handshake" },
  { id: "marketing", title: "Marketing", desc: "Reklamy, rolki, film sprzedażowy i kolejne grupy klientów.", icon: "Megaphone" },
  { id: "zespol", title: "Zespół", desc: "Rekrutacja, standardy pracy i rozwój trenerów.", icon: "Users" },
  { id: "utrzymanie", title: "Utrzymanie klientów", desc: "Opinie, polecenia i lista rezerwowa, gdy grafik jest pełny.", icon: "HeartHandshake" },
];

type BaseMeta = Omit<ToolMeta, "intro" | "inputs" | "maxChars">;

// ---------- KARTY NARZĘDZI ----------

const BASE: BaseMeta[] = [
  // ===== SPRZEDAŻ =====
  {
    id: "asystent-sprzedazy",
    title: "Asystent sprzedaży",
    category: "sprzedaz",
    icon: "MessagesSquare",
    desc: "Wklejasz rozmowę z leadem, dodajesz zrzut ekranu albo opisujesz sytuację. Dostajesz status CRM, następny krok i gotową wiadomość do wysłania.",
    opener: "Wklej rozmowę z leadem (DM, SMS, notatki z telefonu), dodaj zrzut ekranu rozmowy albo opisz sytuację w 2–3 zdaniach. Powiem, na jakim etapie jest lead, co zrobić teraz, i dam gotową wiadomość do wysłania.",
    placeholder: "Wklej rozmowę albo opisz sytuację, np. „Lead z formularza, 2 telefony bez odbioru, SMS wysłany wczoraj”",
    hint: "Działa jak Asystent sprzedażowy ze Skool. Każda odpowiedź ma ten sam układ: status CRM, diagnoza, co zrobić, wiadomość do wysłania, kiedy wrócić i co dalej, gdy klient odpowie.",
    uses: ["oferta", "awatar", "sprzedaz"],
    copyHeadings: ["Wiadomość do wysłania"],
    starters: [
      { label: "Lead nie odbiera", text: "Lead z formularza nie odbiera. Były 2 telefony, SMS wysłany wczoraj, brak odpowiedzi." },
      { label: "„Ile kosztuje?” w DM", text: "Osoba napisała w DM: „Ile kosztuje trening?”. Nic więcej nie wiem." },
      { label: "Zapłaci na miejscu", text: "Klientka chce termin pierwszego spotkania, ale mówi, że zapłaci na miejscu." },
    ],
  },
  {
    id: "audyt-rozmowy",
    title: "Audyt rozmowy",
    category: "sprzedaz",
    icon: "ClipboardCheck",
    desc: "Wklejasz transkrypcję albo notatki, dodajesz nagranie rozmowy z telefonu lub konsultacji. Dostajesz ocenę X/10, błędy, lepsze sformułowania i follow-up.",
    opener: "Wklej transkrypcję, notatki albo opis rozmowy: telefonu po zgłoszeniu, wiadomości w DM albo konsultacji w studiu. Możesz też dodać plik z nagraniem, a spiszę go do tekstu. Ocenię ją jak trener sprzedaży: co było dobre, gdzie uciekła kontrola i co powiedzieć następnym razem.",
    placeholder: "Wklej transkrypcję albo notatki z rozmowy…",
    hint: "Ocena według skryptu konsultacji i zasad Dochodowego Studia. Jeśli rozmowa była nagrywana, klient musi o tym usłyszeć na początku rozmowy.",
    uses: ["oferta", "awatar", "sprzedaz"],
    copyHeadings: ["Wiadomość follow-up do wysłania"],
    starters: [
      { label: "Telefon po formularzu", text: "Rozmowa telefoniczna po formularzu z reklamy. Przebieg:\n" },
      { label: "Konsultacja bez zakupu", text: "Konsultacja w studiu, klientka nie kupiła programu. Przebieg:\n" },
    ],
  },
  {
    id: "trening-rozmowy",
    title: "Trening rozmowy",
    category: "sprzedaz",
    icon: "Drama",
    desc: "AI gra klienta studia z prawdziwymi obiekcjami. Ćwiczysz telefon, DM albo konsultację. Na koniec piszesz „ocena”.",
    opener: "Zagram klienta, a Ty prowadzisz rozmowę. Napisz: 1) co ćwiczymy: telefon po formularzu, DM czy konsultację w studiu, 2) poziom: łatwy, średni czy trudny, 3) kim mam być (albo „losuj z awatara”). W trakcie możesz napisać „podpowiedź”, a na koniec „ocena”.",
    placeholder: "np. „Telefon, poziom średni, losuj z awatara”",
    hint: "To symulacja: klient jest fikcyjny, gra go AI. Komendy: „podpowiedź” (krótka wskazówka), „ocena” (koniec i ocena rozmowy), „od nowa” (nowy klient).",
    uses: ["awatar", "oferta", "sprzedaz"],
    starters: [
      { label: "Telefon, średni", text: "Telefon po formularzu z reklamy, poziom średni, losuj z awatara." },
      { label: "DM, trudny", text: "DM na Instagramie, poziom trudny, klient od razu pyta o cenę." },
      { label: "Konsultacja, trudny", text: "Konsultacja w studiu, poziom trudny, obiekcja: muszę pogadać z partnerem." },
    ],
  },

  // ===== MARKETING =====
  {
    id: "ctr",
    title: "Analiza reklam",
    category: "marketing",
    icon: "MousePointerClick",
    desc: "Wklejasz wyniki z Menedżera reklam albo zrzut ekranu. Dostajesz ocenę według zasad z warsztatu ze specjalistą od reklam: co zostawić, co wyłączyć, co poprawić.",
    opener: "Wklej wyniki reklam z Menedżera reklam. Dla każdej reklamy: wydatki, zasięg, częstotliwość, CTR (kliknięcia w link), odtworzenia 3-sekundowe i koszt za wynik. Najprościej: zaznacz tabelę w Menedżerze, skopiuj i wklej albo dodaj zrzut ekranu. Jeśli wiesz, dopisz, ile z tych leadów przyszło na spotkanie i ile osób kupiło.",
    placeholder: "Wklej tabelę z Menedżera reklam albo wypisz: reklama, wydatki, częstotliwość, CTR, 3 s, koszt leada…",
    hint: "Patrzymy na 4 kolumny: częstotliwość, CTR, odtworzenia 3-sekundowe i koszt za wynik. Kolumnę „Odtworzenia filmu 3-sekundowe” dodasz w Menedżerze przez „Kolumny → Dostosuj kolumny”. Skopiowana tabela albo raport CSV jest najdokładniejszy; zrzut ekranu też zadziała, jeśli liczby są czytelne.",
    uses: ["cel-budzet", "strategia", "awatar"],
    starters: [
      {
        label: "Wzór do uzupełnienia",
        text: "Okres: ostatnie … dni\nReklama 1: wydatki … zł, zasięg …, częstotliwość …, CTR … %, odtworzenia 3 s …, leady …, koszt za lead … zł\nReklama 2: …\nPo reklamach: leady … → rozmowy … → spotkania … → sprzedaż …",
      },
    ],
  },
  {
    id: "rolki",
    title: "Rolki",
    category: "marketing",
    icon: "Film",
    desc: "Scenariusze rolek w języku Twojego klienta: organiczne bez CTA i reklamowe z jednym CTA. Każda z hakiem w pierwszych 3 sekundach.",
    opener: "Jakie rolki robimy? 1) organiczne na profil, bez sprzedaży (np. 9 rolek do optymalizacji profilu albo plan na 30 dni), 2) reklamowe z jednym wezwaniem do działania, 3) rolka z prawdziwą historią klienta. Najpierw zaproponuję tematy, a po Twoim wyborze napiszę pełne scenariusze.",
    placeholder: "Napisz, jakie rolki są potrzebne i dla kogo…",
    hint: "Najpierw lista tematów do wyboru, potem pełne scenariusze, po cztery naraz: hak, tekst do kamery, co pokazać, napisy i opis. Bez wymyślonych wyników klientów.",
    uses: ["dna", "awatar", "oferta"],
    starters: [
      { label: "9 rolek na profil", text: "Potrzebuję 9 rolek organicznych do optymalizacji profilu, bez sprzedaży. Każda oparta na jednym z 7 przekonań." },
      { label: "Plan na 30 dni", text: "Ułóż plan rolek na najbliższe 30 dni: podział treści i kalendarz." },
      { label: "3 rolki reklamowe", text: "Potrzebuję 3 rolek reklamowych z jednym CTA do formularza." },
    ],
  },
  {
    id: "vsl",
    title: "Scenariusz VSL",
    category: "marketing",
    icon: "Clapperboard",
    desc: "Scenariusz filmu sprzedażowego (7–8 minut) pod Twoją ofertę 90 dni: mocny hak, wyniki na początku, mechanizm i wezwanie do działania.",
    opener: "Zrobimy scenariusz VSL, czyli filmu sprzedażowego na stronę z formularzem. Najważniejsze są prawdziwe wyniki klientów pokazane w pierwszych 45 sekundach. Masz 2–3 historie klientów (z czym przyszli, ile trwała współpraca, jaki był wynik), które możesz pokazać za ich zgodą? Opisz je krótko.",
    placeholder: "Opisz historie klientów albo napisz, czego jeszcze nie masz…",
    hint: "Według VSL 2.0 Dochodowego Studia: najpierw 3 warianty haka do wyboru, potem pełny scenariusz z czasami, tekstem do kamery i tym, co widać na ekranie.",
    uses: ["dna", "awatar", "oferta"],
    starters: [{ label: "Nie mam historii klientów", text: "Nie mam jeszcze udokumentowanych historii klientów. Co wtedy?" }],
  },
  {
    id: "nowy-awatar",
    title: "Nowy awatar",
    category: "marketing",
    icon: "UserPlus",
    desc: "Drugi typ klienta, np. osoby po ciąży albo seniorzy. Te same pytania co w kroku „Awatar klienta”, plus porównanie z głównym awatarem.",
    opener: "Opiszemy kolejny typ klienta. Jaką grupę masz na myśli i skąd wiesz, że taka grupa do Ciebie przychodzi? Najlepiej pomyśl o 2–3 prawdziwych osobach z tej grupy.",
    placeholder: "Opisz grupę i 2–3 prawdziwe osoby z niej…",
    hint: "Ten sam sposób pracy co w kroku 4 ścieżki. Gotowy opis skopiuj przyciskiem pod odpowiedzią. Główny awatar w dokumentach zostaje bez zmian.",
    uses: ["dna", "awatar", "oferta"],
  },

  // ===== ZESPÓŁ =====
  {
    id: "ogloszenie-trener",
    title: "Ogłoszenie o pracę dla trenera",
    category: "zespol",
    icon: "Megaphone",
    desc: "Ogłoszenie, pytania do formularza i skrypt pierwszej rozmowy z kandydatem. Według lekcji o zatrudnianiu.",
    opener: "Przygotujemy ogłoszenie dla trenera. Na początek: kogo szukasz (doświadczenie, rodzaj treningów) i jak u Ciebie wygląda praca trenera? Same treningi personalne czy też dyżury i ile terminów w miesiącu minimum?",
    placeholder: "Kogo szukasz i jak wygląda praca u Ciebie…",
    hint: "Najpierw ogłoszenie i pytania do formularza. Potem, jeśli chcesz: skrypt telefonu do kandydata, SMS z zaproszeniem i plan rozmowy 1:1. Stawki i rodzaj umowy ustalasz Ty.",
    uses: ["dna", "oferta", "zespol"],
  },
  {
    id: "podrecznik-standardow",
    title: "Podręcznik standardów studia",
    category: "zespol",
    icon: "BookCheck",
    desc: "Zasady pracy zespołu: otwarcie i zamknięcie, obsługa klienta, prowadzenie treningu, usterki, sytuacje awaryjne, dane klientów. Rozdział po rozdziale.",
    opener: "Ułożymy podręcznik standardów pracy Twojego studia, rozdział po rozdziale. Zacznijmy od profilu: ile metrów ma studio, ilu trenerów pracuje i ile osób trenuje jednocześnie w szczycie?",
    placeholder: "Opisz studio: metraż, zespół, godziny, kto otwiera i zamyka…",
    hint: "Wzór z Dochodowego Studia dopasowany do Twojego lokalu. Punkty o BHP, ochronie przeciwpożarowej i danych klientów sprawdź ze specjalistą przed wdrożeniem.",
    uses: ["dna", "zespol"],
  },
  {
    id: "sciezka-kariery",
    title: "Ścieżka kariery trenera",
    category: "zespol",
    icon: "TrendingUp",
    desc: "Poziomy rozwoju trenera, zakres obowiązków i dwa modele wynagrodzenia: stawka godzinowa albo procent. Wyliczone na Twoich cenach.",
    opener: "Ułożymy ścieżkę kariery dla trenerów. Ile kosztuje u Ciebie pojedynczy trening (albo ile wychodzi za sesję w programie) i czy myślisz o wynagrodzeniu godzinowym, procentowym czy o obu do wyboru?",
    placeholder: "Ceny treningów, model wynagrodzenia, ilu trenerów…",
    hint: "Wzór ścieżki z Dochodowego Studia. Kwoty z materiałów to tylko przykład z jednego studia: wyliczymy je na Twoich cenach. Umowy i składki sprawdź z księgową.",
    uses: ["dna", "oferta", "zespol"],
  },

  // ===== UTRZYMANIE KLIENTÓW =====
  {
    id: "opinie-polecenia",
    title: "Prośba o opinię i polecenie",
    category: "utrzymanie",
    icon: "Star",
    desc: "Gotowe wiadomości z prośbą o opinię w Google, wideo-opinię albo polecenie, i odpowiedzi na opinie. Bez nagród za opinie, zgodnie z zasadami Google.",
    opener: "Pomogę poprosić o opinię albo polecenie. Napisz, o co chodzi: opinia w Google, wideo-opinia lub wywiad, polecenie znajomych, czy odpowiedź na opinię? I krótko: kto to jest i co się ostatnio wydarzyło (np. klientka pochwaliła trening, minęło 90 dni).",
    placeholder: "Kto, co się wydarzyło i o co chcesz poprosić…",
    hint: "Najlepszy moment na prośbę to chwila, gdy klient sam chwali usługę albo widzi pierwszy efekt. Prosimy wszystkich klientów, bez nagród za opinie.",
    uses: ["dna", "oferta", "utrzymanie"],
    copyHeadings: ["Wiadomość do wysłania"],
    starters: [
      { label: "Opinia w Google", text: "Klientka trenuje od 6 tygodni i dziś napisała, że czuje się dużo lepiej. Chcę poprosić o opinię w Google." },
      { label: "Polecenie po 90 dniach", text: "Klient kończy program 90 dni. Chcę poprosić o polecenie na przeglądzie celów." },
      { label: "Odpowiedź na opinię", text: "Odpowiedz na tę opinię w Google:\n" },
    ],
  },
  {
    id: "lista-rezerwowa",
    title: "Lista rezerwowa",
    category: "utrzymanie",
    icon: "CalendarClock",
    desc: "Gdy grafik jest pełny: płatna rezerwacja z gwarancją zwrotu zamiast „nie mamy miejsc”. Wiadomości krok po kroku i obsługa obiekcji.",
    opener: "Płatna lista rezerwowa ma sens, gdy grafik jest naprawdę pełny. Co przygotowujemy: wdrożenie procedury w Twoim studiu (okres, kwota, warunki) czy odpowiedź w konkretnej rozmowie? Przy rozmowie wklej ją tutaj.",
    placeholder: "Wklej rozmowę z osobą, dla której nie ma miejsca, albo opisz sytuację…",
    hint: "Według procedury „System kuloodpornego studia”: najpierw setting i wartość, dopiero potem informacja o pełnym grafiku, rezerwacja z gwarancją zwrotu i BLIK.",
    uses: ["oferta", "awatar", "sprzedaz"],
    copyHeadings: ["Wiadomość do wysłania"],
    starters: [
      { label: "Wdrożenie procedury", text: "Grafik jest pełny. Chcę wdrożyć płatną listę rezerwową. Od czego zaczynamy?" },
      { label: "Rozmowa z osobą", text: "Grafik pełny, a nowa osoba napisała w DM:\n" },
    ],
  },

];

// ---------- „JAK TO DZIAŁA” (okienko przy pierwszym otwarciu + panel obok rozmowy) ----------
// DO ZATWIERDZENIA (Bartek): brzmienie i przykłady.

/** Wspólna informacja o prywatności zdjęć i nagrań (zasady: /api/assistant, /api/transkrypcja). */
export const MEDIA_PRIVACY =
  "Zdjęcia i nagrania idą tylko do AI platformy (OpenRouter, u dostawców, którzy nie zbierają danych) i nie są nigdzie zapisywane. Zapisuje się sam tekst rozmowy, na Twoim koncie.";

const INTRO: Record<ToolId, ToolIntro> = {
  "asystent-sprzedazy": {
    wklej: "Wklej rozmowę z leadem, dodaj zrzut ekranu z Instagrama albo WhatsAppa, nagraj notatkę głosową albo po prostu opisz sytuację.",
    dostaniesz: "Status CRM, diagnozę, co zrobić teraz i gotową wiadomość do wysłania, którą kopiujesz jednym kliknięciem.",
    przyklad: "„Lead z formularza, 2 telefony bez odbioru, SMS wysłany wczoraj” → wiadomość follow-up i termin, kiedy wrócić.",
    prywatnosc: "Zamiast nazwiska wpisz samo imię albo „Klientka A”. Na zrzutach zakryj numery telefonów.",
  },
  "audyt-rozmowy": {
    wklej: "Wklej transkrypcję (np. z Fathom), dodaj plik z nagraniem rozmowy (do 4 MB) albo opisz rozmowę z pamięci.",
    dostaniesz: "Ocenę X/10, co było dobre, gdzie uciekła kontrola, lepsze sformułowania i gotowy follow-up.",
    przyklad: "Nagranie telefonu po formularzu → „Było: daj znać → Lepiej: nad czym konkretnie chcesz się zastanowić?”.",
    prywatnosc: "Rozmowę nagrywasz tylko wtedy, gdy klient o tym wie. Plik zamieniamy na tekst i od razu o nim zapominamy.",
  },
  "trening-rozmowy": {
    wklej: "Napisz, co ćwiczysz: telefon, DM albo konsultację, i poziom trudności. Możesz mówić do mikrofonu jak w prawdziwej rozmowie.",
    dostaniesz: "Fikcyjnego klienta z prawdziwymi obiekcjami, a po komendzie „ocena” ocenę rozmowy i jedno ćwiczenie na następny raz.",
    przyklad: "„Telefon, poziom trudny” → klient od razu pyta o cenę, a na końcu mówi, że musi pogadać z partnerem.",
    prywatnosc: "Klient jest fikcyjny, gra go AI. „Nowa rozmowa” usuwa całą scenkę.",
  },
  ctr: {
    wklej: "Wklej tabelę z Menedżera reklam albo dodaj do 3 zrzutów ekranu. Ważne kolumny: częstotliwość, CTR, odtworzenia 3 s i koszt za wynik.",
    dostaniesz: "Decyzję dla każdej reklamy (zostaw, wymień kreację, popraw hak, popraw przekaz, wyłącz) i 3 zadania na ten tydzień.",
    przyklad: "CTR 0,6% przy dobrych odtworzeniach 3 s → hak działa, ale reszta rolki za słabo mówi o bólu klienta.",
    prywatnosc: "Na zrzucie wystarczy tabela z wynikami. Nazwa konta i dane do faktur nie są potrzebne.",
  },
  rolki: {
    wklej: "Napisz albo nagraj, jakie rolki są potrzebne: organiczne na profil, reklamowe czy z prawdziwą historią klienta.",
    dostaniesz: "Najpierw listę tematów do wyboru, potem pełne scenariusze: hak, tekst do kamery, co pokazać, napisy i opis.",
    przyklad: "„9 rolek na profil” → tematy oparte na 7 przekonaniach klienta i po 4 pełne scenariusze naraz.",
    prywatnosc: "Historie klientów tylko prawdziwe i za ich zgodą. AI nie wymyśla wyników.",
  },
  vsl: {
    wklej: "Opisz albo nagraj 2–3 prawdziwe historie klientów: z czym przyszli, ile trwała współpraca i jaki był wynik.",
    dostaniesz: "3 warianty haka do wyboru, a potem pełny scenariusz filmu (7–8 minut) z czasami i tym, co widać na ekranie.",
    przyklad: "Historia klientki po 90 dniach → hak „dowód na start” i wyniki pokazane w pierwszych 45 sekundach.",
    prywatnosc: "Wizerunek i wyniki klientów pokazujesz tylko za ich pisemną zgodą.",
  },
  "nowy-awatar": {
    wklej: "Opisz grupę i 2–3 prawdziwe osoby z niej. Możesz wkleić transkrypcję rozmowy z klientem albo zrzut odpowiedzi z ankiety.",
    dostaniesz: "Opis nowego typu klienta według szablonu, porównanie z głównym awatarem i 3 haki w języku tej grupy.",
    przyklad: "„Mamy po ciąży” → ich słowa, obawy, co skłania je do szukania pomocy i co zmienić w komunikacji.",
    prywatnosc: "Bez nazwisk i bez danych o zdrowiu konkretnych osób.",
  },
  "ogloszenie-trener": {
    wklej: "Napisz albo nagraj, kogo szukasz i jak wygląda praca u Ciebie: model pracy, minimalna dostępność, co dajesz trenerowi.",
    dostaniesz: "Ogłoszenie w dwóch wersjach i pytania do formularza, a na prośbę skrypt telefonu i plan rozmowy 1:1.",
    przyklad: "„Trener na popołudnia, min. 10 terminów w miesiącu” → post na profil studia i ogłoszenie do grup.",
    prywatnosc: "Ogłoszenie bez wymagań co do wieku i płci. Stawki i rodzaj umowy ustalasz Ty z księgową.",
  },
  "podrecznik-standardow": {
    wklej: "Opisz studio: metraż, zespół, godziny, kto otwiera i zamyka. Najszybciej nagrać to jak notatkę głosową.",
    dostaniesz: "Podręcznik rozdział po rozdziale: otwarcie, obsługa klienta, trening, usterki, sytuacje awaryjne i zamknięcie.",
    przyklad: "„60 m², 3 trenerów, bez recepcji” → procedura otwarcia i zamknięcia dopasowana do Twojego lokalu.",
    prywatnosc: "Punkty o BHP, ochronie przeciwpożarowej i danych klientów sprawdź ze specjalistą przed wdrożeniem.",
  },
  "sciezka-kariery": {
    wklej: "Podaj ceny treningów i model wynagrodzenia, który rozważasz: godzinowy, procentowy albo oba do wyboru.",
    dostaniesz: "Porównanie modeli wyliczone na Twoich cenach, poziomy rozwoju trenera, obowiązki i premie.",
    przyklad: "„Trening 180 zł, 2 trenerów” → ile zarabia trener i ile zostaje studiu przy 10, 40 i 80 treningach w miesiącu.",
    prywatnosc: "Rodzaj umowy, składki i podatki sprawdź z księgową.",
  },
  "opinie-polecenia": {
    wklej: "Napisz, kto to jest i co się wydarzyło. Możesz dodać zrzut opinii z Google albo wiadomości od klienta.",
    dostaniesz: "Gotową wiadomość z prośbą o opinię albo polecenie, co powiedzieć na żywo, albo odpowiedź na opinię.",
    przyklad: "„Klientka po 6 tygodniach pochwaliła trening” → krótki SMS z linkiem do opinii w Google.",
    prywatnosc: "Bez nagród za opinie i bez wybierania tylko zadowolonych klientów: tak wymaga Google.",
  },
  "lista-rezerwowa": {
    wklej: "Wklej rozmowę z osobą, dla której nie ma miejsca, dodaj zrzut ekranu albo zapytaj o wdrożenie procedury.",
    dostaniesz: "Etap procedury, jedną wiadomość do wysłania teraz, czego nie robić i kiedy odezwać się następnym razem.",
    przyklad: "Pytanie o wolne terminy przy pełnym grafiku → najpierw diagnoza i wartość, dopiero potem rezerwacja z gwarancją zwrotu.",
    prywatnosc: "Warunki rezerwacji i zwrotów sprawdź z prawnikiem przed wdrożeniem.",
  },
};

/** Czat kroku ścieżki (Bartek): jedno okienko „Jak to działa” dla wszystkich kroków. */
export const STEP_CHAT_INTRO: ToolIntro = {
  wklej: "Odpowiadasz na pytania Bartka (asystenta AI) jedno po drugim: piszesz, dyktujesz, wklejasz transkrypcję albo dodajesz zdjęcia i nagrania.",
  dostaniesz: "Przycisk „Przygotuj dokument z rozmowy” składa dokument kroku. Poprawiasz go po prawej i zatwierdzasz.",
  przyklad: "W kroku „Awatar klienta” wklejasz transkrypcję rozmowy z klientem, a asystent wyciąga z niej jego własne słowa.",
  prywatnosc: "Zamiast nazwisk używaj imion. Nie wklejaj numerów telefonów ani informacji o zdrowiu klientów.",
};

/** Klucze w state.toolIntro: kiedy ktoś zamknął okienko „Jak to działa”. */
export const introKey = (id: ToolId) => `tool:${id}`;
export const STEP_INTRO_KEY = "krok";

// ---------- CO MOŻNA DODAĆ DO WIADOMOŚCI ----------

const ALL_INPUTS: ToolInput[] = ["zdjecia", "nagranie", "transkrypcja"];
const INPUTS: Partial<Record<ToolId, ToolInput[]>> = {
  "trening-rozmowy": [], // scenka na żywo: tylko pisanie i dyktowanie
  ctr: ["zdjecia"],
  "sciezka-kariery": ["nagranie"],
  "ogloszenie-trener": ["nagranie", "transkrypcja"],
};

/** Narzędzia, do których wkleja się długie transkrypcje i tabele (dłuższy limit wiadomości). */
const LONG_INPUT = new Set<ToolId>(["asystent-sprzedazy", "audyt-rozmowy", "ctr", "lista-rezerwowa", "nowy-awatar"]);

export const TOOLS_PUBLIC: ToolMeta[] = BASE.map((t) => ({
  ...t,
  intro: INTRO[t.id],
  inputs: INPUTS[t.id] ?? ALL_INPUTS,
  maxChars: LONG_INPUT.has(t.id) ? CHAT_LIMITS.longMessage : CHAT_LIMITS.message,
}));

// ---------- NARZĘDZIA W KROKACH ŚCIEŻKI ----------
// DO ZATWIERDZENIA (Bartek): które narzędzia pokazujemy w którym kroku (id kroków z src/lib/journey.ts).

export const STEP_TOOLS: Record<string, ToolId[]> = {
  materialy: [],
  diagnoza: ["ctr", "audyt-rozmowy"],
  dna: [],
  awatar: ["nowy-awatar"],
  oferta: ["trening-rozmowy"],
  "cel-budzet": ["ctr"],
  sprzedaz: ["asystent-sprzedazy", "audyt-rozmowy", "trening-rozmowy"],
  strategia: ["ctr"],
  gotowosc: ["ctr", "ogloszenie-trener"],
  "materialy-lejka": ["rolki", "vsl"],
  plan: ["ogloszenie-trener", "podrecznik-standardow", "sciezka-kariery"],
  wyniki: ["ctr", "audyt-rozmowy"],
  okazje: ["rolki", "nowy-awatar"],
  utrzymanie: ["opinie-polecenia", "lista-rezerwowa", "podrecznik-standardow"],
  zespol: ["ogloszenie-trener", "sciezka-kariery", "podrecznik-standardow"],
};

// ---------- DOSTĘP ----------

export function publicTool(id: string): ToolMeta | undefined {
  return TOOLS_PUBLIC.find((t) => t.id === id);
}

export function toolsForStep(stepId: string): ToolMeta[] {
  return (STEP_TOOLS[stepId] ?? []).flatMap((id) => publicTool(id) ?? []);
}

/** Kroki, w których pojawia się narzędzie (odwrotność STEP_TOOLS). */
export function stepsForTool(id: ToolId): string[] {
  return Object.entries(STEP_TOOLS).filter(([, ids]) => ids.includes(id)).map(([stepId]) => stepId);
}

export function publicToolGroups(): ToolGroup[] {
  return TOOL_CATEGORIES.map((c) => ({ ...c, tools: TOOLS_PUBLIC.filter((t) => t.category === c.id) }));
}
