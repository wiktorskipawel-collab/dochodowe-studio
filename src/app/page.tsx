import Link from "next/link";
import { ArrowRight, Check, CalendarPlus, PlayCircle, Lock } from "lucide-react";
import { GlassCard, StatsCard, Pill, PageHeader, AiNote } from "@/components/ui";
import { studio, stats, modules, tasks, lessons } from "@/lib/data";

export default function Pulpit() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Marketing OS · dane przykładowe" title={`Dzień dobry, ${studio.owner}`}>
        {studio.name} · {studio.stage} · {studio.trainers} trenerów · cel na 90 dni: {studio.goal}
      </PageHeader>

      <GlassCard className="glass-strong flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Następny krok</p>
        <h2 className="text-xl font-semibold md:text-2xl">Wybierz strategię na najbliższe 90 dni</h2>
        <p className="max-w-3xl text-white/75">
          Twoje DNA studia jest gotowe. Marketing OS ocenił 6 lejków według metodyki Dochodowego Studia i przygotował 3 warianty.
          Zanim powstanie choć jedna reklama, wybierasz i zatwierdzasz kierunek.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/rozmowa" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-5 font-semibold text-accent-ink hover:brightness-95">
            Przejdź do wyboru strategii <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link href="/sciezka" className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-5 font-semibold text-white hover:bg-white/10">
            Zobacz całą ścieżkę
          </Link>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatsCard key={s.title} {...s} />
        ))}
      </div>

      <GlassCard>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Twoja ścieżka</h2>
          <span className="text-sm tabular-nums text-white/70">{studio.progress}% · moduł 2 z 6</span>
        </div>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={studio.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Postęp ścieżki">
          <div className="h-full rounded-full bg-accent" style={{ width: `${studio.progress}%` }} />
        </div>
        <ol className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {modules.map((m) => (
            <li
              key={m.no}
              className={`flex flex-col gap-2 rounded-xl border p-3 ${
                m.status === "now" ? "border-accent bg-accent/10" : m.status === "done" ? "border-transparent bg-emerald-400/10" : "border-white/10 bg-white/5"
              }`}
            >
              {m.status === "done" ? <Pill tone="good"><Check className="size-3" aria-hidden="true" />Gotowe</Pill> : m.status === "now" ? <Pill tone="accent">Teraz</Pill> : <Pill><Lock className="size-3" aria-hidden="true" />Dalej</Pill>}
              <p className="text-sm font-semibold">{m.no} · {m.title}</p>
            </li>
          ))}
        </ol>
      </GlassCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <GlassCard>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Plan na ten tydzień</h2>
            <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">
              <CalendarPlus className="size-4" aria-hidden="true" />Dodaj do kalendarza
            </button>
          </div>
          <ul className="divide-y divide-white/10">
            {tasks.map((t) => (
              <li key={t.title} className="flex items-start gap-3 py-3">
                <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border ${t.done ? "border-emerald-400 bg-emerald-400 text-neutral-900" : "border-white/30"}`} aria-hidden="true">
                  {t.done ? <Check className="size-4" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${t.done ? "text-white/60 line-through" : ""}`}>{t.title}</p>
                  <p className="text-sm text-white/65">{t.meta}</p>
                </div>
                {t.flag ? <Pill tone={t.flag.tone}>{t.flag.text}</Pill> : null}
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-white/10 pt-3 text-sm text-white/70">
            Twój czas na marketing w tym tygodniu: <strong className="text-white">3 h 50 min ≈ 610 zł</strong> (wycena Twojej godziny: 160 zł, czyli tyle, ile zarabiasz na treningu personalnym).
          </p>
        </GlassCard>

        <div className="flex flex-col gap-5">
          <GlassCard className="border-amber-400/40 bg-amber-400/10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">Rozliczenie</p>
            <h2 className="mt-2 text-lg font-semibold">Ustaliliśmy 5 nagranych rozmów. Jest 0.</h2>
            <p className="mt-2 text-sm text-white/80">
              To już drugi tydzień. Bez nagrań nie zobaczymy, gdzie tracisz klientów. Przy Twoich liczbach to ok. 2 programy miesięcznie mniej. Co Cię blokuje?
            </p>
            <Link href="/rozmowa" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-neutral-900 hover:bg-white/90">
              Odpowiedz Marketing OS
            </Link>
          </GlassCard>
          <GlassCard>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Lekcje do tego modułu</h2>
              <Link href="/lekcje" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-white/80 hover:text-white">
                Wszystkie
              </Link>
            </div>
            <ul className="flex flex-col gap-2">
              {lessons.slice(1, 3).map((l) => (
                <li key={l.title}>
                  <Link href="/lekcje" className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:border-white/30">
                    <PlayCircle className="size-5 shrink-0 text-accent" aria-hidden="true" />
                    <span className="text-sm"><strong className="block font-semibold">{l.title}</strong><span className="text-white/65">{l.source}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </GlassCard>
          <AiNote />
        </div>
      </div>
    </div>
  );
}
