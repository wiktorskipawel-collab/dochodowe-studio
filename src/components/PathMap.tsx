"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check, Lock, PencilLine, ArrowRight, PlugZap, ClipboardList } from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS, STAGES, stepStatuses, progressPercent } from "@/lib/journey";
import { Pill } from "@/components/ui";
import type { StepStatus } from "@/lib/journey-types";

const BADGE: Record<StepStatus, { tone: "good" | "warn" | "accent" | "neutral"; text: string }> = {
  done: { tone: "good", text: "Zatwierdzone" },
  draft: { tone: "warn", text: "W trakcie" },
  available: { tone: "accent", text: "Do zrobienia" },
  locked: { tone: "neutral", text: "Później" },
};

export function PathMap() {
  const { ready, state } = useJourney();
  if (!ready) return <p className="text-white/70">Wczytuję…</p>;
  const statuses = stepStatuses(state);
  const pct = progressPercent(state);
  const stage = STAGES.find((s) => s.id === state.stage);
  const phases = [...new Set(STEPS.map((s) => s.phase))];

  return (
    <div className="flex flex-col gap-5">
      <section className="glass-card flex flex-col gap-4 rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-white/70">Etap studia</p>
            <p className="text-xl font-semibold">{stage ? stage.name : "Jeszcze nie rozpoznany"}</p>
          </div>
          <p className="text-3xl font-semibold tabular-nums">{pct}%</p>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Postęp ścieżki">
          <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/start" className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 ${state.ai.mode ? "border-emerald-400/40 text-emerald-200" : "border-white/20"}`}>
            {state.ai.mode ? <Check className="size-4" aria-hidden="true" /> : <PlugZap className="size-4" aria-hidden="true" />}Połączone AI
          </Link>
          <Link href="/ankieta" className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 ${state.survey ? "border-emerald-400/40 text-emerald-200" : "border-white/20"}`}>
            {state.survey ? <Check className="size-4" aria-hidden="true" /> : <ClipboardList className="size-4" aria-hidden="true" />}Ankieta i etap
          </Link>
        </div>
      </section>

      {phases.map((phase) => (
        <section key={phase} aria-labelledby={`ph-${phase}`} className="flex flex-col gap-3">
          <h2 id={`ph-${phase}`} className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">{phase}</h2>
          <ol className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {STEPS.filter((s) => s.phase === phase).map((s) => {
              const st = statuses[s.id];
              const inStage = !stage || stage.steps.includes(s.id);
              const Icon = st === "done" ? Check : st === "locked" ? Lock : st === "draft" ? PencilLine : ArrowRight;
              const body = (
                <>
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold ${st === "done" ? "bg-emerald-400/20 text-emerald-200" : st === "locked" ? "bg-white/5 text-white/50" : "bg-brand text-brand-ink"}`}>
                    {s.no}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="font-semibold">{s.title}</strong>
                      <Pill tone={BADGE[st].tone}><Icon className="size-3" aria-hidden="true" />{BADGE[st].text}</Pill>
                    </span>
                    <span className="text-sm text-white/70">{s.goal}</span>
                    <span className="text-xs text-white/55">Dokument: {s.docTitle}{!inStage ? " · poza Twoją ścieżką na teraz" : ""}</span>
                  </span>
                </>
              );
              return (
                <li key={s.id}>
                  {st === "locked" ? (
                    <div className="glass-card flex gap-4 rounded-2xl p-4 opacity-60">{body}</div>
                  ) : (
                    <motion.div whileHover={{ y: -5 }}>
                      <Link href={`/krok/${s.id}`} className={`glass-card flex gap-4 rounded-2xl p-4 ${st === "available" || st === "draft" ? "outline outline-1 outline-brand/60" : ""}`}>{body}</Link>
                    </motion.div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
