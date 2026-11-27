// Nagrody i statystyki uczestnika: XP, poziomy, seria dni, odznaki, kompletność dokumentów.
// Wszystko liczone z prawdziwych działań (zdarzeń) uczestnika — nic nie jest wymyślone.
import type { JourneyEvent, JourneyState } from "@/lib/store";
import { STEPS, progressPercent, stepStatuses, allLessons } from "@/lib/journey";

export const XP: Record<JourneyEvent["type"], number> = {
  ai: 30, // połączone AI
  survey: 50, // ankieta
  path: 20, // akceptacja ścieżki
  draft: 10, // pierwszy szkic dokumentu
  approve: 100, // zatwierdzony dokument
  lesson: 15, // obejrzana lekcja
  msg: 2, // wiadomość do asystenta
};

export const LEVELS = [
  { min: 0, name: "Start" },
  { min: 80, name: "Odkrywca" },
  { min: 200, name: "Fundament" },
  { min: 350, name: "Znawca klienta" },
  { min: 550, name: "Twórca oferty" },
  { min: 800, name: "Strateg" },
  { min: 1050, name: "Wdrożeniowiec" },
  { min: 1350, name: "Analityk" },
  { min: 1700, name: "Mistrz marketingu" },
  { min: 2000, name: "Dochodowe Studio" },
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
  return { index: i + 1, name: cur.name, min: cur.min, next: next?.min ?? null, nextName: next?.name ?? null, pct };
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

/** Ile pól szablonu dokumentu jest wypełnionych (proste porównanie z szablonem). */
export function docCompleteness(template: string, content: string | undefined) {
  if (!content?.trim()) return 0;
  const labels = template.split("\n").map((l) => l.trim()).filter((l) => /:$/.test(l)).map((l) => l.replace(/:$/, "").toLowerCase());
  if (!labels.length) return 100;
  const lines = content.split("\n").map((l) => l.trim());
  let filled = 0;
  for (const label of labels) {
    const i = lines.findIndex((l) => l.toLowerCase().startsWith(label.slice(0, Math.min(label.length, 24))));
    if (i === -1) continue;
    const after = lines[i].slice(lines[i].indexOf(":") + 1).trim();
    const next = lines[i + 1] ?? "";
    if ((after && !/^\[do uzupełnienia\]$/i.test(after)) || (next && !next.endsWith(":") && !/^\[do uzupełnienia\]$/i.test(next))) filled++;
  }
  return Math.round((filled / labels.length) * 100);
}

export type Badge = { id: string; title: string; desc: string; icon: string; earned: boolean };

export function badges(state: JourneyState): Badge[] {
  const approved = (doc: string) => state.docs[doc]?.status === "approved";
  const lessons = allLessons().filter((l) => state.watched[l.id]).length;
  const streak = streakDays(state.events);
  const pct = progressPercent(state);
  const msgs = state.events.filter((e) => e.type === "msg").length;
  const list: Badge[] = [];
  const add = (id: string, title: string, desc: string, icon: string, earned: boolean) => list.push({ id, title, desc, icon, earned });
  // Nazwy bez rodzaju gramatycznego: platforma pisze do właścicielek i właścicieli. DO ZATWIERDZENIA: nazwy i progi (Bartek).
  add("start", "Start", "Ankieta za Tobą", "flag", !!state.survey);
  add("dna", "DNA studia", "Zatwierdzone DNA studia", "dna", approved("dna"));
  add("klient", "Klient jak na dłoni", "Zatwierdzony awatar klienta", "user", approved("awatar"));
  add("oferta", "Oferta, która sprzedaje", "Zatwierdzona oferta", "gem", approved("oferta"));
  add("plan-gry", "Plan gry", "Zatwierdzona strategia", "target", approved("strategia"));
  add("zielone-swiatlo", "Zielone światło", "Lejek ma fundamenty", "rocket", approved("gotowosc"));
  add("tresci", "Treści gotowe", "Materiały lejka zatwierdzone", "pen", approved("materialy-lejka"));
  add("liczby", "Liczby mówią", "Pierwszy przegląd wyników", "chart", approved("wyniki"));
  add("rozmowa", "Rozmowa w toku", "20 wiadomości z asystentem", "chat", msgs >= 20);
  add("wiedza", "Wiedza w praktyce", "5 zaliczonych lekcji", "book", lessons >= 5);
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
