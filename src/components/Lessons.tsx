"use client";

// Lekcje jak w aplikacji do nauki: duża „następna lekcja”, filtry z płynnym przestawianiem kart (GSAP Flip),
// karty wjeżdżające przy przewijaniu (ScrollTrigger) i odtwarzacz, który „wyrasta” z karty (wspólny element Flip).
// Trzy zakładki u góry (adres: /lekcje, /lekcje#kursy, /lekcje#zespol):
// - „Twoja ścieżka”: lekcje kroków (src/lib/journey.ts), z XP. Lekcja zablokowanego kroku odblokowuje się razem z krokiem.
// - „Kursy Bartka”: cała biblioteka ze Skool (src/lib/kursy.ts): kurs → moduły → lekcje, filtr modułów na GSAP Flip.
// - „Dla trenerów zespołu”: moduły do szkolenia trenerów (src/lib/biblioteka.ts).
// W bibliotekach wszystko jest otwarte od razu. „Obejrzane” daje XP (markWatched) i nie blokuje ścieżki; lekcja, która jest też
// w kroku, ma z nim wspólne „obejrzane” (pole ref w lekcji kroku). Wideo (iframe Loom/YouTube) ładuje się tylko w otwartym
// odtwarzaczu, nigdy w kartach. Lekcja bez wideo ma przycisk „Otwórz na Skool”.
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  Play, Check, Lock, X, ArrowRight, Zap, Flame, PlayCircle, Route, Users, HeartHandshake, Brain, Dumbbell, UsersRound, Sunrise,
  ListChecks, BookOpen, Library, ExternalLink, Paperclip, Wrench, Clapperboard, MessagesSquare, Building2, Megaphone, Store,
  type LucideIcon,
} from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS, allLessons, stepStatuses } from "@/lib/journey";
import { KURSY, LEKCJE, WSZYSTKIE_LEKCJE, zrodlo, type Kurs, type LekcjaKursu } from "@/lib/kursy";
import { BIBLIOTEKA, MODULY_TRENERA } from "@/lib/biblioteka";
import { XP, streakDays } from "@/lib/gamification";
import { play } from "@/lib/sfx";
import { Ring } from "@/components/Charts";
import { StepIcon } from "@/components/PathTerrain";
import type { Lesson, Step } from "@/lib/journey-types";

gsap.registerPlugin(Flip, ScrollTrigger, useGSAP);

type Filter = "all" | "todo" | "done" | "locked";
type Item = { lesson: Lesson; no: number; step: Step; phase: number; status: "done" | "open" | "locked" };
type Widok = "sciezka" | "kursy" | "zespol";

const TINT = ["#2e8f22", "#4fb52a", "#79cf3e", "#dd9933", "#c0882e", "#72c41c"];
const PHASES = [...new Set(STEPS.map((s) => s.phase))];
const IFRAME_ALLOW = "autoplay; encrypted-media; picture-in-picture; fullscreen";

/** 1 lekcja, 2 lekcje, 5 lekcji */
function odmiana(n: number, jeden: string, kilka: string, wiele: string) {
  const d = n % 10;
  const s = n % 100;
  if (n === 1) return jeden;
  return d >= 2 && d <= 4 && (s < 12 || s > 14) ? kilka : wiele;
}
const lekcji = (n: number) => `${n} ${odmiana(n, "lekcja", "lekcje", "lekcji")}`;

const ZAKLADKI: [Widok, string, string, LucideIcon][] = [
  ["sciezka", "Twoja ścieżka", `${lekcji(allLessons().length)} do kroków, z XP`, Route],
  ["kursy", "Kursy Bartka", `${lekcji(WSZYSTKIE_LEKCJE.length)} z ${KURSY.length} kursów`, Library],
  ["zespol", "Dla trenerów zespołu", `${lekcji(BIBLIOTEKA.length)}, bez blokad`, Users],
];
const widokZAdresu = (hash: string): Widok => (hash === "#zespol" ? "zespol" : hash === "#kursy" ? "kursy" : "sciezka");

export function Lessons() {
  const { ready } = useJourney();
  const [widok, setWidok] = useState<Widok>("sciezka");

  // /lekcje#kursy = od razu kursy Bartka, /lekcje#zespol = biblioteka zespołu (np. link z menu)
  useEffect(() => {
    const czytaj = () => setWidok(widokZAdresu(window.location.hash));
    czytaj();
    window.addEventListener("hashchange", czytaj);
    return () => window.removeEventListener("hashchange", czytaj);
  }, []);

  const wybierz = (w: Widok) => {
    if (w === widok) return;
    setWidok(w);
    play("tap");
    window.history.replaceState(null, "", w === "sciezka" ? window.location.pathname + window.location.search : `#${w}`);
  };

  if (!ready) return <p className="text-white/70">Wczytuję…</p>;
  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Rodzaj lekcji" className="glass-card grid w-full max-w-3xl grid-cols-3 gap-1 rounded-2xl p-1.5">
        {ZAKLADKI.map(([w, label, sub, Icon]) => (
          <button key={w} type="button" role="tab" id={`lekcje-tab-${w}`} aria-selected={widok === w} aria-controls="lekcje-widok" onClick={() => wybierz(w)}
            className={`relative flex min-h-14 items-center gap-2 rounded-xl px-2.5 text-left md:gap-3 md:px-4 ${widok === w ? "text-brand-ink" : "text-white/75 hover:bg-white/[0.06] hover:text-white"}`}>
            {widok === w ? <motion.span layoutId="lekcje-widok-pill" className="absolute inset-0 rounded-xl bg-brand shadow-[0_6px_24px_-8px_rgba(114,196,28,.7)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} /> : null}
            <Icon className="relative hidden size-5 shrink-0 sm:block" aria-hidden="true" />
            <span className="relative min-w-0">
              <span className="block text-sm font-extrabold leading-tight md:text-base">{label}</span>
              <span className={`hidden truncate text-xs sm:block ${widok === w ? "text-brand-ink/75" : "text-white/50"}`}>{sub}</span>
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={widok} id="lekcje-widok" role="tabpanel" aria-labelledby={`lekcje-tab-${widok}`}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }} onAnimationComplete={() => ScrollTrigger.refresh()}>
          {widok === "sciezka" ? <SciezkaLekcje /> : widok === "kursy" ? <KursyBartka /> : <ZespolTrenerow />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ——— Wspólne drobiazgi ———

function SkoolLink({ href, strong }: { href: string; strong?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={`inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 font-semibold ${strong ? "bg-white text-neutral-950 hover:bg-white/90" : "border border-white/20 hover:bg-white/10"}`}>
      Otwórz na Skool<ExternalLink className="size-4" aria-hidden="true" /><span className="sr-only"> (w nowej karcie)</span>
    </a>
  );
}

function Zalaczniki({ list }: { list: string[] }) {
  return (
    <div className="flex max-w-3xl flex-wrap items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-1.5 font-semibold text-white/70"><Paperclip className="size-4" aria-hidden="true" />Materiały na Skool:</span>
      {list.map((a) => <span key={a} className="rounded-full border border-white/15 px-2.5 py-0.5 text-white/75">{a}</span>)}
    </div>
  );
}

/** Siatka „jak na mapie” w tle okładek. */
function PosterGrid() {
  return <div aria-hidden="true" className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,transparent,#000_60%)] [transform:perspective(400px)_rotateX(35deg)_scale(1.6)] [transform-origin:50%_100%]" />;
}

function CenterIcon({ video, big }: { video: boolean; big?: boolean }) {
  const Icon = video ? Play : ExternalLink;
  return (
    <span className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-neutral-950 shadow-[0_10px_40px_-5px_rgba(0,0,0,.6)] transition-transform duration-300 group-hover:scale-110 ${big ? "size-20" : "size-14"}`}>
      <Icon className={`${big ? "size-8" : "size-6"} ${video ? "translate-x-0.5 fill-current" : ""}`} aria-hidden="true" />
    </span>
  );
}

/** Logika odtwarzacza „wyrastającego” z karty: wejście (Flip), zamknięcie, Escape, blokada przewijania strony. */
function usePlayer(id: string, enterRef: React.RefObject<Flip.FlipState | null>, onClose: (state: Flip.FlipState, id: string) => void, focus: React.RefObject<HTMLButtonElement | null>) {
  const thumb = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const st = enterRef.current;
    enterRef.current = null;
    if (st && thumb.current && !reduce) Flip.from(st, { targets: thumb.current, duration: 0.75, ease: "expo.inOut", scale: true, zIndex: 90 });
    gsap.fromTo(shade.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.fromTo(panel.current?.children ?? [], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, delay: reduce ? 0 : 0.45, ease: "power3.out" });
    focus.current?.focus({ preventScroll: true });
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [enterRef, focus]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    gsap.to([shade.current, panel.current], {
      opacity: 0, duration: 0.2, onComplete: () => {
        if (thumb.current) onClose(Flip.getState(thumb.current), id);
      },
    });
  }, [onClose, id]);

  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return { thumb, shade, panel, close };
}

/** Filtr z GSAP Flip + odtwarzacz wyrastający z miniatury karty i wracający na miejsce. */
function useFlipLibrary<F extends string>(initial: F, cardSelector: string, flipPrefix: string) {
  const [filter, setFilter] = useState<F>(initial);
  const [open, setOpen] = useState<string | null>(null);
  const grid = useRef<HTMLUListElement>(null);
  const flipFilter = useRef<Flip.FlipState | null>(null);
  const flipOpen = useRef<Flip.FlipState | null>(null);
  const flipClose = useRef<{ state: Flip.FlipState; id: string } | null>(null);
  const source = useRef<Element | null>(null);

  // filtr: zapamiętaj ułożenie, zmień, a GSAP Flip płynnie przestawi karty
  const choose = (f: F) => {
    if (f === filter || !grid.current) return;
    flipFilter.current = Flip.getState(grid.current.querySelectorAll(cardSelector), { props: "opacity" });
    setFilter(f);
    play("tap");
  };
  useLayoutEffect(() => {
    const st = flipFilter.current;
    if (!st) return;
    flipFilter.current = null;
    Flip.from(st, {
      duration: 0.6,
      ease: "power3.inOut",
      scale: true,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.8, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "back.out(1.7)" }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.8, duration: 0.35, ease: "power2.in" }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }, [filter]);

  const openLesson = (id: string, from: Element | null) => {
    source.current = from;
    flipOpen.current = from ? Flip.getState(from) : null;
    setOpen(id);
    play("tap");
  };
  const closeLesson = useCallback((state: Flip.FlipState, id: string) => {
    flipClose.current = { state, id };
    setOpen(null);
  }, []);
  useLayoutEffect(() => {
    const back = flipClose.current;
    if (open || !back) return;
    flipClose.current = null;
    const target = source.current?.isConnected ? source.current : document.querySelector(`${cardSelector} [data-flip-id="${flipPrefix}-${back.id}"]`);
    source.current = null;
    if (target && (target as HTMLElement).offsetParent) Flip.from(back.state, { targets: target, duration: 0.6, ease: "expo.inOut", scale: true, zIndex: 40 });
  }, [open, cardSelector, flipPrefix]);

  return { filter, choose, open, openLesson, closeLesson, grid, flipOpen };
}

/** Karty wjeżdżają przy przewijaniu; `hero` = selektor elementu, którego dzieci wjeżdżają na start. */
function useCardsIn(scope: React.RefObject<HTMLDivElement | null>, cardSelector: string, hero?: string, deps: unknown[] = []) {
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const cards = gsap.utils.toArray<HTMLElement>(cardSelector);
      gsap.set(cards, { opacity: 0, y: 40 });
      ScrollTrigger.batch(cards, {
        start: "top 95%",
        once: true,
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power3.out", overwrite: true }),
      });
      if (hero) gsap.from(`${hero} > *`, { opacity: 0, y: 24, duration: 0.8, stagger: 0.1, ease: "power3.out" });
    },
    { scope, dependencies: deps },
  );
}

// ——— „Twoja ścieżka”: lekcje kroków właściciela (XP, blokady jak kroki) ———

function SciezkaLekcje() {
  const { ready, state, markWatched, toggleWatched } = useJourney();
  const root = useRef<HTMLDivElement>(null);
  const { filter, choose, open, openLesson, closeLesson, grid, flipOpen } = useFlipLibrary<Filter>("all", "[data-card]", "thumb");

  const statuses = stepStatuses(state);
  const items: Item[] = allLessons().map((lesson, i) => {
    const step = STEPS.find((s) => s.lessons.some((l) => l.id === lesson.id)) ?? STEPS[0];
    const status = state.watched[lesson.id] ? "done" : statuses[step.id] === "locked" ? "locked" : "open";
    return { lesson, no: i + 1, step, phase: PHASES.indexOf(step.phase), status };
  });
  const count = (f: Filter) => items.filter((it) => match(it, f)).length;
  const done = count("done");
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  const nextUp = items.find((it) => it.status === "open");
  const streak = streakDays(state.events);

  useCardsIn(root, "[data-card]", "[data-hero]", [ready]);

  if (!ready) return <p className="text-white/70">Wczytuję…</p>;
  const current = items.find((it) => it.lesson.id === open) ?? null;

  return (
    <div ref={root} className="flex flex-col gap-8">
      {/* GÓRA: postęp + następna lekcja */}
      <section data-hero className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="glass-card flex flex-col justify-between gap-6 rounded-3xl p-6 md:p-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Lekcje Bartka</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">Jedna lekcja dziennie.<br /><span className="text-white/60">Tyle wystarczy.</span></h2>
          </div>
          <div className="flex items-center gap-5">
            <Ring value={pct} size={120} stroke={11} label="Zaliczone lekcje" sub="zaliczone" />
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2"><PlayCircle className="size-4 text-brand" aria-hidden="true" /><strong className="tabular-nums">{done}/{items.length}</strong> lekcji</li>
              <li className="flex items-center gap-2"><Zap className="size-4 text-orange" aria-hidden="true" /><strong className="tabular-nums">{done * XP.lesson}</strong> XP z lekcji</li>
              <li className="flex items-center gap-2"><Flame className="size-4 text-orange" aria-hidden="true" /><strong className="tabular-nums">{streak}</strong> {streak === 1 ? "dzień" : "dni"} z rzędu</li>
            </ul>
          </div>
        </div>

        {nextUp ? (
          <motion.button type="button" onClick={(e) => openLesson(nextUp.lesson.id, e.currentTarget.querySelector("[data-flip-id]"))} whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-orange/40 bg-[#0a150b] text-left shadow-[0_0_80px_-30px_rgba(221,153,51,.6)]"
            aria-label={`Następna lekcja: ${nextUp.lesson.title}. Otwórz`}>
            <div data-flip-id={`thumb-${nextUp.lesson.id}`} className="relative" style={{ visibility: open === nextUp.lesson.id ? "hidden" : undefined }}>
              <Poster item={nextUp} big />
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <span className="min-w-0">
                <span className="text-xs font-extrabold tracking-wider text-orange">NASTĘPNA LEKCJA</span>
                <strong className="mt-0.5 block truncate text-xl">{nextUp.lesson.title}</strong>
                <span className="text-sm text-white/60">Krok {nextUp.step.no}: {nextUp.step.title}</span>
              </span>
              <span className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-2xl bg-orange px-5 font-extrabold text-neutral-950 shadow-[0_5px_0_0_rgba(0,0,0,.35)] transition group-hover:gap-3">
                <Play className="size-4 fill-current" aria-hidden="true" />Oglądam
              </span>
            </div>
          </motion.button>
        ) : (
          <div className="glass-card grid place-items-center rounded-3xl p-8 text-center">
            <div>
              <Check className="mx-auto size-12 text-brand" aria-hidden="true" />
              <p className="mt-3 text-xl font-bold">Wszystkie dostępne lekcje zaliczone</p>
              <p className="text-white/65">Kolejne odblokują się razem z następnymi krokami ścieżki.</p>
            </div>
          </div>
        )}
      </section>

      {/* FILTRY */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pokaż lekcje">
        {([
          ["all", "Wszystkie"],
          ["todo", "Do obejrzenia"],
          ["done", "Zaliczone"],
          ["locked", "Zablokowane"],
        ] as [Filter, string][]).map(([f, label]) => (
          <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => choose(f)}
            className={`relative inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${filter === f ? "text-brand-ink" : "text-white/75 hover:text-white"}`}>
            {filter === f ? <motion.span layoutId="lekcje-filtr" className="absolute inset-0 rounded-full bg-brand" transition={{ type: "spring", stiffness: 420, damping: 32 }} /> : <span className="absolute inset-0 rounded-full border border-white/15" />}
            <span className="relative">{label}</span>
            <span className={`relative rounded-full px-1.5 text-xs tabular-nums ${filter === f ? "bg-black/15" : "bg-white/10"}`}>{count(f)}</span>
          </button>
        ))}
      </div>

      {/* KARTY */}
      <ul ref={grid} className="relative grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => (
          <li key={it.lesson.id} data-card className={match(it, filter) ? "" : "hidden"}>
            <Card item={it} hidden={open === it.lesson.id} onOpen={(el) => openLesson(it.lesson.id, el)} />
          </li>
        ))}
      </ul>
      {count(filter) === 0 ? <p className="text-white/60">Nic tu jeszcze nie ma.</p> : null}

      <a href="#kursy" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex w-fit items-center gap-2 text-sm text-white/60 hover:text-white">
        <Library className="size-4" aria-hidden="true" />Cała biblioteka Bartka: {lekcji(WSZYSTKIE_LEKCJE.length)} z {KURSY.length} kursów w zakładce „Kursy Bartka”<ArrowRight className="size-4" aria-hidden="true" />
      </a>

      {current
        ? createPortal(
            <Player item={current} enterRef={flipOpen} onClose={closeLesson}
              onDone={() => markWatched([current.lesson.id])} onUndo={() => toggleWatched(current.lesson.id)} />,
            document.body,
          )
        : null}
    </div>
  );
}

function match(it: Item, f: Filter) {
  if (f === "all") return true;
  if (f === "todo") return it.status === "open";
  if (f === "done") return it.status === "done";
  return it.status === "locked";
}

/** „Okładka” lekcji: kolor etapu, siatka jak na mapie, duża ikona kroku i przycisk odtwarzania. */
function Poster({ item, big }: { item: Item; big?: boolean }) {
  const tint = TINT[item.phase % TINT.length];
  return (
    <div className="relative aspect-video w-full overflow-hidden"
      style={{ background: `radial-gradient(110% 90% at 15% 0%, ${tint}88, transparent 60%), radial-gradient(80% 70% at 100% 100%, #dd993322, transparent 60%), linear-gradient(160deg, #0d1d0e, #030805)` }}>
      <PosterGrid />
      <StepIcon id={item.step.id} className={`absolute -bottom-6 -right-4 text-white/15 ${big ? "size-48" : "size-36"}`} />
      <span className="absolute left-4 top-4 max-w-[65%] truncate rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white/85 backdrop-blur-sm">Lekcja {item.no} · {item.lesson.source}</span>
      {item.status === "done" ? (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-extrabold text-brand-ink"><Check className="size-3.5" aria-hidden="true" />Zaliczona</span>
      ) : item.status === "open" ? (
        <span className="absolute right-4 top-4 rounded-full bg-orange px-2.5 py-1 text-[11px] font-extrabold text-neutral-950">+{XP.lesson} XP</span>
      ) : null}
      <CenterIcon video={!!item.lesson.video} big={big} />
      <span className="absolute inset-x-0 bottom-0 h-1 bg-white/10"><span className={`block h-full ${item.status === "done" ? "w-full bg-brand" : "w-0"}`} /></span>
      {item.status === "locked" ? (
        <span className="absolute inset-0 grid place-items-center bg-[#030805]/70 backdrop-blur-[3px]">
          <span className="flex flex-col items-center gap-2 text-center text-sm text-white/80">
            <span className="grid size-12 place-items-center rounded-full bg-white/10"><Lock className="size-5" aria-hidden="true" /></span>
            Odblokuje się w kroku {item.step.no}
          </span>
        </span>
      ) : null}
    </div>
  );
}

function Card({ item, hidden, onOpen }: { item: Item; hidden: boolean; onOpen: (thumb: Element | null) => void }) {
  const locked = item.status === "locked";
  const body = (
    <>
      <div data-flip-id={`thumb-${item.lesson.id}`} style={{ visibility: hidden ? "hidden" : undefined }} className="overflow-hidden rounded-2xl">
        <Poster item={item} />
      </div>
      <div className="flex flex-col gap-1 px-1 pt-3">
        <span className="text-xs font-semibold text-white/50">Krok {item.step.no}: {item.step.title}</span>
        <strong className="text-lg leading-snug">{item.lesson.title}</strong>
        {item.lesson.opis ? <span className="line-clamp-2 text-sm text-white/60">{item.lesson.opis}</span> : null}
      </div>
    </>
  );
  if (locked) return <div className="opacity-80" aria-label={`${item.lesson.title}: zablokowana, odblokuje się w kroku ${item.step.no}`}>{body}</div>;
  return (
    <motion.button type="button" onClick={(e) => onOpen(e.currentTarget.querySelector("[data-flip-id]"))} whileHover={{ y: -6 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 26 }}
      className="group block w-full text-left" aria-label={`${item.lesson.title}${item.status === "done" ? " (zaliczona)" : ""}. Otwórz lekcję`}>
      {body}
    </motion.button>
  );
}

function Player({ item, enterRef, onClose, onDone, onUndo }: {
  item: Item;
  enterRef: React.RefObject<Flip.FlipState | null>;
  onClose: (state: Flip.FlipState, id: string) => void;
  onDone: () => void;
  onUndo: () => void;
}) {
  const primary = useRef<HTMLButtonElement>(null);
  const id = item.lesson.id;
  const { thumb, shade, panel, close } = usePlayer(id, enterRef, onClose, primary);
  const { video, skool, attachments, opis } = item.lesson;
  const done = item.status === "done";

  return (
    <div className="fixed inset-0 z-[75] overflow-y-auto">
      <div ref={shade} aria-hidden="true" onClick={close} className="fixed inset-0 bg-[#020904]/85 backdrop-blur-md" />
      <div role="dialog" aria-modal="true" aria-labelledby="lekcja-h" className="relative mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center gap-5 p-4 md:p-8">
        <div ref={thumb} data-flip-id={`thumb-${id}`} className="overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_120px_-30px_rgba(0,0,0,.9)]">
          {video ? (
            <iframe src={video} title={item.lesson.title} allow={IFRAME_ALLOW} allowFullScreen loading="lazy" className="aspect-video w-full bg-black" />
          ) : (
            <div className="relative">
              <Poster item={{ ...item, status: done ? "done" : "open" }} big />
              <span className="absolute inset-x-0 bottom-4 px-4 text-center text-sm text-white/80">{skool ? "Ta lekcja nie ma nagrania. Treść i materiały są na Skool." : "Nagranie w przygotowaniu."}</span>
            </div>
          )}
        </div>
        <div ref={panel} className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Krok {item.step.no}: {item.step.title}</p>
              <h2 id="lekcja-h" className="mt-1 text-2xl font-extrabold md:text-3xl">{item.lesson.title}</h2>
              <p className="text-white/60">{item.lesson.source}</p>
            </div>
            <button type="button" onClick={close} aria-label="Zamknij lekcję" className="grid size-11 shrink-0 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          {opis ? <p className="max-w-3xl text-base leading-relaxed text-white/80">{opis}</p> : null}
          {attachments?.length ? <Zalaczniki list={attachments} /> : null}
          <div className="flex flex-wrap items-center gap-3">
            {done ? (
              <>
                <span className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand/15 px-5 font-extrabold text-brand"><Check className="size-5" aria-hidden="true" />Lekcja zaliczona</span>
                <button type="button" onClick={onUndo} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white">Cofnij</button>
              </>
            ) : (
              <button ref={primary} type="button" onClick={() => { onDone(); close(); }}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand px-6 text-base font-extrabold text-brand-ink shadow-[0_6px_0_0_rgba(0,0,0,.35)] transition-transform active:translate-y-[3px] active:shadow-[0_3px_0_0_rgba(0,0,0,.35)]">
                <Check className="size-5" aria-hidden="true" />{video ? "Obejrzane" : "Zaliczone"} · +{XP.lesson} XP
              </button>
            )}
            {skool ? <SkoolLink href={skool} strong={!video} /> : null}
            <Link href={`/krok/${item.step.id}`} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/20 px-5 font-semibold hover:bg-white/10">
              Przejdź do kroku {item.step.no}<ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ——— Biblioteki „Kursy Bartka” i „Dla trenerów zespołu” ———
// Ten sam język ruchu co lekcje ścieżki: filtr modułów z GSAP Flip, karty wjeżdżające przy przewijaniu,
// odtwarzacz „wyrastający” z karty. Bez blokad; „Obejrzane” daje XP.

type LibItem = {
  id: string; // id lekcji w kursach (klucz karty i Flip)
  watchId: string; // id w state.watched: lekcja kroku, jeśli ta sama lekcja jest w ścieżce
  lesson: LekcjaKursu;
  opis?: string;
  zadanie?: string;
  group: string; // id modułu (filtr)
  groupTitle: string;
  no: number; // numer w module
  tint: string;
  Icon: LucideIcon;
  badge?: string; // np. „Dla właściciela”
  step?: Step; // krok ścieżki z tą lekcją
};
type Grupa = { id: string; title: string; opis: string };

// Lekcje kursów przypięte do kroków ścieżki (pole ref): wspólne „obejrzane”.
const W_SCIEZCE = new Map<string, { id: string; step: Step }>();
for (const s of STEPS) for (const l of s.lessons) if (l.ref && !W_SCIEZCE.has(l.ref)) W_SCIEZCE.set(l.ref, { id: l.id, step: s });

const KURS_IKONA: Record<string, LucideIcon> = { ds: Building2, sk: Megaphone, pt: Dumbbell, sp: Store };

function itemyKursu(k: Kurs): LibItem[] {
  return k.modules.flatMap((m, mi) =>
    m.lessons.map((lid, i) => {
      const l = LEKCJE[lid];
      const p = W_SCIEZCE.get(l.id);
      return { id: l.id, watchId: p?.id ?? l.id, lesson: l, opis: l.opis, group: m.id, groupTitle: m.title, no: i + 1, tint: TINT[mi % TINT.length], Icon: KURS_IKONA[k.id] ?? BookOpen, step: p?.step };
    }),
  );
}
const KURS_ITEMS: Record<string, LibItem[]> = Object.fromEntries(KURSY.map((k) => [k.id, itemyKursu(k)]));

const MODUL_IKONA: Record<string, LucideIcon> = {
  start: Sunrise, miekkie: HeartHandshake, twarde: Wrench, merytoryka: Brain, studio: Dumbbell, semi: UsersRound, rolki: Clapperboard, spotkania: MessagesSquare,
};
const TEAM_ITEMS: LibItem[] = BIBLIOTEKA.map((l) => {
  const idx = Math.max(0, MODULY_TRENERA.findIndex((m) => m.id === l.modul));
  const m = MODULY_TRENERA[idx];
  const no = BIBLIOTEKA.filter((x) => x.modul === l.modul).indexOf(l) + 1;
  const p = W_SCIEZCE.get(l.id);
  return {
    id: l.id, watchId: p?.id ?? l.id, lesson: l, opis: l.opis, zadanie: l.zadanie, group: m.id, groupTitle: m.title, no,
    tint: TINT[idx % TINT.length], Icon: MODUL_IKONA[m.id] ?? BookOpen, badge: l.dla === "wlasciciel" ? "Dla właściciela" : undefined, step: p?.step,
  };
});

function KursyBartka() {
  const { state } = useJourney();
  const [kurs, setKurs] = useState(KURSY[0].id);
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from("[data-khero] > *", { opacity: 0, y: 24, duration: 0.8, stagger: 0.1, ease: "power3.out" });
    },
    { scope: root },
  );

  const k = KURSY.find((x) => x.id === kurs) ?? KURSY[0];
  const wszystkie = KURSY.flatMap((x) => KURS_ITEMS[x.id]);
  const zaliczone = (list: LibItem[]) => list.filter((t) => state.watched[t.watchId]).length;
  const nagrania = wszystkie.filter((t) => t.lesson.video).length;
  const wybierz = (id: string) => {
    if (id === kurs) return;
    setKurs(id);
    play("tap");
  };

  return (
    <div ref={root} className="flex flex-col gap-8">
      <section data-khero className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <div className="glass-card flex flex-col justify-between gap-6 rounded-3xl p-6 md:p-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Kursy Bartka</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">Cała wiedza z kursów.<br /><span className="text-white/60">W jednym miejscu.</span></h2>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            <li className="flex items-center gap-2"><Library className="size-4 text-brand" aria-hidden="true" /><strong className="tabular-nums">{wszystkie.length}</strong> lekcji, w tym <strong className="tabular-nums">{nagrania}</strong> nagrań</li>
            <li className="flex items-center gap-2"><PlayCircle className="size-4 text-brand" aria-hidden="true" /><strong className="tabular-nums">{zaliczone(wszystkie)}/{wszystkie.length}</strong> zaliczonych</li>
            <li className="flex items-center gap-2"><Zap className="size-4 text-orange" aria-hidden="true" />+{XP.lesson} XP za lekcję. Nic tu nie blokuje ścieżki.</li>
          </ul>
        </div>

        <div role="tablist" aria-label="Kursy Bartka" className="grid gap-3 sm:grid-cols-2">
          {KURSY.map((c) => {
            const list = KURS_ITEMS[c.id];
            const done = zaliczone(list);
            const Icon = KURS_IKONA[c.id] ?? BookOpen;
            const on = c.id === kurs;
            return (
              <motion.button key={c.id} type="button" role="tab" id={`kurs-tab-${c.id}`} aria-selected={on} aria-controls="kurs-panel" onClick={() => wybierz(c.id)}
                whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className={`glass-card relative flex flex-col gap-2 rounded-2xl p-4 text-left ${on ? "text-white" : "text-white/80 hover:text-white"}`}>
                {on ? <motion.span layoutId="kurs-wybrany" aria-hidden="true" className="absolute inset-0 rounded-2xl border-2 border-brand bg-brand/10 shadow-[0_0_40px_-12px_rgba(114,196,28,.7)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} /> : null}
                <span className="relative flex items-center gap-2">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${on ? "bg-brand text-brand-ink" : "bg-white/10 text-brand"}`}><Icon className="size-5" aria-hidden="true" /></span>
                  <strong className="text-base font-extrabold leading-tight">{c.title}</strong>
                </span>
                <span className="relative line-clamp-2 text-sm text-white/60">{c.opis}</span>
                <span className="relative mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-white/55">
                  <span>{lekcji(list.length)} · {c.modules.length} {odmiana(c.modules.length, "moduł", "moduły", "modułów")}</span>
                  <span className="tabular-nums">{done}/{list.length}</span>
                </span>
                <span className="relative h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${list.length ? Math.round((done / list.length) * 100) : 0}%` }} />
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={k.id} id="kurs-panel" role="tabpanel" aria-labelledby={`kurs-tab-${k.id}`}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }} onAnimationComplete={() => ScrollTrigger.refresh()}>
          <Biblioteka items={KURS_ITEMS[k.id]} groups={k.modules} label={`Moduły kursu ${k.title}`} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ZespolTrenerow() {
  const { state } = useJourney();
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from("[data-thero] > *", { opacity: 0, y: 24, duration: 0.8, stagger: 0.1, ease: "power3.out" });
    },
    { scope: root },
  );
  const dlaZespolu = TEAM_ITEMS.filter((t) => !t.badge).length;
  const zaliczone = TEAM_ITEMS.filter((t) => state.watched[t.watchId]).length;

  return (
    <div ref={root} className="flex flex-col gap-8">
      <section data-thero className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="glass-card flex flex-col justify-between gap-6 rounded-3xl p-6 md:p-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Dla trenerów zespołu</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">Szkolisz zespół raz.<br /><span className="text-white/60">Standard zostaje w studiu.</span></h2>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            <li className="flex items-center gap-2"><BookOpen className="size-4 text-brand" aria-hidden="true" /><strong className="tabular-nums">{TEAM_ITEMS.length}</strong> lekcji w {MODULY_TRENERA.length} modułach, <strong className="tabular-nums">{zaliczone}</strong> zaliczonych</li>
            <li className="flex items-center gap-2"><Users className="size-4 text-brand" aria-hidden="true" /><strong className="tabular-nums">{dlaZespolu}</strong> dla trenerów, reszta raczej dla właściciela</li>
            <li className="flex items-center gap-2"><Zap className="size-4 text-orange" aria-hidden="true" />Wszystkie otwarte od razu. +{XP.lesson} XP za lekcję.</li>
          </ul>
        </div>
        <div className="glass-card flex flex-col gap-4 rounded-3xl p-6 md:p-8">
          <p className="flex items-center gap-2 font-semibold"><ListChecks className="size-5 text-brand" aria-hidden="true" />Jak z tego korzystać</p>
          <ol className="flex flex-col gap-3">
            {[
              "Wybierz jedną lekcję na spotkanie zespołu albo wyślij ją trenerom przed spotkaniem.",
              "Obejrzyjcie ją razem i porozmawiajcie, jak to wygląda dziś w Waszym studiu.",
              "Zróbcie zadanie z lekcji i zapiszcie ustalenia jako standard studia.",
            ].map((t, i) => (
              <li key={t} className="flex gap-3 text-sm text-white/75">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-extrabold text-brand">{i + 1}</span>{t}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Biblioteka items={TEAM_ITEMS} groups={MODULY_TRENERA} label="Moduły dla zespołu" />

      <p className="flex items-center gap-2 text-sm text-white/55"><Paperclip className="size-4" aria-hidden="true" />Dokumenty i arkusze do lekcji są na Skool: przycisk „Otwórz na Skool” w każdej lekcji.</p>
    </div>
  );
}

/** Biblioteka lekcji: filtr modułów (GSAP Flip), karty, odtwarzacz. Wideo ładuje się dopiero w odtwarzaczu. */
function Biblioteka({ items, groups, label }: { items: LibItem[]; groups: Grupa[]; label: string }) {
  const { state, markWatched, toggleWatched } = useJourney();
  const root = useRef<HTMLDivElement>(null);
  const { filter, choose, open, openLesson, closeLesson, grid, flipOpen } = useFlipLibrary<string>("all", "[data-lcard]", "lib");
  useCardsIn(root, "[data-lcard]");

  const ile = (f: string) => (f === "all" ? items.length : items.filter((t) => t.group === f).length);
  const current = items.find((t) => t.id === open) ?? null;
  const opisGrupy = groups.find((g) => g.id === filter)?.opis;

  return (
    <div ref={root} className="flex flex-col gap-6">
      {groups.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={label}>
          {[{ id: "all", title: "Wszystkie" }, ...groups].map((g) => (
            <button key={g.id} type="button" role="tab" aria-selected={filter === g.id} onClick={() => choose(g.id)}
              className={`relative inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-left text-sm font-semibold ${filter === g.id ? "text-brand-ink" : "text-white/75 hover:text-white"}`}>
              {filter === g.id ? <motion.span layoutId="lib-filtr" className="absolute inset-0 rounded-full bg-brand" transition={{ type: "spring", stiffness: 420, damping: 32 }} /> : <span className="absolute inset-0 rounded-full border border-white/15" />}
              <span className="relative">{g.title}</span>
              <span className={`relative rounded-full px-1.5 text-xs tabular-nums ${filter === g.id ? "bg-black/15" : "bg-white/10"}`}>{ile(g.id)}</span>
            </button>
          ))}
        </div>
      ) : null}
      {opisGrupy ? <p className="-mt-2 text-sm text-white/60">{opisGrupy}</p> : null}

      <ul ref={grid} className="relative grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((t) => (
          <li key={t.id} data-lcard className={filter === "all" || t.group === filter ? "" : "hidden"}>
            <LibCard item={t} watched={!!state.watched[t.watchId]} hidden={open === t.id} onOpen={(el) => openLesson(t.id, el)} />
          </li>
        ))}
      </ul>

      {current
        ? createPortal(
            <LibPlayer item={current} watched={!!state.watched[current.watchId]} enterRef={flipOpen} onClose={closeLesson}
              onDone={() => markWatched([current.watchId])} onUndo={() => toggleWatched(current.watchId)} />,
            document.body,
          )
        : null}
    </div>
  );
}

/** Okładka lekcji z biblioteki: kolor modułu, siatka jak na mapie, ikona kursu albo modułu. */
function LibPoster({ item, watched, big }: { item: LibItem; watched: boolean; big?: boolean }) {
  const Icon = item.Icon;
  const video = !!item.lesson.video;
  return (
    <div className="relative aspect-video w-full overflow-hidden"
      style={{ background: `radial-gradient(110% 90% at 15% 0%, ${item.tint}88, transparent 60%), radial-gradient(80% 70% at 100% 100%, #4b8fdb22, transparent 60%), linear-gradient(160deg, #0d1d0e, #030805)` }}>
      <PosterGrid />
      <Icon aria-hidden="true" strokeWidth={1.25} className={`absolute -bottom-6 -right-4 text-white/15 ${big ? "size-48" : "size-36"}`} />
      <span className="absolute left-4 top-4 max-w-[62%] truncate rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white/85 backdrop-blur-sm">{item.groupTitle} · {item.no}</span>
      {watched ? (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-extrabold text-brand-ink"><Check className="size-3.5" aria-hidden="true" />Zaliczona</span>
      ) : video ? (
        <span className="absolute right-4 top-4 rounded-full bg-orange px-2.5 py-1 text-[11px] font-extrabold text-neutral-950">+{XP.lesson} XP</span>
      ) : (
        <span className="absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-neutral-950">Na Skool</span>
      )}
      <CenterIcon video={video} big={big} />
      {item.badge ? <span className="absolute bottom-3 left-4 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white/85">{item.badge}</span> : null}
      {item.step ? <span className="absolute bottom-3 right-4 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white/85">Krok {item.step.no} ścieżki</span> : null}
      <span className="absolute inset-x-0 bottom-0 h-1 bg-white/10"><span className={`block h-full ${watched ? "w-full bg-brand" : "w-0"}`} /></span>
    </div>
  );
}

function LibCard({ item, watched, hidden, onOpen }: { item: LibItem; watched: boolean; hidden: boolean; onOpen: (thumb: Element | null) => void }) {
  return (
    <motion.button type="button" onClick={(e) => onOpen(e.currentTarget.querySelector("[data-flip-id]"))} whileHover={{ y: -6 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 26 }}
      className="group block w-full text-left" aria-label={`${item.lesson.title}. ${item.groupTitle}${watched ? " (zaliczona)" : ""}${item.lesson.video ? "" : ", bez nagrania"}. Otwórz lekcję`}>
      <div data-flip-id={`lib-${item.id}`} style={{ visibility: hidden ? "hidden" : undefined }} className="overflow-hidden rounded-2xl">
        <LibPoster item={item} watched={watched} />
      </div>
      <div className="flex flex-col gap-1 px-1 pt-3">
        <span className="text-xs font-semibold text-white/50">{item.groupTitle}</span>
        <strong className="text-lg leading-snug">{item.lesson.title}</strong>
        {item.opis ? <span className="line-clamp-2 text-sm text-white/60">{item.opis}</span> : null}
      </div>
    </motion.button>
  );
}

function LibPlayer({ item, watched, enterRef, onClose, onDone, onUndo }: {
  item: LibItem;
  watched: boolean;
  enterRef: React.RefObject<Flip.FlipState | null>;
  onClose: (state: Flip.FlipState, id: string) => void;
  onDone: () => void;
  onUndo: () => void;
}) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const id = item.id;
  const { thumb, shade, panel, close } = usePlayer(id, enterRef, onClose, closeBtn);
  const { video, skool, attachments, title } = item.lesson;

  return (
    <div className="fixed inset-0 z-[75] overflow-y-auto">
      <div ref={shade} aria-hidden="true" onClick={close} className="fixed inset-0 bg-[#020904]/85 backdrop-blur-md" />
      <div role="dialog" aria-modal="true" aria-labelledby="llekcja-h" className="relative mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center gap-5 p-4 md:p-8">
        <div ref={thumb} data-flip-id={`lib-${id}`} className="overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_120px_-30px_rgba(0,0,0,.9)]">
          {video ? (
            <iframe src={video} title={title} allow={IFRAME_ALLOW} allowFullScreen loading="lazy" className="aspect-video w-full bg-black" />
          ) : (
            <div className="relative">
              <LibPoster item={item} watched={watched} big />
              <span className="absolute inset-x-0 bottom-4 px-4 text-center text-sm text-white/80">Ta lekcja nie ma nagrania. Treść i materiały są na Skool.</span>
            </div>
          )}
        </div>
        <div ref={panel} className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{item.groupTitle} · lekcja {item.no}</p>
              <h2 id="llekcja-h" className="mt-1 text-2xl font-extrabold md:text-3xl">{title}</h2>
              <p className="text-white/60">{zrodlo(item.lesson)}{item.badge ? ` · ${item.badge.toLowerCase()}` : ""}</p>
            </div>
            <button ref={closeBtn} type="button" onClick={close} aria-label="Zamknij lekcję" className="grid size-11 shrink-0 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          {item.opis ? <p className="max-w-3xl text-base leading-relaxed text-white/80">{item.opis}</p> : null}
          {attachments?.length ? <Zalaczniki list={attachments} /> : null}
          {item.zadanie ? (
            <div className="flex max-w-3xl items-start gap-3 rounded-2xl border border-brand/30 bg-brand/10 p-4">
              <ListChecks className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-brand">Zadanie dla zespołu</p>
                <p className="text-sm text-white/80">{item.zadanie}</p>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            {watched ? (
              <>
                <span className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand/15 px-5 font-extrabold text-brand"><Check className="size-5" aria-hidden="true" />Lekcja zaliczona</span>
                <button type="button" onClick={onUndo} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white">Cofnij</button>
              </>
            ) : (
              <button type="button" onClick={() => { onDone(); close(); }}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand px-6 text-base font-extrabold text-brand-ink shadow-[0_6px_0_0_rgba(0,0,0,.35)] transition-transform active:translate-y-[3px] active:shadow-[0_3px_0_0_rgba(0,0,0,.35)]">
                <Check className="size-5" aria-hidden="true" />{video ? "Obejrzane" : "Zaliczone"} · +{XP.lesson} XP
              </button>
            )}
            <SkoolLink href={skool} strong={!video} />
            {item.step ? (
              <Link href={`/krok/${item.step.id}`} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/20 px-5 font-semibold hover:bg-white/10">
                Krok {item.step.no} ścieżki<ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
