"use client";

// Lekcje jak w aplikacji do nauki: duża „następna lekcja”, karty z prawdziwą miniaturą filmu (Loom/YouTube), filtry z płynnym
// przestawianiem kart (GSAP Flip), karty wjeżdżające przy przewijaniu (ScrollTrigger) i odtwarzacz, który „wyrasta” z karty.
// Dwie zakładki u góry (adres: /lekcje i /lekcje#kursy; stary adres /lekcje#zespol otwiera kurs „Przedsiębiorczy Trener”):
// - „Twoja ścieżka”: lekcje kroków (src/lib/journey.ts), z XP. Lekcja zablokowanego kroku odblokowuje się razem z krokiem.
// - „Kursy”: wszystkie kursy ze Skool (src/lib/kursy.ts) w tej samej kolejności co na Skool: kurs → moduły → lekcje.
//   Właściciel przechodzi wszystko sam (najpierw studio w pojedynkę, potem szkolenie trenerów i zespół), więc nie ma osobnej
//   biblioteki dla zespołu. Przejścia między poziomami na GSAP Flip (okładka kursu/modułu przechodzi w nagłówek). Postęp per kurs i moduł.
// W kursach wszystko jest otwarte od razu. „Obejrzane” daje XP (markWatched) i nie blokuje ścieżki; lekcja, która jest też
// w kroku, ma z nim wspólne „obejrzane” (pole ref w lekcji kroku). „Zaliczona” i liczniki: lessonDone() / lessonProgress()
// z src/lib/gamification.ts (te same liczby co na pulpicie). „Obejrzane” włącza się dopiero po ok. 30 s z otwartym
// odtwarzaczem (WatchTimer.tsx). Na telefonie odtwarzacz zajmuje cały ekran, „Zamknij” jest zawsze w prawym górnym rogu.
// Siatki kart mają kolumnę minmax(0,1fr): skracany tekst (truncate) nie rozpycha strony szerzej niż ekran telefonu. Karty pokazują tylko miniaturę (<img loading="lazy">);
// wideo (iframe Loom/YouTube) ładuje się wyłącznie w otwartym odtwarzaczu. Lekcja bez wideo ma przycisk „Otwórz na Skool”.
import Link from "next/link";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  Play, Check, Lock, X, ArrowLeft, ArrowRight, ChevronRight, Zap, Flame, PlayCircle, Route, Clock, BookOpen, Library, ExternalLink,
  Paperclip, Dumbbell, Building2, Megaphone, Store, type LucideIcon,
} from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS, allLessons, stepStatuses } from "@/lib/journey";
import { KURSY, LEKCJE, WSZYSTKIE_LEKCJE, miniatura, wideoLekcji, type Kurs, type LekcjaKursu, type ModulKursu } from "@/lib/kursy";
import { XP, streakDays, lessonDone, lessonProgress, lessonTally, watchSeconds, type LessonTally } from "@/lib/gamification";
import { useWatchCountdown, countdown } from "@/components/WatchTimer";
import { play } from "@/lib/sfx";
import { Ring } from "@/components/Charts";
import { StepIcon } from "@/components/PathTerrain";
import type { Lesson, Step } from "@/lib/journey-types";

gsap.registerPlugin(Flip, ScrollTrigger, useGSAP);

type Filter = "all" | "todo" | "done" | "locked";
type Status = "done" | "open" | "locked";
type Item = { lesson: Lesson; no: number; step: Step; phase: number; status: Status; thumb?: string; duration?: number; gdzie: string };
type Widok = "sciezka" | "kursy";
type Cel = { widok: Widok; kurs: string | null; n: number };

const TINT = ["#2e8f22", "#4fb52a", "#79cf3e", "#dd9933", "#c0882e", "#72c41c"];
const PHASES = [...new Set(STEPS.map((s) => s.phase))];
const IFRAME_ALLOW = "autoplay; encrypted-media; picture-in-picture; fullscreen";
const bezRuchu = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 1 lekcja, 2 lekcje, 5 lekcji */
function odmiana(n: number, jeden: string, kilka: string, wiele: string) {
  const d = n % 10;
  const s = n % 100;
  if (n === 1) return jeden;
  return d >= 2 && d <= 4 && (s < 12 || s > 14) ? kilka : wiele;
}
const lekcji = (n: number) => `${n} ${odmiana(n, "lekcja", "lekcje", "lekcji")}`;
const kursow = (n: number) => `${n} ${odmiana(n, "kurs", "kursy", "kursów")}`;
const modulow = (n: number) => `${n} ${odmiana(n, "moduł", "moduły", "modułów")}`;

/** Czas nagrania: 5:53 albo 1:47:37. */
function czas(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
/** Łączny czas nagrań: 6 h 20 min albo 45 min. */
function czasRazem(s: number) {
  const min = Math.max(1, Math.round(s / 60));
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
}

// ——— Kursy ze Skool: lekcje po kolei (kurs → moduł → lekcja) ———

type KursItem = {
  id: string; // id lekcji w kursach (klucz karty i Flip)
  watchId: string; // id w state.watched: lekcja kroku, jeśli ta sama lekcja jest w ścieżce
  lesson: LekcjaKursu;
  kurs: Kurs;
  modul: ModulKursu;
  kursNo: number;
  modulNo: number;
  no: number; // numer w module
  step?: Step; // krok ścieżki z tą lekcją
};
type Nav = { kurs: string | null; modul: string | null };

// Lekcje kursów przypięte do kroków ścieżki (pole ref): wspólne „obejrzane”.
const W_SCIEZCE = new Map<string, { id: string; step: Step }>();
for (const s of STEPS) for (const l of s.lessons) if (l.ref && !W_SCIEZCE.has(l.ref)) W_SCIEZCE.set(l.ref, { id: l.id, step: s });

const KURS_IKONA: Record<string, LucideIcon> = { ds: Building2, sk: Megaphone, pt: Dumbbell, sp: Store };

const KURS_ITEMS: Record<string, KursItem[]> = Object.fromEntries(
  KURSY.map((k, ki) => [
    k.id,
    k.modules.flatMap((m, mi) =>
      m.lessons.map((lid, i) => {
        const l = LEKCJE[lid];
        const p = W_SCIEZCE.get(l.id);
        return { id: l.id, watchId: p?.id ?? l.id, lesson: l, kurs: k, modul: m, kursNo: ki + 1, modulNo: mi + 1, no: i + 1, step: p?.step };
      }),
    ),
  ]),
);
const WSZYSTKIE_ITEMY = KURSY.flatMap((k) => KURS_ITEMS[k.id]);
const ITEM = new Map(WSZYSTKIE_ITEMY.map((t) => [t.id, t]));
const lekcjeModulu = (k: Kurs, m: ModulKursu) => KURS_ITEMS[k.id].filter((t) => t.modul.id === m.id);
const sekundy = (list: KursItem[]) => list.reduce((s, t) => s + (t.lesson.duration ?? 0), 0);
const okladkaZ = (list: KursItem[]) => {
  for (const t of list) {
    const src = miniatura(t.lesson);
    if (src) return src;
  }
  return undefined;
};

// ——— Zakładki ———

const ZAKLADKI: [Widok, string, string, LucideIcon][] = [
  ["sciezka", "Twoja ścieżka", `${lekcji(allLessons().length)} do kroków, z XP`, Route],
  ["kursy", "Kursy", `Cały program: ${kursow(KURSY.length)}, ${lekcji(WSZYSTKIE_LEKCJE.length)}`, Library],
];

/** /lekcje = ścieżka, /lekcje#kursy = kursy, /lekcje#zespol (stary adres) = kurs „Przedsiębiorczy Trener”. Inne kotwice: bez zmian. */
function celZAdresu(hash: string): Omit<Cel, "n"> | null {
  if (!hash || hash === "#") return { widok: "sciezka", kurs: null };
  if (hash === "#kursy") return { widok: "kursy", kurs: null };
  if (hash === "#zespol") return { widok: "kursy", kurs: "pt" };
  return null;
}

export function Lessons() {
  const { ready } = useJourney();
  const [cel, setCel] = useState<Cel>({ widok: "sciezka", kurs: null, n: 0 });
  const adresPrzeczytany = useRef(false);
  const ostatniaKotwica = useRef({ hash: "", t: 0 }); // ostatnio użyta kotwica (bez podwójnego przełączania)

  // Kotwica w adresie: wejście na /lekcje#kursy, zmiana kotwicy i kliknięcie linku /lekcje#… na tej samej stronie.
  // - Next.js zmienia adres przy linku z kotwicą dopiero po chwili i bez zdarzenia hashchange, więc kotwicę bierzemy
  //   z klikniętego linku (nasłuch w fazie przechwytywania).
  // - Menu boczne i wyszukiwarka wysyłają własne „hashchange” (isTrusted = false), zanim adres się zmieni: wtedy czekamy
  //   chwilę na nowy adres, zamiast czytać stary.
  // - Adres przy wejściu czytamy raz: przy nawigacji w obrębie /lekcje efekt może uruchomić się ponownie ze starym adresem.
  useEffect(() => {
    const ostatni = ostatniaKotwica.current;
    let timer = 0;
    const czytaj = (hash: string) => {
      const c = celZAdresu(hash);
      if (!c || (hash === ostatni.hash && Date.now() - ostatni.t < 2000)) return;
      ostatni.hash = hash;
      ostatni.t = Date.now();
      setCel((p) => ({ ...c, n: p.n + 1 }));
    };
    const onHash = (e: Event) => {
      window.clearTimeout(timer);
      if (e.isTrusted) return czytaj(window.location.hash);
      const przed = window.location.hash;
      let proby = 0;
      const sprawdz = () => {
        if (window.location.hash !== przed) czytaj(window.location.hash);
        else if (++proby < 15) timer = window.setTimeout(sprawdz, 80);
        else czytaj(przed);
      };
      sprawdz();
    };
    const onClick = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(a instanceof HTMLAnchorElement) || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
      const url = new URL(a.href, window.location.href);
      if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.hash) czytaj(url.hash);
    };
    if (!adresPrzeczytany.current) {
      adresPrzeczytany.current = true;
      czytaj(window.location.hash);
    }
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  const wybierz = (w: Widok) => {
    if (w === cel.widok) return;
    setCel((p) => ({ widok: w, kurs: null, n: p.n }));
    ostatniaKotwica.current.t = 0;
    play("tap");
    window.history.replaceState(window.history.state, "", w === "sciezka" ? window.location.pathname + window.location.search : "#kursy");
  };

  if (!ready) return <p className="text-white/70">Wczytuję…</p>;
  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Rodzaj lekcji" className="glass-card grid w-full max-w-2xl grid-cols-2 gap-1 rounded-2xl p-1.5">
        {ZAKLADKI.map(([w, label, sub, Icon]) => (
          <button key={w} type="button" role="tab" id={`lekcje-tab-${w}`} aria-selected={cel.widok === w} aria-controls="lekcje-widok" onClick={() => wybierz(w)}
            className={`relative flex min-h-14 items-center gap-2 rounded-xl px-2.5 text-left md:gap-3 md:px-4 ${cel.widok === w ? "text-brand-ink" : "text-white/75 hover:bg-white/[0.06] hover:text-white"}`}>
            {cel.widok === w ? <motion.span layoutId="lekcje-widok-pill" className="absolute inset-0 rounded-xl bg-brand shadow-[0_6px_24px_-8px_rgba(114,196,28,.7)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} /> : null}
            <Icon className="relative hidden size-5 shrink-0 sm:block" aria-hidden="true" />
            <span className="relative min-w-0">
              <span className="block text-sm font-extrabold leading-tight md:text-base">{label}</span>
              <span className={`hidden truncate text-xs sm:block ${cel.widok === w ? "text-brand-ink/75" : "text-white/50"}`}>{sub}</span>
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={cel.widok} id="lekcje-widok" role="tabpanel" aria-labelledby={`lekcje-tab-${cel.widok}`}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }} onAnimationComplete={() => ScrollTrigger.refresh()}>
          {cel.widok === "sciezka" ? <SciezkaLekcje /> : <Kursy key={cel.n} start={cel.kurs} />}
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
      Otwórz materiały<ExternalLink className="size-4" aria-hidden="true" /><span className="sr-only"> (w nowej karcie)</span>
    </a>
  );
}

function Zalaczniki({ list }: { list: string[] }) {
  return (
    <div className="flex max-w-3xl flex-wrap items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-1.5 font-semibold text-white/70"><Paperclip className="size-4" aria-hidden="true" />Materiały do lekcji:</span>
      {list.map((a) => <span key={a} className="rounded-full border border-white/15 px-2.5 py-0.5 text-white/75">{a}</span>)}
    </div>
  );
}

function Postep({ done, total, className = "" }: { done: number; total: number; className?: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <span className="block h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </span>
      <span className="shrink-0 text-xs tabular-nums text-white/60"><strong className="text-white/85">{done}/{total}</strong> zaliczonych</span>
    </div>
  );
}

/** Siatka „jak na mapie” w tle okładek zastępczych. */
function PosterGrid() {
  return <div aria-hidden="true" className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,transparent,#000_60%)] [transform:perspective(400px)_rotateX(35deg)_scale(1.6)] [transform-origin:50%_100%]" />;
}

/** Okładka zastępcza (lekcja bez nagrania albo miniatura się nie wczytała): kolor, siatka i duża ikona. */
function Zastepcza({ tint, children }: { tint: string; children?: ReactNode }) {
  return (
    <div aria-hidden="true" className="absolute inset-0"
      style={{ background: `radial-gradient(110% 90% at 15% 0%, ${tint}88, transparent 60%), radial-gradient(80% 70% at 100% 100%, #dd993322, transparent 60%), linear-gradient(160deg, #0d1d0e, #030805)` }}>
      <PosterGrid />
      {children}
    </div>
  );
}

/**
 * Miniatura filmu. Zwykły <img> z loading="lazy" (przy 179 lekcjach ładują się tylko karty blisko ekranu), bez iframe.
 * Gdy nie ma adresu albo obrazek się nie wczyta, pokazuje okładkę zastępczą.
 */
function Klatka({ src, eager, fallback }: { src?: string; eager?: boolean; fallback: ReactNode }) {
  const [blad, setBlad] = useState(false);
  if (!src || blad) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- miniatury z cdn.loom.com / i.ytimg.com: stały rozmiar, lazy, bez optymalizacji Next
    <img src={src} alt="" width={640} height={360} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} onError={() => setBlad(true)}
      className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
  );
}

function CenterIcon({ video, big }: { video: boolean; big?: boolean }) {
  const Icon = video ? Play : ExternalLink;
  return (
    <span className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-neutral-950 shadow-[0_10px_40px_-5px_rgba(0,0,0,.7)] transition-transform duration-300 group-hover:scale-110 ${big ? "size-20" : "size-14"}`}>
      <Icon className={`${big ? "size-8" : "size-6"} ${video ? "translate-x-0.5 fill-current" : ""}`} aria-hidden="true" />
    </span>
  );
}

const CHIP = "absolute rounded-full px-2.5 py-1 text-[11px] font-extrabold";

/** Okładka karty lekcji: miniatura filmu, przycisk odtwarzania, czas nagrania i stan (zaliczona / +XP / zablokowana). */
function Okladka({ src, duration, video, done, xp, label, badge, big, eager, fallback, locked }: {
  src?: string; duration?: number; video: boolean; done: boolean; xp: boolean; label?: string; badge?: string;
  big?: boolean; eager?: boolean; fallback: ReactNode; locked?: string;
}) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-[#061008]">
      <Klatka key={src} src={src} eager={eager} fallback={fallback} />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/0 to-black/35" />
      {label ? <span className="absolute left-3 top-3 max-w-[60%] truncate rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">{label}</span> : null}
      {done ? (
        <span className={`${CHIP} right-3 top-3 inline-flex items-center gap-1 bg-brand text-brand-ink`}><Check className="size-3.5" aria-hidden="true" />Zaliczona</span>
      ) : xp ? (
        <span className={`${CHIP} right-3 top-3 bg-orange text-neutral-950`}>+{XP.lesson} XP</span>
      ) : null}
      <CenterIcon video={video} big={big} />
      {badge ? <span className="absolute bottom-3 left-3 max-w-[60%] truncate rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-white/90">{badge}</span> : null}
      {duration ? (
        <span className="absolute bottom-3 right-3 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-bold tabular-nums text-white"><span className="sr-only">Czas nagrania: </span>{czas(duration)}</span>
      ) : !video ? (
        <span className="absolute bottom-3 right-3 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-extrabold text-neutral-950">Materiały</span>
      ) : null}
      <span className="absolute inset-x-0 bottom-0 h-1 bg-white/10"><span className={`block h-full ${done ? "w-full bg-brand" : "w-0"}`} /></span>
      {locked ? (
        <span className="absolute inset-0 grid place-items-center bg-[#030805]/75 backdrop-blur-[3px]">
          <span className="flex flex-col items-center gap-2 text-center text-sm text-white/80">
            <span className="grid size-12 place-items-center rounded-full bg-white/10"><Lock className="size-5" aria-hidden="true" /></span>
            {locked}
          </span>
        </span>
      ) : null}
    </div>
  );
}

/** Logika odtwarzacza „wyrastającego” z karty: wejście (Flip), zamknięcie, Escape, blokada przewijania strony. */
function usePlayer(id: string, enterRef: React.RefObject<Flip.FlipState | null>, onClose: (state: Flip.FlipState, id: string) => void, focus: React.RefObject<HTMLButtonElement | null>) {
  const thumb = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  useLayoutEffect(() => {
    const reduce = bezRuchu();
    const st = enterRef.current;
    enterRef.current = null;
    const el = thumb.current;
    // Po animacji Flip zdejmujemy wpisane w style rozmiary i przekształcenia, żeby odtwarzacz zawsze miał szerokość ekranu.
    if (st && el && !reduce) Flip.from(st, { targets: el, duration: 0.75, ease: "expo.inOut", scale: true, zIndex: 90, onComplete: () => { gsap.set(el, { clearProps: "all" }); } });
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

/** Odtwarzacz wyrastający z miniatury karty (GSAP Flip) i wracający na miejsce; `prefix` = początek data-flip-id miniatur. */
function usePlayerFlip(prefix: string) {
  const [open, setOpen] = useState<string | null>(null);
  const flipOpen = useRef<Flip.FlipState | null>(null);
  const flipClose = useRef<{ state: Flip.FlipState; id: string } | null>(null);
  const source = useRef<Element | null>(null);

  const openLesson = (id: string, from: Element | null) => {
    source.current = from;
    flipOpen.current = from ? Flip.getState(from) : null;
    setOpen(id);
    play("tap");
  };
  /** Następna lekcja bez zamykania odtwarzacza. */
  const switchTo = (id: string) => {
    source.current = null;
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
    const target = source.current?.isConnected ? source.current : document.querySelector(`[data-flip-id="${prefix}-${back.id}"]`);
    source.current = null;
    if (target && (target as HTMLElement).offsetParent) Flip.from(back.state, { targets: target, duration: 0.6, ease: "expo.inOut", scale: true, zIndex: 40, onComplete: () => { gsap.set(target, { clearProps: "all" }); } });
  }, [open, prefix]);

  return { open, openLesson, switchTo, closeLesson, flipOpen };
}

/** Filtr z GSAP Flip: zapamiętaj ułożenie kart, zmień filtr, a Flip płynnie przestawi karty. */
function useFlipFilter<F extends string>(initial: F, cardSelector: string) {
  const [filter, setFilter] = useState<F>(initial);
  const grid = useRef<HTMLUListElement>(null);
  const flipFilter = useRef<Flip.FlipState | null>(null);

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
      onComplete: () => {
        // bez resztek układu z Flip (absolute): karta wraca do szerokości kolumny
        if (grid.current) gsap.set(grid.current.querySelectorAll(cardSelector), { clearProps: "position,top,left,width,height" });
        ScrollTrigger.refresh();
      },
    });
  }, [filter, cardSelector]);

  return { filter, choose, grid };
}

/** Karty wjeżdżają przy przewijaniu; `hero` = selektor elementu, którego dzieci wjeżdżają na start. */
function useCardsIn(scope: React.RefObject<HTMLDivElement | null>, cardSelector: string, hero?: string, deps: unknown[] = []) {
  useGSAP(
    () => {
      if (bezRuchu()) return;
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

/** Odtwarzacz lekcji (ścieżka i kursy). Iframe z wideo powstaje dopiero tutaj; pod nim miniatura, dopóki film się nie wczyta. */
function Odtwarzacz({ id, flipId, title, eyebrow, sub, video, thumb: miniaturaFilmu, duration, opis, attachments, skool, done, poster, enterRef, onClose, onDone, onUndo, link, next }: {
  id: string;
  flipId: string;
  title: string;
  eyebrow: string;
  sub?: string;
  video?: string;
  thumb?: string;
  duration?: number; // czas nagrania w s: krótkie nagranie = krótszy próg „Obejrzane”
  opis?: string;
  attachments?: string[];
  skool?: string;
  done: boolean;
  poster: ReactNode;
  enterRef: React.RefObject<Flip.FlipState | null>;
  onClose: (state: Flip.FlipState, id: string) => void;
  onDone: () => void;
  onUndo?: () => void; // tylko gdy lekcja jest odhaczona ręcznie (zaliczona przez zatwierdzony krok nie ma „Cofnij”)
  link?: { href: string; label: string };
  next?: { title: string; go: () => void };
}) {
  // Fokus startuje na „Zamknij”, nie na „Obejrzane” (jedno Enter nie zalicza lekcji).
  const closeBtn = useRef<HTMLButtonElement>(null);
  const { thumb, shade, panel, close } = usePlayer(id, enterRef, onClose, closeBtn);
  const need = watchSeconds(video ? duration : undefined);
  const left = useWatchCountdown(id, need, !done);
  const label = video ? "Obejrzane" : "Zaliczone";

  // „Następna lekcja” podmienia treść w otwartym odtwarzaczu: krótki wjazd opisu.
  const poprzednia = useRef(id);
  useEffect(() => {
    if (poprzednia.current === id) return;
    poprzednia.current = id;
    if (!bezRuchu()) gsap.fromTo(panel.current?.children ?? [], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power3.out" });
  }, [id, panel]);

  return (
    <div className="fixed inset-0 z-[75] overflow-y-auto overflow-x-hidden overscroll-contain">
      <div ref={shade} aria-hidden="true" onClick={close} className="fixed inset-0 bg-[#020904] md:bg-[#020904]/85 md:backdrop-blur-md" />
      <div role="dialog" aria-modal="true" aria-labelledby="lekcja-h" className="relative mx-auto flex min-h-full w-full min-w-0 max-w-4xl flex-col gap-5 pb-8 pt-[4.25rem] md:justify-center md:px-8 md:pb-8 md:pt-20">
        {/* Zamknij: zawsze widoczny, przypięty w prawym górnym rogu ekranu (na telefonie nad filmem) */}
        <button ref={closeBtn} type="button" onClick={close} aria-label="Zamknij lekcję"
          className="fixed right-3 top-3 z-10 inline-flex min-h-11 items-center gap-2 rounded-xl bg-black/75 px-3.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-md hover:bg-white/15 md:right-6 md:top-6">
          <X className="size-5" aria-hidden="true" />Zamknij
        </button>
        <div ref={thumb} data-flip-id={flipId} className="w-full overflow-hidden bg-black md:rounded-3xl md:border md:border-white/10 md:shadow-[0_40px_120px_-30px_rgba(0,0,0,.9)]">
          {video ? (
            <div className="relative aspect-video w-full">
              {miniaturaFilmu ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura pod ładującym się filmem
                <img src={miniaturaFilmu} alt="" width={1280} height={720} decoding="async" className="absolute inset-0 size-full object-cover" />
              ) : null}
              <iframe key={video} src={video} title={title} allow={IFRAME_ALLOW} allowFullScreen loading="lazy" className="absolute inset-0 size-full" />
            </div>
          ) : (
            <div className="relative">
              {poster}
              <span className="absolute inset-x-0 bottom-5 px-4 text-center text-sm text-white/85">{skool ? "Ta lekcja nie ma nagrania — otwórz materiały." : "Nagranie w przygotowaniu."}</span>
            </div>
          )}
        </div>
        <div ref={panel} className="flex min-w-0 flex-col gap-4 px-4 md:px-0">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
            <h2 id="lekcja-h" className="mt-1 text-2xl font-extrabold md:text-3xl">{title}</h2>
            {sub ? <p className="text-white/60">{sub}</p> : null}
          </div>
          {opis ? <p className="max-w-3xl text-base leading-relaxed text-white/80">{opis}</p> : null}
          {attachments?.length ? <Zalaczniki list={attachments} /> : null}
          {!done && left > 0 ? <p className="text-xs text-white/55">„{label}” włączy się po {need} s z otwartą lekcją.</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            {done ? (
              <>
                <span className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand/15 px-5 font-extrabold text-brand"><Check className="size-5" aria-hidden="true" />Lekcja zaliczona</span>
                {onUndo ? <button type="button" onClick={onUndo} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white">Cofnij</button> : null}
              </>
            ) : (
              <button type="button" disabled={left > 0} onClick={() => { onDone(); close(); }}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand px-6 text-base font-extrabold text-brand-ink shadow-[0_6px_0_0_rgba(0,0,0,.35)] transition-transform active:translate-y-[3px] active:shadow-[0_3px_0_0_rgba(0,0,0,.35)] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/70 disabled:shadow-none disabled:active:translate-y-0">
                {left > 0
                  ? <><Clock className="size-5" aria-hidden="true" />{label} za <span className="tabular-nums">{countdown(left)}</span></>
                  : <><Check className="size-5" aria-hidden="true" />{label} · +{XP.lesson} XP</>}
              </button>
            )}
            {skool ? <SkoolLink href={skool} strong={!video} /> : null}
            {link ? (
              <Link href={link.href} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/20 px-5 font-semibold hover:bg-white/10">
                {link.label}<ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
          {next ? (
            <button type="button" onClick={next.go} className="group flex w-full max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left hover:border-brand/40 hover:bg-white/[0.07]">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-brand"><Play className="size-4 translate-x-px fill-current" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-white/50">Następna lekcja w module</span>
                <strong className="block truncate">{next.title}</strong>
              </span>
              <ArrowRight className="size-5 shrink-0 text-white/50 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ——— „Twoja ścieżka”: lekcje kroków właściciela (XP, blokady jak kroki) ———

function SciezkaLekcje() {
  const { ready, state, markWatched, toggleWatched } = useJourney();
  const root = useRef<HTMLDivElement>(null);
  const { filter, choose, grid } = useFlipFilter<Filter>("all", "[data-card]");
  const { open, openLesson, closeLesson, flipOpen } = usePlayerFlip("thumb");

  const statuses = stepStatuses(state);
  const lp = lessonProgress(state); // te same liczby co na pulpicie („Lekcje ścieżki”)
  const items: Item[] = allLessons().map((lesson, i) => {
    const step = STEPS.find((s) => s.lessons.some((l) => l.id === lesson.id)) ?? STEPS[0];
    const status: Status = lessonDone(state, lesson.id) ? "done" : statuses[step.id] === "locked" ? "locked" : "open";
    const k = lesson.ref ? ITEM.get(lesson.ref) : undefined;
    const gdzie = k ? `${k.kurs.title} · ${k.modul.title}` : lesson.source.replace(/^Skool · /, "") /* starszy zapis źródła */;
    return { lesson, no: i + 1, step, phase: PHASES.indexOf(step.phase), status, ...wideoLekcji(lesson), gdzie };
  });
  const count = (f: Filter) => items.filter((it) => match(it, f)).length;
  const { done, total, pct } = lp.path;
  const nextUp = items.find((it) => it.status === "open");
  const streak = streakDays(state.events);

  useCardsIn(root, "[data-card]", "[data-hero]", [ready]);

  if (!ready) return <p className="text-white/70">Wczytuję…</p>;
  const current = items.find((it) => it.lesson.id === open) ?? null;

  return (
    <div ref={root} className="flex flex-col gap-8">
      {/* GÓRA: postęp + następna lekcja */}
      <section data-hero className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="glass-card flex flex-col justify-between gap-6 rounded-3xl p-6 md:p-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Twoje lekcje</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">Jedna lekcja dziennie.<br /><span className="text-white/60">Tyle wystarczy.</span></h2>
          </div>
          <div className="flex items-center gap-5">
            <Ring value={pct} size={120} stroke={11} label="Zaliczone lekcje ścieżki" sub="zaliczone" />
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2"><PlayCircle className="size-4 text-brand" aria-hidden="true" /><strong className="tabular-nums">{done}/{total}</strong> lekcji ścieżki</li>
              <li className="flex items-center gap-2"><Zap className="size-4 text-orange" aria-hidden="true" /><strong className="tabular-nums">{lp.xp}</strong> XP z lekcji</li>
              <li className="flex items-center gap-2"><Flame className="size-4 text-orange" aria-hidden="true" /><strong className="tabular-nums">{streak}</strong> {streak === 1 ? "dzień" : "dni"} z rzędu</li>
            </ul>
          </div>
        </div>

        {nextUp ? (
          <motion.button type="button" onClick={(e) => openLesson(nextUp.lesson.id, e.currentTarget.querySelector("[data-flip-id]"))} whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-orange/40 bg-[#0a150b] text-left shadow-[0_0_80px_-30px_rgba(221,153,51,.6)]"
            aria-label={`Następna lekcja: ${nextUp.lesson.title}. Otwórz`}>
            <div data-flip-id={`thumb-${nextUp.lesson.id}`} className="relative" style={{ visibility: open === nextUp.lesson.id ? "hidden" : undefined }}>
              <SciezkaOkladka item={nextUp} big eager />
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <span className="min-w-0">
                <span className="text-xs font-extrabold tracking-wider text-orange">NASTĘPNA LEKCJA</span>
                <strong className="mt-0.5 block truncate text-xl">{nextUp.lesson.title}</strong>
                <span className="block truncate text-sm text-white/60">Krok {nextUp.step.no}: {nextUp.step.title} · {nextUp.gdzie}</span>
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
      <ul ref={grid} className="relative grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => (
          <li key={it.lesson.id} data-card className={match(it, filter) ? "" : "hidden"}>
            <Card item={it} hidden={open === it.lesson.id} onOpen={(el) => openLesson(it.lesson.id, el)} />
          </li>
        ))}
      </ul>
      {count(filter) === 0 ? <p className="text-white/60">Nic tu jeszcze nie ma.</p> : null}

      <a href="#kursy" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex w-fit items-center gap-2 text-sm text-white/60 hover:text-white">
        <Library className="size-4" aria-hidden="true" />Cały program: {lekcji(WSZYSTKIE_LEKCJE.length)} z {kursow(KURSY.length)} w zakładce „Kursy”<ArrowRight className="size-4" aria-hidden="true" />
      </a>

      {current
        ? createPortal(
            <Odtwarzacz id={current.lesson.id} flipId={`thumb-${current.lesson.id}`} title={current.lesson.title}
              eyebrow={`Krok ${current.step.no}: ${current.step.title}`}
              sub={`${current.gdzie}${current.duration ? ` · ${czas(current.duration)}` : ""}`}
              video={current.lesson.video} thumb={current.thumb} duration={current.duration} opis={current.lesson.opis} attachments={current.lesson.attachments} skool={current.lesson.skool}
              done={current.status === "done"} poster={<SciezkaOkladka item={{ ...current, status: current.status === "done" ? "done" : "open" }} big />}
              enterRef={flipOpen} onClose={closeLesson}
              onDone={() => markWatched([current.lesson.id])} onUndo={state.watched[current.lesson.id] ? () => toggleWatched(current.lesson.id) : undefined}
              link={{ href: `/krok/${current.step.id}`, label: `Przejdź do kroku ${current.step.no}` }} />,
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

function SciezkaOkladka({ item, big, eager }: { item: Item; big?: boolean; eager?: boolean }) {
  return (
    <Okladka src={item.thumb} duration={item.duration} video={!!item.lesson.video} done={item.status === "done"} xp={item.status === "open"}
      label={`Lekcja ${item.no}`} big={big} eager={eager} locked={item.status === "locked" ? `Odblokuje się w kroku ${item.step.no}` : undefined}
      fallback={
        <Zastepcza tint={TINT[item.phase % TINT.length]}>
          <StepIcon id={item.step.id} className={`absolute -bottom-6 -right-4 text-white/15 ${big ? "size-48" : "size-36"}`} />
        </Zastepcza>
      } />
  );
}

function Card({ item, hidden, onOpen }: { item: Item; hidden: boolean; onOpen: (thumb: Element | null) => void }) {
  const locked = item.status === "locked";
  const body = (
    <>
      <div data-flip-id={`thumb-${item.lesson.id}`} style={{ visibility: hidden ? "hidden" : undefined }} className="overflow-hidden rounded-2xl">
        <SciezkaOkladka item={item} />
      </div>
      <div className="flex flex-col gap-1 px-1 pt-3">
        <span className="text-xs font-semibold text-white/50">Krok {item.step.no}: {item.step.title}</span>
        <strong className="text-lg leading-snug">{item.lesson.title}</strong>
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-white/50"><BookOpen className="size-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{item.gdzie}</span></span>
        {item.lesson.opis ? <span className="line-clamp-2 text-sm text-white/60">{item.lesson.opis}</span> : null}
      </div>
    </>
  );
  if (locked) return <div className="opacity-80" aria-label={`${item.lesson.title}: zablokowana, odblokuje się w kroku ${item.step.no}`}>{body}</div>;
  return (
    <motion.button type="button" onClick={(e) => onOpen(e.currentTarget.querySelector("[data-flip-id]"))} whileHover={{ y: -6 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 26 }}
      className="group block w-full text-left" aria-label={`${item.lesson.title}, ${item.gdzie}${item.duration ? `, ${czas(item.duration)}` : ""}${item.status === "done" ? " (zaliczona)" : ""}. Otwórz lekcję`}>
      {body}
    </motion.button>
  );
}

// ——— „Kursy”: wszystkie kursy ze Skool w tej samej kolejności. Kurs → moduły → lekcje. ———
// Przejścia między poziomami: GSAP Flip na okładce (karta kursu → nagłówek kursu, karta modułu → nagłówek modułu i z powrotem),
// reszta treści wjeżdża (nowe elementy z data-wjazd). Odtwarzacz wyrasta z miniatury karty jak w ścieżce.

function Kursy({ start }: { start: string | null }) {
  const { state, markWatched, toggleWatched } = useJourney();
  const root = useRef<HTMLDivElement>(null);
  const [nav, setNav] = useState<Nav>({ kurs: start && KURSY.some((k) => k.id === start) ? start : null, modul: null });
  const navFlip = useRef<{ state: Flip.FlipState | null; ids: Set<string> } | null>(null);
  const widziane = useRef(new WeakSet<Element>());
  const { open, openLesson, switchTo, closeLesson, flipOpen } = usePlayerFlip("lib");

  // „Zaliczona” = lessonDone() (to samo co pulpit i kamienie milowe); id kursu łączy się z lekcją kroku przez pole ref.
  const watched = (t: KursItem) => lessonDone(state, t.id);
  const zaliczone = (list: KursItem[]) => lessonTally(state, list.map((t) => t.id)).done;
  const nastepna = (list: KursItem[]) => list.find((t) => !watched(t) && t.lesson.video) ?? list.find((t) => !watched(t));

  /** Przejście między poziomami: zapamiętaj okładki (Flip), zmień widok. */
  const go = (next: Nav) => {
    if (next.kurs === nav.kurs && next.modul === nav.modul) return;
    const els = root.current ? [...root.current.querySelectorAll<HTMLElement>("[data-nav-flip]")] : [];
    navFlip.current = {
      state: els.length && !bezRuchu() ? Flip.getState(els) : null,
      ids: new Set(els.map((e) => e.dataset.flipId ?? "")),
    };
    setNav(next);
    play("tap");
  };

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const przejscie = navFlip.current;
      navFlip.current = null;
      // po przejściu: początek sekcji na ekranie (gdy karta była niżej na stronie)
      if (przejscie) {
        const top = el.getBoundingClientRect().top;
        if (top < 0) window.scrollTo({ top: window.scrollY + top - 96, behavior: "instant" });
      }
      const nowe = gsap.utils.toArray<HTMLElement>("[data-wjazd]", el).filter((e) => !widziane.current.has(e));
      nowe.forEach((e) => widziane.current.add(e));
      if (bezRuchu()) return;
      if (przejscie?.state) Flip.from(przejscie.state, { targets: el.querySelectorAll("[data-nav-flip]"), duration: 0.65, ease: "expo.inOut", scale: true, zIndex: 20 });
      // element z okładką, która właśnie „leci” (Flip), nie wjeżdża osobno
      const wjazd = nowe.filter((e) => ![...e.querySelectorAll<HTMLElement>("[data-nav-flip]")].some((f) => przejscie?.ids.has(f.dataset.flipId ?? "")));
      if (wjazd.length) gsap.fromTo(wjazd, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.045, ease: "power3.out", delay: przejscie ? 0.15 : 0, clearProps: "opacity,transform" });
    },
    { scope: root, dependencies: [nav.kurs, nav.modul] },
  );

  const k = nav.kurs ? KURSY.find((x) => x.id === nav.kurs) ?? null : null;
  const m = k && nav.modul ? k.modules.find((x) => x.id === nav.modul) ?? null : null;
  const current = open ? ITEM.get(open) ?? null : null;
  const lekcjeOtwartegoModulu = current ? lekcjeModulu(current.kurs, current.modul) : [];
  const dalej = current ? lekcjeOtwartegoModulu[lekcjeOtwartegoModulu.indexOf(current) + 1] : undefined;

  return (
    <div ref={root} className="flex flex-col gap-8">
      {!k ? (
        <ListaKursow postep={lessonProgress(state).courses} zaliczone={zaliczone} nastepna={nastepna} open={open}
          onKurs={(id) => go({ kurs: id, modul: null })} onLekcja={openLesson} />
      ) : (
        <WidokKursu kurs={k} modul={m} watched={watched} zaliczone={zaliczone} nastepna={nastepna} open={open}
          go={go} onLekcja={openLesson} />
      )}

      {current
        ? createPortal(
            <Odtwarzacz id={current.id} flipId={`lib-${current.id}`} title={current.lesson.title}
              eyebrow={`${current.kurs.title} · ${current.modul.title}`}
              sub={`Lekcja ${current.no} z ${lekcjeOtwartegoModulu.length}${current.lesson.sekcja ? ` · ${current.lesson.sekcja}` : ""}${current.lesson.duration ? ` · ${czas(current.lesson.duration)}` : ""}`}
              video={current.lesson.video} thumb={miniatura(current.lesson)} duration={current.lesson.duration} opis={current.lesson.opis} attachments={current.lesson.attachments} skool={current.lesson.skool}
              done={watched(current)} poster={<LekcjaOkladka item={current} watched={watched(current)} big />}
              enterRef={flipOpen} onClose={closeLesson}
              onDone={() => markWatched([current.watchId])} onUndo={state.watched[current.watchId] ? () => toggleWatched(current.watchId) : undefined}
              link={current.step ? { href: `/krok/${current.step.id}`, label: `Krok ${current.step.no} ścieżki` } : undefined}
              next={dalej ? { title: dalej.lesson.title, go: () => switchTo(dalej.id) } : undefined} />,
            document.body,
          )
        : null}
    </div>
  );
}

type Postepy = {
  watched: (t: KursItem) => boolean;
  zaliczone: (list: KursItem[]) => number;
  nastepna: (list: KursItem[]) => KursItem | undefined;
  open: string | null;
  onLekcja: (id: string, from: Element | null) => void;
};

/** Poziom 1: wszystkie kursy (kolejność ze Skool) + „Kontynuuj”. */
function ListaKursow({ postep, zaliczone, nastepna, open, onKurs, onLekcja }: Omit<Postepy, "watched"> & { postep: LessonTally; onKurs: (id: string) => void }) {
  const { done, total, pct } = postep; // „Lekcje kursów”: lessonProgress(state).courses
  const dalej = nastepna(WSZYSTKIE_ITEMY);

  return (
    <>
      <section className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div data-wjazd className="glass-card flex flex-col justify-between gap-6 rounded-3xl p-6 md:p-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Kursy</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">Cały program.<br /><span className="text-white/60">Krok po kroku.</span></h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
              Na początku studio często prowadzi się w pojedynkę, potem przychodzi czas na szkolenie trenerów i zespół.
              Dlatego kursy, moduły i lekcje idą po kolei: od pierwszego kroku aż po własny zespół.
            </p>
          </div>
          <div className="flex items-center gap-5">
            <Ring value={pct} size={112} stroke={10} label="Zaliczone lekcje z kursów" sub="zaliczone" />
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2"><PlayCircle className="size-4 text-brand" aria-hidden="true" /><strong className="tabular-nums">{done}/{total}</strong> lekcji kursów</li>
              <li className="flex items-center gap-2"><Clock className="size-4 text-brand" aria-hidden="true" /><strong>{czasRazem(sekundy(WSZYSTKIE_ITEMY))}</strong> nagrań</li>
              <li className="flex items-center gap-2"><Zap className="size-4 text-orange" aria-hidden="true" />+{XP.lesson} XP za lekcję</li>
            </ul>
          </div>
        </div>

        {dalej ? (
          <motion.button data-wjazd type="button" onClick={(e) => onLekcja(dalej.id, e.currentTarget.querySelector("[data-flip-id]"))} whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-orange/40 bg-[#0a150b] text-left shadow-[0_0_80px_-30px_rgba(221,153,51,.6)]"
            aria-label={`${done ? "Kontynuuj" : "Zacznij"}: ${dalej.lesson.title}, ${dalej.kurs.title}, ${dalej.modul.title}. Otwórz`}>
            <div data-flip-id={`lib-${dalej.id}`} className="relative" style={{ visibility: open === dalej.id ? "hidden" : undefined }}>
              <LekcjaOkladka item={dalej} watched={false} big eager />
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <span className="min-w-0">
                <span className="text-xs font-extrabold tracking-wider text-orange">{done ? "KONTYNUUJ" : "ZACZNIJ OD"}</span>
                <strong className="mt-0.5 block truncate text-xl">{dalej.lesson.title}</strong>
                <span className="block truncate text-sm text-white/60">{dalej.kurs.title} · {dalej.modul.title}</span>
              </span>
              <span className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-2xl bg-orange px-5 font-extrabold text-neutral-950 shadow-[0_5px_0_0_rgba(0,0,0,.35)] transition group-hover:gap-3">
                <Play className="size-4 fill-current" aria-hidden="true" />Oglądam
              </span>
            </div>
          </motion.button>
        ) : (
          <div data-wjazd className="glass-card grid place-items-center rounded-3xl p-8 text-center">
            <div>
              <Check className="mx-auto size-12 text-brand" aria-hidden="true" />
              <p className="mt-3 text-xl font-bold">Wszystkie lekcje z kursów zaliczone</p>
              <p className="text-white/65">Do każdej można wrócić w dowolnej chwili.</p>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="kursy-h" className="flex flex-col gap-4">
        <h2 id="kursy-h" data-wjazd className="text-xl font-extrabold">Wszystkie kursy <span className="font-semibold text-white/50">· {kursow(KURSY.length)}, po kolei</span></h2>
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2">
          {KURSY.map((kurs, i) => {
            const list = KURS_ITEMS[kurs.id];
            const d = zaliczone(list);
            return (
              <li key={kurs.id} data-wjazd>
                <motion.button type="button" onClick={() => onKurs(kurs.id)} whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 26 }}
                  className="group glass-card flex h-full w-full flex-col overflow-hidden rounded-3xl text-left"
                  aria-label={`Kurs ${i + 1}: ${kurs.title}. ${modulow(kurs.modules.length)}, ${lekcji(list.length)}, zaliczone ${d} z ${list.length}. Otwórz kurs`}>
                  <div data-nav-flip data-flip-id={`kurs-${kurs.id}`} className="relative aspect-video w-full overflow-hidden bg-[#061008]">
                    <KursOkladka kurs={kurs} no={i + 1} done={d === list.length} />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <strong className="text-xl font-extrabold leading-tight">{kurs.title}</strong>
                    <span className="line-clamp-2 text-sm text-white/60">{kurs.opis}</span>
                    <span className="flex flex-wrap items-center gap-x-2 text-xs text-white/55">
                      {modulow(kurs.modules.length)}<span aria-hidden="true">·</span>{lekcji(list.length)}<span aria-hidden="true">·</span>{czasRazem(sekundy(list))} nagrań
                    </span>
                    <Postep done={d} total={list.length} className="mt-auto pt-2" />
                  </div>
                </motion.button>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}

/** Poziomy 2 i 3: kurs (lista modułów) albo moduł (lekcje). */
function WidokKursu({ kurs, modul, watched, zaliczone, nastepna, open, go, onLekcja }: Postepy & { kurs: Kurs; modul: ModulKursu | null; go: (n: Nav) => void }) {
  const no = KURSY.indexOf(kurs) + 1;
  const list = KURS_ITEMS[kurs.id];
  const d = zaliczone(list);
  const dalej = nastepna(list);
  const Icon = KURS_IKONA[kurs.id] ?? BookOpen;
  const mi = modul ? kurs.modules.indexOf(modul) : -1;
  const pills = useRef<HTMLDivElement>(null);

  // aktywny moduł widoczny na pasku modułów (przewija się w bok)
  useEffect(() => {
    const row = pills.current;
    const pill = row?.querySelector<HTMLElement>("[aria-selected=true]");
    if (row && pill) row.scrollTo({ left: pill.offsetLeft - row.clientWidth / 2 + pill.clientWidth / 2, behavior: bezRuchu() ? "auto" : "smooth" });
  }, [modul]);

  return (
    <>
      <nav aria-label="Gdzie jestem" className="-mb-3 flex min-w-0 flex-wrap items-center gap-1 text-sm">
        <button type="button" onClick={() => go({ kurs: null, modul: null })} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 font-semibold text-white/70 hover:bg-white/10 hover:text-white">
          <ArrowLeft className="size-4" aria-hidden="true" />Wszystkie kursy
        </button>
        <ChevronRight className="size-4 text-white/30" aria-hidden="true" />
        {modul ? (
          <>
            <button type="button" onClick={() => go({ kurs: kurs.id, modul: null })} className="inline-flex min-h-10 items-center rounded-xl px-2 font-semibold text-white/70 hover:bg-white/10 hover:text-white">{kurs.title}</button>
            <ChevronRight className="size-4 text-white/30" aria-hidden="true" />
            <span aria-current="page" className="min-w-0 truncate px-2 font-semibold">{modul.title}</span>
          </>
        ) : (
          <span aria-current="page" className="px-2 font-semibold">{kurs.title}</span>
        )}
      </nav>

      {/* NAGŁÓWEK KURSU */}
      <section className="glass-card grid grid-cols-[minmax(0,1fr)] gap-5 rounded-3xl p-4 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:p-5">
        <div data-nav-flip data-flip-id={`kurs-${kurs.id}`} className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#061008]">
          <KursOkladka kurs={kurs} no={no} done={d === list.length} />
        </div>
        <div data-wjazd className="flex min-w-0 flex-col justify-center gap-3">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand"><Icon className="size-4" aria-hidden="true" />Kurs {no} z {KURSY.length}</p>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight md:text-3xl">{kurs.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/65">{kurs.opis}</p>
          </div>
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-white/60">
            {modulow(kurs.modules.length)}<span aria-hidden="true">·</span>{lekcji(list.length)}<span aria-hidden="true">·</span><Clock className="size-4" aria-hidden="true" />{czasRazem(sekundy(list))} nagrań
          </p>
          <Postep done={d} total={list.length} className="max-w-md" />
          {dalej ? (
            <button type="button" onClick={() => onLekcja(dalej.id, null)}
              className="inline-flex min-h-12 w-fit max-w-full items-center gap-2 rounded-2xl bg-brand px-5 font-extrabold text-brand-ink shadow-[0_5px_0_0_rgba(0,0,0,.35)] transition-transform active:translate-y-[3px] active:shadow-[0_2px_0_0_rgba(0,0,0,.35)]">
              <Play className="size-4 shrink-0 fill-current" aria-hidden="true" /><span className="shrink-0">{d ? "Kontynuuj:" : "Zacznij:"}</span><span className="truncate font-semibold">{dalej.lesson.title}</span>
            </button>
          ) : (
            <p className="inline-flex items-center gap-2 font-bold text-brand"><Check className="size-5" aria-hidden="true" />Kurs ukończony</p>
          )}
        </div>
      </section>

      {!modul ? (
        /* POZIOM 2: moduły kursu po kolei */
        <section aria-labelledby="moduly-h" className="flex flex-col gap-4">
          <h3 id="moduly-h" data-wjazd className="text-xl font-extrabold">Moduły <span className="font-semibold text-white/50">· {modulow(kurs.modules.length)}, po kolei</span></h3>
          <ol className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {kurs.modules.map((mod, i) => {
              const lekcje = lekcjeModulu(kurs, mod);
              const dm = zaliczone(lekcje);
              return (
                <li key={mod.id} data-wjazd>
                  <motion.button type="button" onClick={() => go({ kurs: kurs.id, modul: mod.id })} whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 26 }}
                    className="group glass-card flex h-full w-full flex-col overflow-hidden rounded-2xl text-left"
                    aria-label={`Moduł ${i + 1}: ${mod.title}. ${lekcji(lekcje.length)}, zaliczone ${dm} z ${lekcje.length}. Otwórz moduł`}>
                    <div data-nav-flip data-flip-id={`modul-${mod.id}`} className="relative aspect-video w-full overflow-hidden bg-[#061008]">
                      <ModulOkladka kurs={kurs} lekcje={lekcje} no={i + 1} done={dm === lekcje.length} />
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5 p-4">
                      <strong className="text-lg leading-snug">{mod.title}</strong>
                      <span className="line-clamp-2 text-sm text-white/60">{mod.opis}</span>
                      <Postep done={dm} total={lekcje.length} className="mt-auto pt-2" />
                    </div>
                  </motion.button>
                </li>
              );
            })}
          </ol>
        </section>
      ) : (
        /* POZIOM 3: lekcje modułu po kolei */
        <ModulLekcje kurs={kurs} modul={modul} mi={mi} watched={watched} zaliczone={zaliczone} open={open} go={go} onLekcja={onLekcja} pills={pills} />
      )}
    </>
  );
}

function ModulLekcje({ kurs, modul, mi, watched, zaliczone, open, go, onLekcja, pills }: Omit<Postepy, "nastepna"> & {
  kurs: Kurs; modul: ModulKursu; mi: number; go: (n: Nav) => void; pills: React.RefObject<HTMLDivElement | null>;
}) {
  const lekcje = lekcjeModulu(kurs, modul);
  const dm = zaliczone(lekcje);
  const poprzedni = kurs.modules[mi - 1];
  const nastepny = kurs.modules[mi + 1];

  return (
    <section aria-labelledby="modul-h" className="flex flex-col gap-6">
      {/* pasek modułów kursu (jak spis na Skool) */}
      <div ref={pills} role="tablist" aria-label={`Moduły kursu ${kurs.title}`} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        {kurs.modules.map((mod, i) => {
          const on = mod.id === modul.id;
          const l = lekcjeModulu(kurs, mod);
          return (
            <button key={mod.id} type="button" role="tab" aria-selected={on} onClick={() => go({ kurs: kurs.id, modul: mod.id })} title={mod.title}
              className={`relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold ${on ? "text-brand-ink" : "text-white/75 hover:text-white"}`}>
              {on ? <motion.span layoutId="kurs-modul-pill" className="absolute inset-0 rounded-full bg-brand" transition={{ type: "spring", stiffness: 420, damping: 32 }} /> : <span className="absolute inset-0 rounded-full border border-white/15" />}
              <span className="relative max-w-[15rem] truncate">{/^\d/.test(mod.title) ? mod.title : `${i + 1}. ${mod.title}`}</span>
              <span className={`relative rounded-full px-1.5 text-xs tabular-nums ${on ? "bg-black/15" : "bg-white/10"}`}>{zaliczone(l)}/{l.length}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div data-nav-flip data-flip-id={`modul-${modul.id}`} className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl bg-[#061008] sm:w-60">
          <ModulOkladka kurs={kurs} lekcje={lekcje} no={mi + 1} done={dm === lekcje.length} />
        </div>
        <div data-wjazd className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Moduł {mi + 1} z {kurs.modules.length}</p>
          <h3 id="modul-h" className="text-2xl font-extrabold leading-tight">{modul.title}</h3>
          <p className="max-w-2xl text-sm text-white/65">{modul.opis}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-white/55">{lekcji(lekcje.length)}{sekundy(lekcje) ? <><span aria-hidden="true">·</span><Clock className="size-4" aria-hidden="true" />{czasRazem(sekundy(lekcje))} nagrań</> : null}</p>
          <Postep done={dm} total={lekcje.length} className="max-w-md" />
        </div>
      </div>

      <ul className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {lekcje.map((t, i) => (
          <Fragment key={t.id}>
            {t.lesson.sekcja && t.lesson.sekcja !== lekcje[i - 1]?.lesson.sekcja ? (
              <li data-wjazd className="col-span-full flex items-center gap-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-brand">{t.lesson.sekcja}</h4>
                <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
              </li>
            ) : null}
            <li data-wjazd>
              <LekcjaKarta item={t} watched={watched(t)} hidden={open === t.id} onOpen={(el) => onLekcja(t.id, el)} />
            </li>
          </Fragment>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {poprzedni ? (
          <button type="button" onClick={() => go({ kurs: kurs.id, modul: poprzedni.id })} className="inline-flex min-h-12 max-w-full items-center gap-2 rounded-2xl border border-white/15 px-4 text-left text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white">
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">Poprzedni moduł: {poprzedni.title}</span>
          </button>
        ) : <span />}
        {nastepny ? (
          <button type="button" onClick={() => go({ kurs: kurs.id, modul: nastepny.id })} className="inline-flex min-h-12 max-w-full items-center gap-2 rounded-2xl bg-white px-5 text-left text-sm font-extrabold text-neutral-950 hover:bg-white/90">
            <span className="truncate">Następny moduł: {nastepny.title}</span><ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </button>
        ) : (
          <button type="button" onClick={() => go({ kurs: null, modul: null })} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-extrabold text-neutral-950 hover:bg-white/90">
            Koniec kursu · wszystkie kursy<ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}

const GRADIENT = <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/0 to-black/30" />;

/** Okładka kursu: klatka z pierwszego nagrania kursu, numer kursu jak na Skool. */
function KursOkladka({ kurs, no, done }: { kurs: Kurs; no: number; done: boolean }) {
  const Icon = KURS_IKONA[kurs.id] ?? BookOpen;
  const src = okladkaZ(KURS_ITEMS[kurs.id]);
  return (
    <>
      <Klatka key={src} src={src} eager fallback={<Zastepcza tint={TINT[(no - 1) % TINT.length]}><Icon aria-hidden="true" strokeWidth={1.25} className="absolute -bottom-6 -right-4 size-40 text-white/15" /></Zastepcza>} />
      {GRADIENT}
      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm"><Icon className="size-3.5 text-brand" aria-hidden="true" />Kurs {no}</span>
      {done ? <span className={`${CHIP} right-3 top-3 inline-flex items-center gap-1 bg-brand text-brand-ink`}><Check className="size-3.5" aria-hidden="true" />Ukończony</span> : null}
    </>
  );
}

/** Okładka modułu: klatka z pierwszego nagrania modułu, liczba lekcji i czas. */
function ModulOkladka({ kurs, lekcje, no, done }: { kurs: Kurs; lekcje: KursItem[]; no: number; done: boolean }) {
  const Icon = KURS_IKONA[kurs.id] ?? BookOpen;
  const src = okladkaZ(lekcje);
  const s = sekundy(lekcje);
  return (
    <>
      <Klatka key={src} src={src} fallback={<Zastepcza tint={TINT[(no - 1) % TINT.length]}><Icon aria-hidden="true" strokeWidth={1.25} className="absolute -bottom-6 -right-4 size-36 text-white/15" /></Zastepcza>} />
      {GRADIENT}
      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">Moduł {no}</span>
      {done ? <span className={`${CHIP} right-3 top-3 inline-flex items-center gap-1 bg-brand text-brand-ink`}><Check className="size-3.5" aria-hidden="true" />Ukończony</span> : null}
      <span className="absolute bottom-3 left-3 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white/90">{lekcji(lekcje.length)}</span>
      {s ? <span className="absolute bottom-3 right-3 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-bold tabular-nums text-white">{czasRazem(s)}</span> : null}
    </>
  );
}

function LekcjaOkladka({ item, watched, big, eager }: { item: KursItem; watched: boolean; big?: boolean; eager?: boolean }) {
  const Icon = KURS_IKONA[item.kurs.id] ?? BookOpen;
  return (
    <Okladka src={miniatura(item.lesson)} duration={item.lesson.duration} video={!!item.lesson.video} done={watched} xp
      label={`Lekcja ${item.no}`} badge={item.step ? `Krok ${item.step.no} ścieżki` : undefined} big={big} eager={eager}
      fallback={
        <Zastepcza tint={TINT[(item.modulNo - 1) % TINT.length]}>
          <Icon aria-hidden="true" strokeWidth={1.25} className={`absolute -bottom-6 -right-4 text-white/15 ${big ? "size-48" : "size-36"}`} />
        </Zastepcza>
      } />
  );
}

function LekcjaKarta({ item, watched, hidden, onOpen }: { item: KursItem; watched: boolean; hidden: boolean; onOpen: (thumb: Element | null) => void }) {
  const d = item.lesson.duration;
  return (
    <motion.button type="button" onClick={(e) => onOpen(e.currentTarget.querySelector("[data-flip-id]"))} whileHover={{ y: -6 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 26 }}
      className="group block w-full text-left"
      aria-label={`${item.lesson.title}. ${item.kurs.title}, ${item.modul.title}${d ? `, ${czas(d)}` : ""}${watched ? " (zaliczona)" : ""}${item.lesson.video ? "" : ", bez nagrania"}. Otwórz lekcję`}>
      <div data-flip-id={`lib-${item.id}`} style={{ visibility: hidden ? "hidden" : undefined }} className="overflow-hidden rounded-2xl">
        <LekcjaOkladka item={item} watched={watched} />
      </div>
      <div className="flex flex-col gap-1 px-1 pt-3">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-white/50"><BookOpen className="size-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{item.kurs.title} · {item.modul.title}</span></span>
        <strong className="text-lg leading-snug">{item.lesson.title}</strong>
        {item.lesson.opis ? <span className="line-clamp-2 text-sm text-white/60">{item.lesson.opis}</span> : null}
      </div>
    </motion.button>
  );
}
