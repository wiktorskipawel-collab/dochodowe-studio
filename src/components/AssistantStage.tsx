"use client";

// Bartek na środku ekranu. Wita po wejściu (raz dziennie i po każdym nowym zalogowaniu),
// wraca sam, gdy coś jest potrzebne (zatwierdzony dokument, przerwa w pracy, zagrożona seria),
// a po zamknięciu „odlatuje” do rogu — wspólny layoutId z awatarem w doku.
// Zawsze oznaczony jako asystent AI (AI Act, art. 50).
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Flame, Hand, PartyPopper, X } from "lucide-react";
import { helloKey, useJourney, type JourneyState } from "@/lib/store";
import { currentStep, stepStatuses } from "@/lib/journey";
import { activityByDay, dayKey, streakDays } from "@/lib/gamification";
import { isNudge, pace } from "@/lib/pace";
import { ASSISTANT_NAME, AssistantAvatar, AssistantDock } from "@/components/Assistant";

type Mood = "hello" | "cheer" | "nudge";
type Scene = { id: string; mood: Mood; lines: string[]; cta: { label: string; href: string } };

const streakKey = (email: string) => `mos:streak:${email}`;
const DAY = 86_400_000;

const firstName = (s: JourneyState) => (s.profile?.name ?? "").trim().split(/\s+/)[0] ?? "";

function nextMove(state: JourneyState): { line: string; cta: Scene["cta"] } {
  const step = currentStep(state);
  if (!step) return { line: "Cała ścieżka zrobiona. Teraz pilnujemy wyników i łapiemy okazje.", cta: { label: "Zobacz dokumenty", href: "/dokumenty" } };
  if (stepStatuses(state)[step.id] === "draft") {
    return { line: `Masz rozpoczęty krok „${step.title}”. Dokończmy go dziś, jesteś blisko.`, cta: { label: "Wracam do kroku", href: `/krok/${step.id}` } };
  }
  return { line: `Dziś na tapecie: „${step.title}”. ${step.goal}`, cta: { label: "Zaczynajmy", href: `/krok/${step.id}` } };
}

// Bartek mówi wprost, kiedy ktoś odpuszcza (prośba z rozmowy 2026-11-27).
// DO ZATWIERDZENIA: brzmienie — Bartek może podać własne, mocniejsze teksty; wtedy podmieniamy je tutaj.
function awayLines(days: number, hi: string) {
  if (days >= 14) return [`Halo${hi}. ${days} dni ciszy.`, "Tak się studia nie buduje. Nie pytam, co się stało. Pytam: kiedy wracasz? Najlepiej teraz, 15 minut."];
  if (days >= 7) return [`${days} dni bez ruchu${hi}.`, "W tym czasie klienci poszli do studia, które robi marketing. Wracamy dziś, jeden krok."];
  return [`Nie było Cię ${days} dni${hi}.`, "Bez wyrzutów, ale marketing studia sam się nie zrobi. Dziś wystarczy 15 minut."];
}

/** Krok w trakcie od tygodnia albo dłużej: ile dni temu ktoś go zaczął (null = nie dotyczy). */
function stuckDays(state: JourneyState, now: Date) {
  const step = currentStep(state);
  if (!step || stepStatuses(state)[step.id] !== "draft") return null;
  const touches = state.events.filter((e) => e.ref === step.id || e.ref === step.docId).map((e) => Date.parse(e.at)).filter(Boolean);
  if (!touches.length) return null;
  const days = Math.floor((now.getTime() - Math.min(...touches)) / DAY);
  return days >= 7 ? { step, days } : null;
}

function welcomeScene(state: JourneyState, opts: { firstVisit?: boolean; summoned?: boolean } = {}): Scene {
  const now = new Date();
  const name = firstName(state);
  const hi = name ? `, ${name}` : "";
  const last = state.events.reduce((m, e) => Math.max(m, Date.parse(e.at) || 0), 0);
  const away = last ? Math.floor((now.getTime() - last) / DAY) : 0;
  const streak = streakDays(state.events, now);
  const activeToday = (activityByDay(state.events).get(dayKey(now)) ?? 0) > 0;
  const move = nextMove(state);
  const lines: string[] = [];
  let mood: Mood = "hello";
  let cta = move.cta;
  // Tempo do celu z ankiety (src/lib/pace.ts): przy wejściu Bartek chwali albo rozlicza, coraz mocniej.
  const tempo = opts.firstVisit || opts.summoned ? null : pace(state, now);
  const paced = !!tempo && (isNudge(tempo.level) || tempo.level === "brawo");

  if (opts.summoned) lines.push(`Jestem${hi}. Zobaczmy, co dalej.`);
  else if (opts.firstVisit) lines.push(`Cześć${hi}! Tu ${ASSISTANT_NAME}, a dokładniej mój asystent AI.`, "Dobrze, że jesteś. Prowadzę Cię krok po kroku, a Ty zatwierdzasz efekty.");
  else if (tempo && paced) {
    mood = tempo.level === "brawo" ? "cheer" : "nudge";
    const [first, ...rest] = tempo.lines;
    lines.push(name ? `${name}, ${first.charAt(0).toLowerCase()}${first.slice(1)}` : first, ...rest);
    cta = { label: tempo.cta, href: move.cta.href };
  } else if (away >= 3) {
    mood = "nudge";
    lines.push(...awayLines(away, hi));
  } else lines.push(`Cześć${hi}! Dobrze, że jesteś.`);

  const stuck = opts.firstVisit ? null : stuckDays(state, now);
  if (stuck) {
    mood = "nudge";
    lines.push(`Siedzisz nad krokiem „${stuck.step.title}” od ${stuck.days} dni. Co blokuje? Napisz mi wprost, rozbijemy to na mniejsze kawałki i dziś domkniemy.`);
  } else lines.push(move.line);
  if (streak >= 2 && !activeToday) {
    mood = "nudge";
    lines.push(`Masz serię ${streak} dni. Jedno działanie dziś i jej nie tracisz.`);
  } else if (streak >= 2 && !paced) lines.push(`Seria: ${streak} dni z rzędu. Tak się buduje studio.`);

  return { id: `hello-${opts.summoned ? "on-demand" : "entry"}-${now.getTime()}`, mood, lines, cta };
}

function streakScene(state: JourneyState, streak: number): Scene {
  const name = firstName(state);
  const move = nextMove(state);
  return {
    id: `streak-${Date.now()}`,
    mood: "nudge",
    lines: [`${name ? `${name}, s` : "S"}eria ${streak} dni jest zagrożona.`, "Dziś jeszcze nic nie ruszyło. Wystarczy jedno działanie: lekcja, rozmowa albo poprawka dokumentu.", move.line],
    cta: move.cta,
  };
}

/** Pisanie linijka po linijce, z pauzą po przecinku i kropce. */
function useSpeech(lines: string[]) {
  const reduce = useReducedMotion();
  const [pos, setPos] = useState({ line: 0, n: 0 });
  const done = !!reduce || pos.line >= lines.length;
  useEffect(() => {
    if (done) return;
    const text = lines[pos.line];
    const ch = text[pos.n - 1];
    const t =
      pos.n < text.length
        ? setTimeout(() => setPos({ line: pos.line, n: pos.n + 1 }), ch === "," || ch === "." || ch === "!" ? 170 : 19)
        : setTimeout(() => setPos({ line: pos.line + 1, n: 0 }), 420);
    return () => clearTimeout(t);
  }, [pos, done, lines]);
  return { line: done ? lines.length : pos.line, n: pos.n, talking: !done, skip: () => setPos({ line: lines.length, n: 0 }) };
}

/** Słupki „mówi” obok podpisu. */
function VoiceBars({ on }: { on: boolean }) {
  return (
    <span aria-hidden="true" className="inline-flex h-3 items-end gap-[2px]">
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-brand"
          animate={on ? { height: ["30%", "100%", "45%", "85%", "30%"] } : { height: "30%" }}
          transition={on ? { duration: 0.8, repeat: Infinity, delay: i * 0.11, ease: "easeInOut" } : { duration: 0.3 }}
        />
      ))}
    </span>
  );
}

const MOOD_ICON = { hello: Hand, cheer: PartyPopper, nudge: Flame } as const;

function Stage({ scene, onClose }: { scene: Scene; onClose: () => void }) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const descId = useId();
  const { line, n, talking, skip } = useSpeech(scene.lines);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const Icon = MOOD_ICON[scene.mood];

  useEffect(() => {
    ctaRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <button type="button" tabIndex={-1} aria-label="Zamknij" onClick={onClose} className="absolute inset-0 cursor-default bg-[#02100b]/65 backdrop-blur-md" />

      <div role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId} className="relative w-full max-w-md pt-[104px]">
        {/* Bartek: przylatuje z rogu (layoutId) i unosi się nad kartą */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center">
          <motion.div layoutId="bartek-avatar" className="relative rounded-full" transition={{ type: "spring", stiffness: 210, damping: 24 }}>
            <motion.span
              aria-hidden="true"
              className="absolute -inset-3 rounded-full opacity-60 blur-lg"
              style={{ background: "conic-gradient(from 0deg, #72c41c, #ffffff, #dd9933, #1a7f2a, #72c41c)" }}
              animate={reduce ? undefined : { rotate: 360 }}
              transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
            />
            <motion.div animate={reduce ? undefined : { y: [0, -7, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}>
              <AssistantAvatar size={136} talking={talking} />
            </motion.div>
            <motion.span
              aria-hidden="true"
              className="absolute -right-3 top-1 grid size-12 place-items-center rounded-full bg-brand text-brand-ink shadow-[0_8px_24px_-6px_rgba(114,196,28,.5)]"
              style={{ originX: 0.7, originY: 0.9 }}
              initial={{ scale: 0, rotate: -40 }}
              animate={reduce ? { scale: 1, rotate: 0 } : { scale: 1, rotate: scene.mood === "hello" ? [0, 22, -10, 22, -6, 0] : [0, -12, 12, 0] }}
              transition={{ scale: { delay: 0.35, type: "spring", stiffness: 400, damping: 14 }, rotate: { delay: 0.55, duration: 1.3, repeat: 1, repeatDelay: 0.5 } }}
            >
              <Icon className="size-6" />
            </motion.span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.08 }}
          className="glass-strong relative rounded-3xl px-6 pb-6 pt-14"
          style={{ boxShadow: "0 0 0 1px rgba(114,196,28,.35), 0 30px 80px -30px rgba(0,0,0,.85), 0 0 70px -25px rgba(114,196,28,.4)" }}
        >
          <button type="button" onClick={onClose} aria-label="Zamknij" className="absolute right-2 top-2 grid size-11 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white">
            <X className="size-4" aria-hidden="true" />
          </button>

          <p id={titleId} className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            {ASSISTANT_NAME} · asystent AI <VoiceBars on={talking} />
          </p>
          <p id={descId} className="sr-only">{scene.lines.join(" ")}</p>

          {/* Pełny tekst jest niewidoczny pod spodem, więc karta nie skacze podczas pisania. Kliknięcie = pokaż od razu. */}
          <div aria-hidden="true" onClick={talking ? skip : undefined} className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-white/85">
            {scene.lines.map((l, i) => (
              <p key={i} className={i === 0 ? "relative text-lg font-bold leading-snug text-white" : "relative"}>
                <span className="invisible">{l}</span>
                <span className="absolute inset-0">
                  {i < line ? l : i === line ? l.slice(0, n) : ""}
                  {i === line && talking ? <span className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-[3px] animate-pulse bg-brand" /> : null}
                </span>
              </p>
            ))}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
              Później
            </button>
            <motion.div whileHover={reduce ? undefined : { y: -3 }} whileTap={{ scale: 0.97 }}>
              <Link
                ref={ctaRef}
                href={scene.cta.href}
                onClick={onClose}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 font-bold text-brand-ink shadow-[0_12px_30px_-12px_rgba(114,196,28,.55)] hover:brightness-110 sm:w-auto"
              >
                {scene.cta.label}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/** Asystent na ekranie: scena na środku + dok w rogu. Montowany w układzie aplikacji. */
export function AssistantHost() {
  const { ready, state } = useJourney();
  const [scene, setScene] = useState<Scene | null>(null);
  const email = state.profile?.email ?? "";
  const latest = useRef(state);

  useEffect(() => {
    latest.current = state;
  });

  // Wejście do aplikacji: powitanie raz dziennie (i po każdym zalogowaniu), a wieczorem — przypomnienie o serii.
  useEffect(() => {
    if (!ready || !email) return;
    const today = dayKey(new Date());
    const last = localStorage.getItem(helloKey(email));
    // Pierwsze wejście: zamiast tego powitania jest okienko z wideo i przewodnik po pulpicie (Onboarding.tsx).
    if (!latest.current.onboarded && !latest.current.demo) {
      localStorage.setItem(helloKey(email), today);
      return;
    }
    if (last !== today) {
      const t = setTimeout(() => {
        localStorage.setItem(helloKey(email), today);
        setScene(welcomeScene(latest.current, { firstVisit: last === null }));
      }, 650);
      return () => clearTimeout(t);
    }
    const s = latest.current;
    const streak = streakDays(s.events);
    const activeToday = (activityByDay(s.events).get(today) ?? 0) > 0;
    if (new Date().getHours() >= 18 && streak >= 2 && !activeToday && localStorage.getItem(streakKey(email)) !== today) {
      const t = setTimeout(() => {
        localStorage.setItem(streakKey(email), today);
        setScene(streakScene(latest.current, streak));
      }, 650);
      return () => clearTimeout(t);
    }
  }, [ready, email]);

  // Zatwierdzony dokument: gratulacje i następny krok pokazuje ekran fanfar (Celebration.tsx).

  const close = useCallback(() => setScene(null), []);
  const summon = useCallback(() => setScene(welcomeScene(latest.current, { summoned: true })), []);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>{scene ? <Stage key={scene.id} scene={scene} onClose={close} /> : null}</AnimatePresence>
      <AssistantDock hidden={!!scene} onSummon={summon} />
    </MotionConfig>
  );
}
