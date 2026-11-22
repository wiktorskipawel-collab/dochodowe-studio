"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, PlugZap, ClipboardList, Route, FileText, PlayCircle, Check } from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS, STAGES, stepStatuses, progressPercent, currentStep, allLessons } from "@/lib/journey";
import { Pill } from "@/components/ui";

export function Home() {
  const { ready, state } = useJourney();
  if (!ready) return <p className="text-white/70">Wczytuję…</p>;

  // Przed startem: powitanie i 3 kroki wejścia
  if (!state.ai.mode || !state.survey || !state.pathAccepted) {
    const items = [
      { done: !!state.ai.mode, title: "Połącz swoje AI", text: "ChatGPT albo Claude. Albo pracuj w swoim czacie i wklejaj wyniki.", href: "/start", icon: PlugZap },
      { done: !!state.survey, title: "Ankieta z asystentem", text: "Kilka pytań o Twoje studio. Rozpoznamy etap, na którym jesteś.", href: "/ankieta", icon: ClipboardList },
      { done: state.pathAccepted, title: "Twoja ścieżka", text: "Propozycja kroków dopasowana do etapu: awatar, oferta, lejek i dalej.", href: "/ankieta", icon: Route },
    ];
    const nextItem = items.find((x) => !x.done) ?? items[2];
    return (
      <div className="flex flex-col gap-6">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong flex flex-col gap-4 rounded-3xl p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Dochodowe Studio · Marketing OS</p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">Zbudujmy marketing Twojego studia krok po kroku</h1>
          <p className="max-w-2xl text-lg text-white/75">Asystent poprowadzi Cię metodyką Dochodowego Studia: od rozpoznania etapu, przez awatar i ofertę, po lejek, który przyprowadzi klientów.</p>
          <Link href={nextItem.href} className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-accent px-6 text-lg font-semibold text-accent-ink hover:brightness-95">
            {items.some((x) => x.done) ? "Kontynuuj" : "Zaczynamy"}<ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </motion.section>
        <ol className="grid gap-4 md:grid-cols-3">
          {items.map(({ done, title, text, href, icon: Icon }, n) => (
            <li key={title}>
              <motion.div whileHover={{ y: -5 }}>
                <Link href={href} className="glass-card flex h-full flex-col gap-3 rounded-2xl p-5">
                  <span className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-white/10"><Icon className="size-5" aria-hidden="true" /></span>
                    {done ? <Pill tone="good"><Check className="size-3" aria-hidden="true" />Gotowe</Pill> : <Pill>Krok {n + 1}</Pill>}
                  </span>
                  <strong className="text-lg">{title}</strong>
                  <span className="text-sm text-white/70">{text}</span>
                </Link>
              </motion.div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  // W trakcie ścieżki
  const statuses = stepStatuses(state);
  const pct = progressPercent(state);
  const stage = STAGES.find((s) => s.id === state.stage);
  const cur = currentStep(state);
  const docsDone = STEPS.filter((s) => state.docs[s.docId]?.status === "approved").length;
  const lessons = allLessons();
  const watched = lessons.filter((l) => state.watched[l.id]).length;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Marketing OS · {stage?.name}</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Twój postęp: {pct}%</h1>
      </header>

      {cur ? (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong flex flex-col gap-3 rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Następny krok</p>
          <h2 className="text-xl font-semibold md:text-2xl">{cur.no}. {cur.title}</h2>
          <p className="max-w-3xl text-white/75">{cur.goal}</p>
          <Link href={`/krok/${cur.id}`} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-accent px-5 font-semibold text-accent-ink hover:brightness-95">
            {statuses[cur.id] === "draft" ? "Wróć do pracy" : "Zacznij krok"}<ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </motion.section>
      ) : (
        <section className="glass-strong rounded-2xl p-6"><h2 className="text-xl font-semibold">Cała ścieżka zatwierdzona. Gratulacje!</h2></section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Route} label="Kroki zatwierdzone" value={`${STEPS.filter((s) => statuses[s.id] === "done").length} / ${STEPS.length}`} href="/sciezka" />
        <Stat icon={FileText} label="Dokumenty gotowe" value={`${docsDone} / ${STEPS.length}`} href="/dokumenty" />
        <Stat icon={PlayCircle} label="Lekcje obejrzane" value={`${watched} / ${lessons.length}`} href="/lekcje" />
      </div>

      <section className="glass-card rounded-2xl p-5 md:p-6" aria-labelledby="map-h">
        <div className="mb-4 flex items-baseline justify-between gap-2">
          <h2 id="map-h" className="text-lg font-semibold">Ścieżka</h2>
          <Link href="/sciezka" className="inline-flex min-h-11 items-center text-sm font-semibold text-white/80 hover:text-white">Cała mapa</Link>
        </div>
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s) => {
            const st = statuses[s.id];
            return (
              <li key={s.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${st === "done" ? "border-transparent bg-emerald-400/15 text-emerald-100" : st === "locked" ? "border-white/10 text-white/50" : "border-accent bg-accent/10"}`}>
                <span className="font-semibold tabular-nums">{s.no}</span>{s.title}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, href }: { icon: typeof Route; label: string; value: string; href: string }) {
  return (
    <motion.div whileHover={{ y: -5 }}>
      <Link href={href} className="glass-card flex items-center gap-4 rounded-2xl p-5">
        <span className="grid size-11 place-items-center rounded-xl bg-white/10"><Icon className="size-5" aria-hidden="true" /></span>
        <span><span className="block text-2xl font-semibold tabular-nums">{value}</span><span className="text-sm text-white/70">{label}</span></span>
      </Link>
    </motion.div>
  );
}
