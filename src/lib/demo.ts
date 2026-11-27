// DANE PRZYKŁADOWE do pokazu pulpitu (przycisk „Pokaż przykładowy postęp”). Wyraźnie oznaczone jako demo.
import type { ChatMessage, JourneyEvent, JourneyState } from "@/lib/store";
import { STEPS, allLessons } from "@/lib/journey";

const daysAgo = (d: number, h = 10) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, (d * 7) % 60, 0, 0);
  return t.toISOString();
};

function fill(template: string, ratio = 1) {
  const lines = template.split("\n");
  const labels = lines.filter((l) => /:\s*$/.test(l.trim()));
  const keep = Math.ceil(labels.length * ratio);
  let n = 0;
  return lines.map((l) => (/:\s*$/.test(l.trim()) ? (n++ < keep ? `${l.trim()} przykładowa treść (demo)` : l) : l)).join("\n");
}

export function demoState(): JourneyState {
  const approved = ["materialy", "diagnoza", "dna", "awatar", "oferta"];
  const approvedAt = [18, 15, 12, 8, 4];
  const msgCounts: Record<string, number> = { materialy: 6, diagnoza: 9, dna: 4, awatar: 10, oferta: 7, "cel-budzet": 3 };
  const events: JourneyEvent[] = [
    { type: "ai", at: daysAgo(20, 9) },
    { type: "survey", at: daysAgo(20, 9) },
    { type: "path", at: daysAgo(20, 10) },
  ];
  const docs: JourneyState["docs"] = {};
  const chats: JourneyState["chats"] = {};
  STEPS.forEach((s) => {
    const i = approved.indexOf(s.id);
    const count = msgCounts[s.id] ?? 0;
    if (count) {
      const msgs: ChatMessage[] = [];
      for (let k = 0; k < count; k++) {
        msgs.push({ role: "user", content: "Przykładowa odpowiedź uczestnika (demo)." }, { role: "assistant", content: "Przykładowa odpowiedź asystenta (demo)." });
        events.push({ type: "msg", ref: s.id, at: daysAgo((i >= 0 ? approvedAt[i] : 1) + (k % 3), 8 + k) });
      }
      chats[s.id] = msgs;
    }
    if (i >= 0) {
      events.push({ type: "draft", ref: s.docId, at: daysAgo(approvedAt[i] + 1, 12) });
      events.push({ type: "approve", ref: s.docId, at: daysAgo(approvedAt[i], 18) });
      docs[s.docId] = { content: fill(s.docTemplate), status: "approved", updatedAt: daysAgo(approvedAt[i], 18) };
    } else if (s.id === "cel-budzet") {
      events.push({ type: "draft", ref: s.docId, at: daysAgo(1, 19) });
      docs[s.docId] = { content: fill(s.docTemplate, 0.45), status: "draft", updatedAt: daysAgo(1, 19) };
    }
  });
  const watched: Record<string, boolean> = {};
  allLessons().slice(0, 5).forEach((l, k) => {
    watched[l.id] = true;
    events.push({ type: "lesson", ref: l.id, at: daysAgo(17 - k * 3, 20) });
  });
  // seria ostatnich dni
  [0, 2, 3].forEach((d) => events.push({ type: "msg", ref: "cel-budzet", at: daysAgo(d, 7) }));
  events.sort((a, b) => a.at.localeCompare(b.at));

  return {
    version: 1,
    demo: true,
    profile: { name: "Kasia (demo)", email: "demo@dochodowe.studio" },
    ai: { mode: "manual", model: "" },
    // Odpowiedzi według ankiety v3 (segment, rozliczenia, grafik, przedłużenia, poduszka).
    survey: { studio: "Studio Demo, miasto ok. 500 tys. mieszkańców", segment: "bez-systemu", model: "trenerzy", rozliczenia: "stawka", grafik: "50-80", przedluzenia: "polowa", "cel-liczby": "8 nowych klientów miesięcznie, 25 tys. zł zysku (demo)", poduszka: "do3", zrodla: "polecenia", problem: "zgloszenia", kontakt: "dzien", konsultacja: "nie-licze", reklamy: "do1k", waluta: "oba", godziny: "5", "czerwone-linie": "nie chcę się nagrywać (demo)", poziom: "sredni" },
    stage: "bez-systemu",
    pathAccepted: true,
    chats,
    docs,
    watched,
    events,
  };
}
