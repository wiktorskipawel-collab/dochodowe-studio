"use client";

// Lekcje jak w aplikacji do nauki: duża „następna lekcja”, filtry z płynnym przestawianiem kart (GSAP Flip),
// karty wjeżdżające przy przewijaniu (ScrollTrigger) i odtwarzacz, który „wyrasta” z karty (wspólny element Flip).
// Lekcja kroku, który jest jeszcze zablokowany, też jest zablokowana — odblokowuje się razem z krokiem.
import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Play, Check, Lock, X, ArrowRight, Zap, Flame, PlayCircle, Clapperboard } from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS, allLessons, stepStatuses } from "@/lib/journey";
import { XP, streakDays } from "@/lib/gamification";
import { play } from "@/lib/sfx";
import { Ring } from "@/components/Charts";
import { StepIcon } from "@/components/PathTerrain";
import type { Lesson, Step } from "@/lib/journey-types";

gsap.registerPlugin(Flip, ScrollTrigger, useGSAP);

type Filter = "all" | "todo" | "done" | "locked";
type Item = { lesson: Lesson; no: number; step: Step; phase: number; status: "done" | "open" | "locked" };

const TINT = ["#2e8f22", "#4fb52a", "#79cf3e", "#dd9933", "#c0882e", "#72c41c"];
const PHASES = [...new Set(STEPS.map((s) => s.phase))];

export function Lessons() {
  const { ready, state, markWatched, toggleWatched } = useJourney();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLUListElement>(null);
  const flipFilter = useRef<Flip.FlipState | null>(null);
  const flipOpen = useRef<Flip.FlipState | null>(null);
  const flipClose = useRef<{ state: Flip.FlipState; id: string } | null>(null);
  const source = useRef<Element | null>(null); // skąd otwarto lekcję (karta albo „Następna lekcja”)

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

  // karty wjeżdżają przy przewijaniu
  useGSAP(
    () => {
      if (!ready || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
      gsap.set(cards, { opacity: 0, y: 40 });
      ScrollTrigger.batch(cards, {
        start: "top 95%",
        once: true,
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power3.out", overwrite: true }),
      });
      gsap.from("[data-hero] > *", { opacity: 0, y: 24, duration: 0.8, stagger: 0.1, ease: "power3.out" });
    },
    { scope: root, dependencies: [ready] },
  );

  // filtr: zapamiętaj ułożenie, zmień, a GSAP Flip płynnie przestawi karty
  const choose = (f: Filter) => {
    if (f === filter || !grid.current) return;
    flipFilter.current = Flip.getState(grid.current.querySelectorAll("[data-card]"), { props: "opacity" });
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

  // odtwarzacz: miniatura karty „wyrasta” w duży odtwarzacz i wraca na miejsce
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
    const target = source.current?.isConnected ? source.current : document.querySelector(`[data-card] [data-flip-id="thumb-${back.id}"]`);
    source.current = null;
    if (target && (target as HTMLElement).offsetParent) Flip.from(back.state, { targets: target, duration: 0.6, ease: "expo.inOut", scale: true, zIndex: 40 });
  }, [open]);

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

      <p className="flex items-center gap-2 text-sm text-white/55"><Clapperboard className="size-4" aria-hidden="true" />Wkrótce cała biblioteka Bartka: 191 lekcji z kursów i 97 nagrań mentoringów grupowych.</p>

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
      <div aria-hidden="true" className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,transparent,#000_60%)] [transform:perspective(400px)_rotateX(35deg)_scale(1.6)] [transform-origin:50%_100%]" />
      <StepIcon id={item.step.id} className={`absolute -bottom-6 -right-4 text-white/15 ${big ? "size-48" : "size-36"}`} />
      <span className="absolute left-4 top-4 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white/85 backdrop-blur-sm">Lekcja {item.no} · {item.lesson.source}</span>
      {item.status === "done" ? (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-extrabold text-brand-ink"><Check className="size-3.5" aria-hidden="true" />Zaliczona</span>
      ) : item.status === "open" ? (
        <span className="absolute right-4 top-4 rounded-full bg-orange px-2.5 py-1 text-[11px] font-extrabold text-neutral-950">+{XP.lesson} XP</span>
      ) : null}
      <span className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-neutral-950 shadow-[0_10px_40px_-5px_rgba(0,0,0,.6)] transition-transform duration-300 group-hover:scale-110 ${big ? "size-20" : "size-14"}`}>
        <Play className={`${big ? "size-8" : "size-6"} translate-x-0.5 fill-current`} aria-hidden="true" />
      </span>
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
  const thumb = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const id = item.lesson.id;
  const video = item.lesson.video;

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const st = enterRef.current;
    enterRef.current = null;
    if (st && thumb.current && !reduce) Flip.from(st, { targets: thumb.current, duration: 0.75, ease: "expo.inOut", scale: true, zIndex: 90 });
    gsap.fromTo(shade.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.fromTo(panel.current?.children ?? [], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, delay: reduce ? 0 : 0.45, ease: "power3.out" });
    primary.current?.focus({ preventScroll: true });
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [enterRef]);

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

  const done = item.status === "done";
  return (
    <div className="fixed inset-0 z-[75] overflow-y-auto">
      <div ref={shade} aria-hidden="true" onClick={close} className="fixed inset-0 bg-[#020904]/85 backdrop-blur-md" />
      <div role="dialog" aria-modal="true" aria-labelledby="lekcja-h" className="relative mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center gap-5 p-4 md:p-8">
        <div ref={thumb} data-flip-id={`thumb-${id}`} className="overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_120px_-30px_rgba(0,0,0,.9)]">
          {video ? (
            <iframe src={video} title={item.lesson.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" className="aspect-video w-full bg-black" />
          ) : (
            <div className="relative">
              <Poster item={{ ...item, status: done ? "done" : "open" }} big />
              <span className="absolute inset-x-0 bottom-4 text-center text-sm text-white/75">Nagranie w przygotowaniu: Bartek wgrywa lekcje do platformy.</span>
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
          <div className="flex flex-wrap items-center gap-3">
            {done ? (
              <>
                <span className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand/15 px-5 font-extrabold text-brand"><Check className="size-5" aria-hidden="true" />Lekcja zaliczona</span>
                <button type="button" onClick={onUndo} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white">Cofnij</button>
              </>
            ) : (
              <button ref={primary} type="button" onClick={() => { onDone(); close(); }}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand px-6 text-base font-extrabold text-brand-ink shadow-[0_6px_0_0_rgba(0,0,0,.35)] transition-transform active:translate-y-[3px] active:shadow-[0_3px_0_0_rgba(0,0,0,.35)]">
                <Check className="size-5" aria-hidden="true" />Obejrzane · +{XP.lesson} XP
              </button>
            )}
            <Link href={`/krok/${item.step.id}`} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/20 px-5 font-semibold hover:bg-white/10">
              Przejdź do kroku {item.step.no}<ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
