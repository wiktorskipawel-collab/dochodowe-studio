import Link from "next/link";
import { Check, Lock, FileText } from "lucide-react";
import { GlassCard, Pill, PageHeader } from "@/components/ui";
import { modules, funnels, library } from "@/lib/data";

export const metadata = { title: "Ścieżka · Marketing OS" };

export default function Sciezka() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Ścieżka Marketing OS" title="Od DNA studia do klientów z wybranych lejków">
        Każdy uczestnik przechodzi tę samą drogę, ale Marketing OS dopasowuje ją do etapu studia. Nie uruchamiamy wszystkich lejków naraz.
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ol className="flex flex-col gap-4">
          {modules.map((m) => (
            <li key={m.no}>
              <GlassCard className={m.status === "now" ? "border-accent" : ""}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span
                    className={`grid size-14 shrink-0 place-items-center rounded-xl text-lg font-bold ${
                      m.status === "done" ? "bg-emerald-400/15 text-emerald-300" : m.status === "now" ? "bg-accent text-accent-ink" : "bg-white/10"
                    }`}
                  >
                    {m.no}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold">{m.title}</h2>
                      {m.status === "done" ? <Pill tone="good">Karta gotowa</Pill> : m.status === "now" ? <Pill tone="accent">Teraz</Pill> : <Pill><Lock className="size-3" aria-hidden="true" />Dalej</Pill>}
                    </div>
                    <p className="text-sm text-white/75">{m.text}</p>
                    {m.steps ? (
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {m.steps.map((s, i) => {
                          const done = m.status === "done" || (m.status === "now" && i < 2);
                          return (
                            <li key={s} className="flex items-center gap-2 text-sm">
                              <span className={`grid size-5 place-items-center rounded ${done ? "bg-emerald-400 text-neutral-900" : "border border-white/30"}`} aria-hidden="true">
                                {done ? <Check className="size-3.5" /> : null}
                              </span>
                              <span className={done ? "text-white/65" : ""}>{s}</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                    {m.no === "02" ? (
                      <ul className="mt-2 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                        {funnels.map((f) => (
                          <li key={f.name} className={`flex flex-col gap-2 rounded-xl border p-4 ${f.state === "picked" ? "border-accent bg-accent/10" : f.state === "notNow" ? "border-white/10 bg-black/20" : "border-white/10 bg-white/5"}`}>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold">{f.name}</h3>
                              {f.state === "picked" ? <Pill tone="accent">Wybrany</Pill> : f.state === "notNow" ? <Pill>Nie teraz</Pill> : <Pill>Później</Pill>}
                            </div>
                            <p className="text-sm text-white/70">{f.text}</p>
                            <p className="text-sm"><strong>Gotowość:</strong> {f.ready}</p>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {m.status === "now" ? (
                      <Link href="/rozmowa" className="mt-1 inline-flex min-h-11 w-fit items-center rounded-xl bg-accent px-5 font-semibold text-accent-ink hover:brightness-95">
                        Kontynuuj
                      </Link>
                    ) : null}
                  </div>
                </div>
              </GlassCard>
            </li>
          ))}
        </ol>

        <aside className="flex flex-col gap-5" aria-label="Jak działa moduł">
          <GlassCard>
            <h2 className="mb-3 text-lg font-semibold">Jak działa każdy moduł</h2>
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-white/85">
              <li><strong>AI pyta tylko o braki.</strong> Resztę bierze z DNA studia i wgranych materiałów.</li>
              <li><strong>Proponuje 2–3 koncepcje</strong> i mówi, którą poleca i dlaczego.</li>
              <li><strong>Ty zatwierdzasz.</strong> Bez zgody nic nie powstaje.</li>
              <li><strong>Dostajesz materiały, zadania i KPI.</strong> Wynik zapisuje się jako karta.</li>
            </ol>
          </GlassCard>
          <GlassCard>
            <h2 className="mb-2 text-lg font-semibold">Każdy moduł kończy się kartą</h2>
            <p className="text-sm text-white/75">Karty to pamięć Marketing OS. Kolejne moduły czytają karty, a nie całą historię rozmów. Dzięki temu AI się nie gubi, a koszt jest niski.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["DNA studia", "Strategia", "Lejek: Formularze", "Wyniki"].map((c) => (
                <Pill key={c}><FileText className="size-3" aria-hidden="true" />{c}</Pill>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="bg-accent/10">
            <h2 className="mb-2 text-lg font-semibold">Źródło wiedzy</h2>
            <p className="text-sm text-white/80">
              Metodyka Bartka z {library.lessons} lekcji Skool, {library.mentorings} mentoringów grupowych i kanału YouTube. Każda zasada ma źródło, a sprzeczne wypowiedzi trafiają do decyzji Bartka.
            </p>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}
