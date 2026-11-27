"use client";

// Wykresy i karty pulpitu (shadcn Chart/Recharts + szklane karty), w barwach DS.
// Zasady (skill dataviz): każdy wykres ma tytuł, opis i tabelę danych („Pokaż dane w tabeli”); jeden szereg = bez legendy;
// stan nigdy samym kolorem (ikona + podpis); XP = pomarańcz (akcent nagród), postęp = zieleń marki.
// Stany kroków: --viz-st-* w globals.css (walidator dataviz, tryb ciemny: CVD ΔE ≥ 11,9, normalne ≥ 22,8).
// Bez wykresów „na pusto”: liczby sprzedaży pokażemy dopiero, gdy będą zbierane (zapowiedź po kroku 12).
import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { ArrowRight, BarChart3, Check, FileText, Flag, Lock, PenLine, PlayCircle, Sparkles, Video, type LucideIcon } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ChartCard, DataTable } from "@/components/Charts";
import { LEVELS, type MilestoneProgress, type phaseDetail } from "@/lib/gamification";
import type { Lesson, Step, StepStatus } from "@/lib/journey-types";

// ---------- 1. Ścieżka etap po etapie: kroki (stan) + lekcje ----------
const ST: Record<StepStatus, { label: string; color: string; Icon?: LucideIcon }> = {
  done: { label: "Zatwierdzony", color: "var(--viz-st-done)", Icon: Check },
  draft: { label: "W trakcie", color: "var(--viz-st-draft)", Icon: PenLine },
  available: { label: "Do zrobienia", color: "var(--viz-st-todo)" },
  locked: { label: "Później", color: "var(--viz-track)", Icon: Lock },
};

export function PathByPhase({ phases }: { phases: ReturnType<typeof phaseDetail> }) {
  const steps = phases.flatMap((p) => p.steps);
  const count = (s: StepStatus) => steps.filter((x) => x.status === s).length;
  const lessonsDone = phases.reduce((n, p) => n + p.lessonsDone, 0);
  const lessonsTotal = phases.reduce((n, p) => n + p.lessonsTotal, 0);
  return (
    <ChartCard
      title="Ścieżka etap po etapie"
      subtitle={`${count("done")} z ${steps.length} kroków zatwierdzonych · ${lessonsDone} z ${lessonsTotal} lekcji ścieżki zaliczonych`}
      table={<DataTable head={["Etap", "Zatwierdzone", "W trakcie", "Kroki", "Lekcje"]} rows={phases.map((p) => [p.phase, p.done, p.draft, p.total, `${p.lessonsDone}/${p.lessonsTotal}`])} />}
    >
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/75" aria-label="Legenda">
        {(Object.keys(ST) as StepStatus[]).map((k) => {
          const { label, color, Icon } = ST[k];
          return (
            <li key={k} className="flex items-center gap-1.5">
              <span className="grid size-4 place-items-center rounded-[4px]" style={{ background: color, color: k === "locked" ? "rgba(255,255,255,.7)" : "#0b1410" }} aria-hidden="true">{Icon ? <Icon className="size-3" strokeWidth={3} /> : null}</span>
              {label} <span className="text-white/50">{count(k)}</span>
            </li>
          );
        })}
      </ul>
      <ol className="flex flex-col gap-3.5">
        {phases.map((p, pi) => (
          <li key={p.phase} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[150px_minmax(0,1fr)_170px]">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{p.phase}</p>
              <p className="text-xs text-white/60">{p.done}/{p.total} {p.total === 1 ? "krok" : "kroki"}</p>
            </div>
            <ul className="flex gap-1.5" aria-label={`Kroki etapu ${p.phase}`}>
              {p.steps.map((s, si) => {
                const { label, color, Icon } = ST[s.status];
                return (
                  <motion.li key={s.id} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.04 * (pi * 3 + si) }}>
                    <Link href={s.status === "locked" ? "/sciezka" : `/krok/${s.id}`} title={`${s.no}. ${s.title}: ${label.toLowerCase()}`}
                      className="grid size-10 place-items-center rounded-xl text-sm font-bold transition hover:-translate-y-0.5 hover:brightness-110"
                      style={{ background: color, color: s.status === "locked" ? "rgba(255,255,255,.6)" : "#0b1410" }}>
                      {Icon ? <Icon className="size-4" strokeWidth={s.status === "locked" ? 2 : 3} aria-hidden="true" /> : <span aria-hidden="true">{s.no}</span>}
                      <span className="sr-only">Krok {s.no}. {s.title}: {label.toLowerCase()}</span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
            <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
              <PlayCircle className="size-3.5 shrink-0 text-white/55" aria-hidden="true" />
              <span className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--viz-track)" }} aria-hidden="true">
                <motion.span className="block h-full rounded-full bg-white/75" initial={{ width: 0 }} animate={{ width: `${p.lessonsTotal ? (p.lessonsDone / p.lessonsTotal) * 100 : 0}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
              </span>
              <span className="shrink-0 whitespace-nowrap text-right text-xs tabular-nums text-white/70">lekcje {p.lessonsDone}/{p.lessonsTotal}</span>
            </div>
          </li>
        ))}
      </ol>
    </ChartCard>
  );
}

// ---------- 2. Co dalej: lekcja, dokument, narzędzie AI i najbliższy kamień ----------
// Narzędzia AI pasujące do kroku. tools.ts jest tylko po stronie serwera, więc tu sama lista id i nazw.
// DO ZATWIERDZENIA (Bartek): które narzędzie podpowiadamy w którym kroku.
const STEP_TOOL: Record<string, { id: string; title: string }> = {
  awatar: { id: "nowy-awatar", title: "Nowy awatar" },
  oferta: { id: "vsl", title: "Scenariusz VSL" },
  sprzedaz: { id: "asystent-sprzedazy", title: "Asystent sprzedaży" },
  strategia: { id: "ctr", title: "Analiza reklam" },
  gotowosc: { id: "ctr", title: "Analiza reklam" },
  "materialy-lejka": { id: "rolki", title: "Rolki" },
  plan: { id: "rolki", title: "Rolki" },
  wyniki: { id: "ctr", title: "Analiza reklam" },
  okazje: { id: "opinie-polecenia", title: "Prośba o opinię i polecenie" },
  utrzymanie: { id: "lista-rezerwowa", title: "Lista rezerwowa" },
  zespol: { id: "ogloszenie-trener", title: "Ogłoszenie o pracę dla trenera" },
};

function Row({ icon: Icon, label, children, href, tone = "neutral" }: { icon: LucideIcon; label: string; children: ReactNode; href?: string; tone?: "neutral" | "done" | "orange" }) {
  const inner = (
    <>
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone === "done" ? "bg-brand/20 text-brand" : tone === "orange" ? "bg-orange/15 text-orange" : "bg-white/[0.08] text-white"}`}><Icon className="size-5" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-white/55">{label}</span>
        <span className="block text-sm font-semibold leading-snug">{children}</span>
      </span>
      {href ? <ArrowRight className="size-4 shrink-0 text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white" aria-hidden="true" /> : null}
    </>
  );
  return (
    <li>
      {href ? <Link href={href} className="group flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.06]">{inner}</Link> : <div className="flex min-h-14 items-center gap-3 px-2 py-2">{inner}</div>}
    </li>
  );
}

export function NextUp({ step, lessonsDone, docPct, docStarted, milestone }: {
  step: Step | undefined;
  lessonsDone: (l: Lesson) => boolean;
  docPct: number;
  docStarted: boolean;
  milestone: MilestoneProgress | undefined;
}) {
  const lesson = step?.lessons.find((l) => !lessonsDone(l));
  const tool = step ? STEP_TOOL[step.id] : undefined;
  const missing = milestone ? milestone.total - milestone.done : 0;
  return (
    <ChartCard title={step ? `Co dalej w kroku ${step.no}` : "Co dalej"} subtitle={step ? `„${step.title}”: lekcja, dokument i narzędzie w jednym miejscu` : "Cała ścieżka zatwierdzona"}>
      <ul className="-mx-2 flex flex-col">
        {step ? (
          <>
            {lesson ? (
              <Row icon={PlayCircle} label={`Lekcja · ${step.lessons.filter(lessonsDone).length}/${step.lessons.length} zaliczone`} href={`/krok/${step.id}`}>{lesson.title}</Row>
            ) : (
              <Row icon={Check} label="Lekcje kroku" tone="done">Wszystkie zaliczone, czas na rozmowę z Bartkiem</Row>
            )}
            <Row icon={FileText} label={`Dokument · ${docStarted ? `${docPct}% pól wypełnionych` : "jeszcze pusty"}`} href={`/krok/${step.id}`}>{step.docTitle}</Row>
            <Row icon={Sparkles} label="Narzędzie AI do tego kroku" href={tool ? `/narzedzia/${tool.id}` : "/narzedzia"}>{tool ? tool.title : "Wszystkie narzędzia AI"}</Row>
          </>
        ) : (
          <Row icon={Sparkles} label="Narzędzia AI" href="/narzedzia">Asystent sprzedaży, analiza reklam, rolki i VSL na co dzień</Row>
        )}
        {milestone ? (
          <Row icon={milestone.call ? Video : Flag} tone={milestone.call ? "orange" : "neutral"} label={`Kamień ${milestone.no} · ${milestone.done}/${milestone.total} zadań`}>
            {missing === 1 ? "Brakuje 1 zadania" : `Brakuje ${missing} zadań`} do kamienia „{milestone.short}”{milestone.call ? " i 30 min z Bartkiem" : ""}
          </Row>
        ) : null}
      </ul>
    </ChartCard>
  );
}

// ---------- 3. XP w czasie z progami poziomów ----------
const xpConfig = { xp: { label: "Punkty XP", color: "var(--orange)" } } satisfies ChartConfig;

export function XpLevels({ data, xp, level }: {
  data: { day: string; label: string; xp: number }[];
  xp: number;
  level: { name: string; next: number | null; nextName: string | null };
}) {
  const max = Math.max(0, ...data.map((d) => d.xp));
  const top = Math.ceil((Math.max(max, level.next ?? max) * 1.08) / 100) * 100 || 100;
  const lines = LEVELS.filter((l) => l.min > 0 && l.min <= top);
  const changes = data.filter((d, i) => i === data.length - 1 || d.xp !== data[i - 1]?.xp);
  return (
    <ChartCard
      title="XP w czasie i progi poziomów"
      subtitle={`Ostatnie ${data.length} dni · ${xp} XP · ${level.next ? `do poziomu „${level.nextName}” brakuje ${level.next - xp} XP` : "najwyższy poziom"}`}
      table={<DataTable head={["Dzień", "XP łącznie"]} rows={changes.map((d) => [new Date(d.day).toLocaleDateString("pl-PL", { day: "numeric", month: "long" }), d.xp])} />}
    >
      <ChartContainer config={xpConfig} className="aspect-auto h-[250px] w-full">
        <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 12, top: 18, bottom: 0 }}>
          <defs>
            <linearGradient id="xpLevelsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-xp)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-xp)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,.07)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} />
          <YAxis tickLine={false} axisLine={false} width={42} allowDecimals={false} domain={[0, top]} />
          {lines.map((l) => (
            <ReferenceLine key={l.min} y={l.min} stroke="rgba(255,255,255,.32)" strokeDasharray="4 4"
              label={{ value: `${l.name} · ${l.min} XP`, position: "insideTopLeft", fill: "rgba(255,255,255,.72)", fontSize: 11 }} />
          ))}
          <ChartTooltip cursor={{ stroke: "rgba(255,255,255,.25)" }} content={<ChartTooltipContent indicator="line" />} />
          <Area dataKey="xp" type="monotone" stroke="var(--color-xp)" strokeWidth={2} fill="url(#xpLevelsFill)" activeDot={{ r: 5, strokeWidth: 2, stroke: "#0f1f19" }} />
        </AreaChart>
      </ChartContainer>
      <p className="text-xs text-white/60">Przerywane linie to progi poziomów. Pomarańczowa linia to Twoje XP narastająco.</p>
    </ChartCard>
  );
}

// ---------- 4. Wyniki studia: zapowiedź (danych sprzedaży jeszcze nie zbieramy) ----------
// DO ZATWIERDZENIA: jakie liczby zbieramy po kroku 12 (zgłoszenia, umówione konsultacje, sprzedaż, koszt pozyskania klienta).
export function ResultsTeaser({ status }: { status: StepStatus | undefined }) {
  const done = status === "done";
  return (
    <section className="glass-card flex items-start gap-4 rounded-2xl p-5 md:p-6" aria-labelledby="wyniki-h">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/[0.08] text-white/70"><BarChart3 className="size-6" aria-hidden="true" /></span>
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 id="wyniki-h" className="flex items-center gap-2 text-base font-bold">Wyniki studia {done ? null : <Lock className="size-4 text-white/50" aria-label="zablokowane" />}</h2>
        <p className="text-sm text-white/70">
          {done
            ? "Przegląd wyników zatwierdzony. Wykres tygodniowych liczb studia pojawi się tutaj w kolejnej wersji platformy."
            : "Po kroku 12 „Przegląd wyników” pokażemy tu liczby studia: zgłoszenia, umówione konsultacje, sprzedaż i koszt pozyskania klienta. Do tego czasu niczego nie zgadujemy."}
        </p>
        {status && status !== "locked" && !done ? (
          <Link href="/krok/wyniki" className="mt-1 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">Przejdź do kroku 12<ArrowRight className="size-4" aria-hidden="true" /></Link>
        ) : null}
      </div>
    </section>
  );
}
