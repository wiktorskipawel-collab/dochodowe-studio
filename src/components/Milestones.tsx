"use client";

import { motion } from "motion/react";
import { Check, Lock, Video, CalendarCheck } from "lucide-react";
import type { JourneyState } from "@/lib/store";
import { phaseProgress } from "@/lib/gamification";

// Kamienie milowe = zamknięte etapy ścieżki. Nagroda: 30 minut rozmowy z Bartkiem na żywo (pomysł z rozmowy 2026-11-27).
// DO ZATWIERDZENIA (Bartek): które etapy dają rozmowę, ile rozmów, link do kalendarza (NEXT_PUBLIC_BARTEK_KALENDARZ).
// Nazwy etapów ze ścieżki v2 (pole `phase` w journey.ts): rozmowa po fundamencie, po obsłudze zgłoszeń i po wdrożeniu.
export const CALL_AFTER = new Set(["Fundament", "Cel i sprzedaż", "Wdrożenie"]);
export const CALENDAR = process.env.NEXT_PUBLIC_BARTEK_KALENDARZ ?? "";

const short = (phase: string) => phase.replace(/\s*\(.*\)$/, "");

export function Milestones({ state }: { state: JourneyState }) {
  const phases = phaseProgress(state);
  return (
    <section data-tour="milestones" className="glass-card flex flex-col gap-4 rounded-3xl p-6" aria-labelledby="kamienie-h">
      <div>
        <h2 id="kamienie-h" className="text-lg font-bold">Kamienie milowe</h2>
        <p className="text-sm text-white/70">Zamknij etap, a odblokujesz 30 minut rozmowy z Bartkiem na żywo. Bartek widzi, że robisz robotę.</p>
      </div>
      <ol className="flex flex-col gap-2">
        {phases.map((p, i) => {
          const done = p.done === p.total;
          const call = CALL_AFTER.has(p.phase);
          return (
            <motion.li key={p.phase} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}
              className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 ${done ? "border-emerald-400/30 bg-emerald-400/10" : "border-white/10 bg-white/5"}`}>
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${done ? "bg-brand text-brand-ink" : "bg-white/10 text-white/60"}`}>
                {done ? <Check className="size-5" aria-hidden="true" /> : <span className="text-sm font-bold">{i + 1}</span>}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block">{short(p.phase)}</strong>
                <span className="text-xs text-white/60">{p.done}/{p.total} kroków</span>
              </span>
              {call ? (
                done ? (
                  CALENDAR ? (
                    <a href={CALENDAR} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange px-4 text-sm font-bold text-neutral-950 hover:brightness-105">
                      <CalendarCheck className="size-4" aria-hidden="true" />Umów 30 min z Bartkiem
                    </a>
                  ) : (
                    <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-orange/50 px-4 text-sm font-semibold text-orange">
                      <Video className="size-4" aria-hidden="true" />Rozmowa z Bartkiem odblokowana
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/55"><Lock className="size-3.5" aria-hidden="true" />nagroda: 30 min z Bartkiem</span>
                )
              ) : null}
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
