// Nagrody i statystyki uczestnika: XP, poziomy, seria dni, odznaki, kompletność dokumentów.
// Wszystko liczone z prawdziwych działań (zdarzeń) uczestnika — nic nie jest wymyślone.
import type { JourneyEvent, JourneyState } from "@/lib/store";
import type { StepStatus } from "@/lib/journey-types";
import { STEPS, progressPercent, stepStatuses, allLessons, currentStep } from "@/lib/journey";
import { KURSY, LEKCJE, type IdLekcjiKursu } from "@/lib/kursy";

export const XP: Record<JourneyEvent["type"], number> = {
  ai: 30, // połączone AI
  survey: 50, // ankieta
  path: 20, // akceptacja ścieżki
  draft: 10, // pierwszy szkic dokumentu
  approve: 100, // zatwierdzony dokument
  lesson: 15, // obejrzana lekcja
  msg: 2, // wiadomość do asystenta
};

// POZIOMY = etapy rozwoju studia językiem Bartka (moduły Skool „Dochodowe Studio”), bez rodzaju gramatycznego
// (nazywamy stan studia, nie osobę). DO ZATWIERDZENIA (Bartek): nazwy, opisy i progi.
// Progi policzone pod ścieżkę: start (ankieta + ścieżka) ≈ 70 XP, jeden krok ≈ 110 XP (szkic + zatwierdzenie)
// + jego lekcje (2–5 × 15 XP) + rozmowa (~8 wiadomości × 2 XP), czyli ok. 160–200 XP na krok:
// po kroku 1 ≈ 225, po 3 ≈ 540, po 5 ≈ 910, po 7 ≈ 1270, po 9 ≈ 1610, po 11 ≈ 1970, po 14 ≈ 2510 XP.
// Krok 15 „Zespół i delegowanie” (boczny, po ofercie) to kolejne ≈ 170 XP: „Studio bez Ciebie” = ścieżka z zespołem
// (≈ 2680) + kilka lekcji, „Dochodowe Studio” = do tego reszta lekcji kursu „Dochodowe Studio” ze Skool.
export const LEVELS = [
  { min: 0, name: "Start!", opis: "Ankieta za Tobą, ruszamy z programem." },
  { min: 200, name: "Diagnoza przed ofertą", opis: "Wiesz, gdzie dziś stoi studio i co blokuje wzrost." },
  { min: 500, name: "Złoty model", opis: "DNA studia i model biznesowy spisane czarno na białym." },
  { min: 850, name: "Grubaśna oferta", opis: "Awatar i oferta 90 dni, która sprzedaje zmianę, nie treningi." },
  { min: 1200, name: "Skuteczna sprzedaż", opis: "Cel w liczbach i system, w którym żaden lead nie czeka." },
  { min: 1550, name: "Zapytania bez końca", opis: "Strategia i lejek gotowe do startu." },
  { min: 1900, name: "Pełny grafik", opis: "Lejek wdrożony, zgłoszenia płyną do kalendarza." },
  { min: 2400, name: "Klient = przyjaciel", opis: "Wyniki pod kontrolą, klienci zostają i polecają." },
  { min: 2750, name: "Studio bez Ciebie", opis: "Zespół i procesy, dzięki którym studio działa bez Twojej obecności." },
  { min: 2950, name: "Dochodowe Studio", opis: "Cała ścieżka i cały kurs za Tobą. Studio zarabia." },
];

export function xpTotal(events: JourneyEvent[]) {
  return events.reduce((sum, e) => sum + (XP[e.type] ?? 0), 0);
}

export function levelOf(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].min) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  const pct = next ? Math.round(((xp - cur.min) / (next.min - cur.min)) * 100) : 100;
  return { index: i + 1, name: cur.name, opis: cur.opis, min: cur.min, next: next?.min ?? null, nextName: next?.name ?? null, pct };
}

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Ile zdarzeń było każdego dnia (lokalny czas). */
export function activityByDay(events: JourneyEvent[]) {
  const map = new Map<string, number>();
  for (const e of events) {
    const k = dayKey(new Date(e.at));
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

/** Siatka ostatnich `weeks` tygodni (pon–niedz), do mapy aktywności. */
export function activityGrid(events: JourneyEvent[], weeks = 12, now = new Date()) {
  const map = activityByDay(events);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = (end.getDay() + 6) % 7; // 0 = poniedziałek
  const start = new Date(end);
  start.setDate(end.getDate() - dow - (weeks - 1) * 7);
  const cols: { key: string; label: string; count: number; future: boolean }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      const k = dayKey(day);
      col.push({ key: k, label: day.toLocaleDateString("pl-PL", { day: "numeric", month: "long" }), count: map.get(k) ?? 0, future: day > end });
    }
    cols.push(col);
  }
  return cols;
}

/** Seria: kolejne dni z aktywnością, licząc od dziś (albo od wczoraj, jeśli dziś jeszcze nic). */
export function streakDays(events: JourneyEvent[], now = new Date()) {
  const map = activityByDay(events);
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!map.get(dayKey(day))) day.setDate(day.getDate() - 1);
  let n = 0;
  while (map.get(dayKey(day))) {
    n++;
    day.setDate(day.getDate() - 1);
  }
  return n;
}

/** XP narastająco w ostatnich `days` dniach — do wykresu. */
export function xpTimeline(events: JourneyEvent[], days = 30, now = new Date()) {
  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at));
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  let acc = sorted.filter((e) => new Date(e.at) < start).reduce((s, e) => s + XP[e.type], 0);
  const perDay = new Map<string, number>();
  for (const e of sorted) {
    const d = new Date(e.at);
    if (d >= start) perDay.set(dayKey(d), (perDay.get(dayKey(d)) ?? 0) + XP[e.type]);
  }
  const out: { day: string; label: string; xp: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    acc += perDay.get(dayKey(d)) ?? 0;
    out.push({ day: dayKey(d), label: d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }), xp: acc });
  }
  return out;
}

/** Postęp w każdym etapie ścieżki (Fundament, Klient i oferta…). */
export function phaseProgress(state: JourneyState) {
  const st = stepStatuses(state);
  const phases = [...new Set(STEPS.map((s) => s.phase))];
  return phases.map((phase) => {
    const steps = STEPS.filter((s) => s.phase === phase);
    const done = steps.filter((s) => st[s.id] === "done").length;
    return { phase, done, total: steps.length, pct: Math.round((done / steps.length) * 100) };
  });
}

// Wartość pola, która nie jest treścią: „[do uzupełnienia]”, sam znacznik w nawiasie („[KWOTA]”), „…”, „-”.
const EMPTY_VALUE = /^(\[[^\]]*\]|…+|\.{2,}|[-–—?]+)$/;

/** Pola szablonu dokumentu: które są wypełnione, które puste (proste porównanie z szablonem). */
export function docCheck(template: string, content: string | undefined) {
  const text = content?.trim() ?? "";
  const tpl = template.split("\n").map((l) => l.trim());
  const fields = tpl.filter((l) => /:$/.test(l)).map((l) => l.replace(/:$/, ""));
  if (!text) return { pct: 0, chars: 0, filled: 0, total: fields.length, missing: fields };
  if (!fields.length) return { pct: 100, chars: text.length, filled: 0, total: 0, missing: [] as string[] };
  const own = new Set(tpl.filter(Boolean).map((l) => l.toLowerCase()));
  const lines = content!.split("\n").map((l) => l.trim());
  const missing: string[] = [];
  for (const field of fields) {
    const label = field.toLowerCase();
    const i = lines.findIndex((l) => l.toLowerCase().startsWith(label.slice(0, Math.min(label.length, 24))));
    const after = i === -1 ? "" : lines[i].slice(lines[i].indexOf(":") + 1).trim();
    const next = i === -1 ? "" : lines[i + 1] ?? "";
    // treść po dwukropku albo w następnej linii (która nie jest kolejną linią szablonu)
    const ok = (after && !EMPTY_VALUE.test(after)) || (next && !next.endsWith(":") && !own.has(next.toLowerCase()) && !EMPTY_VALUE.test(next));
    if (!ok) missing.push(field);
  }
  const filled = fields.length - missing.length;
  return { pct: Math.round((filled / fields.length) * 100), chars: text.length, filled, total: fields.length, missing };
}

/** Ile pól szablonu dokumentu jest wypełnionych (w %). */
export function docCompleteness(template: string, content: string | undefined) {
  return docCheck(template, content).pct;
}

// Zatwierdzenie kroku (ApproveDialog.tsx): pustego albo prawie pustego dokumentu nie da się zatwierdzić.
// DO ZATWIERDZENIA (Bartek): progi.
export const APPROVE_MIN_CHARS = 300;
export const APPROVE_MIN_PCT = 50;

/** Czy dokument jest na tyle pełny, żeby go zatwierdzić, a jeśli nie — dlaczego. */
export function approveBlockers(template: string, content: string | undefined) {
  const c = docCheck(template, content);
  const out: string[] = [];
  if (c.chars < APPROVE_MIN_CHARS) out.push(`Dokument jest za krótki: ${c.chars} z co najmniej ${APPROVE_MIN_CHARS} znaków.`);
  if (c.total && c.pct < APPROVE_MIN_PCT) out.push(`Wypełnione pola szablonu: ${c.pct}%. Potrzeba co najmniej ${APPROVE_MIN_PCT}%.`);
  return { check: c, blockers: out };
}

// „Obejrzane” w lekcji: przycisk włącza się, gdy odtwarzacz był otwarty co najmniej 30 s, a przy krótkim nagraniu
// (znany czas poniżej minuty) połowę jego długości. Nic poza tym nie śledzimy. DO ZATWIERDZENIA (Bartek): próg.
export const WATCH_MIN_SECONDS = 30;
export function watchSeconds(duration?: number) {
  return duration && duration > 0 ? Math.max(1, Math.min(WATCH_MIN_SECONDS, Math.ceil(duration / 2))) : WATCH_MIN_SECONDS;
}

export type Badge = { id: string; title: string; desc: string; icon: string; earned: boolean };

export function badges(state: JourneyState): Badge[] {
  const approved = (doc: string) => state.docs[doc]?.status === "approved";
  const lessons = lessonProgress(state).path.done;
  const streak = streakDays(state.events);
  const pct = progressPercent(state);
  const msgs = state.events.filter((e) => e.type === "msg").length;
  const list: Badge[] = [];
  const add = (id: string, title: string, desc: string, icon: string, earned: boolean) => list.push({ id, title, desc, icon, earned });
  // Nazwy bez rodzaju gramatycznego: platforma pisze do właścicielek i właścicieli. DO ZATWIERDZENIA: nazwy i progi (Bartek).
  add("start", "Start", "Ankieta za Tobą", "flag", !!state.survey);
  add("dna", "DNA studia", "Zatwierdzone DNA studia", "dna", approved("dna"));
  add("klient", "Klient jak na dłoni", "Zatwierdzony awatar klienta", "user", approved("awatar"));
  add("oferta", "Oferta, która sprzedaje", "Zatwierdzona oferta 90 dni", "gem", approved("oferta"));
  // Ikony „phone” i „heart”: do dodania w BadgeIcon.tsx (PhoneCall, HeartHandshake); do tego czasu BadgeIcon pokaże pucharek.
  add("sprzedaz", "Żaden lead nie czeka", "Zatwierdzony system obsługi zgłoszeń", "phone", approved("sprzedaz"));
  add("plan-gry", "Plan gry", "Zatwierdzona strategia", "target", approved("strategia"));
  add("zielone-swiatlo", "Zielone światło", "Lejek ma fundamenty", "rocket", approved("gotowosc"));
  add("tresci", "Treści gotowe", "Gotowce lejka zatwierdzone", "pen", approved("materialy-lejka"));
  add("liczby", "Liczby mówią", "Pierwszy przegląd tygodniowy", "chart", approved("wyniki"));
  add("utrzymanie", "Klienci zostają", "Zatwierdzony system utrzymania klientów", "heart", approved("utrzymanie"));
  add("zespol", "Zespół w grze", "Zatwierdzony system zespołu i delegowania", "team", approved("zespol"));
  add("rozmowa", "Rozmowa w toku", "20 wiadomości z asystentem", "chat", msgs >= 20);
  add("wiedza", "Wiedza w praktyce", "5 zaliczonych lekcji ścieżki", "book", lessons >= 5);
  add("seria3", "3 dni w ruchu", "3 dni z rzędu w akcji", "flame", streak >= 3);
  add("seria7", "Tydzień w ruchu", "7 dni bez przerwy", "flame", streak >= 7);
  add("polmetek", "Półmetek", "50% ścieżki", "half", pct >= 50);
  add("meta", "Cała ścieżka", "Wszystkie kroki zatwierdzone", "trophy", pct >= 100);
  return list;
}

/** Ostatnie `days` dni: rozmowy, lekcje i praca nad dokumentami — do słupków piętrowych. */
export function weeklyActivity(events: JourneyEvent[], days = 7, now = new Date()) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: { day: string; label: string; rozmowy: number; lekcje: number; dokumenty: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const k = dayKey(d);
    const evs = events.filter((e) => dayKey(new Date(e.at)) === k);
    out.push({
      day: k,
      label: d.toLocaleDateString("pl-PL", { weekday: "short" }),
      rozmowy: evs.filter((e) => e.type === "msg").length,
      lekcje: evs.filter((e) => e.type === "lesson").length,
      dokumenty: evs.filter((e) => e.type === "draft" || e.type === "approve").length,
    });
  }
  return out;
}

/** Dzienne XP i liczba działań — do interaktywnego wykresu liniowego. */
export function dailySeries(events: JourneyEvent[], days = 60, now = new Date()) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const map = new Map<string, { xp: number; dzialania: number }>();
  for (const e of events) {
    const k = dayKey(new Date(e.at));
    const v = map.get(k) ?? { xp: 0, dzialania: 0 };
    v.xp += XP[e.type];
    v.dzialania += 1;
    map.set(k, v);
  }
  const out: { day: string; label: string; xp: number; dzialania: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const v = map.get(dayKey(d)) ?? { xp: 0, dzialania: 0 };
    out.push({ day: dayKey(d), label: d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }), ...v });
  }
  return out;
}

/** Ile czegoś przybyło w ostatnich 7 dniach (do kart z liczbami). */
export function lastWeek(events: JourneyEvent[], types: JourneyEvent["type"][], now = new Date()) {
  const from = now.getTime() - 7 * 24 * 3600 * 1000;
  return events.filter((e) => types.includes(e.type) && new Date(e.at).getTime() >= from);
}

// ---------- LEKCJE: „zaliczona” wspólnie dla ścieżki i biblioteki kursów ----------
// Lekcja kursu (id „sk-…”) w ścieżce ma czasem stary id (pole `ref` łączy oba). Zatwierdzony krok liczymy jako
// zaliczone lekcje tego kroku: StepWorkspace nie pozwala przejść do rozmowy i dokumentu bez odhaczenia lekcji.
const PATH_LESSON = new Map<string, { ids: string[]; steps: string[] }>();
const REF_OF = new Map<string, string>(); // id lekcji w ścieżce → id w kursach
for (const s of STEPS) {
  for (const l of s.lessons) {
    const key = l.ref ?? l.id;
    REF_OF.set(l.id, key);
    const cur = PATH_LESSON.get(key) ?? { ids: [], steps: [] };
    if (!cur.ids.includes(l.id)) cur.ids.push(l.id);
    if (!cur.steps.includes(s.id)) cur.steps.push(s.id);
    PATH_LESSON.set(key, cur);
  }
}
const DOC_OF_STEP = new Map(STEPS.map((s) => [s.id, s.docId]));

/** Czy lekcja (id ze ścieżki albo z kursów) jest zaliczona: obejrzana albo jej krok jest zatwierdzony. */
export function lessonDone(state: JourneyState, lessonId: string): boolean {
  if (state.watched[lessonId]) return true;
  const key = REF_OF.get(lessonId) ?? lessonId;
  const p = PATH_LESSON.get(key);
  if (state.watched[key]) return true;
  if (!p) return false;
  if (p.ids.some((id) => state.watched[id])) return true;
  return p.steps.some((st) => state.docs[DOC_OF_STEP.get(st) ?? ""]?.status === "approved");
}

/** Pierwszy krok, w którym jest lekcja kursu (żeby link prowadził do kroku, a nie do biblioteki). */
export function stepOfLesson(kursId: string): string | undefined {
  return PATH_LESSON.get(kursId)?.steps[0];
}

// ---------- LICZNIKI LEKCJI: jedna funkcja dla pulpitu, strony Lekcje, kamieni i odznak ----------
// „Zaliczona” zawsze znaczy lessonDone(). Dwie osobne pule, zawsze tak nazywane w interfejsie:
// - LEKCJE ŚCIEŻKI = lekcje przypięte do kroków (allLessons(), każda raz), zakładka /lekcje „Twoja ścieżka”;
// - LEKCJE KURSÓW = wszystkie lekcje kursów (src/lib/kursy.ts, każda raz), zakładka /lekcje#kursy.
// Część lekcji jest w obu pulach (pole `ref`): zaliczenie w jednym miejscu liczy się w obu.
export type LessonTally = { done: number; total: number; pct: number };
const PATH_LESSON_IDS = allLessons().map((l) => l.id);
const COURSE_LESSON_IDS = [...new Set(KURSY.flatMap((k) => k.modules.flatMap((m) => m.lessons as string[])))];

/** Ile lekcji z listy (id ze ścieżki albo z kursów) jest zaliczonych. */
export function lessonTally(state: JourneyState, ids: readonly string[]): LessonTally {
  const done = ids.filter((id) => lessonDone(state, id)).length;
  return { done, total: ids.length, pct: ids.length ? Math.round((done / ids.length) * 100) : 0 };
}

/** Lekcje ścieżki i lekcje kursów osobno + XP zdobyte za lekcje (z prawdziwych zdarzeń). */
export function lessonProgress(state: JourneyState) {
  return {
    path: lessonTally(state, PATH_LESSON_IDS),
    courses: lessonTally(state, COURSE_LESSON_IDS),
    xp: state.events.filter((e) => e.type === "lesson").length * XP.lesson,
  };
}

// ---------- KAMIENIE MILOWE = moduły kursu „Dochodowe Studio” na Skool ----------
// Kamień zdobywasz, gdy zrobisz wszystkie zadania modułu: zatwierdzone kroki ścieżki przypisane do modułu
// + lekcje modułu (zaliczone w kroku albo w bibliotece /lekcje#kursy) + ewentualne zadanie dodatkowe (lokal).
// Każdy krok ścieżki należy do dokładnie jednego kamienia (kroki 1–14 + boczny krok 15 „zespol” w module 7; krok,
// którego nie ma w STEPS, jest pomijany). Kamienie nie blokują się nawzajem: „Lokal” nie ma kroku, krok 14 (utrzymanie)
// zamyka moduł 5, a krok 15 otwiera się już po ofercie, więc kolejność modułów ≠ kolejność kroków.
// DO ZATWIERDZENIA (Bartek): przypisanie kroków do modułów, wymóg wszystkich lekcji modułu, zadanie „lokal”,
// nagrody (30 min rozmowy po kamieniach 2, 4 i 6 — tyle samo rozmów co wcześniej) i opisy.
export type MilestoneDef = {
  id: string;
  no: number; // numer modułu na Skool
  module: string; // id modułu w KURSY (src/lib/kursy.ts)
  title: string; // nazwa modułu jak na Skool
  short: string; // krótka nazwa na szlak
  icon: "start" | "model" | "lokal" | "sprzedaz" | "klienci" | "marketing" | "zespol" | "usprawnienia";
  outcome: string; // co studio ma po zdobyciu kamienia
  steps: string[]; // id kroków ścieżki
  lokal?: boolean; // zadanie dodatkowe: pierwszy lokal w kalkulatorze /lokal
  call?: boolean; // nagroda: 30 minut rozmowy z Bartkiem na żywo
  note?: string; // dla kogo moduł jest najważniejszy
};

export const MILESTONES: MilestoneDef[] = [
  { id: "m1", no: 1, module: "ds-start", title: "START!", short: "START!", icon: "start", outcome: "Studio prześwietlone: materiały, diagnoza i karta progresu.", steps: ["materialy", "diagnoza"] },
  { id: "m2", no: 2, module: "ds-model", title: "Złoty model biznesowy", short: "Złoty model", icon: "model", outcome: "DNA studia, awatar klienta i Grubaśna oferta na 90 dni.", steps: ["dna", "awatar", "oferta"], call: true },
  { id: "m3", no: 3, module: "ds-lokal", title: "Lokal", short: "Lokal", icon: "lokal", outcome: "Lokal policzony i sprawdzony, zanim podpiszesz umowę.", steps: [], lokal: true, note: "Najważniejszy przed otwarciem albo przy zmianie lokalu." },
  { id: "m4", no: 4, module: "ds-sprzedaz", title: "Skuteczna sprzedaż", short: "Sprzedaż", icon: "sprzedaz", outcome: "Cel w liczbach i system, w którym żaden lead nie czeka.", steps: ["cel-budzet", "sprzedaz"], call: true },
  { id: "m5", no: 5, module: "ds-klienci", title: "Dożywotni klienci", short: "Dożywotni klienci", icon: "klienci", outcome: "Klienci zostają na lata, polecają i wracają.", steps: ["utrzymanie"] },
  { id: "m6", no: 6, module: "ds-marketing", title: "Marketing", short: "Marketing", icon: "marketing", outcome: "Strategia, gotowy lejek i plan wdrożenia: zapytania bez końca.", steps: ["strategia", "gotowosc", "materialy-lejka", "plan"], call: true },
  { id: "m7", no: 7, module: "ds-zespol", title: "Budowanie teamu / Zatrudnianie", short: "Zespół", icon: "zespol", outcome: "Zespół, który prowadzi metodę studia: rozliczenia, rekrutacja, standardy i delegowanie.", steps: ["zespol"], note: "Najważniejszy, gdy studio rośnie ponad jedną osobę." },
  { id: "m8", no: 8, module: "ds-usprawnienia", title: "Usprawnienia", short: "Usprawnienia", icon: "usprawnienia", outcome: "Przegląd wyników, kalendarz okazji i usprawnienia na co dzień.", steps: ["wyniki", "okazje"] },
];

// NAGRODA „30 minut z Bartkiem”: jedna zasada wszędzie — za kamienie milowe 2, 4 i 6 (pole `call`), nie za etapy ścieżki.
// Nowo zdobyty kamień wykrywa `commit` w store.tsx (Reward.milestone), a Celebration.tsx pokazuje ekran kamienia.
// DO ZATWIERDZENIA (Bartek): które kamienie dają rozmowę i link do kalendarza (NEXT_PUBLIC_BARTEK_KALENDARZ).
export const CALL_MILESTONES = MILESTONES.filter((m) => m.call).map((m) => m.no);
/** „2, 4 i 6” — numery kamieni z rozmową, do tekstów w interfejsie. */
export const CALL_MILESTONES_TEXT = CALL_MILESTONES.length > 1 ? `${CALL_MILESTONES.slice(0, -1).join(", ")} i ${CALL_MILESTONES.at(-1)}` : String(CALL_MILESTONES[0] ?? "");

export type MilestoneItem = {
  kind: "step" | "lesson" | "extra";
  id: string;
  title: string;
  done: boolean;
  href: string;
  no?: string; // numer kroku
  status?: StepStatus;
  video?: boolean;
};

export type MilestoneProgress = MilestoneDef & {
  items: MilestoneItem[];
  done: number;
  total: number;
  pct: number;
  complete: boolean;
  stepsDone: number;
  stepsTotal: number;
  lessonsDone: number;
  lessonsTotal: number;
  current: boolean; // tu jest Twój bieżący krok
};

export function milestones(state: JourneyState): MilestoneProgress[] {
  const st = stepStatuses(state);
  const cur = currentStep(state);
  const course = KURSY.find((k) => k.id === "ds");
  return MILESTONES.map((m) => {
    const steps: MilestoneItem[] = m.steps.flatMap((id) => {
      const s = STEPS.find((x) => x.id === id);
      return s ? [{ kind: "step" as const, id: s.id, no: s.no, title: s.title, status: st[s.id], done: st[s.id] === "done", href: st[s.id] === "locked" ? "/sciezka" : `/krok/${s.id}` }] : [];
    });
    const lessonIds: IdLekcjiKursu[] = course?.modules.find((x) => x.id === m.module)?.lessons ?? [];
    const lessons: MilestoneItem[] = lessonIds.map((id) => {
      const l = LEKCJE[id];
      // Lekcja z odblokowanego kroku prowadzi do kroku; z zablokowanego albo spoza ścieżki — do biblioteki kursów.
      const step = stepOfLesson(id);
      return { kind: "lesson" as const, id, title: l.title, video: !!l.video, done: lessonDone(state, id), href: step && st[step] !== "locked" ? `/krok/${step}` : "/lekcje#kursy" };
    });
    const extra: MilestoneItem[] = m.lokal ? [{ kind: "extra", id: "lokal", title: "Pierwszy lokal w kalkulatorze", done: (state.lokale?.length ?? 0) > 0, href: "/lokal" }] : [];
    const items = [...steps, ...lessons, ...extra];
    const done = items.filter((i) => i.done).length;
    return {
      ...m,
      items,
      done,
      total: items.length,
      pct: items.length ? Math.round((done / items.length) * 100) : 0,
      complete: items.length > 0 && done === items.length,
      stepsDone: steps.filter((i) => i.done).length,
      stepsTotal: steps.length,
      lessonsDone: lessons.filter((i) => i.done).length,
      lessonsTotal: lessons.length,
      current: !!cur && m.steps.includes(cur.id),
    };
  });
}

/** Najbliższy kamień: ten z bieżącym krokiem, a gdy go nie ma — niezdobyty z największym postępem. */
export function nextMilestone(list: MilestoneProgress[]): MilestoneProgress | undefined {
  const open = list.filter((m) => !m.complete);
  return open.find((m) => m.current) ?? [...open].sort((a, b) => b.pct - a.pct || a.no - b.no)[0];
}

/** Postęp każdego etapu ścieżki: stany kroków i zaliczone lekcje (wykres „Ścieżka etap po etapie”). */
export function phaseDetail(state: JourneyState) {
  const st = stepStatuses(state);
  const phases = [...new Set(STEPS.map((s) => s.phase))];
  return phases.map((phase) => {
    const steps = STEPS.filter((s) => s.phase === phase);
    const lessons = [...new Map(steps.flatMap((s) => s.lessons).map((l) => [l.id, l])).values()];
    return {
      phase,
      steps: steps.map((s) => ({ id: s.id, no: s.no, title: s.title, status: st[s.id] })),
      done: steps.filter((s) => st[s.id] === "done").length,
      draft: steps.filter((s) => st[s.id] === "draft").length,
      total: steps.length,
      lessonsDone: lessons.filter((l) => lessonDone(state, l.id)).length,
      lessonsTotal: lessons.length,
    };
  });
}
