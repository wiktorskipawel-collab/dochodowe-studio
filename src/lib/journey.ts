// Ścieżka Marketing OS według notatek Bartka (rozmowa w ChatGPT, spec: materialy/spec-marketing-os.md).
// Numery w nawiasach = wymiany z rozmowy. Elementy oznaczone „DO ZATWIERDZENIA” nie mają jawnej decyzji Bartka.
import type { JourneyState } from "@/lib/store";
import type { Lesson, Stage, Step, StepStatus, SurveyQuestion } from "@/lib/journey-types";

// ---------- ANKIETA STARTOWA ----------
// DO ZATWIERDZENIA: w rozmowie nie ma dosłownej ankiety. Pytania złożone z tych, które Bartek zadaje w rozmowie
// (cel biznesowy 89–90, waluta czas/pieniądze 82, godziny 75, problem z wym. 1, poziom 73).
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
      { value: "solo", label: "Sam / sama prowadzę treningi" },
      { value: "trenerzy", label: "Mam 1–3 trenerów" },
      { value: "zespol", label: "Mam zespół z managerem albo kilka lokalizacji" },
    ],
  },
  {
    id: "cel", intro: "Marketing ma służyć celowi biznesowemu. Co chcesz osiągnąć w najbliższe 3 miesiące?", question: "Jaki jest Twój główny cel na najbliższe 3 miesiące?",
    options: [
      { value: "otwarcie", label: "Otworzyć studio i zdobyć pierwszych klientów" },
      { value: "grafik", label: "Zapełnić grafik (mój albo nowego trenera)" },
      { value: "przychod", label: "Zwiększyć przychody" },
      { value: "odchodzacy", label: "Zastąpić klientów, którzy odchodzą" },
      { value: "skalowanie", label: "Skalować: kolejna lokalizacja, większy zespół" },
    ],
  },
  {
    id: "zrodla", intro: "Skąd dziś przychodzą klienci? Bez oceniania, potrzebuję prawdy.", question: "Skąd dziś przychodzą do Ciebie klienci?",
    options: [
      { value: "brak", label: "Jeszcze nie mam klientów" },
      { value: "polecenia", label: "Głównie z poleceń i przypadkiem" },
      { value: "social", label: "Z social mediów, bez reklam" },
      { value: "reklamy", label: "Z reklam płatnych" },
      { value: "kilka", label: "Z kilku źródeł naraz" },
    ],
  },
  {
    id: "problem", intro: "Co najbardziej Cię blokuje? Od tego zaczniemy diagnozę.", question: "Co najbardziej Cię dziś blokuje?",
    options: [
      { value: "zgloszenia", label: "Za mało zgłoszeń" },
      { value: "jakosc", label: "Zgłoszenia są drogie albo słabej jakości" },
      { value: "sprzedaz", label: "Zgłoszenia są, ale mało kto kupuje" },
      { value: "oferta", label: "Nie wiem, co i komu sprzedawać" },
      { value: "czas", label: "Brakuje mi czasu na marketing" },
    ],
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
    id: "godziny", intro: "Ile godzin tygodniowo realnie dasz na marketing? Ułożę plan pod Twój tydzień.", question: "Ile godzin tygodniowo realnie dasz na marketing?",
    options: [
      { value: "2", label: "Do 2 godzin" },
      { value: "5", label: "2–5 godzin" },
      { value: "10", label: "5–10 godzin" },
      { value: "10+", label: "Ponad 10 godzin albo ktoś mi pomaga" },
    ],
  },
  {
    id: "materialy", intro: "Co już masz o studiu? Nic nie przepisujesz ręcznie, w pierwszym kroku po prostu to wkleisz.", question: "Jakie materiały o studiu już masz?",
    help: "Nie przepisujesz nic ręcznie. W pierwszym kroku po prostu je wkleisz.",
    options: [
      { value: "nic", label: "Prawie nic" },
      { value: "oferta", label: "Ofertę i cennik" },
      { value: "wiecej", label: "Ofertę, opis klientów, wyniki" },
      { value: "audyt", label: "Audyt Dochodowego Studia i inne dokumenty" },
    ],
  },
  {
    id: "poziom", intro: "Ostatnie pytanie: jak radzisz sobie z narzędziami? Dopasuję, jak mocno prowadzę Cię za rękę.", question: "Jak radzisz sobie z narzędziami (Menedżer reklam, Canva, statystyki)?",
    options: [
      { value: "poczatkujacy", label: "Słabo, prowadź mnie za rękę" },
      { value: "sredni", label: "Średnio, wybiorę z gotowych propozycji" },
      { value: "zaawansowany", label: "Dobrze, chcę liczb i analiz" },
    ],
  },
];

// ---------- ETAPY STUDIA (52) ----------
const ALL = ["materialy", "diagnoza", "dna", "awatar", "oferta", "cel-budzet", "strategia", "gotowosc", "plan", "materialy-lejka", "wyniki", "okazje"];

export const STAGES: Stage[] = [
  {
    id: "przed-otwarciem",
    name: "Przed otwarciem",
    description: "Nie masz jeszcze klientów ani danych. Marketing budujemy od zera.",
    focus: "awatar, oferta, pozycjonowanie i strategia zdobycia pierwszych klientów",
    steps: ALL.filter((s) => s !== "wyniki" && s !== "okazje"),
  },
  {
    id: "bez-systemu",
    name: "Działające studio bez przewidywalnego marketingu",
    description: "Masz klientów, ofertę i jakieś działania, ale nie masz systemu, który regularnie przyprowadza nowych klientów.",
    focus: "diagnoza problemu i uruchomienie 1–2 dobrze dobranych lejków",
    steps: ALL,
  },
  {
    id: "rozwiniete",
    name: "Studio rozwinięte",
    description: "Marketing już działa. Teraz liczy się rentowność i wąskie gardła.",
    focus: "analiza wyników, wąskie gardła i poprawa opłacalności pozyskiwania klientów",
    steps: ALL,
  },
];

/** DO ZATWIERDZENIA: w rozmowie nie ma progów. Docelowo etap potwierdza diagnoza z danych (krok 2), a nie sama deklaracja. */
export function detectStage(a: Record<string, string>): string {
  if (a.etap === "przed" || a.zrodla === "brak" || a.cel === "otwarcie") return "przed-otwarciem";
  if (a.etap === "regularnie" && (a.model === "zespol" || a.cel === "skalowanie" || a.zrodla === "kilka" || a.zrodla === "reklamy")) return "rozwiniete";
  return "bez-systemu";
}

export function surveySummary(a: Record<string, string> | null): string {
  if (!a) return "";
  return SURVEY.map((q) => {
    const v = a[q.id];
    if (!v) return null;
    const label = q.options?.find((o) => o.value === v)?.label ?? v;
    return `- ${q.question} ${label}`;
  }).filter(Boolean).join("\n");
}

// ---------- LEKCJE (nazwy z rozmowy; pełna lista ze Skoola później) ----------
const L = {
  playbook: { id: "playbook", title: "Dochodowe Studio Playbook", source: "Skool · podstawa metodyki" },
  awatarPlaybook: { id: "awatar-klienta-studia", title: "Awatar klienta studia", source: "Playbook DS · rozdział 03" },
  profilKlienta: { id: "profil-klienta", title: "Profil klienta i segmentacja rynku", source: "kurs Płatny Marketing · 1.6–1.7" },
  oferta: { id: "oferta-pakiety", title: "Oferta studia: jak stworzyć pakiety usług", source: "Skool" },
  matryca: { id: "matryca-oferty", title: "Matryca oferty", source: "Skool · lekcje 4.2 i 4.3" },
  nieTrening: { id: "nie-sprzedajesz-treningu", title: "Nie sprzedajesz treningu · Program 90 dni", source: "Playbook DS" },
  systemSprzedazy: { id: "system-sprzedazy", title: "System Sprzedaży Studia Treningu Personalnego", source: "Skool" },
  systemKlientow: { id: "system-klientow", title: "System Klientów", source: "Skool · kurs" },
  setting: { id: "jak-settowac", title: "Jak settować", source: "nagranie · DM i rozmowy" },
  content: { id: "content-dochodowe", title: "Content Dochodowe", source: "e-book" },
  scenariusze: { id: "scenariusze-reklam", title: "Gotowe scenariusze reklam dla kobiet i mężczyzn", source: "Skool" },
  ocenaReklam: { id: "jak-oceniac-reklamy", title: "Jak oceniać reklamy", source: "szkolenie · analiza kampanii" },
} satisfies Record<string, Lesson>;

const STATUSES = "Przy każdej istotnej informacji podaj status: POTWIERDZONE / DEKLARACJA / HIPOTEZA / BRAK DANYCH / SPRZECZNOŚĆ.";

// ---------- KROKI ŚCIEŻKI ----------
export const STEPS: Step[] = [
  {
    id: "materialy", no: "1", phase: "Fundament (moduł 00)",
    title: "Twoje materiały i obraz firmy",
    goal: "Uporządkować wszystko, co już wiesz o studiu, zamiast wypełniać formularze.",
    docId: "inwentaryzacja", docTitle: "Inwentaryzacja i wstępny obraz firmy",
    docTemplate: `ETAP 1 — INWENTARYZACJA
Materiał | Jakie informacje zawiera | Data / aktualność | Co z niego wynika | Czego nie można potwierdzić

ETAP 2 — WSTĘPNE DNA (ze statusami)
Opis studia i modelu biznesowego:
Grupy klientów i ich problemy:
Oferta, obietnica i mechanizm transformacji:
Cennik oraz ekonomika:
Zespół i przepustowość:
Pozycjonowanie i przewagi:
Materiały dowodowe:
Dotychczasowy marketing:
Proces sprzedaży:
Cele i ograniczenia:

ETAP 3 — LUKI
A. Krytyczne:
B. Ważne:
C. Opcjonalne:

ETAP 4 — PODSUMOWANIE
Co już wiemy:
Mocne strony:
Co może ograniczać marketing:
5 informacji do uzupełnienia w pierwszej kolejności:`,
    script: `To prompt 00.1 „Analizator materiałów” (37). Jesteś analitykiem strategicznym. Nie tworzysz jeszcze reklam, lejków, skryptów ani strategii — masz zrozumieć biznes.
- Poproś o wklejenie wszystkiego, co właściciel ma: oferta i cennik, opis klienta, audyt, liczba klientów i trenerów, wyniki sprzedaży, lokalizacja (adres), dotychczasowe kampanie, opinie i historie klientów, proces obsługi leadów, cele, linki do Instagrama/Facebooka/strony/wizytówki Google. Nie zakładaj, że ma wszystko.
- Nie pytaj o to, co jest w materiałach. Pokaż sprzeczności i ich źródła. Oznacz dane, które mogą być nieaktualne.
- Nie traktuj przykładowego awatara jako opisu prawdziwych klientów. Oddziel obiecane rezultaty od udokumentowanych.
- ${STATUSES}
- Na końcu zapytaj, czy właściciel zgadza się z obrazem firmy. Nie przechodź dalej bez przedstawienia wyników analizy.`,
    opener: "Zaczynamy od tego, co już masz. Wklej tu wszystko o swoim studiu: ofertę i cennik, opis klientów, audyt, wyniki, opinie, linki do profili. Może być chaotycznie i niekompletnie. Ja to uporządkuję i powiem, czego brakuje.",
    exitCriteria: ["Wszystkie materiały są w jednym miejscu", "Wiesz, co jest potwierdzone, a co jest tylko założeniem", "Masz listę braków A / B / C"],
    lessons: [L.playbook],
    needs: [],
  },
  {
    id: "diagnoza", no: "2", phase: "Fundament (moduł 00)",
    title: "Diagnoza i uzupełnienie braków",
    goal: "Sprawdzić, co naprawdę ogranicza wzrost studia, i dopytać tylko o to, co zmienia strategię.",
    docId: "diagnoza", docTitle: "Diagnoza studia",
    docTemplate: `Etap studia (z danych, nie z deklaracji):
Główny typ problemu (oferta / za mało zgłoszeń / słaba sprzedaż / niewykorzystana przepustowość):
Co już działa:
Czego brakuje:
Wąskie gardła:
Możliwości zespołu i obsługi nowych klientów:
Gotowość do obsługi leadów (CRM, telefon, konsultacja):
Uzupełnione braki (pytanie → odpowiedź):
Co należy zrobić najpierw:`,
    script: `To prompty 00.2 „Diagnosta biznesowy” i 00.3 „Uzupełnianie braków” (36, 37).
- Oceń według metodyki Dochodowego Studia: ofertę, klienta docelowego, wyróżniki, zespół, proces sprzedaży i ekonomikę. Rozstrzygnij, czy problemem jest oferta, zbyt mała liczba zgłoszeń, słaba sprzedaż czy niewykorzystana przepustowość.
- Pytania: tylko braki z listy A, potem B. Etapami, jedno pytanie naraz, przy każdym jednym zdaniem wyjaśnij, do czego potrzebujesz odpowiedzi. Nie zadawaj pytań, które nie wpływają na decyzje marketingowe.
- Potwierdź etap studia na podstawie danych (przed otwarciem / działające bez przewidywalnego marketingu / rozwinięte). Jeśli różni się od ankiety, powiedz to wprost.
- Zablokuj rekomendowanie reklam, jeśli studio nie obsłuży zgłoszeń. Brak danych to też ważny wynik diagnozy.`,
    opener: "Mam Twój obraz firmy. Teraz sprawdzę, co naprawdę ogranicza wzrost studia. Dopytam tylko o rzeczy, które zmieniają strategię. Gotowy?",
    exitCriteria: ["Znasz główny problem studia", "Etap studia jest potwierdzony danymi", "Braki krytyczne są uzupełnione"],
    lessons: [L.systemSprzedazy],
    needs: ["inwentaryzacja"],
  },
  {
    id: "dna", no: "3", phase: "Fundament (moduł 00)",
    title: "DNA marketingowe studia",
    goal: "Jeden dokument o Twoim studiu, z którego korzystają wszystkie kolejne kroki i lejki.",
    docId: "dna", docTitle: "DNA marketingowe studia",
    docTemplate: `DNA MARKETINGOWE STUDIA — [NAZWA]
1. Model biznesowy:
2. Awatar klienta (wstępnie):
3. Oferta i transformacja:
4. Pozycjonowanie:
5. Dowody skuteczności (ze zgodą na publikację?):
6. Marketing obecnie:
7. Sprzedaż i obsługa:
8. Ekonomika i możliwości (przychód na klienta, marża, akceptowalny koszt klienta, wolne miejsca):
9. Cele i ograniczenia:
10. Luki i gotowość:

Najważniejsze przewagi studia:
Najważniejsze problemy marketingowe:
Zasoby gotowe do wykorzystania:
Brakujące zasoby:
Ograniczenia wdrożeniowe:
Pytania bez odpowiedzi:`,
    script: `To prompt 00.4 „Generator DNA” (31, 36). Złóż ostateczny, uporządkowany dokument studia — punkt odniesienia dla każdego kolejnego lejka.
- Korzystaj z inwentaryzacji i diagnozy. ${STATUSES}
- Najpierw pokaż DNA do zatwierdzenia. Popraw to, co właściciel wskaże.
- DNA to żywy dokument: później będzie aktualizowane wraz z wiedzą o klientach.`,
    opener: "Składam teraz DNA Twojego studia z tego, co ustaliliśmy. Zanim je przygotuję: czy jest coś ważnego o studiu, czego jeszcze nie powiedziałeś?",
    exitCriteria: ["DNA ma wszystkie 10 obszarów", "Każda ważna informacja ma status", "Zatwierdzasz DNA jako prawdziwy obraz studia"],
    lessons: [L.playbook],
    needs: ["inwentaryzacja", "diagnoza"],
  },
  {
    id: "awatar", no: "4", phase: "Klient i oferta (moduł 01)",
    title: "Awatar klienta",
    goal: "Opisać prawdziwego klienta studia jego własnym językiem, a nie domysłami.",
    docId: "awatar", docTitle: "Awatar klienta",
    docTemplate: `Nazwa grupy klientów:
Sytuacja życiowa:
Główne problemy (jego słowami):
Cele i to, co naprawdę chce zmienić:
Czego się obawia / obiekcje:
Co sprawia, że zaczyna szukać pomocy:
Wcześniejsze próby i ich rezultaty:
Motywacje:
Język klienta (dosłowne zwroty):
Zachowania zakupowe:
Skąd to wiemy (prawdziwi klienci, opinie, rozmowy) — statusy:`,
    script: `Moduł 01, kroki 1–2 (41). „Awatar przed ofertą”. „Język klienta zamiast języka trenera”.
- Buduj awatar na podstawie prawdziwych klientów studia: problemy, obawy, motywacje, wcześniejsze próby, rezultaty. Poproś o przykłady 2–3 najlepszych klientów, opinie, wiadomości, notatki z konsultacji.
- Rozróżniaj cele klientów od ich cech. Nie buduj awatara z researchu konkurencji ani wyłącznie z demografii.
- Gdy studio ma dwie wyraźne grupy, opisz główną i zaznacz drugą.
- Na końcu kontrola jakości: wypisz, co jest założeniem bez potwierdzenia.`,
    opener: "Teraz klient. Pomyśl o 2–3 najlepszych klientach, jakich miałeś. Kim są, co ich do Ciebie przyprowadziło i jakimi słowami opisywali swój problem na pierwszym spotkaniu?",
    exitCriteria: ["Awatar opiera się na prawdziwych klientach", "Masz zwroty, którymi mówią klienci", "Wiesz, co jest pewne, a co do sprawdzenia"],
    lessons: [L.awatarPlaybook, L.profilKlienta],
    needs: ["dna"],
  },
  {
    id: "oferta", no: "5", phase: "Klient i oferta (moduł 01)",
    title: "Oferta transformacyjna",
    goal: "Sprzedawać zmianę, której chce awatar, a nie godziny treningu.",
    docId: "oferta", docTitle: "Oferta",
    docTemplate: `OFERTA BIZNESOWA (zmienia tylko właściciel)
Produkt główny:
Rezultat:
Okres:
Proces:
Warianty:
Cena:
Za co studio odpowiada:

OFERTA MARKETINGOWA
Nazwa:
Obietnica (bez obietnic nie do udowodnienia):
Argumenty:
Dowody:
Bonusy:
Pierwszy krok klienta (np. konsultacja, trening wprowadzający):

Usługi studia: usługa → rola w strategii → priorytet

BRIEF DO LEJKÓW: kluczowe argumenty, dowody i komunikaty`,
    script: `Moduł 01, kroki 3–6 (41, 93). Zasady: „Sprzedajemy zmianę, nie godzinę treningu”, „Jeden produkt główny”, metody to sposób realizacji rezultatu.
- Zrób audyt oferty: czy sprzedaje rozwiązanie problemu awatara, czy pakiet treningów.
- Rozwijasz ofertę MARKETINGOWĄ (nazwa, obietnica, argumenty, bonusy, pierwszy krok). Nie zmieniasz samodzielnie ceny, głównego produktu ani modelu biznesowego. Gdy problemem jest sam produkt, zasygnalizuj to i poleć konsultację z zespołem Dochodowego Studia.
- Zaproponuj 2–3 koncepcje oferty marketingowej, poleć jedną i uzasadnij. Na końcu wyłap niepotwierdzone obietnice i sprzeczności.`,
    opener: "Mając awatar, sprawdzimy ofertę. Napisz, co dziś sprzedajesz najczęściej, za ile i na jak długo, oraz co klient ma po tym czasie osiągnąć.",
    exitCriteria: ["Jest jeden produkt główny", "Oferta odpowiada na problem awatara", "Nie ma obietnic bez pokrycia"],
    lessons: [L.oferta, L.matryca, L.nieTrening],
    needs: ["dna", "awatar"],
  },
  {
    id: "cel-budzet", no: "6", phase: "Strategia (moduł 02)",
    title: "Cel, budżet i czas",
    goal: "Przeliczyć cel biznesowy na cele marketingowe i świadomie wybrać: płacisz czasem czy pieniędzmi.",
    docId: "cel-budzet", docTitle: "Cel, budżet i czas",
    docTemplate: `Cel biznesowy (ile klientów, do kiedy):
Cel marketingowy (ile rozmów, ile leadów — z wyliczenia):
Wolne miejsca w grafiku:
Wartość godziny właściciela (i skąd ta kwota):
Godziny tygodniowo na marketing:
Budżet reklamowy miesięcznie:
Cały budżet marketingowy (reklamy, montaż, grafika, narzędzia):
Porównanie: organic jako koszt czasu vs reklamy jako wydatek:
Wybór: czas / pieniądze / oba:
Scenariusze (ostrożny / realistyczny / optymistyczny) albo budżet testowy, jeśli brak danych:`,
    script: `K6 (81–84, 89–91). Marketing podporządkowany celowi biznesowemu.
- Ustal cel biznesowy i przelicz go na liczby: potrzebni klienci → rozmowy → leady (na podstawie skuteczności studia; jeśli jej nie ma, powiedz, że to założenie).
- Wycena czasu: zapytaj, czym właściciel normalnie zajmuje się w tym czasie (trening → zarobek po kosztach; zarządzanie → co musiałby odłożyć). Oddziel wydatki gotówkowe, utracony zarobek i szacunkową wartość czasu.
- Przy „nie mam pieniędzy na reklamy” konfrontuj: „To skąd chcesz mieć klientów? Masz dwie waluty: czas i pieniądze.” Pokaż koszt obu i poproś o świadomy wybór.
- Prognoza tylko na danych studia; bez danych zaproponuj budżet testowy zamiast prognozy. Podział budżetu zatwierdza właściciel.`,
    opener: "Ustalmy, po co nam marketing w liczbach. Ilu nowych klientów potrzebujesz i do kiedy?",
    exitCriteria: ["Cel jest przeliczony na leady i rozmowy", "Znasz koszt swojej godziny", "Świadomie wybrałeś czas, pieniądze albo oba"],
    lessons: [L.systemKlientow],
    needs: ["dna", "oferta"],
  },
  {
    id: "strategia", no: "7", phase: "Strategia (moduł 02)",
    title: "Strategia i wybór lejka",
    goal: "Ocenić 6 lejków i wybrać 1–2, które mają sens dla Twojego studia teraz.",
    docId: "strategia", docTitle: "Strategia marketingowa",
    docTemplate: `Diagnoza w skrócie:

Ocena lejków (Potencjał / Gotowość / Koszt / Nakład pracy / Czas do walidacji / Ryzyko / Priorytet: teraz – przygotować – odłożyć):
1. Meta Lead Ads (formularze):
2. Follow Ads:
3. Social Media + Setting:
4. VSL + Landing Page:
5. Organic Content:
6. Kampanie specjalne:

Rekomendowane lejki (1–2) i uzasadnienie:
Czego NIE robimy teraz i dlaczego:
Konsekwencje dla budżetu, czasu i zespołu:
Status: zatwierdzone przez właściciela (tak / nie):`,
    script: `00.5 „Architekt strategii” — serce Marketing OS (36, 41). Łączysz DNA z metodyką DS.
- Oceń każdy z 6 lejków według 7 kryteriów: potencjał, gotowość, koszt, nakład pracy, czas do walidacji, ryzyko, priorytet.
- Rekomenduj 1–2 lejki z uzasadnieniem. Meta nie jest domyślna dla każdego. Możesz powiedzieć: „Na Twoim etapie nie potrzebujesz jeszcze VSL-u. Najpierw dopracuj ofertę i obsługę leadów.”
- Właściciel może świadomie wybrać inny lub więcej lejków — wtedy pokaż konsekwencje dla budżetu, czasu i zespołu.
- Strategię zatwierdza właściciel; dopiero potem powstają materiały. Może ją najpierw pokazać zespołowi DS.`,
    opener: "Mamy DNA, awatar, ofertę i budżet. Teraz ocenię 6 lejków Dochodowego Studia pod Twoje studio. Zanim zacznę: czy któryś lejek już testowałeś i jak poszło?",
    exitCriteria: ["Każdy z 6 lejków ma ocenę", "Wybrane są 1–2 lejki z uzasadnieniem", "Zatwierdzasz strategię"],
    lessons: [L.systemKlientow, L.systemSprzedazy],
    needs: ["dna", "oferta", "cel-budzet"],
  },
  {
    id: "gotowosc", no: "8", phase: "Wdrożenie",
    title: "Gotowość wybranego lejka",
    goal: "Nie uruchamiać lejka bez fundamentów: sprawdzić, co masz, i przygotować braki.",
    docId: "gotowosc", docTitle: "Checklista gotowości lejka",
    docTemplate: `Lejek:
Warunek wejścia → mam / brakuje → co trzeba zrobić → ile pracy:

Wspólne: CRM, osoba od leadów, procedura kontaktu, pomiar źródła

Zadania przygotowawcze (kolejność):`,
    script: `K9 (95). Każdy lejek ma warunki wejścia; najpierw przygotowujesz fundamenty.
Warunki z metodyki (do weryfikacji ze szkoleniami):
- Meta Lead Ads: bank nagranych scenariuszy reklam, formularz podpięty do CRM, każdy lead przypisany do osoby, test próbnego zgłoszenia, reklamy oznaczone źródłem.
- Follow Ads: bio pokazujące dla kogo / jaki efekt / jak zacząć, przypięty post z lead magnetem i CTA do DM, wyróżnione relacje i dowody, osoba codziennie obsługująca DM.
- Social Media + Setting: setting ma właściciela, codzienny zakres pracy i raport — nie jest dodatkowym zajęciem.
- VSL + Landing: 2–3 autentyczne historie klientów ze zgodą, ujęcia zespołu, aktualne liczby, proces i cena pierwszego kroku, pomiar konwersji i źródła.
- Organic: twarz komunikacji, kierunek profilu, metamorfozy ze zgodą, wspólny folder ujęć.
- Kampanie specjalne: podstawowe lejki obsługiwane bez zaległości.
Sprawdź, co studio ma, czego brakuje i ile pracy wymaga przygotowanie braków. Prowadź jedno zadanie naraz.`,
    opener: "Sprawdzimy, czy wybrany lejek ma fundamenty. Zacznę od najważniejszego: kto u Ciebie odbiera nowe zgłoszenia i w czym je zapisuje?",
    exitCriteria: ["Każdy warunek wejścia ma status", "Braki mają zadania i szacowany czas"],
    lessons: [L.setting],
    needs: ["dna", "strategia"],
  },
  {
    id: "plan", no: "9", phase: "Wdrożenie",
    title: "Mapa wdrożenia i kalendarz",
    goal: "Rozpisać pracę na zadania z czasem, osobą i terminem, dopasowane do Twojego tygodnia.",
    docId: "plan", docTitle: "Mapa wdrożenia",
    docTemplate: `Godziny tygodniowo na marketing:
Termin uruchomienia lejka:

Zadanie | Czas | Termin | Kto (sam / montażysta / pracownik / AI) | KPI | Dowód wykonania

Twój tydzień marketingowy (ile godzin łącznie):`,
    script: `K10 (74, 75, 80).
- Rozpisz całe wdrożenie wybranego lejka (oferta, komunikaty, reklamy, formularze, materiały, obsługa leadów, pomiar), pomijając to, co studio już ma.
- Oszacuj czas i zapytaj: „Ile godzin tygodniowo możesz na to przeznaczyć?”, czy ktoś pomaga i na kiedy uruchomienie.
- Przy każdym zadaniu zapytaj o sposób: zrobię sam / zlecę montażyście / oddam pracownikowi / wygeneruję z AI.
- Kryterium ukończenia to działający element („zgłoszenie trafia do CRM”), a nie „zrobiliśmy reklamę”. Do kalendarza dodajesz tylko za zgodą.`,
    opener: "Rozpiszę teraz pracę na konkretne zadania. Ile godzin tygodniowo naprawdę możesz dać na marketing i czy ktoś Ci pomaga?",
    exitCriteria: ["Każde zadanie ma czas, osobę i termin", "Plan mieści się w Twoich godzinach"],
    lessons: [],
    needs: ["strategia", "gotowosc"],
  },
  {
    id: "materialy-lejka", no: "10", phase: "Wdrożenie",
    title: "Koncepcje i materiały",
    goal: "Najpierw 2–3 koncepcje komunikacji, potem gotowe materiały do publikacji.",
    docId: "materialy-lejka", docTitle: "Materiały lejka",
    docTemplate: `Wybrana koncepcja komunikacji i dlaczego:

Materiały (gotowe do użycia):
- Teksty reklam / postów:
- Scenariusze rolek / VSL (ujęcia, napisy, CTA):
- Przypięta karuzela / lead magnet:
- Wiadomości i skrypt pierwszego kontaktu:
- Brief dla wykonawcy (jeśli zlecasz) i kryteria odbioru:`,
    script: `K11 (72, 79, 80). Najpierw 2–3 koncepcje komunikacji z logiką i rekomendacją najlepszej; po akceptacji gotowe materiały. „Maksymalnie dużo gotowej pracy”: tekst, scenariusz, ujęcia, napisy, CTA, pomysły wizualne i instrukcja krok po kroku. Nie odsyłaj do samodzielnego projektowania w Canvie.
- Jeden problem na reklamę, mocne hooki, krótkie wersje. Bez dowodów nie udajemy wyników. Reklamy sylwetkowe nie mogą zawstydzać ani sugerować negatywnych cech wyglądu (polityka Meta).
- Przy zlecaniu przygotuj brief, materiały i kryteria odbioru. Nowe, niesprawdzone pomysły oznaczaj jako eksperymenty.`,
    opener: "Czas na materiały. Zanim cokolwiek napiszę, pokażę Ci 2–3 koncepcje komunikacji do wyboru. Od czego zaczynamy: reklamy, rolki czy przypięty post?",
    exitCriteria: ["Wybrałeś koncepcję komunikacji", "Masz materiały gotowe do publikacji albo do zlecenia"],
    lessons: [L.content, L.scenariusze],
    needs: ["dna", "awatar", "oferta", "strategia"],
  },
  {
    id: "wyniki", no: "11", phase: "Wyniki",
    title: "Analiza wyników i decyzja",
    goal: "Zobaczyć całą drogę klienta od reklamy do zakupu i zdecydować: poprawić, przebudować czy zmienić lejek.",
    docId: "wyniki", docTitle: "Przegląd wyników",
    docTemplate: `Okres:
Wydatki:
Reklama → Lead → Kontakt → Umówienie → Obecność → Sprzedaż (liczby):
Koszt leada:
Koszt pozyskania klienta (CAC):
Przychód i opłacalność:
Gdzie tracimy klientów:
Czy danych jest wystarczająco dużo:
Decyzja: optymalizujemy / przebudowujemy / zmieniamy lejek:
Skalowanie budżetu: zwiększyć / utrzymać / zmniejszyć — i dlaczego:
Kolejne zadania:`,
    script: `K13 — tryb ANALITYK (70, 96, 104, 108).
- Przyjmij dane w dowolnej formie: rozmowa („wydałem 800 zł, przyszło 20 leadów, sprzedałem 2 programy”), screeny, raporty.
- Analizuj całą drogę: reklama → lead → kontakt → umówienie → obecność → sprzedaż, z CAC. Koszt leada to za mało — zawsze dopytaj, ile osób kupiło i za ile.
- Najpierw sprawdź, czy danych jest dość (nie wyłączaj kampanii po 3 dniach). Potem jedna decyzja: optymalizujemy / przebudowujemy / zmieniamy lejek. Skalowanie według celu, rentowności i wolnych miejsc — nie dla samego skalowania.
- Pamiętaj wcześniejsze testy i nie proponuj tego samego bez uwzględnienia historii.`,
    opener: "Zobaczmy liczby. Napisz po prostu: ile wydałeś, ile przyszło zgłoszeń, do ilu osób się dodzwoniłeś i ile osób kupiło. Możesz też wkleić zrzut ekranu.",
    exitCriteria: ["Znasz koszt pozyskania klienta", "Wiesz, gdzie tracisz klientów", "Jest jedna decyzja na kolejny okres"],
    lessons: [L.ocenaReklam, L.systemKlientow],
    needs: ["strategia", "plan"],
  },
  {
    id: "okazje", no: "12", phase: "Wyniki",
    title: "Okazje i plan na kolejne miesiące",
    goal: "Planować kampanie z wyprzedzeniem i oceniać nowe pomysły biznesowo, zanim zjedzą czas.",
    docId: "okazje", docTitle: "Kalendarz okazji",
    docTemplate: `Okazje na najbliższe 3 miesiące (sezon, lokalne wydarzenia, baza byłych klientów, wolne godziny trenerów):
Okazja → działanie → budżet → termin przygotowania materiałów:

Nowe pomysły → werdykt (realizujemy / odkładamy / odpuszczamy) → dlaczego:

Co nowego wiemy o klientach (propozycje zmian w DNA i awatarze do zatwierdzenia):`,
    script: `K14 (86–88, 92, 118, 119).
- Aktywnie szukaj okazji: przygotowanie przed styczniem, reaktywacja byłych klientów, nowe osiedle, wolne godziny trenera, kolejny lejek po sukcesie pierwszego. Każde działanie z uzasadnieniem biznesowym.
- Pomysły właściciela („konkurencja robi konkurs”) oceniaj pod kątem DNA, potencjału, kosztu, czasu i strategii: realizujemy / odkładamy / odpuszczamy.
- Kampanie specjalne z biblioteki: polecenia, reaktywacja, konkursy (zgodne z prawem), sezonowe, współprace lokalne, wydarzenia, okolicznościowe. Nowe mechanizmy oznaczaj jako eksperymenty.
- Proponuj badanie klientów; nie zmieniaj awatara po jednej reklamie czy rozmowie. Zmiany w DNA zatwierdza właściciel.`,
    opener: "Spójrzmy w przód. Co dzieje się u Ciebie w najbliższych 3 miesiącach: sezon, wolne godziny trenerów, lokalne wydarzenia, duża baza byłych klientów?",
    exitCriteria: ["Masz kalendarz okazji na 3 miesiące", "Nowe pomysły mają werdykt"],
    lessons: [],
    needs: ["dna", "strategia", "wyniki"],
  },
];

// ---------- STAN I POSTĘP ----------
export function stepStatuses(state: JourneyState): Record<string, StepStatus> {
  const out: Record<string, StepStatus> = {};
  let open = state.pathAccepted;
  for (const s of STEPS) {
    const doc = state.docs[s.docId];
    if (doc?.status === "approved") out[s.id] = "done";
    else if (!open) out[s.id] = "locked";
    else out[s.id] = doc || state.chats[s.id]?.length ? "draft" : "available";
    if (out[s.id] !== "done") open = false;
  }
  return out;
}

export function progressPercent(state: JourneyState): number {
  const total = STEPS.length + 2; // + połączenie AI + ankieta
  const done = (state.ai.mode ? 1 : 0) + (state.survey ? 1 : 0) + STEPS.filter((s) => state.docs[s.docId]?.status === "approved").length;
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
