"use client";

// Pierwsze wejście na pulpit: okienko z wideo powitalnym Bartka, potem przewodnik po pulpicie
// (podświetlony element + dymek „Dalej”), jak w aplikacjach typu Notion czy Linear (prośba Pawła 2026-11-27).
// Całe powitanie można odtworzyć z menu konta („Powitanie i przewodnik”).
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Compass, PlayCircle, Route, FileDown, MessageCircle, X } from "lucide-react";
import { useJourney } from "@/lib/store";
import { WelcomeIntro } from "@/components/WelcomeIntro";
import { currentStep } from "@/lib/journey";

const WELCOME_VIDEO = process.env.NEXT_PUBLIC_WIDEO_POWITALNE ?? "";
const TOUR_FLAG = "ds:tour";

/** Włącz przewodnik (np. z menu konta). Pulpit podchwyci to od razu albo po przejściu na „/”. */
export function startTour() {
  try {
    sessionStorage.setItem(TOUR_FLAG, "1");
  } catch {
    // bez sessionStorage zadziała tylko zdarzenie poniżej
  }
  window.dispatchEvent(new Event(TOUR_FLAG));
}

type TourStep = { target?: string; title: string; body: string; side?: "bottom" | "right" };

// DO ZATWIERDZENIA (Bartek): teksty przewodnika.
const TOUR: TourStep[] = [
  { target: "hero", title: "Tu mówi do Ciebie Bartek", body: "Asystent AI Bartka. Na pulpicie zawsze podpowie, co dziś zrobić. Kiedy chcesz pogadać, kliknij jego twarz w rogu ekranu." },
  { target: "next-step", title: "Twój następny krok", body: "Jeden klik i jesteś w środku: krótka lekcja, rozmowa z Bartkiem i gotowy dokument." },
  { target: "progress", title: "Postęp, poziom i seria", body: "Za każdy krok dostajesz XP i odznaki. Seria dni pilnuje, żeby nie stanąć w miejscu." },
  { target: "milestones", title: "Kamienie milowe", body: "Zamknij etap, a odblokujesz 30 minut rozmowy z Bartkiem na żywo." },
  { target: "nav-path", title: "Mapa całej ścieżki", body: "„Twoja ścieżka” pokazuje wszystkie etapy i kroki na jednej mapie. Lekcje masz zebrane w jednym miejscu.", side: "right" },
  { target: "nav-marketing", title: "Mój marketing", body: "Tu lądują zatwierdzone dokumenty: DNA studia, awatar, oferta i strategia. Każdy pobierzesz jednym kliknięciem.", side: "right" },
  { target: "nav-actions", title: "Szybkie akcje", body: "Kiedy podstawy są gotowe: nowy awatar, scenariusz VSL, rolki i analiza reklam.", side: "right" },
  { title: "To wszystko. Zaczynamy?", body: "" },
];

export function Onboarding() {
  const { ready, state, setOnboarded } = useJourney();
  const [tour, setTour] = useState(false);
  const [welcomeClosed, setWelcomeClosed] = useState(false);
  const [replay, setReplay] = useState(false); // ponownie z menu konta (też w demo, np. na pokaz)
  const showWelcome = ready && !!state.profile && (replay || (!state.demo && !state.onboarded)) && !welcomeClosed && !tour;

  // ponowne włączenie: całe powitanie (intro → wideo → przewodnik) z menu konta
  useEffect(() => {
    if (!ready) return;
    const open = () => {
      try {
        if (sessionStorage.getItem(TOUR_FLAG) !== "1") return;
        sessionStorage.removeItem(TOUR_FLAG);
      } catch {
        // brak sessionStorage: otwieramy po samym zdarzeniu
      }
      setTour(false);
      setWelcomeClosed(false);
      setReplay(true);
    };
    const t = setTimeout(open, 400);
    window.addEventListener(TOUR_FLAG, open);
    return () => {
      clearTimeout(t);
      window.removeEventListener(TOUR_FLAG, open);
    };
  }, [ready]);

  const finish = useCallback(() => {
    setTour(false);
    setReplay(false);
    setWelcomeClosed(true);
    setOnboarded();
  }, [setOnboarded]);

  if (!ready) return null;
  return createPortal(
    <AnimatePresence>
      {showWelcome ? (
        <Welcome key="welcome" name={state.profile?.name ?? ""} onTour={() => { setWelcomeClosed(true); setTour(true); }} onSkip={finish} />
      ) : null}
      {tour ? <Tour key="tour" onDone={finish} /> : null}
    </AnimatePresence>,
    document.body,
  );
}

function Welcome({ name, onTour, onSkip }: { name: string; onTour: () => void; onSkip: () => void }) {
  const titleId = useId();
  const primary = useRef<HTMLButtonElement>(null);
  const videoCta = useRef<HTMLButtonElement>(null);
  const [screen, setScreen] = useState<"intro" | "video">("intro");
  const first = name.trim().split(/\s+/)[0];

  useEffect(() => {
    if (screen === "video") videoCta.current?.focus({ preventScroll: true });
  }, [screen]);

  useEffect(() => {
    primary.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onSkip();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onSkip]);

  return (
    <motion.div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div aria-hidden="true" className="absolute inset-0 bg-[#020904]/75 backdrop-blur-md" />
      <motion.div role="dialog" aria-modal="true" aria-labelledby={titleId}
        initial={{ opacity: 0, y: 40, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        className="glass-strong relative w-full max-w-3xl overflow-hidden rounded-3xl bg-[#07130a]/95 p-5 md:p-7"
        style={{ boxShadow: "0 0 0 1px rgba(114,196,28,.35), 0 40px 100px -30px rgba(0,0,0,.9), 0 0 90px -30px rgba(114,196,28,.45)" }}>
        <button type="button" onClick={onSkip} aria-label="Zamknij" className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white">
          <X className="size-4" aria-hidden="true" />
        </button>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Witaj w Dochodowym Studiu{first ? `, ${first}` : ""}</p>
        <AnimatePresence mode="wait" initial={false}>
          {screen === "intro" ? (
            <motion.div key="intro" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}>
              <h2 id={titleId} className="sr-only">Witaj w Dochodowym Studiu</h2>
              <WelcomeIntro />
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button type="button" onClick={onSkip} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">Pomiń</button>
                <button ref={primary} type="button" onClick={() => setScreen("video")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 font-bold text-brand-ink shadow-[0_12px_30px_-12px_rgba(114,196,28,.6)] hover:brightness-110">
                  Dalej<ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="video" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 260, damping: 28 }}>
            <h2 id={titleId} className="mt-1 pr-10 text-2xl font-extrabold md:text-3xl">{first ? `${first}, zanim zaczniesz: ` : "Zanim zaczniesz: "}2 minuty od Bartka</h2>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black">
              {WELCOME_VIDEO ? (
                <iframe src={WELCOME_VIDEO} title="Wideo powitalne od Bartka" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" className="aspect-video w-full" />
              ) : (
                // DO ZATWIERDZENIA: nagranie powitalne Bartka (adres w NEXT_PUBLIC_WIDEO_POWITALNE)
                <div className="relative grid aspect-video w-full place-items-center bg-[radial-gradient(60%_80%_at_50%_40%,rgba(46,140,30,.35),transparent_70%),linear-gradient(180deg,#0b1a0d,#030805)] p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="relative grid size-20 place-items-center rounded-full bg-brand text-brand-ink shadow-[0_0_60px_-10px_rgba(114,196,28,.8)]">
                      <motion.span aria-hidden="true" className="absolute inset-0 rounded-full border-2 border-brand" animate={{ scale: [1, 1.6], opacity: [0.8, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
                      <PlayCircle className="size-10" aria-hidden="true" />
                    </span>
                    <p className="max-w-md text-sm text-white/75">Tu będzie wideo od Bartka: kim jest, jak działa ścieżka i czego od Ciebie oczekuje. Nagranie w przygotowaniu.</p>
                  </div>
                </div>
              )}
            </div>

            <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              {[
                { icon: Route, text: "Ścieżka krok po kroku, od materiałów do wyników" },
                { icon: MessageCircle, text: "Bartek prowadzi każdy krok i zadaje pytania" },
                { icon: FileDown, text: "Gotowe dokumenty do pobrania" },
              ].map((b, i) => (
                <motion.li key={b.text} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.08 }}
                  className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <b.icon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />{b.text}
                </motion.li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button type="button" onClick={onSkip} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">Pomiń, poradzę sobie</button>
              <button ref={videoCta} type="button" onClick={onTour}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 font-bold text-brand-ink shadow-[0_12px_30px_-12px_rgba(114,196,28,.6)] hover:brightness-110">
                <Compass className="size-4" aria-hidden="true" />Pokaż mi, jak to działa
              </button>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

type Box = { top: number; left: number; width: number; height: number };
const PAD = 8;

const visible = (el: Element | null) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth;
};

function Tour({ onDone }: { onDone: () => void }) {
  const { state } = useJourney();
  const reduce = useReducedMotion();
  const titleId = useId();
  const next = useRef<HTMLButtonElement>(null);
  // kroki, których element jest teraz na ekranie (np. bez menu bocznego na telefonie)
  const [steps] = useState(() => TOUR.filter((t) => !t.target || visible(document.querySelector(`[data-tour="${t.target}"]`))));
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const step = steps[i];
  const cur = currentStep(state);

  // podświetlenie: przewiń do elementu i śledź jego położenie
  useEffect(() => {
    let frame = 0;
    const el = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!el) return setBox(null);
        const r = el.getBoundingClientRect();
        setBox({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
      });
    };
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < 80 || r.bottom > window.innerHeight - 40) el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    }
    measure();
    const t = setTimeout(measure, 450);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, reduce]);

  useEffect(() => {
    next.current?.focus({ preventScroll: true });
  }, [i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone, steps.length]);

  const last = i === steps.length - 1;
  const spot = step.target ? box : null;

  // dymek: pod elementem, nad nim albo z prawej (menu boczne)
  const W = 340;
  const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  // `translate` (osobna właściwość CSS) nie gryzie się z animacją y z Motion
  let card: React.CSSProperties = { left: "50%", top: "50%", translate: "-50% -50%" };
  if (spot) {
    const clampX = (x: number) => Math.max(12, Math.min(x, vw - Math.min(W, vw - 24) - 12));
    if (step.side === "right" && spot.left + spot.width + W + 24 < vw) card = { left: spot.left + spot.width + 14, top: Math.max(12, Math.min(spot.top, vh - 260)) };
    else if (vh - (spot.top + spot.height) > 230) card = { left: clampX(spot.left), top: spot.top + spot.height + 14 };
    else if (spot.top > 230) card = { left: clampX(spot.left), bottom: vh - spot.top + 14 };
    else card = { left: clampX(spot.left), top: Math.max(12, vh - 260) };
  }

  return (
    <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* blokada klikania w stronę podczas przewodnika */}
      <div aria-hidden="true" className="absolute inset-0" onClick={(e) => e.stopPropagation()} style={spot ? undefined : { background: "rgba(2,9,4,.72)", backdropFilter: "blur(4px)" }} />
      {spot ? (
        <motion.div aria-hidden="true" className="pointer-events-none absolute rounded-2xl"
          initial={false}
          animate={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
          style={{ boxShadow: "0 0 0 9999px rgba(2,9,4,.74), 0 0 0 2px #72c41c, 0 0 40px 6px rgba(114,196,28,.35)" }} />
      ) : null}

      <motion.div key={i} role="dialog" aria-modal="true" aria-labelledby={titleId}
        initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 320, damping: 28, delay: reduce ? 0 : 0.12 }}
        className="absolute w-[min(340px,calc(100vw-24px))] rounded-2xl border border-white/10 bg-[#0b1a0e] p-5"
        style={{ ...card, boxShadow: "0 0 0 1px rgba(114,196,28,.35), 0 30px 70px -25px rgba(0,0,0,.9)" }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Przewodnik · {i + 1} z {steps.length}</p>
        <h2 id={titleId} className="mt-1 text-lg font-extrabold leading-snug">{step.title}</h2>
        {last ? (
          <p className="mt-1.5 text-sm text-white/75">{cur ? `Pierwszy ruch: krok ${cur.no}, „${cur.title}”. Bartek już czeka.` : "Ścieżka jest gotowa. Działaj na swoich dokumentach."}</p>
        ) : (
          <p className="mt-1.5 text-sm text-white/75">{step.body}</p>
        )}
        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
          {steps.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-brand" : k < i ? "w-1.5 bg-brand/60" : "w-1.5 bg-white/20"}`} />)}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          {i > 0 ? (
            <button type="button" onClick={() => setI(i - 1)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
              <ArrowLeft className="size-4" aria-hidden="true" />Wstecz
            </button>
          ) : (
            <button type="button" onClick={onDone} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white">Pomiń</button>
          )}
          {last && cur ? (
            <Link href={`/krok/${cur.id}`} onClick={onDone} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink hover:brightness-110">
              Zaczynam<ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
          <button ref={next} type="button" onClick={() => (last ? onDone() : setI(i + 1))}
            className={last && cur ? "min-h-11 rounded-xl px-3 text-sm font-semibold text-white/70 hover:bg-white/10" : "inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink hover:brightness-110"}>
            {last ? (cur ? "Zostaję na pulpicie" : "Gotowe") : "Dalej"}{last ? null : <ArrowRight className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
