"use client";

// Intro w okienku powitalnym: cienka pomarańczowa linia z kropkami w węzłach przechodzi płynnie
// z kształtu w kształt (sztanga → klepsydra → szczyt z flagą), a nad i pod nią duże słowa (wzór od Pawła 2026-11-27).
// Wszystkie kształty mają po 12 wierzchołków, więc GSAP przesuwa po prostu punkty; kropki jadą razem z nimi.
// DO ZATWIERDZENIA (Bartek): hasła i podpisy.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type Pt = [number, number];
type Slide = { top: string; bottom: string; caption: string; pts: Pt[]; dots: number[] };

const SLIDES: Slide[] = [
  {
    top: "Ciężar",
    bottom: "z głowy",
    caption: "Bartek prowadzi Cię krok po kroku, a asystent pisze dokumenty. Ty decydujesz i zatwierdzasz.",
    // sztanga: lewa tarcza, gryf, prawa tarcza
    pts: [[20, 55], [20, 205], [34, 198], [48, 138], [352, 138], [366, 198], [380, 205], [380, 55], [366, 62], [352, 122], [48, 122], [34, 62]],
    dots: [0, 1, 3, 4, 6, 7, 9, 10],
  },
  {
    top: "Oszczędzasz",
    bottom: "czas",
    caption: "Zamiast miesięcy prób: 15 kroków, a każdy kończy się gotowym dokumentem.",
    // klepsydra: dwie przekątne krzyżują się w talii
    pts: [[340, 20], [60, 20], [128, 75], [196, 130], [128, 185], [94, 212], [60, 240], [340, 240], [272, 185], [204, 130], [272, 75], [306, 47]],
    dots: [0, 1, 3, 6, 7, 9],
  },
  {
    top: "Prosto",
    bottom: "na szczyt",
    caption: "Mapa pokazuje, gdzie jesteś i co dalej. Za kamienie milowe 2, 4 i 6: 30 minut rozmowy z Bartkiem.",
    // dwa szczyty, na wyższym flaga
    pts: [[20, 235], [118, 120], [158, 165], [226, 72], [226, 12], [282, 28], [226, 44], [226, 72], [300, 150], [330, 180], [380, 235], [200, 235]],
    dots: [0, 1, 3, 4, 5, 10],
  },
];

const HOLD = 3.6; // sekundy na jedno hasło
const R = 9; // zaokrąglenie narożników

/** Zamknięta łamana z zaokrąglonymi narożnikami. */
function rounded(pts: Pt[]) {
  const m = pts.length;
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const f = (n: number) => n.toFixed(2);
  const start = mid(pts[0], pts[1]);
  let d = `M${f(start[0])} ${f(start[1])}`;
  for (let k = 1; k <= m; k++) {
    const a = pts[k - 1];
    const b = pts[k % m];
    const c = pts[(k + 1) % m];
    const ab = Math.hypot(a[0] - b[0], a[1] - b[1]);
    const bc = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const r = Math.min(R, ab / 2, bc / 2);
    if (r < 0.5) {
      d += `L${f(b[0])} ${f(b[1])}`;
      continue;
    }
    const p1: Pt = [b[0] + ((a[0] - b[0]) / ab) * r, b[1] + ((a[1] - b[1]) / ab) * r];
    const p2: Pt = [b[0] + ((c[0] - b[0]) / bc) * r, b[1] + ((c[1] - b[1]) / bc) * r];
    d += `L${f(p1[0])} ${f(p1[1])}Q${f(b[0])} ${f(b[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}L${f(start[0])} ${f(start[1])}Z`;
}

export function WelcomeIntro() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);
  const glow = useRef<SVGPathElement>(null);
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  const pts = useRef<Pt[]>(SLIDES[0].pts.map((p) => [...p] as Pt));

  const paint = (p: Pt[]) => {
    const d = rounded(p);
    line.current?.setAttribute("d", d);
    glow.current?.setAttribute("d", d);
    p.forEach(([x, y], k) => {
      const c = dots.current[k];
      if (c) {
        c.setAttribute("cx", x.toFixed(2));
        c.setAttribute("cy", y.toFixed(2));
      }
    });
  };

  // wejście: linia się rysuje, kropki „wskakują”
  useGSAP(
    () => {
      paint(pts.current);
      const on = dots.current.filter((_, k) => SLIDES[0].dots.includes(k));
      gsap.set(dots.current, { attr: { r: 0 } });
      if (reduce) {
        gsap.set(on, { attr: { r: 4 } });
        return;
      }
      gsap.fromTo([line.current, glow.current], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" });
      gsap.to(on, { attr: { r: 4 }, duration: 0.5, ease: "back.out(3)", stagger: 0.08, delay: 0.9 });
    },
    { scope: root },
  );

  // przejście do kolejnego kształtu
  useGSAP(
    () => {
      if (i === 0 && pts.current[0][0] === SLIDES[0].pts[0][0] && pts.current[0][1] === SLIDES[0].pts[0][1]) return;
      const from = pts.current.map((p) => [...p] as Pt);
      const to = SLIDES[i].pts;
      const proxy = { t: 0 };
      gsap.to(dots.current, { attr: { r: (k: number) => (SLIDES[i].dots.includes(k) ? 4 : 0) }, duration: 0.45, ease: "power2.out", delay: reduce ? 0 : 0.35 });
      gsap.to(proxy, {
        t: 1,
        duration: reduce ? 0 : 1.15,
        ease: "expo.inOut",
        onUpdate: () => {
          pts.current = from.map((p, k) => [p[0] + (to[k][0] - p[0]) * proxy.t, p[1] + (to[k][1] - p[1]) * proxy.t]);
          paint(pts.current);
        },
      });
    },
    { dependencies: [i], scope: root },
  );

  // samo przełącza hasła
  useEffect(() => {
    const t = setTimeout(() => setI((n) => (n + 1) % SLIDES.length), HOLD * 1000);
    return () => clearTimeout(t);
  }, [i]);

  const s = SLIDES[i];
  return (
    <div ref={root} className="flex flex-col items-center gap-2 py-2 text-center">
      <p className="sr-only">{SLIDES.map((sl) => `${sl.top} ${sl.bottom}. ${sl.caption}`).join(" ")}</p>
      <Word text={s.top} id={`t${i}`} reduce={!!reduce} />
      <svg viewBox="-10 -10 420 280" className="h-auto w-full max-w-[360px] overflow-visible" aria-hidden="true">
        <defs>
          <filter id="ds-intro-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" /></filter>
        </defs>
        <path ref={glow} pathLength={1} strokeDasharray="1" fill="none" stroke="#dd9933" strokeWidth={5} opacity={0.35} filter="url(#ds-intro-glow)" />
        <path ref={line} pathLength={1} strokeDasharray="1" fill="none" stroke="#f0a640" strokeWidth={1.6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {SLIDES[0].pts.map((_, k) => (
          <circle key={k} ref={(el) => { dots.current[k] = el; }} r={0} fill="#f0a640" />
        ))}
      </svg>
      <Word text={s.bottom} id={`b${i}`} reduce={!!reduce} delay={0.12} />
      <AnimatePresence mode="wait">
        <motion.p key={i} aria-hidden="true" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.45 } }} exit={{ opacity: 0, y: -6, transition: { duration: 0.2 } }}
          className="mt-3 max-w-md text-sm text-white/70 md:text-base">
          {s.caption}
        </motion.p>
      </AnimatePresence>
      <div className="mt-4 flex gap-1.5" role="tablist" aria-label="Hasła">
        {SLIDES.map((sl, k) => (
          <button key={k} type="button" role="tab" aria-selected={k === i} aria-label={`${sl.top} ${sl.bottom}`} onClick={() => setI(k)}
            className="relative h-1.5 w-10 overflow-hidden rounded-full bg-white/15">
            {k === i ? (
              <motion.span key={`p${i}`} className="absolute inset-y-0 left-0 rounded-full bg-orange" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: HOLD, ease: "linear" }} />
            ) : k < i ? <span className="absolute inset-0 rounded-full bg-orange/60" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Duże słowo: litery wjeżdżają od dołu jedna po drugiej. */
function Word({ text, id, reduce, delay = 0 }: { text: string; id: string; reduce: boolean; delay?: number }) {
  return (
    <div className="relative h-[1.12em] w-full overflow-hidden text-[clamp(2.4rem,10.5vw,4.6rem)] font-semibold leading-none tracking-[-0.035em]" aria-hidden="true">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={id} className="absolute inset-x-0 top-0 block whitespace-nowrap"
          exit={reduce ? { opacity: 0 } : { y: "-110%", opacity: 0, transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] } }}>
          {[...text].map((ch, k) => (
            <motion.span key={k} className="inline-block"
              initial={reduce ? { opacity: 0 } : { y: "110%" }} animate={reduce ? { opacity: 1 } : { y: "0%" }}
              transition={{ delay: delay + 0.25 + k * 0.025, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              {ch === " " ? " " : ch}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
