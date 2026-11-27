"use client";

// KAMIENIE MILOWE = 8 modułów kursu „Dochodowe Studio” na Skool (definicje i liczenie: MILESTONES / milestones()
// w src/lib/gamification.ts). Kamień = zatwierdzone kroki ścieżki z modułu + lekcje modułu (+ lokal w module 3).
// Nagroda za kamienie 2, 4 i 6: 30 minut rozmowy z Bartkiem na żywo. DO ZATWIERDZENIA (Bartek): które kamienie dają
// rozmowę, ile rozmów, link do kalendarza (NEXT_PUBLIC_BARTEK_KALENDARZ).
//
// Forma: SZLAK (ścieżka z węzłami jak w Duolingo), a nie wykres słupkowy, bo:
// - 8 kamieni to 8 odcinków jednej drogi przez kurs (kolejność modułów na Skool), więc kolejność jest treścią;
// - w każdym węźle jest jedna proporcja (zadania zrobione / wszystkie) → pierścień-miernik w jednym kolorze (zieleń marki);
// - stan nie wisi na samym kolorze: zdobyty = pełne zielone koło z ✓, w drodze = pierścień postępu, nieruszony = kłódka;
// - liczby są w podpisie węzła, w panelu szczegółów i w tabeli („Pokaż dane w tabeli”).
// Szeroki ekran: szlak falą w poziomie. Wąski: zygzak w dół, jak w Duolingo.
// Kamień zdobyty od ostatniej wizyty na pulpicie odblokowuje się z animacją (kłódka odpada, węzeł się zapełnia,
// rozbłysk, „Odblokowano!”). Co już widziane, pamięta localStorage (ds:kamienie:<e-mail>).
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight, CalendarCheck, Check, Crown, Flag, Handshake, HeartHandshake, Lock, Megaphone, PenLine, PlayCircle, Rocket, Store,
  UsersRound, Video, Wrench, FileText, type LucideIcon,
} from "lucide-react";
import type { JourneyState } from "@/lib/store";
import { CALL_PHASES, milestones, nextMilestone, type MilestoneItem, type MilestoneProgress } from "@/lib/gamification";
import { DataTable } from "@/components/Charts";
import { play } from "@/lib/sfx";

// Celebration.tsx pokazuje rozmowę z Bartkiem po zamknięciu etapu ścieżki: etapy, które kończą kamień z rozmową.
export const CALL_AFTER = CALL_PHASES;
export const CALENDAR = process.env.NEXT_PUBLIC_BARTEK_KALENDARZ ?? "";

const ICON: Record<MilestoneProgress["icon"], LucideIcon> = {
  start: Rocket, model: Crown, lokal: Store, sprzedaz: Handshake, klienci: HeartHandshake, marketing: Megaphone, zespol: UsersRound, usprawnienia: Wrench,
};

const UNLOCK_START = 0.8; // s: pierwsze odblokowanie po wjeździe karty
const UNLOCK_STAGGER = 1.1; // s: kolejne po sobie
const WIDE = 720; // px szerokości szlaku, od której szlak biegnie poziomo

function useWidth(ref: RefObject<HTMLElement | null>) {
  const subscribe = useCallback((cb: () => void) => {
    const el = ref.current;
    if (!el) return () => {};
    const ro = new ResizeObserver(cb);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return useSyncExternalStore(subscribe, () => ref.current?.clientWidth ?? 0, () => 0);
}

function readSeen(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const stateLabel = (m: MilestoneProgress) => (m.complete ? "zdobyty" : m.done ? "w drodze" : "jeszcze nie ruszony");

export function Milestones({ state }: { state: JourneyState }) {
  const list = milestones(state);
  const reduce = useReducedMotion() ?? false;
  const key = `ds:kamienie:${state.profile?.email ?? "gosc"}`;
  const completeIds = list.filter((m) => m.complete).map((m) => m.id);
  const completeKey = completeIds.join(",");

  // Nowo zdobyte od ostatniej wizyty. Przy pierwszym wejściu liczone od razu (bez mignięcia gotowym stanem; pulpit
  // renderuje się tylko w przeglądarce, za Gate). Next 16 nie odmontowuje pulpitu przy przejściu na inną stronę, tylko
  // go chowa, a przy powrocie efekty uruchamiają się na nowo: wtedy porównujemy z zapisem i odpalamy kolejną „rundę”.
  const [run, setRun] = useState<{ ids: string[]; n: number }>(() => ({ ids: completeIds.filter((id) => !readSeen(key).includes(id)), n: 0 }));
  const first = useRef(true);
  useLayoutEffect(() => {
    const ids = completeKey ? completeKey.split(",") : [];
    const newly = first.current ? [] : ids.filter((id) => !readSeen(key).includes(id));
    first.current = false;
    try {
      localStorage.setItem(key, JSON.stringify(ids));
    } catch {
      // bez localStorage animacja odblokowania pokaże się po prostu przy każdym wejściu
    }
    // nowa runda animacji po powrocie na pulpit (efekt układu: przed narysowaniem, bez mignięcia gotowym stanem)
    if (newly.length) setRun((r) => ({ ids: newly, n: r.n + 1 }));
  }, [key, completeKey]);
  const fresh = run.ids;
  useEffect(() => {
    if (reduce || !run.ids.length) return;
    const timers = run.ids.map((_, k) => setTimeout(() => play("unlock"), (UNLOCK_START + k * UNLOCK_STAGGER + 0.5) * 1000));
    return () => timers.forEach(clearTimeout);
  }, [run, reduce]);

  const next = nextMilestone(list);
  const [picked, setPicked] = useState<string | null>(null);
  const selected = list.find((m) => m.id === picked) ?? next ?? list[0];
  const freshDelay = (id: string) => {
    const k = fresh.indexOf(id);
    return k === -1 || reduce ? null : UNLOCK_START + k * UNLOCK_STAGGER;
  };

  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box);
  const wide = width >= WIDE;
  const earned = completeIds.length;
  const calls = list.filter((m) => m.call);
  const callsOpen = calls.filter((m) => m.complete).length;
  const freshNames = list.filter((m) => fresh.includes(m.id) && m.complete).map((m) => m.title);

  return (
    <section data-tour="milestones" className="glass-card flex flex-col gap-5 rounded-3xl p-5 md:p-6" aria-labelledby="kamienie-h">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 id="kamienie-h" className="text-lg font-bold">Kamienie milowe</h2>
          <p className="text-sm text-white/70">
            8 modułów kursu „Dochodowe Studio”. Kamień zdobywasz, gdy zatwierdzisz kroki ścieżki i obejrzysz lekcje modułu.
            Za kamienie 2, 4 i 6 odblokujesz 30 minut rozmowy z Bartkiem na żywo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><Flag className="size-3.5 text-brand" aria-hidden="true" />{earned} z {list.length} zdobytych</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange/15 px-3 py-1.5 text-orange"><Video className="size-3.5" aria-hidden="true" />Rozmowy z Bartkiem: {callsOpen} z {calls.length}</span>
        </div>
      </header>

      <p className="sr-only" aria-live="polite">{freshNames.length ? `Odblokowano kamień milowy: ${freshNames.join(", ")}.` : ""}</p>

      <div ref={box} className="relative w-full" style={{ minHeight: width ? undefined : 260 }}>
        {width ? (wide ? <TrailWide list={list} width={width} selected={selected.id} onPick={setPicked} freshDelay={freshDelay} reduce={reduce} runN={run.n} />
          : <TrailTall list={list} width={width} selected={selected.id} onPick={setPicked} freshDelay={freshDelay} reduce={reduce} runN={run.n} />) : null}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <Panel key={selected.id} m={selected} />
      </AnimatePresence>

      <details className="text-sm text-white/75">
        <summary className="cursor-pointer select-none text-xs font-semibold text-white/60 hover:text-white">Pokaż dane w tabeli</summary>
        <div className="mt-2 overflow-x-auto">
          <DataTable head={["Kamień (moduł kursu)", "Kroki", "Lekcje", "Zadania", "Nagroda", "Stan"]}
            rows={list.map((m) => [`${m.no}. ${m.title}`, m.stepsTotal ? `${m.stepsDone}/${m.stepsTotal}` : "—", `${m.lessonsDone}/${m.lessonsTotal}`, `${m.done}/${m.total}`, m.call ? "30 min z Bartkiem" : "flaga na szlaku", stateLabel(m)])} />
        </div>
      </details>
    </section>
  );
}

type TrailProps = {
  list: MilestoneProgress[];
  width: number;
  selected: string;
  onPick: (id: string) => void;
  freshDelay: (id: string) => number | null;
  reduce: boolean;
  runN: number; // numer rundy odblokowań: nowa runda montuje węzeł od nowa i odpala animację
};

/** Odcinek szlaku między kamieniami: przebyty (oba zdobyte), w drodze (płynie do bieżącego) albo przed Tobą. */
function Segment({ d, a, b, draw }: { d: string; a: MilestoneProgress; b: MilestoneProgress; draw: number | null }) {
  const walked = a.complete && b.complete;
  const flowing = !walked && (b.current || (a.complete && b.done > 0));
  return (
    <>
      <path d={d} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth={5} strokeLinecap="round" strokeDasharray="1 11" />
      {walked ? (
        // przy odblokowaniu droga „dorysowuje się” do nowego kamienia
        <motion.path d={d} fill="none" stroke="var(--brand)" strokeWidth={5} strokeLinecap="round" opacity={0.85}
          initial={draw === null ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: (draw ?? 0) + 0.5, duration: 0.7, ease: "easeInOut" }} />
      ) : null}
      {flowing ? <path d={d} fill="none" stroke="var(--brand)" strokeWidth={3} strokeLinecap="round" strokeDasharray="8 10" className="dash-flow" opacity={0.75} /> : null}
    </>
  );
}

function TrailWide({ list, width, selected, onPick, freshDelay, reduce, runN }: TrailProps) {
  const col = width / list.length;
  const H = 268;
  const pos = list.map((_, i) => ({ x: col * (i + 0.5), y: i % 2 ? 158 : 88 }));
  const labelW = Math.min(col - 6, 150);
  return (
    <div className="relative" style={{ height: H }}>
      <svg className="absolute inset-0" width={width} height={H} aria-hidden="true">
        {pos.slice(1).map((p, i) => {
          const a = pos[i];
          const dx = p.x - a.x;
          const fd = [freshDelay(list[i].id), freshDelay(list[i + 1].id)].filter((x): x is number => x !== null);
          const draw = fd.length ? Math.max(...fd) : null;
          return <Segment key={`${i}-${draw === null ? "n" : runN}`} draw={draw} a={list[i]} b={list[i + 1]} d={`M${a.x} ${a.y} C${a.x + dx / 2} ${a.y} ${p.x - dx / 2} ${p.y} ${p.x} ${p.y}`} />;
        })}
      </svg>
      <ol className="absolute inset-0" aria-label="Szlak kamieni milowych">
        {list.map((m, i) => (
          <li key={m.id} className="absolute" style={{ left: pos[i].x, top: pos[i].y, width: 0, height: 0 }}>
            <Node key={freshDelay(m.id) === null ? "n" : `r${runN}`} m={m} selected={selected === m.id} onPick={onPick} delay={freshDelay(m.id)} reduce={reduce} bubble />
            <div className="absolute top-[42px] -translate-x-1/2 text-center" style={{ width: labelW }}>
              <Label m={m} align="center" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TrailTall({ list, width, selected, onPick, freshDelay, reduce, runN }: TrailProps) {
  const row = 104;
  const H = list.length * row;
  const pos = list.map((_, i) => ({ x: width * (i % 2 ? 0.7 : 0.3), y: row / 2 + i * row }));
  return (
    <div className="relative" style={{ height: H }}>
      <svg className="absolute inset-0" width={width} height={H} aria-hidden="true">
        {pos.slice(1).map((p, i) => {
          const a = pos[i];
          const dy = p.y - a.y;
          const fd = [freshDelay(list[i].id), freshDelay(list[i + 1].id)].filter((x): x is number => x !== null);
          const draw = fd.length ? Math.max(...fd) : null;
          return <Segment key={`${i}-${draw === null ? "n" : runN}`} draw={draw} a={list[i]} b={list[i + 1]} d={`M${a.x} ${a.y} C${a.x} ${a.y + dy / 2} ${p.x} ${p.y - dy / 2} ${p.x} ${p.y}`} />;
        })}
      </svg>
      <ol className="absolute inset-0" aria-label="Szlak kamieni milowych">
        {list.map((m, i) => {
          const left = i % 2 === 0;
          return (
            <li key={m.id} className="absolute" style={{ left: pos[i].x, top: pos[i].y, width: 0, height: 0 }}>
              <Node key={freshDelay(m.id) === null ? "n" : `r${runN}`} m={m} selected={selected === m.id} onPick={onPick} delay={freshDelay(m.id)} reduce={reduce} />
              <div className={`absolute top-0 -translate-y-1/2 ${left ? "left-[42px] text-left" : "right-[42px] text-right"}`} style={{ width: left ? width - pos[i].x - 46 : pos[i].x - 46 }}>
                <Label m={m} align={left ? "start" : "end"} chip />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Label({ m, align, chip }: { m: MilestoneProgress; align: "center" | "start" | "end"; chip?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 ${align === "center" ? "items-center" : align === "end" ? "items-end" : "items-start"}`}>
      {chip && m.current && !m.complete ? <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-brand-ink">Tu jesteś</span> : null}
      <span className="text-[13px] font-bold leading-tight"><span className="text-white/55">{m.no}.</span> {m.short}</span>
      <span className={`text-xs leading-tight ${m.complete ? "font-semibold text-brand" : "text-white/60"}`}>
        {m.complete ? "zdobyty" : `${m.done}/${m.total} zadań`}
      </span>
    </div>
  );
}

const RAYS = Array.from({ length: 10 }, (_, i) => i * 36);

function Node({ m, selected, onPick, delay, reduce, bubble }: { m: MilestoneProgress; selected: boolean; onPick: (id: string) => void; delay: number | null; reduce: boolean; bubble?: boolean }) {
  const Icon = ICON[m.icon];
  const r = 29;
  const c = 2 * Math.PI * r;
  const fresh = delay !== null && m.complete;
  const label = `Kamień ${m.no}: ${m.title}. ${stateLabel(m)}, ${m.done} z ${m.total} zadań.${m.call ? ` Nagroda: 30 minut z Bartkiem${m.complete ? ", odblokowana" : ""}.` : ""}${m.current && !m.complete ? " Tu jesteś." : ""}`;
  return (
    <div className="absolute -left-8 -top-8 size-16">
      {bubble && m.current && !m.complete ? (
        <motion.span
          className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-brand-ink shadow-lg after:absolute after:-bottom-1 after:left-1/2 after:size-2 after:-translate-x-1/2 after:rotate-45 after:bg-white"
          animate={reduce ? undefined : { y: [0, -4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} aria-hidden="true"
        >Tu jesteś</motion.span>
      ) : null}
      <motion.button
        type="button" onClick={() => { onPick(m.id); play("tap"); }} aria-pressed={selected} aria-controls="kamien-panel" aria-label={label}
        whileHover={reduce ? undefined : { scale: 1.08, y: -2 }} whileTap={reduce ? undefined : { scale: 0.94 }}
        className={`relative grid size-16 place-items-center rounded-full outline-offset-4 ${selected ? "ring-2 ring-white/70 ring-offset-4 ring-offset-[#0b170d]" : ""}`}
      >
        {/* pierścień postępu (zadania zrobione / wszystkie) */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx={32} cy={32} r={r} fill="none" stroke="var(--viz-track)" strokeWidth={4} />
          {m.done > 0 ? (
            <motion.circle cx={32} cy={32} r={r} fill="none" stroke="var(--brand)" strokeWidth={4} strokeLinecap="round" strokeDasharray={c}
              initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - m.pct / 100) }} transition={{ duration: reduce ? 0 : 1, ease: "easeOut", delay: fresh ? delay ?? 0 : 0.2 }} />
          ) : null}
        </svg>

        {m.complete ? (
          <motion.span
            className="relative grid size-[50px] place-items-center rounded-full bg-brand text-brand-ink shadow-[0_10px_30px_-8px_rgba(114,196,28,.7)]"
            initial={fresh ? { scale: 0.4, opacity: 0 } : false} animate={{ scale: fresh ? [0.4, 1.2, 1] : 1, opacity: 1 }}
            transition={{ delay: fresh ? (delay ?? 0) + 0.55 : 0, duration: 0.6, ease: "easeOut" }}
          >
            <Icon className="size-6" aria-hidden="true" />
          </motion.span>
        ) : (
          <span className={`grid size-[50px] place-items-center rounded-full ${m.done ? "bg-white/12 text-white" : "bg-white/[0.06] text-white/45"}`}>
            <Icon className="size-6" aria-hidden="true" />
          </span>
        )}

        {/* odblokowanie: kłódka trzęsie się i odpada, rozbłysk, fala */}
        {fresh ? (
          <>
            <motion.span className="absolute grid size-[50px] place-items-center rounded-full bg-[#1a2a1c] text-white/80"
              initial={{ opacity: 1 }} animate={{ opacity: [1, 1, 1, 0], scale: [1, 1.06, 1.06, 0.4], rotate: [0, -12, 12, 0], y: [0, 0, 0, -26] }}
              transition={{ delay: delay ?? 0, duration: 0.85, times: [0, 0.3, 0.6, 1] }} aria-hidden="true">
              <Lock className="size-6" />
            </motion.span>
            <motion.span className="pointer-events-none absolute inset-0 rounded-full border-2 border-brand" initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: [0, 0.9, 0], scale: [1, 1.9, 2.2] }} transition={{ delay: (delay ?? 0) + 0.6, duration: 0.9 }} aria-hidden="true" />
            {RAYS.map((deg) => (
              <span key={deg} className="pointer-events-none absolute inset-0" style={{ rotate: `${deg}deg` }} aria-hidden="true">
                <motion.span className="absolute left-1/2 top-0 h-3 w-1 -translate-x-1/2 rounded-full bg-orange" initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], y: [0, -16, -22] }} transition={{ delay: (delay ?? 0) + 0.6, duration: 0.8, ease: "easeOut" }} />
              </span>
            ))}
            <motion.span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-orange px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-950"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -6] }} transition={{ delay: (delay ?? 0) + 0.65, duration: 2.6, times: [0, 0.12, 0.85, 1] }} aria-hidden="true">
              Odblokowano!
            </motion.span>
          </>
        ) : null}

        {/* znaczki: zdobyty ✓ / nieruszony 🔒, nagroda 30 min z Bartkiem */}
        {m.complete ? (
          <motion.span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full bg-white text-brand-ink shadow" initial={fresh ? { scale: 0 } : false} animate={{ scale: 1 }}
            transition={{ delay: fresh ? (delay ?? 0) + 0.95 : 0, type: "spring", stiffness: 500, damping: 18 }} aria-hidden="true">
            <Check className="size-4" strokeWidth={3} />
          </motion.span>
        ) : !m.done ? (
          <span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full bg-[#1a2a1c] text-white/60 ring-1 ring-white/15" aria-hidden="true"><Lock className="size-3" /></span>
        ) : null}
        {m.call ? (
          <span className={`absolute -right-1 -top-1 grid size-6 place-items-center rounded-full ${m.complete ? "bg-orange text-neutral-950" : "bg-[#1a2a1c] text-orange ring-1 ring-orange/60"}`} aria-hidden="true">
            <Video className="size-3.5" />
          </span>
        ) : null}
      </motion.button>
    </div>
  );
}

function itemIcon(i: MilestoneItem) {
  if (i.done) return <Check className="size-4 text-brand" aria-hidden="true" />;
  if (i.kind === "step") return i.status === "locked" ? <Lock className="size-4 text-white/45" aria-hidden="true" /> : <PenLine className="size-4 text-white/70" aria-hidden="true" />;
  if (i.kind === "lesson") return i.video ? <PlayCircle className="size-4 text-white/70" aria-hidden="true" /> : <FileText className="size-4 text-white/70" aria-hidden="true" />;
  return <Store className="size-4 text-white/70" aria-hidden="true" />;
}

const STEP_STATE: Record<string, string> = { done: "zatwierdzony", draft: "w trakcie", available: "do zrobienia", locked: "później" };

function Panel({ m }: { m: MilestoneProgress }) {
  const Icon = ICON[m.icon];
  const steps = m.items.filter((i) => i.kind !== "lesson");
  const lessons = m.items.filter((i) => i.kind === "lesson");
  // Najpierw niezaliczone lekcje, potem zaliczone; pokazujemy do 6, resztę w bibliotece kursów.
  const shown = [...lessons.filter((l) => !l.done), ...lessons.filter((l) => l.done)].slice(0, 6);
  const todo = m.items.find((i) => !i.done && i.status !== "locked");
  return (
    <motion.div id="kamien-panel" role="region" aria-label={`Kamień ${m.no}: ${m.title}`}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
      className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)_minmax(0,0.8fr)]">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${m.complete ? "bg-brand text-brand-ink" : "bg-white/10 text-white"}`}><Icon className="size-6" aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white/60">Kamień {m.no} z 8 · moduł „{m.no}. {m.title}”</p>
            <h3 className="text-lg font-extrabold leading-tight">{m.title}</h3>
          </div>
        </div>
        <p className="text-sm text-white/80">{m.outcome}</p>
        {m.note ? <p className="text-xs text-white/60">{m.note}</p> : null}
        <div>
          <div className="mb-1 flex justify-between text-xs text-white/70"><span>{m.complete ? "Kamień zdobyty" : "Postęp"}</span><span className="tabular-nums">{m.done}/{m.total} zadań</span></div>
          <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "var(--viz-track)" }} role="progressbar" aria-valuenow={m.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Postęp kamienia ${m.title}`}>
            <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {steps.length ? (
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-white/55">{m.stepsTotal ? `Kroki ścieżki ${m.stepsDone}/${m.stepsTotal}` : "Zadanie"}</p>
            <ul className="flex flex-col gap-1">
              {steps.map((i) => (
                <li key={i.id}>
                  <Link href={i.href} title={i.no ? `${i.no}. ${i.title}` : i.title} className="flex min-h-9 items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-white/[0.06]">
                    {itemIcon(i)}
                    <span className="min-w-0 flex-1 truncate">{i.no ? `${i.no}. ` : ""}{i.title}</span>
                    {i.status ? <span className="shrink-0 text-xs text-white/55">{STEP_STATE[i.status]}</span> : <span className="shrink-0 text-xs text-white/55">{i.done ? "gotowe" : "do zrobienia"}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className={steps.length ? "" : "sm:col-span-2 lg:col-span-1 xl:col-span-2"}>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-white/55">Lekcje modułu {m.lessonsDone}/{m.lessonsTotal}</p>
          <ul className="flex flex-col gap-1">
            {shown.map((i) => (
              <li key={i.id}>
                <Link href={i.href} title={i.no ? `${i.no}. ${i.title}` : i.title} className="flex min-h-9 items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-white/[0.06]">
                  {itemIcon(i)}
                  <span className={`min-w-0 flex-1 truncate ${i.done ? "text-white/60" : ""}`}>{i.title}</span>
                  <span className="sr-only">{i.done ? "zaliczona" : "do obejrzenia"}</span>
                </Link>
              </li>
            ))}
          </ul>
          {lessons.length > shown.length ? (
            <Link href="/lekcje#kursy" className="mt-1 inline-flex min-h-9 items-center gap-1 px-2 text-xs font-semibold text-brand hover:underline">
              Wszystkie {lessons.length} lekcje w Kursach<ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {m.call ? (
          <div className={`flex flex-col gap-2 rounded-2xl border p-4 ${m.complete ? "border-orange/60 bg-orange/15" : "border-orange/35 bg-orange/[0.06]"}`}>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange"><Video className="size-4" aria-hidden="true" />Nagroda</p>
            <p className="font-bold">30 minut rozmowy z Bartkiem na żywo</p>
            {m.complete ? (
              CALENDAR ? (
                <a href={CALENDAR} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange px-4 text-sm font-bold text-neutral-950 hover:brightness-105">
                  <CalendarCheck className="size-4" aria-hidden="true" />Umów 30 min z Bartkiem
                </a>
              ) : <p className="text-sm text-white/80">Odblokowana. Link do kalendarza Bartka pojawi się tutaj.</p>
            ) : <p className="flex items-center gap-1.5 text-sm text-white/70"><Lock className="size-3.5" aria-hidden="true" />Odblokujesz ją po zdobyciu kamienia.</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60"><Flag className="size-4" aria-hidden="true" />Nagroda</p>
            <p className="font-bold">Flaga na szlaku Dochodowego Studia</p>
            <p className="text-sm text-white/70">{m.complete ? "Zdobyta. Moduł zamknięty." : "Zatknij ją, gdy zrobisz wszystkie zadania modułu."}</p>
          </div>
        )}
        {todo ? (
          <Link href={todo.href} className="inline-flex min-h-11 items-center justify-between gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink hover:brightness-105">
            <span className="truncate">Dalej: {todo.kind === "step" ? `krok ${todo.no}. ${todo.title}` : todo.title}</span><ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </motion.div>
  );
}
