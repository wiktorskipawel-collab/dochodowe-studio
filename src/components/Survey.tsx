"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useJourney } from "@/lib/store";
import { SURVEY, STAGES, STEPS, detectStage } from "@/lib/journey";

export function Survey() {
  const { ready, state, saveSurvey, acceptPath } = useJourney();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [i, setI] = useState(0);
  // null = jeszcze nie wybrano: pokazujemy wynik, jeśli ankieta była już wypełniona
  const [editing, setEditing] = useState<boolean | null>(null);

  if (!ready) return <p className="text-white/70">Wczytuję…</p>;

  const showResult = !(editing ?? !(state.survey && state.stage));
  if (showResult) {
    const stage = STAGES.find((s) => s.id === state.stage) ?? STAGES[0];
    return (
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card flex flex-col gap-5 rounded-2xl p-6 md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Twój etap</p>
          <h2 className="mt-1 text-2xl font-semibold md:text-3xl">{stage.name}</h2>
          <p className="mt-2 max-w-3xl text-white/80">{stage.description}</p>
          <p className="mt-2 max-w-3xl text-white/80"><strong className="text-white">Na czym się skupimy:</strong> {stage.focus}</p>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Proponowana ścieżka</h3>
          <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {stage.steps.map((id, n) => {
              const s = STEPS.find((x) => x.id === id);
              if (!s) return null;
              return (
                <li key={id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/10 text-sm font-semibold">{n + 1}</span>
                  <span className="text-sm"><strong className="block">{s.title}</strong><span className="text-white/65">{s.goal}</span></span>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => { acceptPath(); router.push(`/krok/${stage.steps[0]}`); }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-6 font-semibold text-brand-ink hover:brightness-95">
            <Check className="size-4" aria-hidden="true" />Akceptuję ścieżkę i zaczynam
          </button>
          <button type="button" onClick={() => { setEditing(true); setI(0); setAnswers(state.survey ?? {}); }}
            className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-5 font-semibold hover:bg-white/10">
            Popraw odpowiedzi
          </button>
        </div>
      </motion.section>
    );
  }

  const q = SURVEY[i];
  const value = answers[q.id] ?? "";
  const last = i === SURVEY.length - 1;

  function next() {
    if (!value.trim()) return;
    if (!last) return setI(i + 1);
    const stage = detectStage(answers);
    saveSurvey(answers, stage);
    setEditing(false);
  }

  return (
    <section className="glass-card flex flex-col gap-5 rounded-2xl p-6 md:p-8" aria-labelledby="q-h">
      <div className="flex items-center justify-between gap-3 text-sm text-white/70">
        <span>Pytanie {i + 1} z {SURVEY.length}</span>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((i + 1) / SURVEY.length) * 100}%` }} />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4">
          <h2 id="q-h" className="text-xl font-semibold md:text-2xl">{q.question}</h2>
          {q.help ? <p className="text-white/70">{q.help}</p> : null}
          {q.options ? (
            <fieldset className="grid gap-2 sm:grid-cols-2">
              <legend className="sr-only">{q.question}</legend>
              {q.options.map((o) => (
                <label key={o.value} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${value === o.value ? "border-brand bg-brand/10" : "border-white/15 hover:border-white/35"}`}>
                  <input type="radio" name={q.id} value={o.value} checked={value === o.value} onChange={() => setAnswers({ ...answers, [q.id]: o.value })} className="size-4 accent-[var(--brand)]" />
                  <span>{o.label}</span>
                </label>
              ))}
            </fieldset>
          ) : (
            <div className="flex flex-col gap-2">
              <label htmlFor={`q-${q.id}`} className="sr-only">{q.question}</label>
              <textarea id={`q-${q.id}`} rows={3} value={value} placeholder={q.placeholder} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/25 p-3 text-white placeholder:text-white/40 focus:border-brand focus:outline-none" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 font-semibold hover:bg-white/10 disabled:opacity-40">
          <ArrowLeft className="size-4" aria-hidden="true" />Wstecz
        </button>
        <button type="button" onClick={next} disabled={!value.trim()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-brand-ink hover:brightness-95 disabled:opacity-40">
          {last ? "Pokaż mój etap" : "Dalej"}<ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
