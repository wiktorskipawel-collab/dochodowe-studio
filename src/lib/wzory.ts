// Wzory dokumentów dla studia (strona /dokumenty, sekcja „Wzory dokumentów dla studia”).
// Na podstawie wzorów, które Bartek udostępnił w społeczności (umowa z klientem, umowa zlecenia, NDA),
// i lekcji „Jak zakomunikować, że trening przepada” (regulamin). Dane osobowe i firmowe z oryginałów są usunięte:
// w ich miejscu stoją pola w [NAWIASACH], więc wzór pasuje do dowolnego studia.
// DO ZATWIERDZENIA (Bartek, najlepiej z prawnikiem): treść wzorów, zwłaszcza regulamin złożony z lekcji
// oraz uproszczenia i dopiski (studio z zespołem zamiast jednego trenera, zgoda na wizerunek, przykłady w NDA).

export const UWAGA_PRAWNA = "Wzór przykładowy. Przed użyciem skonsultuj z prawnikiem.";

export type Wzor = {
  id: string;
  title: string;
  opis: string; // 1–2 zdania na karcie
  kiedy: string; // kiedy po niego sięgnąć
  uwagi?: string[]; // co szczególnie sprawdzić z prawnikiem
  wdrozenie?: string[]; // jak wprowadzić dokument w studiu
  tresc: string; // pełny tekst, zaczyna się od UWAGA_PRAWNA
};

const PODPISY = (lewy: string, prawy: string) => `……………………………………                ……………………………………
${lewy.padEnd(36, " ")}${prawy}`;

const EWIDENCJA = Array.from({ length: 31 }, (_, i) => `${String(i + 1).padStart(2, " ")}. ……… godz.`).join("\n");

export const WZORY: Wzor[] = [
  {
    id: "umowa-klient",
    title: "Umowa o świadczenie usług treningowych",
    opis: "Umowa studia z klientem na pakiet treningów: obowiązki obu stron, zasada odwołania 24 h, płatność z góry, przedłużenie i wypowiedzenie.",
    kiedy: "Podpisujesz ją z każdą nową osobą przed pierwszym treningiem pakietu.",
    uwagi: [
      "Klient jest konsumentem: zapisy o braku zwrotu pieniędzy przy wypowiedzeniu (§ 6) sprawdź pod kątem klauzul niedozwolonych.",
      "Gwarancja efektu (§ 6 ust. 4) jest opcjonalna. Jeśli ją dajesz, opisz mierzalne warunki.",
      "Informacje o zdrowiu to dane szczególne: ustal z prawnikiem treść zgody i klauzulę RODO.",
    ],
    tresc: `${UWAGA_PRAWNA}

UMOWA O ŚWIADCZENIE USŁUG TRENINGOWYCH

zawarta w dniu [DATA ZAWARCIA UMOWY] w [MIEJSCOWOŚĆ] pomiędzy:

[NAZWA STUDIA] – działalność gospodarcza prowadzona przez [IMIĘ I NAZWISKO WŁAŚCICIELA], siedziba: [ADRES STUDIA], NIP: [NIP], dalej „Studio”,

a

[IMIĘ I NAZWISKO KLIENTA], adres: [ADRES KLIENTA], dalej „Klient”,

dalej łącznie „Strony”.

§ 1. Przedmiot umowy
1. Studio zobowiązuje się świadczyć na rzecz Klienta opiekę trenerską: [LICZBA TRENINGÓW] treningów personalnych oraz nadzór nad postępami, na warunkach określonych w Umowie.
2. Studio dołoży wszelkich starań, aby Klient osiągnął zakładane efekty.
3. Klient przyjmuje do wiadomości, że efekt treningów zależy także od jego indywidualnych predyspozycji, rodzaju, sposobu i częstotliwości wykonywanych ćwiczeń, diety, stosowanych suplementów, kontroli postępów i wysyłania raportów.

§ 2. Rozpoczęcie współpracy
1. Współpraca zaczyna się od pierwszego spotkania, na którym Klient przedstawia swoje cele, a Studio omawia zasady opieki trenerskiej.
2. Jeśli Klient akceptuje te zasady, Studio omawia z nim proponowany plan treningowy, a Klient wykupuje pakiet treningowy.

§ 3. Obowiązki Klienta
Klient zobowiązuje się do:
a) informowania trenera o każdej zmianie stanu zdrowia po rozpoczęciu współpracy, także w trakcie treningu, która może wpływać na udział w treningach, ich częstotliwość lub dobór ćwiczeń; jeśli Klient tego nie zrobi, Studio nie odpowiada za wynikające z tego powikłania zdrowotne,
b) przestrzegania ustalonego cyklu treningowego i punktualnego przychodzenia na trening (najlepiej 5 minut przed rozpoczęciem); w razie spóźnienia Klienta trening nie jest przedłużany,
c) przychodzenia na trening bez osób towarzyszących; osoba towarzysząca (niezależnie od wieku) może przebywać w studiu wyłącznie za każdorazową zgodą trenera i tylko w miejscu przez niego wskazanym; Klient odpowiada za osobę towarzyszącą, w tym za szkody przez nią wyrządzone i szkody jej wyrządzone w studiu; Studio nie sprawuje nad nią opieki ani nadzoru,
d) przygotowania do treningu: strój sportowy, czyste obuwie odpowiednie do ćwiczeń i woda do picia; jeśli strój lub obuwie nie nadają się do ćwiczeń, trener może odmówić prowadzenia zajęć, a Studio może naliczyć opłatę za trening,
e) terminowego płacenia za pakiet,
f) stosowania się do instrukcji trenera w studiu przed treningiem, w jego trakcie i po nim,
g) przestrzegania zaleceń żywieniowych przekazanych przez trenera,
h) raportowania postępów i przebiegu współpracy.

§ 4. Obowiązki Studia
1. Studio zapewnia prowadzenie treningów personalnych i zaleceń żywieniowych przez trenera Studia, z uwzględnieniem celów Klienta i jego stanu zdrowia, z należytą starannością i odpowiednią wiedzą z zakresu treningu i żywienia.
2. Studio oświadcza, że trenerzy prowadzący treningi mają niezbędne kwalifikacje, wiedzę i doświadczenie.

§ 5. Treningi, odwołania i nieobecności
1. Treningi odbywają się [LICZBA TRENINGÓW W TYGODNIU] razy w tygodniu w cyklu trwającym około [CZAS TRWANIA CYKLU], a każdy trening trwa [CZAS TRENINGU W MINUTACH] minut.
2. Klient oświadcza, że nie ma przeciwwskazań zdrowotnych do aktywności fizycznej zgodnej z planem treningowym. Jeśli oświadczenie jest nieprawdziwe, Studio nie odpowiada za powikłania zdrowotne wynikające z udziału w treningach lub stosowania zaleceń żywieniowych.
3. Klient jest świadomy zagrożeń dla zdrowia związanych z nadmiernym obciążeniem, intensywnością lub rodzajem ćwiczeń niezgodnym z planem trenera. Jeśli Klient ćwiczy wbrew planowi trenera, Studio nie odpowiada za wynikające z tego powikłania zdrowotne.
4. Klient może odwołać trening najpóźniej 24 godziny przed jego planowanym rozpoczęciem. Wtedy trening zostaje przełożony na inny termin w tym samym cyklu, ustalony przez Strony z uwzględnieniem grafiku Studia. Trening odwołany później uznaje się za przeprowadzony, a Studio może naliczyć za niego opłatę.
5. Jeśli Klient trenuje w parze lub małej grupie, nieobecność drugiej osoby nie odwołuje treningu: trening odbywa się dla obecnych. Dla osoby nieobecnej trening uznaje się za odbyty, a Studio może naliczyć za niego opłatę.
6. Przy częstych nieobecnościach Klienta (np. urlopy, wyjazdy), także zgłoszonych wcześniej, Studio może nie przedłużać cyklu treningowego i anulować gwarancję. Treningi nieodbyte z tego powodu uznaje się za odbyte, a Studio może naliczyć za nie opłatę, chyba że Strony ustalą inaczej na piśmie.

§ 6. Czas trwania i wypowiedzenie umowy
1. Umowa zostaje zawarta na czas określony: jeden cykl treningowy (około [CZAS TRWANIA CYKLU]). Okres ten może się wydłużyć do czasu wykorzystania wszystkich [LICZBA TRENINGÓW] treningów.
2. Jeśli Klient kupi pakiet na kolejny cykl w czasie ważności obecnego pakietu, Umowa przedłuża się automatycznie o okres ważności nowego pakietu. Jeśli go nie kupi, Umowa wygasa z końcem ważności pakietu.
3. Każda ze Stron może wypowiedzieć Umowę ze skutkiem natychmiastowym, jeśli druga Strona narusza jej postanowienia, przy czym:
a) przy wypowiedzeniu przez Studio z winy Klienta Studiu przysługuje wynagrodzenie za cały cykl treningowy oraz zwrot wydatków poniesionych lub koniecznych do poniesienia w związku z rozwiązaniem Umowy,
b) przy wypowiedzeniu przez Klienta z winy Studia Studio zwraca Klientowi niewykorzystaną część wynagrodzenia za cykl, pomniejszoną o przeprowadzone treningi i poniesione wydatki.
4. (Zapis opcjonalny: gwarancja efektu) Jeśli Klient nie osiągnie ustalonych rezultatów mimo przestrzegania zaleceń trenera, może żądać zwrotu zapłaty za cykl treningowy. Warunki gwarancji: [WARUNKI GWARANCJI].
5. Klient może wypowiedzieć Umowę ze skutkiem natychmiastowym w każdej chwili bez podania przyczyny. Wtedy Studio zachowuje prawo do wynagrodzenia za cały cykl treningowy, nie zwraca niewykorzystanej części wynagrodzenia i może żądać zwrotu wydatków poniesionych lub koniecznych do poniesienia w związku z rozwiązaniem Umowy.

§ 7. Wynagrodzenie i płatność
1. Wynagrodzenie Studia za cykl treningowy wynosi [KWOTA] zł (słownie: [KWOTA SŁOWNIE]).
2. Klient płaci za pakiet gotówką albo przelewem na rachunek Studia nr [NUMER KONTA], najpóźniej przed pierwszym treningiem pakietu, a przy przedłużeniu Umowy – przed pierwszym treningiem kolejnego cyklu.
3. Brak zapłaty w tym terminie oznacza rozwiązanie Umowy przez Klienta ze skutkiem natychmiastowym.

§ 8. Korespondencja
1. Strony doręczają sobie korespondencję na adresy podane na początku Umowy.
2. Strony niezwłocznie informują się o zmianie adresu. Jeśli Strona tego nie zrobi, pismo wysłane na dotychczasowy adres uznaje się za skutecznie doręczone. Zmiana adresu nie jest zmianą Umowy.
3. Strony kontaktują się pisemnie, e-mailem lub telefonicznie: Studio – [TELEFON STUDIA], [E-MAIL STUDIA]; Klient – [TELEFON KLIENTA], [E-MAIL KLIENTA]. Korespondencja elektroniczna nie zastępuje formy pisemnej tam, gdzie Umowa jej wymaga pod rygorem nieważności.

§ 9. Postanowienia końcowe
1. Zmiany Umowy wymagają formy pisemnej pod rygorem nieważności.
2. Jeśli niektóre postanowienia Umowy staną się bezprzedmiotowe lub będą wymagały zmiany, nie wpływa to na ważność pozostałych postanowień.
3. Klient wyraża zgodę na przetwarzanie swoich danych osobowych, w tym informacji o stanie zdrowia, w zakresie niezbędnym do wykonania Umowy. Administratorem danych jest Studio.
4. Studio może wykonywać zdjęcia Klienta w celu dokumentowania postępów i pracy trenera. Publikacja wizerunku Klienta wymaga jego odrębnej zgody.
5. W sprawach nieuregulowanych w Umowie stosuje się przepisy Kodeksu cywilnego.
6. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.


${PODPISY("Studio", "Klient")}
`,
  },
  {
    id: "umowa-zlecenia",
    title: "Umowa zlecenia z trenerem",
    opis: "Prosta umowa zlecenia dla trenera personalnego w zespole: stawka godzinowa, miesięczna ewidencja godzin, dwutygodniowe wypowiedzenie. Z gotowym załącznikiem do ewidencji.",
    kiedy: "Gdy przyjmujesz trenera do zespołu na zlecenie, a nie na etat ani fakturę.",
    uwagi: [
      "Stawka za godzinę nie może być niższa niż minimalna stawka godzinowa dla umów zlecenia w danym roku.",
      "Stałe godziny pod kierownictwem studia mogą sprawić, że umowę uzna się za umowę o pracę. Sprawdź to z prawnikiem lub księgową.",
      "Jeśli trener ma dostęp do bazy klientów, cennika i metodyki, podpisz z nim także umowę o zachowaniu poufności.",
    ],
    tresc: `${UWAGA_PRAWNA}

UMOWA ZLECENIA

zawarta w dniu [DATA ZAWARCIA UMOWY] w [MIEJSCOWOŚĆ] pomiędzy:

Zleceniodawcą: [NAZWA STUDIA / FIRMY], [ADRES SIEDZIBY], NIP: [NIP], REGON: [REGON],

a

Zleceniobiorcą: [IMIĘ I NAZWISKO TRENERA], adres zamieszkania: [ADRES TRENERA], PESEL: [PESEL],

dalej odpowiednio „Zleceniodawca” i „Zleceniobiorca”.

§ 1. Przedmiot umowy
1. Zleceniodawca powierza, a Zleceniobiorca przyjmuje do wykonania czynności trenera personalnego.
2. Zleceniobiorca wykonuje powierzone czynności z należytą starannością.

§ 2. Czas trwania umowy
Umowa zostaje zawarta od dnia [DATA ROZPOCZĘCIA] na czas nieokreślony.

§ 3. Ewidencja godzin wykonywania zlecenia
1. Potwierdzeniem czasu wykonywania czynności z § 1 jest ewidencja godzin wykonywania umowy zlecenia, której wzór stanowi Załącznik nr 1.
2. Ewidencja obejmuje jeden miesiąc kalendarzowy i zawiera liczbę godzin przepracowanych przez Zleceniobiorcę w każdym dniu.
3. Zleceniobiorca dostarcza ewidencję Zleceniodawcy w ostatnim dniu roboczym miesiąca, którego dotyczy.
4. Dane w ewidencji wymagają akceptacji Zleceniodawcy.

§ 4. Wynagrodzenie
1. Za wykonanie czynności z § 1 Zleceniodawca wypłaca Zleceniobiorcy wynagrodzenie według stawki [STAWKA ZA GODZINĘ] zł brutto za godzinę.
2. Wynagrodzenie jest płatne w ostatnim dniu miesiąca, na podstawie zaakceptowanej ewidencji godzin, na rachunek Zleceniobiorcy nr [NUMER KONTA TRENERA].

§ 5. Wypowiedzenie umowy
1. Każda ze Stron może wypowiedzieć Umowę z zachowaniem dwutygodniowego okresu wypowiedzenia.
2. Jeśli Zleceniobiorca wypowie Umowę bez ważnego powodu, odpowiada za szkodę, która z tego wyniknie.

§ 6. Brak stosunku pracy
Z tytułu Umowy Zleceniobiorca nie nabywa uprawnień pracowniczych wynikających z Kodeksu pracy; Umowa nie jest umową o pracę.

§ 7. Postanowienia końcowe
1. Zmiany Umowy wymagają formy pisemnej pod rygorem nieważności.
2. W sprawach nieuregulowanych w Umowie stosuje się przepisy Kodeksu cywilnego.
3. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.


${PODPISY("Zleceniodawca", "Zleceniobiorca")}


ZAŁĄCZNIK NR 1 – EWIDENCJA GODZIN WYKONYWANIA UMOWY ZLECENIA

Zleceniobiorca: [IMIĘ I NAZWISKO TRENERA]
Miesiąc i rok: [MIESIĄC I ROK]

Dzień miesiąca – liczba godzin:
${EWIDENCJA}

Razem w miesiącu: ……… godz.


${PODPISY("Zleceniobiorca", "Akceptacja Zleceniodawcy")}
`,
  },
  {
    id: "nda",
    title: "Umowa o zachowaniu poufności (NDA)",
    opis: "Chroni bazę klientów, cennik, metodykę i materiały studia. Obowiązuje bezterminowo, z karą umowną za każde naruszenie.",
    kiedy: "Zanim nowy trener, recepcja albo współpracownik (np. agencja marketingowa) dostanie dostęp do danych studia.",
    uwagi: [
      "Wpisz karę umowną adekwatną do ryzyka. Rażąco wygórowaną karę sąd może obniżyć.",
      "Wzór ma dwa warianty strony przekazującej: działalność jednoosobowa albo spółka (z numerem KRS i reprezentacją).",
    ],
    tresc: `${UWAGA_PRAWNA}

UMOWA O ZACHOWANIU POUFNOŚCI

zawarta w dniu [DATA ZAWARCIA UMOWY] w [MIEJSCOWOŚĆ], dalej „Umowa”, pomiędzy:

[NAZWA STUDIA / FIRMY], siedziba: [ADRES SIEDZIBY], NIP: [NIP], REGON: [REGON]
(dla spółki dodatkowo: KRS: [NUMER KRS], reprezentacja: [IMIĘ I NAZWISKO, FUNKCJA]),
dalej „Strona przekazująca”,

a

[IMIĘ I NAZWISKO / NAZWA FIRMY], adres: [ADRES], NIP lub PESEL: [NIP LUB PESEL],
dalej „Strona przyjmująca”,

o następującej treści:

§ 1. Przedmiot umowy
1. Przedmiotem Umowy jest określenie warunków udostępniania Stronie przyjmującej przez Stronę przekazującą informacji poufnych oraz warunków zachowania poufności tych informacji przez Stronę przyjmującą.
2. Umowa nie jest samodzielną podstawą wykonywania przez Stronę przyjmującą jakichkolwiek zleceń ani czynności. Zasady ich realizacji Strony określą odrębnie.

§ 2. Informacje poufne
1. Informacje poufne to wszelkie informacje techniczne, technologiczne, teleinformatyczne, ekonomiczne, finansowe, handlowe, prawne i organizacyjne, informacje o sposobie świadczenia usług, informacje marketingowe oraz dane osobowe, ujawnione przez Stronę przekazującą albo uzyskane w wyniku dostępu do jej danych, niezależnie od formy i sposobu przekazania, źródła oraz stopnia ich ukończenia (dalej „Informacje Poufne”).
2. Informacjami Poufnymi są w szczególności: dane klientów i ich wyniki, cennik i warunki współpracy, metodyka i plany treningowe, procedury i skrypty rozmów, materiały marketingowe oraz wyniki finansowe Strony przekazującej.
3. Informacje Poufne obejmują także informacje stanowiące tajemnicę przedsiębiorstwa w rozumieniu ustawy z dnia 16 kwietnia 1993 r. o zwalczaniu nieuczciwej konkurencji, ale nie ograniczają się do niej.

§ 3. Zobowiązanie do zachowania poufności
1. Strona przyjmująca zachowa w poufności wszelkie Informacje Poufne i wykorzysta je wyłącznie w celu świadczenia usług na rzecz Strony przekazującej.
2. Strona przyjmująca w szczególności:
a) podejmie wszelkie niezbędne kroki, aby żadna z osób otrzymujących Informacje Poufne nie ujawniła ich ani źródła ich pochodzenia, w całości ani w części, osobom trzecim bez uprzedniej, wyraźnej, pisemnej zgody Strony przekazującej,
b) nie będzie kopiować, powielać ani rozpowszechniać Informacji Poufnych, z wyjątkami przewidzianymi w Umowie.
3. Obowiązki z ust. 1 i 2 dotyczą także pracowników, podwykonawców, konsultantów, przedstawicieli, kontrahentów i innych osób, które mają dostęp do informacji przekazanych Stronie przyjmującej.
4. Obowiązek zachowania poufności nie dotyczy informacji, które:
a) zostały ujawnione na podstawie bezwzględnie obowiązującego przepisu prawa lub orzeczenia sądu, w zakresie, w jakim uprawniony organ może żądać ich ujawnienia,
b) są opublikowane lub powszechnie znane, jeśli nie stało się to w wyniku naruszenia Umowy.
5. Jeśli Strona przyjmująca zostanie zobowiązana nakazem sądu lub organu administracji albo przepisami prawa do ujawnienia Informacji Poufnych, niezwłocznie pisemnie powiadomi o tym Stronę przekazującą i poinformuje odbiorcę o poufnym charakterze tych informacji.

§ 4. Okres obowiązywania
1. Umowa wchodzi w życie w dniu podpisania.
2. Obowiązek zachowania poufności wiąże Strony bezterminowo.

§ 5. Naruszenie warunków umowy
1. W razie rażącego naruszenia przez Stronę przyjmującą któregokolwiek z obowiązków z Umowy albo ujawnienia, przekazania lub wykorzystania Informacji Poufnych niezgodnie z Umową Strona przekazująca może naliczyć i żądać od Strony przyjmującej kary umownej w wysokości [KWOTA KARY UMOWNEJ] zł (słownie: [KWOTA SŁOWNIE]) za każdy przypadek naruszenia.
2. Kara umowna nie wyłącza dochodzenia odszkodowania przewyższającego jej wysokość na zasadach ogólnych.
3. Strona przyjmująca odpowiada wobec Strony przekazującej za szkody wynikłe z działania lub zaniechania swoich podwykonawców jak za własne.

§ 6. Postanowienia końcowe
1. Zmiany Umowy wymagają formy pisemnej pod rygorem nieważności.
2. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.


${PODPISY("Strona przekazująca", "Strona przyjmująca")}
`,
  },
  {
    id: "regulamin",
    title: "Regulamin studia",
    opis: "Krótki regulamin dla klientów: płatność z góry, trening odwołany później niż 24 h przepada, punktualność, przygotowanie i bezpieczeństwo.",
    kiedy: "Wysyłasz go każdej nowej osobie w mailu powitalnym i wprowadzasz u obecnych klientów jedną wiadomością.",
    wdrozenie: [
      "Dołącz regulamin do maila powitalnego razem z prezentem (np. przykładowy jadłospis albo e-book).",
      "Przypnij go w grupie lub społeczności klientów.",
      "Wyślij krótkiego SMS-a, że w mailu czeka regulamin i warto go przeczytać.",
      "Obecnym klientom zapowiedz zmianę jedną wiadomością: co dokładasz (prezent, wartość) i od kiedy obowiązuje regulamin.",
      "Gdy ktoś protestuje, że trening przepadł bez jego winy: okaż zrozumienie i przypomnij, że zasada działa w dwie strony. Możesz też oddać trening przy okazji wydarzenia w studiu.",
    ],
    // DO ZATWIERDZENIA (Bartek): regulamin złożony z lekcji „Jak zakomunikować, że trening przepada”, zasad z umowy z klientem
    // i lekcji o granicach (spóźnienia, przychodzenie za wcześnie). Pkt 3.3 (trening gratis, gdy studio odwoła) z lekcji, opcja 1.
    tresc: `${UWAGA_PRAWNA}

REGULAMIN STUDIA [NAZWA STUDIA]

Obowiązuje od [DATA WEJŚCIA W ŻYCIE].

1. Najważniejsze
1.1. Regulamin opisuje zasady treningów w [NAZWA STUDIA], [ADRES STUDIA] (dalej „Studio”).
1.2. Kupując pakiet, akceptujesz Regulamin. Uzupełnia on umowę o świadczenie usług treningowych.
1.3. Zasady są po to, żeby każdy trening się odbył, a postępy były regularne.

2. Płatność i pakiety
2.1. Za pakiet płacisz z góry, najpóźniej przed pierwszym treningiem pakietu. Przy przedłużeniu – przed pierwszym treningiem kolejnego pakietu.
2.2. Pakiet obejmuje [LICZBA TRENINGÓW] treningów i jest ważny [OKRES WAŻNOŚCI PAKIETU] od pierwszego treningu.
2.3. Płatność: gotówka, karta albo przelew na rachunek [NUMER KONTA].
2.4. Brak płatności przed pierwszym treningiem oznacza, że trening się nie odbywa.

3. Odwołanie i przełożenie treningu
3.1. Trening możesz odwołać albo przełożyć najpóźniej 24 godziny przed jego rozpoczęciem: [SPOSÓB ODWOŁANIA, NP. SMS NA NUMER STUDIA].
3.2. Trening odwołany później niż 24 godziny przed rozpoczęciem albo nieodwołany przepada i liczy się jako odbyty, niezależnie od powodu.
3.3. Zasada działa w dwie strony: jeśli Studio odwoła trening później niż 24 godziny przed jego rozpoczęciem, dostajesz dodatkowy trening gratis.
3.4. Przy treningu w parze lub małej grupie nieobecność jednej osoby nie odwołuje treningu. Trening odbywa się dla obecnych.
3.5. Częste nieobecności (urlopy, wyjazdy) nie wydłużają ważności pakietu, chyba że Studio zgodzi się na to na piśmie.

4. Punktualność
4.1. Przyjdź 5 minut przed treningiem.
4.2. Spóźnienie nie przedłuża treningu: zaczynamy później, kończymy o ustalonej godzinie.
4.3. Jeśli przyjdziesz dużo wcześniej, trener poprosi o rozgrzewkę albo chwilę cierpliwości. W tym czasie prowadzi trening innej osoby.

5. Przygotowanie i bezpieczeństwo
5.1. Na trening przychodzisz w stroju sportowym, z czystym obuwiem na zmianę i wodą. W nieodpowiednim stroju lub obuwiu trener może nie poprowadzić treningu, a trening liczy się jako odbyty.
5.2. Przed treningiem mówisz trenerowi o bólu, kontuzji, chorobie i każdej zmianie stanu zdrowia.
5.3. Ćwiczysz zgodnie z instrukcjami trenera i nie zmieniasz samodzielnie ćwiczeń ani obciążeń.
5.4. Przychodzisz bez osób towarzyszących. Wyjątek wymaga zgody trenera, a za osobę towarzyszącą odpowiadasz Ty.

6. Zdjęcia i dane
6.1. Zdjęcia sylwetki do porównania postępów robimy tylko za Twoją zgodą. Publikujemy je wyłącznie za Twoją odrębną zgodą.
6.2. Twoje dane osobowe przetwarza [NAZWA STUDIA] w zakresie potrzebnym do prowadzenia treningów.

7. Kontakt
Pytania o Regulamin: [TELEFON STUDIA], [E-MAIL STUDIA].
`,
  },
];

/** Pola do uzupełnienia, czyli wszystko w [NAWIASACH] (bez powtórzeń, w kolejności z dokumentu). */
export function polaWzoru(tresc: string): string[] {
  return [...new Set([...tresc.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]))];
}
