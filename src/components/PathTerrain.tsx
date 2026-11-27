"use client";

// Mapa ścieżki jako teren 3D (rzut izometryczny): kroki na szlaku od dołu mapy aż na szczyt.
// Zrobione etapy świecą na zielono, aktualny krok ma pomarańczowy „stożek”. Geometria: src/lib/terrain.ts.
import Link from "next/link";
import { useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion, useReducedMotion } from "motion/react";
import {
  Check, Lock, FolderOpen, Stethoscope, Dna, UserRound, Gem, Wallet, Target, ShieldCheck, CalendarRange, Clapperboard,
  ChartColumn, Sparkles, CircleDot, PhoneCall, HeartHandshake, Users, type LucideIcon,
} from "lucide-react";
import { VW, VH, TERRAIN, layout } from "@/lib/terrain";
import type { Step, StepStatus } from "@/lib/journey-types";

export const STEP_ICON: Record<string, LucideIcon> = {
  materialy: FolderOpen, diagnoza: Stethoscope, dna: Dna, awatar: UserRound, oferta: Gem, "cel-budzet": Wallet, sprzedaz: PhoneCall,
  strategia: Target, gotowosc: ShieldCheck, "materialy-lejka": Clapperboard, plan: CalendarRange, wyniki: ChartColumn, okazje: Sparkles,
  utrzymanie: HeartHandshake, zespol: Users,
};
/** Ikona kroku (z mapy STEP_ICON). */
export function StepIcon({ id, className }: { id: string; className?: string }) {
  const Icon = STEP_ICON[id] ?? CircleDot;
  return <Icon className={className} aria-hidden="true" />;
}

const SHORT: Record<string, string> = {
  materialy: "Materiały", diagnoza: "Diagnoza", dna: "DNA studia", awatar: "Awatar", oferta: "Oferta", "cel-budzet": "Cel i budżet",
  sprzedaz: "Obsługa zgłoszeń", strategia: "Strategia", gotowosc: "Gotowość", "materialy-lejka": "Gotowce", plan: "Plan",
  wyniki: "Przegląd", okazje: "Okazje", utrzymanie: "Utrzymanie", zespol: "Zespół",
};
export const shortTitle = (s: Step) => SHORT[s.id] ?? s.title;
export const phaseName = (phase: string) => phase.replace(/\s*\(.*\)$/, "");

gsap.registerPlugin(useGSAP);

const pos = ([x, y]: [number, number]) => ({ left: `${(x / VW) * 100}%`, top: `${(y / VH) * 100}%` });

type Props = { steps: Step[]; statuses: Record<string, StepStatus>; currentId: string | null };

export function PathTerrain({ steps, statuses, currentId }: Props) {
  const reduce = useReducedMotion();
  const tilt = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);

  // GSAP: „przelot kamery” przy wejściu + delikatny przechył mapy za kursorem.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(intro.current, { rotationX: 34, scale: 0.9, y: 50, opacity: 0, transformPerspective: 1600, transformOrigin: "50% 75%", duration: 1.5, ease: "expo.out", clearProps: "transform,opacity" });
      const el = tilt.current;
      if (!el || !window.matchMedia("(pointer: fine)").matches) return;
      gsap.set(el, { transformPerspective: 1800 });
      const rx = gsap.quickTo(el, "rotationX", { duration: 0.8, ease: "power3.out" });
      const ry = gsap.quickTo(el, "rotationY", { duration: 0.8, ease: "power3.out" });
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        rx(((e.clientY - r.top) / r.height - 0.5) * -3);
        ry(((e.clientX - r.left) / r.width - 0.5) * 4);
      };
      const leave = () => { rx(0); ry(0); };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
    });
    return () => mm.revert();
  }, []);
  const phases = useMemo(() => [...new Set(steps.map((s) => s.phase))], [steps]);
  const map = useMemo(() => layout(steps.map((s) => phases.indexOf(s.phase))), [steps, phases]);
  const cur = steps.findIndex((s) => s.id === currentId);
  const done = (i: number) => statuses[steps[i]?.id] === "done";

  const zoneState = (phase: string) => {
    const list = steps.filter((s) => s.phase === phase);
    if (list.every((s) => statuses[s.id] === "done")) return "done";
    if (list.some((s) => s.id === currentId)) return "active";
    return "future";
  };
  const ZONE = {
    done: { fill: "rgba(79,181,42,.16)", edge: "#4fb52a", dash: undefined, label: "rgba(169,228,122,.85)" },
    active: { fill: "rgba(114,196,28,.10)", edge: "#72c41c", dash: undefined, label: "#c8f08f" },
    future: { fill: "rgba(255,255,255,.015)", edge: "rgba(255,255,255,.12)", dash: "4 4", label: "rgba(255,255,255,.45)" },
  } as const;

  return (
    <div ref={tilt} className="relative w-full will-change-transform" style={{ aspectRatio: `${VW} / ${VH}` }}>
      <div ref={intro} className="absolute inset-0">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <radialGradient id="ds-map-fade" cx="50%" cy="50%" r="60%">
            <stop offset="55%" stopColor="#fff" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <mask id="ds-map-mask"><rect width={VW} height={VH} fill="url(#ds-map-fade)" /></mask>
          <pattern id="ds-map-dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="#dd9933" opacity=".6" /></pattern>
          <filter id="ds-map-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>

        {/* strefy etapów pod siatką */}
        {map.zones.map((z) => (
          <motion.path key={`f${z.group}`} d={z.fill} fill={ZONE[zoneState(phases[z.group])].fill}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + z.group * 0.08, duration: 0.6 }} />
        ))}

        <motion.path d={TERRAIN} fill="none" stroke="rgba(170,210,180,.17)" strokeWidth={1} vectorEffect="non-scaling-stroke" mask="url(#ds-map-mask)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }} />

        {map.zones.map((z) => {
          const st = ZONE[zoneState(phases[z.group])];
          return (
            <g key={`e${z.group}`}>
              {st.dash ? null : <path d={z.edge} fill="none" stroke={st.edge} strokeWidth={4} opacity={0.35} filter="url(#ds-map-glow)" />}
              <path d={z.edge} fill="none" stroke={st.edge} strokeWidth={1.6} strokeDasharray={st.dash} vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}

        {/* drogi między krokami */}
        {map.links.map((d, i) => {
          const walked = done(i) && done(i + 1);
          const next = done(i) && i + 1 === cur;
          if (walked)
            return (
              <g key={`l${i}`}>
                <path d={d} fill="none" stroke="#72c41c" strokeWidth={8} opacity={0.3} filter="url(#ds-map-glow)" />
                <motion.path d={d} fill="none" stroke="#72c41c" strokeWidth={3} strokeLinecap="round"
                  initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }} />
              </g>
            );
          return <path key={`l${i}`} d={d} fill="none" stroke={next ? "#dd9933" : "rgba(255,255,255,.28)"} strokeWidth={next ? 2.4 : 2} strokeDasharray="7 7" className={next ? "dash-flow" : undefined} />;
        })}

        {/* nóżki punktów + stożek pod aktualnym krokiem */}
        {map.nodes.map((n, i) => (
          <line key={`s${i}`} x1={n.ground[0]} y1={n.ground[1]} x2={n.top[0]} y2={n.top[1]} strokeWidth={1.2}
            stroke={i === cur ? "transparent" : done(i) ? "#4fb52a" : "rgba(255,255,255,.25)"} />
        ))}
        {cur >= 0 ? (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }}>
            <path d={map.footprint(cur).base} fill="url(#ds-map-dots)" stroke="#dd9933" strokeWidth={1.2} />
            <path d={map.footprint(cur).cone} stroke="#dd9933" strokeWidth={1} opacity={0.75} />
          </motion.g>
        ) : null}

        {map.zones.map((z) => (
          <text key={`t${z.group}`} x={z.label[0]} y={z.label[1] + (steps.findIndex((s) => s.phase === phases[z.group]) === cur ? 42 : 0)} textAnchor="middle" fontSize={11} fontWeight={700} letterSpacing={2.5}
            fill={ZONE[zoneState(phases[z.group])].label}>
            {phaseName(phases[z.group]).toUpperCase()}
          </text>
        ))}
      </svg>

      {/* punkty kroków (HTML: klikalne, z klawiatury i czytnika ekranu) */}
      <ol className="absolute inset-0" aria-label="Kroki na mapie">
        {steps.map((s, i) => {
          const st = statuses[s.id];
          const isCur = i === cur;
          const ring = isCur ? "border-orange" : st === "done" ? "border-brand" : st === "locked" ? "border-white/15" : "border-white/45";
          const label = `${s.no}. ${s.title}: ${isCur ? "teraz" : st === "done" ? "zatwierdzony" : st === "locked" ? "później" : st === "draft" ? "w trakcie" : "do zrobienia"}`;
          const body = (
            <>
              {isCur && !reduce
                ? [0, 1].map((k) => (
                    <motion.span key={k} aria-hidden="true" className="absolute inset-0 rounded-full border border-orange/70"
                      initial={{ scale: 1, opacity: 0.7 }} animate={{ scale: 2.1, opacity: 0 }} transition={{ duration: 2.4, delay: k * 1.2, repeat: Infinity, ease: "easeOut" }} />
                  ))
                : null}
              {isCur ? <span aria-hidden="true" className="absolute -inset-2 rounded-full border border-orange/40" /> : null}
              <span className={`relative grid size-10 place-items-center rounded-full border-2 bg-[#06120a]/95 shadow-[0_10px_30px_-10px_rgba(0,0,0,.9)] xl:size-12 ${ring} ${st === "locked" ? "text-white/45" : "text-white"}`}>
                <StepIcon id={s.id} className="size-4 xl:size-5" />
                {st === "done" ? (
                  <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-brand text-brand-ink"><Check className="size-3" aria-hidden="true" /></span>
                ) : st === "locked" ? (
                  <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-white/15"><Lock className="size-2.5" aria-hidden="true" /></span>
                ) : null}
              </span>
              <span aria-hidden="true" className={`absolute left-[calc(100%-4px)] top-[-12px] flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm xl:text-xs ${isCur ? "border-orange/60 bg-[#1a1206]/90 text-white" : st === "locked" ? "border-white/10 bg-[#07110a]/80 text-white/55" : "border-white/20 bg-[#07110a]/90 text-white"}`}>
                {isCur ? <span className="text-[10px] font-extrabold tracking-wider text-orange">TERAZ</span> : <span className="text-white/45">{s.no}</span>}
                {shortTitle(s)}
              </span>
              {/* podpowiedź po najechaniu / fokusie */}
              <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] z-20 w-56 -translate-x-1/2 rounded-xl border border-white/15 bg-[#081409]/95 p-3 text-left text-xs leading-snug text-white/80 opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                <strong className="block text-sm text-white">{s.no}. {s.title}</strong>
                {st === "locked" ? (s.unlockAfter ? `Otworzy się po zatwierdzeniu kroku „${steps.find((x) => x.id === s.unlockAfter)?.title ?? s.unlockAfter}”.` : "Odblokuje się po zatwierdzeniu poprzedniego kroku.") : s.goal}
              </span>
            </>
          );
          return (
            <motion.li key={s.id} className={`absolute -translate-x-1/2 -translate-y-1/2 hover:z-30 focus-within:z-30 ${isCur ? "z-20" : "z-10"}`} style={pos(map.nodes[i].top)}
              initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.06, type: "spring", stiffness: 380, damping: 22 }}>
              {st === "locked" ? (
                <span tabIndex={0} aria-label={label} className="group relative block rounded-full">{body}</span>
              ) : (
                <motion.span className="block" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                  <Link href={`/krok/${s.id}`} aria-label={label} className="group relative block rounded-full">{body}</Link>
                </motion.span>
              )}
            </motion.li>
          );
        })}
      </ol>
      </div>
    </div>
  );
}
