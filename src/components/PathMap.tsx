"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check, Lock, ArrowRight, PlugZap, ClipboardList, FileText, PlayCircle, Mountain } from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS, STAGES, stepStatuses, progressPercent, currentStep } from "@/lib/journey";
import { platformAi } from "@/lib/models";
import { PathTerrain, StepIcon, phaseName } from "@/components/PathTerrain";
import type { Step, StepStatus } from "@/lib/journey-types";

const STATUS: Record<StepStatus, string> = { done: "Zatwierdzone", draft: "W trakcie", available: "Do zrobienia", locked: "Później" };
const moduleTag = (phase: string) => phase.match(/\((.*)\)$/)?.[1] ?? "";

export function PathMap() {
  const { ready, state } = useJourney();
  if (!ready) return <p className="text-white/70">Wczytuję…</p>;
  const statuses = stepStatuses(state);
  const pct = progressPercent(state);
  const stage = STAGES.find((s) => s.id === state.stage);
  const cur = currentStep(state);
  const phases = [...new Set(STEPS.map((s) => s.phase))];
  const doneCount = STEPS.filter((s) => statuses[s.id] === "done").length;

  return (
    <div className="flex flex-col gap-8">
      {/* MAPA */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(90%_70%_at_30%_20%,rgba(46,140,30,.18),transparent_60%),radial-gradient(60%_50%_at_85%_30%,rgba(221,153,51,.07),transparent_60%),linear-gradient(180deg,#06110a,#030805)]"
        aria-labelledby="mapa-h">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-wrap items-start justify-between gap-3 p-5 md:p-6">
          <div className="pointer-events-auto">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand"><Mountain className="size-3.5" aria-hidden="true" />Mapa ścieżki</p>
            <h2 id="mapa-h" className="mt-1 text-3xl font-extrabold tabular-nums md:text-4xl">{pct}%<span className="ml-2 text-base font-semibold text-white/60">drogi na szczyt</span></h2>
            <p className="mt-1 text-sm text-white/65">{doneCount} z {STEPS.length} kroków · {stage ? stage.name : "etap studia jeszcze nierozpoznany"}</p>
          </div>
          <div className="pointer-events-auto flex flex-wrap gap-2">
            <Legend color="bg-brand" text="Zrobione" />
            <Legend color="bg-orange" text="Teraz" />
            <Legend color="bg-white/30" text="Przed Tobą" />
          </div>
        </div>
        <div className="overflow-x-auto pt-28 md:pt-16">
          <div className="min-w-[780px]">
            <PathTerrain steps={STEPS} statuses={statuses} currentId={cur?.id ?? null} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-5 py-4 text-sm md:px-6">
          {cur ? (
            <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} className="inline-flex">
              <Link href={`/krok/${cur.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 font-bold text-brand-ink shadow-[0_12px_30px_-12px_rgba(114,196,28,.6)] hover:brightness-110">
                {statuses[cur.id] === "draft" ? "Wracam do kroku" : "Idę dalej"}: {cur.title}<ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </motion.span>
          ) : (
            <span className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand"><Check className="size-4" aria-hidden="true" />Cała ścieżka zatwierdzona</span>
          )}
          <Link href="/ankieta" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 hover:bg-white/10">
            <ClipboardList className="size-4" aria-hidden="true" />Ankieta i etap
          </Link>
          {platformAi ? null : (
            <Link href="/polacz" className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 hover:bg-white/10 ${state.ai.mode ? "border-emerald-400/40 text-emerald-200" : "border-white/20"}`}>
              {state.ai.mode ? <Check className="size-4" aria-hidden="true" /> : <PlugZap className="size-4" aria-hidden="true" />}{state.ai.mode ? "Połączone AI" : "Połącz AI"}
            </Link>
          )}
        </div>
      </motion.section>

      {/* MODUŁY: duże kafelki */}
      {phases.map((phase, pi) => {
        const list = STEPS.filter((s) => s.phase === phase);
        const d = list.filter((s) => statuses[s.id] === "done").length;
        const tag = moduleTag(phase);
        return (
          <section key={phase} aria-labelledby={`ph-${pi}`} className="flex flex-col gap-4">
            <motion.header initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.45 }}
              className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Etap {pi + 1}{tag ? ` · ${tag}` : ""}</p>
                <h2 id={`ph-${pi}`} className="text-2xl font-extrabold md:text-3xl">{phaseName(phase)}</h2>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/65">
                <span className="tabular-nums">{d}/{list.length} kroków</span>
                <span className="h-2 w-32 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={d} aria-valuemin={0} aria-valuemax={list.length} aria-label={`Postęp etapu ${phaseName(phase)}`}>
                  <motion.span className="block h-full rounded-full bg-brand" initial={{ width: 0 }} whileInView={{ width: `${(d / list.length) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }} />
                </span>
              </div>
            </motion.header>
            <ol className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {list.map((s, i) => (
                <motion.li key={s.id} initial={{ opacity: 0, y: 28, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.07, type: "spring", stiffness: 220, damping: 26 }}>
                  <Tile step={s} status={statuses[s.id]} current={s.id === cur?.id} prev={STEPS[STEPS.indexOf(s) - 1]} offPath={!!stage && !stage.steps.includes(s.id)} />
                </motion.li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/75 backdrop-blur-sm">
      <span className={`size-2 rounded-full ${color}`} aria-hidden="true" />{text}
    </span>
  );
}

function Tile({ step: s, status, current, prev, offPath }: { step: Step; status: StepStatus; current: boolean; prev?: Step; offPath: boolean }) {
  const locked = status === "locked";
  const tone = current
    ? "border-orange/50 bg-[linear-gradient(150deg,rgba(221,153,51,.16),rgba(255,255,255,.03)_55%)] shadow-[0_0_70px_-25px_rgba(221,153,51,.55)]"
    : status === "done"
      ? "border-emerald-400/25 bg-[linear-gradient(150deg,rgba(79,181,42,.16),rgba(255,255,255,.03)_55%)]"
      : locked
        ? "border-white/10 bg-white/[0.025]"
        : "border-white/15 bg-white/[0.05]";

  const inner = (
    <div className={`glass-card group relative flex h-full min-h-[240px] flex-col gap-4 overflow-hidden rounded-3xl border p-6 ${tone} ${locked ? "opacity-70" : ""}`}>
      <span aria-hidden="true" className="pointer-events-none absolute -right-3 -top-8 select-none text-[130px] font-black leading-none text-white/[0.045]">{s.no}</span>
      {current ? (
        <span className="absolute right-5 top-5 rounded-full bg-orange px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-neutral-950">TERAZ</span>
      ) : (
        <span className={`absolute right-5 top-5 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status === "done" ? "border-emerald-400/40 text-emerald-200" : locked ? "border-white/10 text-white/50" : "border-white/25 text-white/85"}`}>
          {status === "done" ? <Check className="size-3" aria-hidden="true" /> : locked ? <Lock className="size-3" aria-hidden="true" /> : null}{STATUS[status]}
        </span>
      )}
      <span className={`grid size-14 place-items-center rounded-2xl ${status === "done" ? "bg-brand text-brand-ink" : current ? "bg-orange/15 text-orange ring-1 ring-orange/50" : locked ? "bg-white/5 text-white/45" : "bg-white/10 text-white"}`}>
        <StepIcon id={s.id} className="size-6" />
      </span>
      <div>
        <p className="text-xs font-semibold text-white/50">Krok {s.no}</p>
        <h3 className="text-xl font-bold leading-snug">{s.title}</h3>
        <p className="mt-1.5 line-clamp-3 text-sm text-white/70">{s.goal}</p>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <span className="flex flex-col gap-1 text-xs text-white/55">
          <span className="inline-flex items-center gap-1.5"><FileText className="size-3.5" aria-hidden="true" />{s.docTitle}</span>
          {s.lessons.length ? <span className="inline-flex items-center gap-1.5"><PlayCircle className="size-3.5" aria-hidden="true" />{s.lessons.length} {s.lessons.length === 1 ? "lekcja" : s.lessons.length < 5 ? "lekcje" : "lekcji"}</span> : null}
          {offPath ? <span>Poza Twoją ścieżką na teraz</span> : null}
        </span>
        {locked ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-white/50"><Lock className="size-3.5" aria-hidden="true" />{prev ? `Po kroku ${prev.no}` : "Później"}</span>
        ) : (
          <span className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition group-hover:gap-3 ${current ? "bg-orange text-neutral-950" : status === "done" ? "border border-white/20 text-white" : "bg-brand text-brand-ink"}`}>
            {status === "done" ? "Otwórz" : status === "draft" ? "Wracam" : "Zaczynam"}<ArrowRight className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );

  if (locked) return inner;
  return (
    <motion.div className="h-full" whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
      <Link href={`/krok/${s.id}`} className="block h-full rounded-3xl" aria-label={`Krok ${s.no}: ${s.title}. ${current ? "Teraz" : STATUS[status]}`}>{inner}</Link>
    </motion.div>
  );
}
