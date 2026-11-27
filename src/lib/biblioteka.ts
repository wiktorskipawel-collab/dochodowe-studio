// Biblioteka „Dla trenerów zespołu” na stronie /lekcje (zakładka obok „Twoja ścieżka” i „Kursy Bartka”).
// Moduły z kursu Bartka „Przedsiębiorczy Trener” (Skool) + lekcje trenera ze studia Bartka (kurs „Jak to robi studio Bartka”)
// i lekcja „Trening 3–4 osób w studiu” z kursu Dochodowe Studio. Dane lekcji (tytuł, wideo, link Skool) są w src/lib/kursy.ts;
// tu tylko dobór modułów oraz opisy i zadania dla zespołu, własnymi słowami (bez imion, nazw studiów i linków do Dysku).
// Lekcje nie blokują się. „Obejrzane” daje XP przez markWatched i jest wspólne z biblioteką kursów (to samo id lekcji).
// DO ZATWIERDZENIA (Bartek): dobór modułów, opisy i zadania; które lekcje są raczej dla właściciela.
import { LEKCJE, lekcjeModulu, type IdLekcjiKursu, type LekcjaKursu } from "@/lib/kursy";

type Dla = "zespol" | "wlasciciel"; // „wlasciciel” = raczej dla właściciela niż dla trenerów

export type ModulTrenera = { id: string; title: string; opis: string };

export type LekcjaTrenera = LekcjaKursu & {
  modul: string; // id modułu z MODULY_TRENERA
  zadanie?: string; // ćwiczenie po lekcji, np. na spotkanie zespołu
  dla: Dla;
};

type Notatka = { opis?: string; zadanie?: string; dla?: Dla };

const NOTATKI: Partial<Record<IdLekcjiKursu, Notatka>> = {
  // ——— Tu zacznij ———
  "sk-ad5e1dcd21": { opis: "Jak przejść przez kurs dla trenerów i gdzie zadawać pytania.", dla: "wlasciciel" },
  "sk-f79ed2a44f": {
    opis: "Kilka zasad na co dzień: działać, nawet gdy nie jest idealnie, nie odkładać, myśleć jak właściciel, uczyć się sprzedaży i mierzyć wyniki liczbami. Najlepiej mieć je na widoku.",
    zadanie: "Każda osoba z zespołu spisuje swój kodeks na jednej kartce i trzyma go na widoku.",
  },
  "sk-532ecf7f31": { opis: "Rytm dnia bez telefonu przed snem i zaraz po przebudzeniu, rano tworzenie zamiast reagowania, ruch bez uciekania w trening i proste nawyki wieczorne, które obniżają stres." },

  // ——— Fundamenty miękkie ———
  "sk-9120fca80c": {
    opis: "Technika to mała część pracy trenera. Reszta to relacja, atmosfera i własny przykład: kto sam dba o trening, sen i jedzenie, nie musi nikogo ciągnąć na siłę.",
    zadanie: "Każda osoba z zespołu odpowiada sobie: co daje mi w tej pracy najwięcej satysfakcji i w czym wymagam od klientów więcej niż od siebie?",
  },
  "sk-25093147cd": {
    opis: "Ludzie wracają do ludzi, nie do ćwiczeń. Przywitanie z energią, pytania o życie klienta, czytanie jego nastroju, pełna obecność w najcięższej części treningu i krótka wiadomość następnego dnia.",
    zadanie: "Spiszcie 5 standardów relacji w studiu: przywitanie, pytanie w trakcie, notatki o kliencie, pożegnanie, wiadomość po treningu.",
  },
  "sk-718b3389e3": {
    opis: "Wygląd, punktualność, język i mowa ciała mówią klientowi, czy jest w dobrych rękach. Ekspert prowadzi według planu i spokojnie stawia granice, gdy klient się spóźnia albo ma własne pomysły.",
    zadanie: "Wypiszcie zwroty, które brzmią, jakby trener nie miał planu, i zamieńcie je na konkretne komunikaty.",
  },

  // ——— Fundamenty twarde ———
  "sk-80fa7268b4": { zadanie: "Sprawdźcie, z których narzędzi zespół już korzysta, a których brakuje, i ustalcie jedno wspólne miejsce na dokumenty." },

  // ——— Merytoryka trenera ———
  "sk-92c4b31b32": { opis: "U początkujących o efekcie decyduje głównie to, czy klient polubił trenera i atmosferę oraz czy zaangażował się finansowo. Wiedza jest fundamentem, ale studio potrzebuje i metodyki, i pracy nad relacją." },
  "sk-20ebf79634": { opis: "Stały schemat jednostki: rozgrzewka, mobilizacja, część główna na cztery części ciała, ćwiczenia dodatkowe pod cel klienta i interwał. Nowa osoba najpierw uczy się wzorców ruchu z zapasem siły w każdej serii." },
  "sk-4daa4cb36e": { opis: "Prosty szablon planu i notatki z treningów wystarczą, żeby każdy trener w zespole wiedział, gdzie klient był miesiąc temu i dokąd zmierza." },
  "sk-609d7d1ff6": { opis: "To, że waga stoi, nie znaczy, że klient nie ma efektów. Najważniejsze zmiany często dzieją się w śnie, samopoczuciu i głowie, a dobry trening to czasem mniej stresu, nie więcej ciężaru." },
  "sk-e6f51fe76e": {
    opis: "Bez spisanej metodyki każdy trener prowadzi po swojemu, a klient dostaje inną usługę u każdego.",
    zadanie: "Spiszcie metodykę studia na jedną stronę tak prosto, żeby osoba z zewnątrz mogła jutro poprowadzić trening.",
  },

  // ——— Trener w studiu Bartka ———
  "sk-7ebe17067f": { opis: "Trening do 60 minut: rozgrzewka i mobilizacja, cztery ćwiczenia główne w superseriach, ćwiczenia dodatkowe pod cel klienta i krótki interwał. Zapas powtórzeń osobno dla nowych i zaawansowanych." },
  "sk-993df8348c": { zadanie: "Rozpiszcie pierwsze dwa tygodnie nowego klienta w studiu: kto się odzywa, kiedy i z czym." },

  // ——— Semi-personal ———
  "sk-44f9d80177": { opis: "Obawy przed treningiem kilku osób naraz i to, co wyszło w praktyce: te same wyniki, więcej czasu i wyższy przychód z godziny na sali.", dla: "wlasciciel" },
  "sk-3df83a7a3f": { opis: "Jak zakończyć konsultację informacją o modelu współpracy, jak wycenić semi i jak powiedzieć o zmianie obecnym klientom.", dla: "wlasciciel" },
  "sk-48fcda0239": { opis: "Dalsza część wdrożenia modelu. Dla ostrożnych wariant łagodny: nowe zasady tylko dla nowych osób.", dla: "wlasciciel" },
  "sk-c97dd1517e": { opis: "Ta sama metodyka co 1:1, z dwiema zmianami: sala ustawiona tak, żeby nie rozkładać sprzętu przy każdym ćwiczeniu, i rytm pracy: pokazujesz, sprawdzasz technikę, mówisz, co dalej, i idziesz do kolejnej osoby." },
  "sk-f3c32335eb": { opis: "Najczęstsze obawy: że klient nie zapłaci tyle samo, że nie da się ogarnąć kilku osób, że spadnie jakość. Chaos to brak systemu, a nie liczba osób na sali." },
  "sk-166cd52726": { zadanie: "Przeprowadźcie 10 próbnych treningów semi z osobami o różnych celach i zapiszcie, co spowalnia trening." },
  "sk-b5d3289ff2": { opis: "Nagranie treningu semi: jak wygląda rytm pracy z kilkoma osobami naraz." },
  "sk-539979c4a0": {
    opis: "Trening 3–4 osób w praktyce: krótki check-in na start, ćwiczenia w trzech poziomach trudności, finisher i jasne zasady progresji.",
    zadanie: "Wprowadźcie jeden wspólny check-in (energia 1–10, ból, ostatni trening) i notujcie odpowiedzi przez 2 tygodnie.",
  },

  // ——— Spotkania grupowe ———
  "sk-dcd6272cbc": { dla: "zespol" },
};

const MODULY: (ModulTrenera & { dla: Dla; lekcje: LekcjaKursu[] })[] = [
  { id: "start", title: "Tu zacznij", opis: "Kodeks i codzienne rutyny: jak zarządzać sobą, zanim zaczniesz prowadzić klientów.", dla: "zespol", lekcje: lekcjeModulu("pt-start") },
  { id: "miekkie", title: "Fundamenty miękkie", opis: "Relacja, postawa i komunikacja z klientem.", dla: "zespol", lekcje: lekcjeModulu("pt-miekkie") },
  { id: "twarde", title: "Fundamenty twarde", opis: "Proste narzędzia trenera: dokumenty, arkusze, kalendarz, formularze, linktree.", dla: "zespol", lekcje: lekcjeModulu("pt-twarde") },
  { id: "merytoryka", title: "Merytoryka trenera", opis: "Czym jest trening personalny, jak zbudować jednostkę i śledzić postępy klienta.", dla: "zespol", lekcje: lekcjeModulu("pt-merytoryka") },
  { id: "studio", title: "Trener w studiu Bartka", opis: "Jak pracują trenerzy w studiu Bartka: metoda, zasady, relacje, umawianie, wdrażanie klientów i zastępstwa.", dla: "zespol", lekcje: lekcjeModulu("sp-trener") },
  { id: "semi", title: "Semi-personal", opis: "Trening kilku osób naraz: dlaczego, jak wdrożyć, metodyka i mity.", dla: "zespol", lekcje: [...lekcjeModulu("pt-semi"), LEKCJE["sk-539979c4a0"]] },
  { id: "rolki", title: "Montaż rolek", opis: "Krótkie filmy do social mediów: montaż krok po kroku.", dla: "zespol", lekcje: lekcjeModulu("pt-rolki") },
  { id: "spotkania", title: "Spotkania grupowe", opis: "Nagrania spotkań grupowych kursu z pytaniami uczestników.", dla: "wlasciciel", lekcje: lekcjeModulu("pt-spotkania") },
];

export const MODULY_TRENERA: ModulTrenera[] = MODULY.map(({ id, title, opis }) => ({ id, title, opis }));

export const BIBLIOTEKA: LekcjaTrenera[] = MODULY.flatMap((m) =>
  m.lekcje.map((l) => {
    const n = (NOTATKI as Record<string, Notatka | undefined>)[l.id];
    return { ...l, modul: m.id, opis: n?.opis ?? l.opis, zadanie: n?.zadanie, dla: n?.dla ?? m.dla };
  }),
);
