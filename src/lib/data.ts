// DANE PRZYKŁADOWE do prezentacji. Po podłączeniu bazy (Supabase, Frankfurt) zastąpią je prawdziwe dane.
import type { IconName } from "@/components/ui";

export const studio = {
  owner: "Kasia",
  name: "Studio Forma",
  city: "Poznań",
  stage: "działające studio",
  trainers: 2,
  goal: "+12 klientów programu 90 dni",
  progress: 38,
};

export const stats: { title: string; value: string; note: string; icon: IconName; tone: "neutral" | "good" | "warn" }[] = [
  { title: "Leady z 30 dni", value: "46", note: "+12 vs poprzedni miesiąc", icon: "users", tone: "good" },
  { title: "Koszt leada", value: "18,40 zł", note: "norma DS: do 25 zł", icon: "coins", tone: "neutral" },
  { title: "Sprzedane programy", value: "7", note: "z 21 rozmów", icon: "bag", tone: "neutral" },
  { title: "Koszt pozyskania klienta", value: "121 zł", note: "w normie", icon: "target", tone: "good" },
];

export type ModuleStatus = "done" | "now" | "next";

export const modules: { no: string; title: string; text: string; status: ModuleStatus; steps?: string[] }[] = [
  {
    no: "00", title: "Fundament i DNA studia", status: "done",
    text: "Uczestnik wgrywa ofertę, awatar, audyt i dane. AI pyta tylko o braki, które zmieniają strategię.",
    steps: ["Analizator materiałów", "Diagnosta biznesowy", "Uzupełnianie braków", "Generator DNA"],
  },
  {
    no: "01", title: "Diagnoza i wybór strategii", status: "now",
    text: "Ocena 6 lejków, 3 warianty z kosztem, czasem i przewidywanym wynikiem. Właściciel zatwierdza wybór.",
    steps: ["Cel biznesowy → cel marketingowy", "3 scenariusze na liczbach studia", "Wybór 1–2 lejków", "Budżet: reklamy, czas, wykonawcy"],
  },
  { no: "02", title: "Lejki wybrane dla studia", status: "next", text: "Warunki wejścia, 2–3 koncepcje komunikacji do zatwierdzenia, potem gotowe materiały, zadania i KPI." },
  { no: "03", title: "Wdrożenie i rozliczanie", status: "next", text: "Zadania z czasem i wyceną godziny właściciela, kalendarz, kontrola na zrzutach ekranu, linkach i wynikach." },
  { no: "04", title: "Analiza i optymalizacja", status: "next", text: "Cała droga klienta od reklamy do zakupu. Decyzja: poprawić, przebudować albo zmienić lejek." },
  { no: "05", title: "Skalowanie i planowanie", status: "next", text: "Skalowanie według rentowności i wolnych miejsc w grafiku, akcje planowane z wyprzedzeniem." },
];

export const funnels: { name: string; text: string; ready: string; state: "picked" | "later" | "notNow" }[] = [
  { name: "Formularze Meta", text: "Kampanie leadowe, kąty reklamowe, formularz z kwalifikacją, obsługa leadów.", ready: "5 z 6 warunków", state: "picked" },
  { name: "Follow Ads + setting", text: "Lokalni obserwujący, profil jako wizytówka, DM, przypięta karuzela z wynikiem klienta.", ready: "3 z 6 warunków", state: "picked" },
  { name: "Social media + setting", text: "Relacje z obserwującymi, skrypty rozmów, aktywność dzienna.", ready: "2 z 5 warunków", state: "later" },
  { name: "VSL + landing page", text: "Konwersja przez wideo: scenariusz, wzór strony, formularz.", ready: "za wcześnie: brak opinii i wyników klientów", state: "notNow" },
  { name: "Organic content", text: "Zaufanie, historie, rozrywka. Kalendarz i scenariusze rolek.", ready: "4 z 6 warunków", state: "later" },
  { name: "Kampanie specjalne", text: "Polecenia, eventy, konkursy zgodne z prawem.", ready: "biblioteka akcji", state: "later" },
];

export const tasks: { title: string; meta: string; done: boolean; flag?: { text: string; tone: "warn" | "accent" } }[] = [
  { title: "Uzupełnij liczby studia w DNA", meta: "15 min · zrobione we wtorek", done: true },
  { title: "Wybierz i zatwierdź strategię", meta: "20 min · rozmowa z Marketing OS", done: false, flag: { text: "Dziś", tone: "accent" } },
  { title: "Nagraj 5 rozmów sprzedażowych i wgraj je", meta: "5 × 30 min · bez nagrań nie poprawimy sprzedaży", done: false, flag: { text: "0 z 5", tone: "warn" } },
  { title: "Wgraj wyniki reklam z ostatnich 30 dni", meta: "5 min · zrzut ekranu z Menedżera reklam wystarczy", done: false },
];

// Tytuły lekcji pochodzą z rozmowy Bartka w ChatGPT. Pełną listę 191 lekcji przeniesiemy ze Skoola.
export const lessons: { title: string; source: string; module: string }[] = [
  { title: "Dochodowe Studio Playbook", source: "Skool · podstawa metodyki", module: "00 · Fundament" },
  { title: "Oferta studia: jak stworzyć pakiety usług", source: "Skool · oferta i pakiety", module: "00 · DNA" },
  { title: "System Sprzedaży Studia Treningu Personalnego", source: "Skool · rozmowy i sprzedaż", module: "01 · Strategia" },
  { title: "Jak oceniać reklamy", source: "szkolenie · analiza kampanii", module: "02 · Formularze Meta" },
  { title: "Jak settować", source: "nagranie · DM i rozmowy", module: "02 · Follow Ads" },
];

export const library = { lessons: 191, courses: 5, mentorings: 97 };

export type Signal = { text: string; tone: "good" | "warn" | "bad" | "accent" };

export const studios: { name: string; module: string; last: string; leads: string; cpl: string; signal: Signal; ai: string }[] = [
  { name: "Studio Forma · Poznań", module: "01 Strategia", last: "dziś", leads: "46", cpl: "18,40 zł", signal: { text: "W normie", tone: "good" }, ai: "4,10 zł" },
  { name: "Fit Point · Łódź", module: "02 Formularze Meta", last: "wczoraj", leads: "61", cpl: "22,10 zł", signal: { text: "W normie", tone: "good" }, ai: "6,30 zł" },
  { name: "Strefa Ruchu · Kraków", module: "00 DNA", last: "9 dni temu", leads: "–", cpl: "–", signal: { text: "Brak aktywności", tone: "bad" }, ai: "1,20 zł" },
  { name: "EMS Body · Wrocław", module: "02 Follow Ads", last: "2 dni temu", leads: "28", cpl: "41,80 zł", signal: { text: "Koszt leada 2× norma", tone: "warn" }, ai: "5,80 zł" },
  { name: "Moc Studio · Gdańsk", module: "03 Wdrożenie", last: "dziś", leads: "73", cpl: "15,20 zł", signal: { text: "W normie", tone: "good" }, ai: "7,90 zł" },
  { name: "Studio Puls · Katowice", module: "03 Wdrożenie", last: "4 dni temu", leads: "39", cpl: "24,60 zł", signal: { text: "0 z 5 zadań", tone: "warn" }, ai: "3,40 zł" },
  { name: "Core Lab · Szczecin", module: "01 Strategia", last: "dziś", leads: "–", cpl: "–", signal: { text: "Strategia do omówienia", tone: "accent" }, ai: "2,70 zł" },
];

export const alerts: { title: string; text: string; tone: "bad" | "warn" | "accent" }[] = [
  { title: "Strefa Ruchu: 9 dni bez aktywności", text: "AI wysłało 2 przypomnienia, brak reakcji. Zadzwoń.", tone: "bad" },
  { title: "EMS Body: koszt leada 41,80 zł", text: "Diagnoza AI: słaba kreacja, formularz bez kwalifikacji. Rekomendacja: poprawić, nie zmieniać lejka.", tone: "warn" },
  { title: "Core Lab: strategia gotowa", text: "Do omówienia na najbliższym mentoringu grupowym.", tone: "accent" },
];
