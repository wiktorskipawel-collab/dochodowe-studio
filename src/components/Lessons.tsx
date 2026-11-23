"use client";

import Link from "next/link";
import { PlayCircle, Check } from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS, allLessons } from "@/lib/journey";

export function Lessons() {
  const { ready, state, toggleWatched } = useJourney();
  if (!ready) return <p className="text-white/70">Wczytuję…</p>;
  const lessons = allLessons();
  const watched = lessons.filter((l) => state.watched[l.id]).length;
  const pct = lessons.length ? Math.round((watched / lessons.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <section className="glass-card flex flex-col gap-3 rounded-2xl p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-semibold">Lekcje przypięte do Twojej ścieżki</h2>
          <span className="tabular-nums text-white/75">{watched} / {lessons.length}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Obejrzane lekcje">
          <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-white/65">Pełna biblioteka: 191 lekcji z 5 kursów Skool i 97 mentoringów grupowych. Filmy przeniesiemy z Looma do Bunny Stream (odtwarzanie tylko dla zalogowanych).</p>
      </section>
      {STEPS.filter((s) => s.lessons.length).map((s) => (
        <section key={s.id} className="glass-card rounded-2xl p-5" aria-labelledby={`l-${s.id}`}>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 id={`l-${s.id}`} className="font-semibold">{s.no}. {s.title}</h3>
            <Link href={`/krok/${s.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-white/75 hover:text-white">Przejdź do kroku</Link>
          </div>
          <ul className="flex flex-col gap-2">
            {s.lessons.map((l) => {
              const seen = !!state.watched[l.id];
              return (
                <li key={l.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <PlayCircle className="size-5 shrink-0 text-brand" aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-sm"><strong className="block font-semibold">{l.title}</strong><span className="text-white/60">{l.source}</span></span>
                  <button type="button" onClick={() => toggleWatched(l.id)} aria-pressed={seen} aria-label={seen ? `Oznacz „${l.title}” jako nieobejrzaną` : `Oznacz „${l.title}” jako obejrzaną`}
                    className={`grid size-11 shrink-0 place-items-center rounded-xl border ${seen ? "border-emerald-400 bg-emerald-400 text-neutral-900" : "border-white/25 text-white/60 hover:border-white/50"}`}>
                    <Check className="size-4" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
