"use client";

// Nagrody w stylu Duolingo (prośba Pawła 2026-11-27): dużo fanfar i odblokowań.
// - Drobne działanie (lekcja, szkic, ankieta): toast u góry z „dzyń” i licznikiem XP.
// - Duże (zatwierdzony krok, nowa odznaka, zamknięty etap, zdobyty kamień milowy, nowy poziom): pełny ekran, ekrany po kolei
//   z konfetti i fanfarą, a na końcu przycisk do odblokowanego kroku.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";
import confetti from "canvas-confetti";
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Flag, Lock, LockOpen, Sparkles, Trophy, Video, Zap, CalendarCheck } from "lucide-react";
import { useJourney, type Reward } from "@/lib/store";
import { play, type Sfx } from "@/lib/sfx";
import { AssistantAvatar } from "@/components/Assistant";
import { BadgeIcon } from "@/components/BadgeIcon";
import { CALENDAR } from "@/components/Milestones";
import type { Badge } from "@/lib/gamification";
import { flyXp } from "@/lib/fx";

gsap.registerPlugin(ScrambleTextPlugin, useGSAP);

const COLORS = ["#72c41c", "#ffffff", "#dd9933", "#1a7f2a", "#b5e86b"];
const short = (phase: string) => phase.replace(/\s*\(.*\)$/, "");

// Nagroda „30 minut z Bartkiem” = za kamienie milowe 2, 4 i 6 (MilestoneDef.call w gamification.ts), nie za etap ścieżki.
type Screen =
  | { type: "approve"; reward: Reward }
  | { type: "badge"; badge: Badge; xp?: number }
  | { type: "phase"; phase: string }
  | { type: "milestone"; no: number; title: string; call: boolean }
  | { type: "level"; index: number; name: string };

function screensOf(r: Reward): Screen[] {
  const out: Screen[] = [];
  if (r.kind === "approve") out.push({ type: "approve", reward: r });
  r.badges?.forEach((b, i) => out.push({ type: "badge", badge: b, xp: i === 0 && r.kind !== "approve" ? r.xp : undefined }));
  if (r.phase) out.push({ type: "phase", phase: r.phase });
  if (r.milestone) out.push({ type: "milestone", ...r.milestone });
  if (r.levelUp) out.push({ type: "level", index: r.levelUp.index, name: r.levelUp.name });
  return out;
}

export function Celebration() {
  const { reward, clearReward } = useJourney();
  const screens = reward ? screensOf(reward) : [];
  const big = screens.length > 0;
  return (
    <>
      <Toast reward={!big ? reward : null} onDone={clearReward} />
      <AnimatePresence>{big && reward ? <Fanfare key={reward.id} reward={reward} screens={screens} onDone={clearReward} /> : null}</AnimatePresence>
    </>
  );
}

/** Licznik, który „nabija” punkty od zera. */
function CountUp({ to, delay = 0 }: { to: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const c = animate(0, to, { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = `+${Math.round(v)}`; } });
    return () => c.stop();
  }, [to, delay]);
  return <span ref={ref}>+0</span>;
}

function Toast({ reward, onDone }: { reward: Reward | null; onDone: () => void }) {
  const icon = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!reward) return;
    play("xp");
    const fly = setTimeout(() => flyXp(icon.current), 180); // XP leci do licznika w nagłówku
    const t = setTimeout(onDone, 3000);
    return () => {
      clearTimeout(fly);
      clearTimeout(t);
    };
  }, [reward, onDone]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[85] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {reward ? (
          <motion.div key={reward.id}
            initial={{ opacity: 0, y: -40, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -24, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-orange/40 bg-[#0d1a0c] px-5 py-3.5 shadow-[0_20px_50px_-20px_rgba(221,153,51,.6)]">
            <motion.span ref={icon} initial={{ rotate: -25, scale: 0.4 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 12, delay: 0.1 }}
              className="grid size-11 place-items-center rounded-xl bg-orange text-neutral-950">
              <Zap className="size-6" aria-hidden="true" />
            </motion.span>
            <div>
              <p className="font-bold">{reward.title}</p>
              <p className="text-sm font-extrabold text-orange"><CountUp to={reward.xp} delay={0.15} /> XP</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Fanfare({ reward, screens, onDone }: { reward: Reward; screens: Screen[]; onDone: () => void }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const primary = useRef<HTMLElement>(null);
  const s = screens[i];
  const last = i === screens.length - 1;
  const next = useCallback(() => (last ? onDone() : setI((n) => n + 1)), [last, onDone]);

  // dźwięk + konfetti przy każdym ekranie
  useEffect(() => {
    const sfx: Sfx = s.type === "badge" ? "badge" : s.type === "level" ? "level" : "fanfare";
    play(sfx);
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (s.type === "approve" && s.reward.unlocked) timers.push(setTimeout(() => play("unlock"), 1100));
    if (s.type === "phase" || s.type === "milestone") timers.push(setTimeout(() => play("unlock"), 900));
    if (!reduce) {
      const burst = (x: number, n = 70) => confetti({ particleCount: n, spread: 80, startVelocity: 45, origin: { x, y: 0.7 }, colors: COLORS, zIndex: 95, disableForReducedMotion: true });
      if (s.type === "approve" || s.type === "phase" || s.type === "milestone") { burst(0.2); burst(0.8); }
      if (s.type === "level") { burst(0.5, 160); timers.push(setTimeout(() => { burst(0.15); burst(0.85); }, 350)); }
      if (s.type === "badge") confetti({ particleCount: 50, spread: 360, startVelocity: 25, gravity: 0.6, origin: { x: 0.5, y: 0.42 }, colors: ["#dd9933", "#f2c472", "#ffffff"], shapes: ["star"], scalar: 1.1, zIndex: 95, disableForReducedMotion: true });
    }
    primary.current?.focus({ preventScroll: true });
    return () => timers.forEach(clearTimeout);
  }, [s, reduce]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onDone(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  const unlocked = reward.unlocked;
  const btn = "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 text-base font-extrabold shadow-[0_6px_0_0_rgba(0,0,0,.35)] transition-transform active:translate-y-[3px] active:shadow-[0_3px_0_0_rgba(0,0,0,.35)] sm:w-auto";

  return (
    <motion.div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_40%,rgba(46,140,30,.35),transparent_70%),rgba(2,9,4,.86)] backdrop-blur-md" />
      <div role="dialog" aria-modal="true" aria-label="Nagroda" className="relative flex w-full max-w-md flex-col items-center text-center">
        <AnimatePresence mode="wait">
          <motion.div key={i} className="flex w-full flex-col items-center"
            initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -20, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}>
            {s.type === "approve" ? (
              <>
                <Burst tone="brand"><Check className="size-16" strokeWidth={3} aria-hidden="true" /></Burst>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-brand">Krok zatwierdzony</p>
                <h2 className="mt-1 text-3xl font-extrabold leading-tight">{s.reward.title.replace(/^Zatwierdzone:\s*/, "")}</h2>
                <p className="mt-3 text-5xl font-black text-orange"><CountUp to={s.reward.xp} delay={0.35} /> <span className="text-2xl">XP</span></p>
                {unlocked ? (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
                    className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-brand/40 bg-brand/10 p-4 text-left">
                    <UnlockIcon />
                    <span><span className="block text-xs font-bold uppercase tracking-wider text-brand">Odblokowano</span><strong>Krok {unlocked.no}: {unlocked.title}</strong></span>
                  </motion.div>
                ) : null}
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-5 flex items-center gap-3 text-left text-sm text-white/75">
                  <AssistantAvatar size={40} /> {unlocked ? "Brawo! Ten dokument już pracuje na Twoje studio. Idziemy za ciosem?" : "Brawo! Kawał dobrej roboty."}
                </motion.p>
              </>
            ) : s.type === "badge" ? (
              <>
                <Medal icon={s.badge.icon} />
                <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-orange">Nowa odznaka</p>
                <h2 className="mt-1 text-3xl font-extrabold">{s.badge.title}</h2>
                <p className="mt-2 text-white/75">{s.badge.desc}</p>
                {s.xp ? <p className="mt-3 text-xl font-black text-orange"><CountUp to={s.xp} delay={0.3} /> XP</p> : null}
              </>
            ) : s.type === "phase" ? (
              <>
                <Burst tone="orange"><Trophy className="size-16" aria-hidden="true" /></Burst>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-orange">Etap zamknięty</p>
                <h2 className="mt-1 text-3xl font-extrabold">{short(s.phase)}</h2>
                <p className="mt-3 text-white/75">Kolejny etap ścieżki stoi otworem.</p>
              </>
            ) : s.type === "milestone" ? (
              <>
                <Burst tone="orange"><Flag className="size-16" aria-hidden="true" /></Burst>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-orange">Kamień milowy zdobyty</p>
                <h2 className="mt-1 text-3xl font-extrabold">Kamień {s.no}: {s.title}</h2>
                {s.call ? (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className="mt-6 flex w-full flex-col gap-3 rounded-2xl border border-orange/50 bg-orange/10 p-4 text-left">
                    <div className="flex items-center gap-3">
                      <UnlockIcon tone="orange" />
                      <span><span className="block text-xs font-bold uppercase tracking-wider text-orange">Odblokowano</span><strong>30 minut rozmowy z Bartkiem na żywo</strong></span>
                    </div>
                    {CALENDAR ? (
                      <a href={CALENDAR} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange px-4 text-sm font-extrabold text-neutral-950 hover:brightness-105">
                        <CalendarCheck className="size-4" aria-hidden="true" />Umów 30 min z Bartkiem<span className="sr-only"> (w nowej karcie)</span>
                      </a>
                    ) : <p className="text-sm text-white/80">Termin ustalisz z zespołem Dochodowego Studia. Nagroda czeka też na pulpicie, w kamieniach milowych.</p>}
                  </motion.div>
                ) : <p className="mt-3 text-white/75">Moduł kursu zamknięty. Flaga na szlaku jest Twoja.</p>}
              </>
            ) : (
              <>
                <Burst tone="orange"><span className="text-6xl font-black">{s.index}</span></Burst>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-orange">Nowy poziom</p>
                <LevelName key={s.name} name={s.name} />
                <p className="mt-2 flex items-center gap-1.5 text-white/75"><Sparkles className="size-4 text-orange" aria-hidden="true" />Tak się buduje dochodowe studio.</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex w-full flex-col items-center gap-2">
          {last && unlocked ? (
            <Link ref={primary as React.Ref<HTMLAnchorElement>} href={`/krok/${unlocked.id}`} onClick={onDone} className={`${btn} bg-brand text-brand-ink`}>
              Przejdź do kroku {unlocked.no}<ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          ) : (
            <button ref={primary as React.Ref<HTMLButtonElement>} type="button" onClick={next} className={`${btn} bg-brand text-brand-ink`}>
              {last ? "Super!" : "Dalej"}{last ? null : <ArrowRight className="size-5" aria-hidden="true" />}
            </button>
          )}
          {last && unlocked ? (
            <button type="button" onClick={onDone} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-white/65 hover:bg-white/10 hover:text-white">Później</button>
          ) : null}
          {screens.length > 1 ? (
            <div className="mt-2 flex gap-1.5" aria-hidden="true">
              {screens.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-orange" : "w-1.5 bg-white/25"}`} />)}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

/** Ikona w kole z obracającymi się promieniami. */
function Burst({ children, tone }: { children: React.ReactNode; tone: "brand" | "orange" }) {
  const reduce = useReducedMotion();
  const c = tone === "brand" ? "#72c41c" : "#dd9933";
  return (
    <div className="relative grid size-40 place-items-center">
      <motion.span aria-hidden="true" className="absolute -inset-10 rounded-full opacity-60"
        style={{ background: `repeating-conic-gradient(from 0deg, ${c}55 0deg 10deg, transparent 10deg 30deg)`, maskImage: "radial-gradient(circle, #000 30%, transparent 70%)", WebkitMaskImage: "radial-gradient(circle, #000 30%, transparent 70%)" }}
        animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} />
      <motion.span className={`relative grid size-32 place-items-center rounded-full ${tone === "brand" ? "bg-brand text-brand-ink" : "bg-orange text-neutral-950"}`}
        style={{ boxShadow: `0 0 0 8px ${c}33, 0 0 80px -10px ${c}` }}
        initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 13, delay: 0.1 }}>
        {children}
      </motion.span>
    </div>
  );
}

/** Medal odznaki: wjeżdża z obrotem, po nim przelatuje błysk. */
function Medal({ icon }: { icon: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative grid size-44 place-items-center">
      <motion.span aria-hidden="true" className="absolute -inset-12 rounded-full"
        style={{ background: "repeating-conic-gradient(from 0deg, #dd993344 0deg 8deg, transparent 8deg 24deg)", maskImage: "radial-gradient(circle, #000 25%, transparent 70%)", WebkitMaskImage: "radial-gradient(circle, #000 25%, transparent 70%)" }}
        animate={reduce ? undefined : { rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} />
      <motion.span className="relative grid size-36 place-items-center overflow-hidden rounded-[2.2rem] bg-[linear-gradient(145deg,#f2c472,#dd9933_45%,#a86a17)] text-neutral-950"
        style={{ boxShadow: "0 0 0 6px rgba(242,196,114,.25), 0 20px 60px -10px rgba(221,153,51,.8), inset 0 2px 0 rgba(255,255,255,.5)" }}
        initial={{ scale: 0, rotateY: 180 }} animate={{ scale: 1, rotateY: 0 }} transition={{ type: "spring", stiffness: 180, damping: 14 }}>
        <BadgeIcon icon={icon} className="size-16" />
        {reduce ? null : (
          <motion.span aria-hidden="true" className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/50 blur-sm"
            initial={{ x: "-200%" }} animate={{ x: "400%" }} transition={{ delay: 0.7, duration: 0.9, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.2 }} />
        )}
      </motion.span>
    </div>
  );
}

/** Kłódka, która się otwiera. */
function UnlockIcon({ tone = "brand" }: { tone?: "brand" | "orange" }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 1050);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.span className={`grid size-12 shrink-0 place-items-center rounded-xl ${tone === "brand" ? "bg-brand text-brand-ink" : "bg-orange text-neutral-950"}`}
      animate={open ? { scale: [1, 1.25, 1], rotate: [0, -12, 8, 0] } : { x: [0, -2, 2, -2, 0] }} transition={open ? { duration: 0.5 } : { duration: 0.4, repeat: 2, delay: 0.4 }}>
      {open ? <LockOpen className="size-6" aria-hidden="true" /> : tone === "orange" ? <Video className="size-6" aria-hidden="true" /> : <Lock className="size-6" aria-hidden="true" />}
    </motion.span>
  );
}

/** Nazwa nowego poziomu „rozsypuje się” i składa (GSAP ScrambleText). */
function LevelName({ name }: { name: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.textContent = "";
    gsap.to(el, { duration: 1.3, delay: 0.35, scrambleText: { text: name, chars: "ABCDEFGHIJKLMNOPRSTUWZ0123456789", revealDelay: 0.35, speed: 0.5 } });
  });
  return <h2 ref={ref} className="mt-1 min-h-[1.2em] text-4xl font-black" aria-label={name}>{name}</h2>;
}
