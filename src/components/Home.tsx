"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, PlugZap, ClipboardList, Route, Check, Flame, Zap, FileCheck2, PlayCircle, Dna, Gem, Rocket, PenLine, Trophy, Plug, MessageCircle, BookOpen, ChartPie, ChartColumn, Flag, User, Target, Lock, type LucideIcon } from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS, STAGES, stepStatuses, progressPercent, currentStep, allLessons } from "@/lib/journey";
import { xpTotal, levelOf, streakDays, xpTimeline, activityGrid, phaseProgress, docCompleteness, badges } from "@/lib/gamification";
import { AssistantAvatar, Typewriter, GREETING, ASSISTANT_NAME } from "@/components/Assistant";
import { ChartCard, DataTable, Ring, SegmentedBar, MeterList, Heatmap, XpArea, MessagesBars } from "@/components/Charts";
import { Pill } from "@/components/ui";

const BADGE_ICON: Record<string, LucideIcon> = { plug: Plug, flag: Flag, dna: Dna, user: User, gem: Gem, target: Target, rocket: Rocket, pen: PenLine, chart: ChartColumn, chat: MessageCircle, book: BookOpen, flame: Flame, half: ChartPie, trophy: Trophy };

export function Home() {
  const { ready, state } = useJourney();
  if (!ready) return <p className="text-white/70">Wczytuję…</p>;
  if (!state.ai.mode || !state.survey || !state.pathAccepted) return <Welcome />;
  return <Dashboard />;
}

// ---------- Przed startem ----------
function Welcome() {
  const { state, loadDemo } = useJourney();
  const items = [
    { done: !!state.ai.mode, title: "Połącz swoje AI", text: "ChatGPT albo Claude jednym kliknięciem.", href: "/start", icon: PlugZap },
    { done: !!state.survey, title: "Ankieta", text: "10 szybkich pytań o Twoje studio. Rozpoznamy Twój etap.", href: "/ankieta", icon: ClipboardList },
    { done: state.pathAccepted, title: "Twoja ścieżka", text: "Awatar, oferta, lejek i dalej, krok po kroku.", href: "/ankieta", icon: Route },
  ];
  const next = items.find((x) => !x.done) ?? items[2];
  return (
    <div className="flex flex-col gap-6">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-strong relative overflow-hidden rounded-3xl p-6 md:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[radial-gradient(circle,rgba(221,153,51,.25),transparent_65%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <AssistantAvatar size={112} talking />
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Dochodowe Studio · Marketing OS</p>
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight md:text-5xl">Zbudujmy marketing Twojego studia. Krok po kroku.</h1>
            <p className="max-w-2xl text-lg text-white/85"><Typewriter text={GREETING} /></p>
            <Link href={next.href} className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-brand px-7 text-lg font-bold text-brand-ink shadow-[0_10px_30px_-10px_rgba(221,153,51,.8)] transition hover:brightness-105">
              {items.some((x) => x.done) ? "Kontynuuj" : "Zaczynamy"}<ArrowRight className="size-5" aria-hidden="true" />
            </Link>
            <button type="button" onClick={loadDemo} className="w-fit text-sm font-semibold text-white/60 underline-offset-4 hover:text-white hover:underline">
              Pokaż przykładowy postęp (demo)
            </button>
          </div>
        </div>
      </motion.section>
      <ol className="grid gap-4 md:grid-cols-3">
        {items.map(({ done, title, text, href, icon: Icon }, n) => (
          <li key={title}>
            <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <Link href={href} className="glass-card flex h-full flex-col gap-3 rounded-2xl p-5">
                <span className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-white/10"><Icon className="size-5" aria-hidden="true" /></span>
                  {done ? <Pill tone="good"><Check className="size-3" aria-hidden="true" />Gotowe</Pill> : <Pill>Krok {n + 1}</Pill>}
                </span>
                <strong className="text-lg">{title}</strong>
                <span className="text-sm text-white/75">{text}</span>
              </Link>
            </motion.div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------- Pulpit w trakcie ścieżki ----------
function Dashboard() {
  const { state, reset } = useJourney();
  const statuses = stepStatuses(state);
  const pct = progressPercent(state);
  const stage = STAGES.find((s) => s.id === state.stage);
  const cur = currentStep(state);
  const xp = xpTotal(state.events);
  const level = levelOf(xp);
  const streak = streakDays(state.events);
  const lessons = allLessons();
  const watched = lessons.filter((l) => state.watched[l.id]).length;
  const lessonsPct = lessons.length ? Math.round((watched / lessons.length) * 100) : 0;
  const done = STEPS.filter((s) => statuses[s.id] === "done").length;
  const draft = STEPS.filter((s) => statuses[s.id] === "draft").length;
  const avail = STEPS.filter((s) => statuses[s.id] === "available").length;
  const locked = STEPS.length - done - draft - avail;
  const phases = phaseProgress(state);
  const curPhase = cur ? phases.find((p) => p.phase === cur.phase) : phases[phases.length - 1];
  const timeline = xpTimeline(state.events, 30);
  const grid = activityGrid(state.events, 14);
  const msgs = STEPS.map((s) => ({ label: s.no, title: s.title, msgs: (state.chats[s.id] ?? []).filter((m) => m.role === "user").length }));
  const docs = STEPS.map((s) => ({ label: s.docTitle, value: docCompleteness(s.docTemplate, state.docs[s.docId]?.content), approved: state.docs[s.docId]?.status === "approved" }));
  const allBadges = badges(state);
  const earned = allBadges.filter((b) => b.earned).length;

  const message =
    streak >= 2 ? `Masz serię ${streak} dni z rzędu. Nie przerywaj, dziś wystarczy jeden ruch.`
    : cur && statuses[cur.id] === "draft" ? `Jesteś w trakcie kroku „${cur.title}”. Dokończmy go razem, zostało niewiele.`
    : cur ? `Następny krok: „${cur.title}”. ${cur.goal}`
    : "Cała ścieżka zatwierdzona. Teraz pilnujemy wyników i okazji.";
  const levelHint = level.next ? `Do poziomu „${level.nextName}” brakuje Ci ${level.next - xp} XP.` : "Masz najwyższy poziom.";

  return (
    <div className="flex flex-col gap-5">
      {state.demo ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm">
          <span><strong>Dane przykładowe.</strong> Tak wygląda pulpit uczestnika w połowie ścieżki.</span>
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-4 font-semibold hover:bg-white/10">Wyczyść i zacznij od nowa</button>
        </div>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Asystent + następny krok */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-strong relative overflow-hidden rounded-3xl p-6 md:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -left-20 -bottom-28 size-80 rounded-full bg-[radial-gradient(circle,rgba(0,127,95,.45),transparent_65%)]" />
          <div className="relative flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <AssistantAvatar size={72} talking />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-brand">{ASSISTANT_NAME} · Twój asystent AI</p>
                <p className="mt-1 text-lg font-semibold leading-snug md:text-xl"><Typewriter text={message} /></p>
                <p className="mt-1 text-sm text-white/65">{levelHint}</p>
              </div>
            </div>
            {cur ? (
              <motion.div whileHover={{ y: -4 }}>
                <Link href={`/krok/${cur.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-brand/60">
                  <span className="flex items-center gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand text-lg font-extrabold text-brand-ink">{cur.no}</span>
                    <span><span className="block text-xs text-white/60">{cur.phase}</span><strong className="text-lg">{cur.title}</strong></span>
                  </span>
                  <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 font-bold text-brand-ink">{statuses[cur.id] === "draft" ? "Wracam" : "Start"}<ArrowRight className="size-4" aria-hidden="true" /></span>
                </Link>
              </motion.div>
            ) : null}
          </div>
        </motion.section>

        {/* Poziom i całość */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card flex items-center gap-6 rounded-3xl p-6 md:p-8">
          <Ring value={pct} size={150} stroke={12} label="Cała ścieżka" sub="ścieżki" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">Poziom {level.index}</p>
              <p className="text-2xl font-extrabold">{level.name}</p>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-white/65"><span>{xp} XP</span><span>{level.next ? `${level.next} XP` : "max"}</span></div>
              <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "var(--viz-track)" }} role="progressbar" aria-valuenow={level.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Postęp do kolejnego poziomu">
                <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${level.pct}%` }} transition={{ duration: 1 }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="warn"><Flame className="size-3.5" aria-hidden="true" />{streak} {streak === 1 ? "dzień" : "dni"} z rzędu</Pill>
              <Pill><Trophy className="size-3.5" aria-hidden="true" />{earned}/{allBadges.length} odznak</Pill>
              {stage ? <Pill>{stage.name}</Pill> : null}
            </div>
          </div>
        </motion.section>
      </div>

      {/* Liczby */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile icon={Route} label="Kroki zatwierdzone" value={`${done} / ${STEPS.length}`} href="/sciezka" />
        <Tile icon={FileCheck2} label="Dokumenty gotowe" value={`${docs.filter((d) => d.approved).length} / ${docs.length}`} href="/dokumenty" />
        <Tile icon={PlayCircle} label="Lekcje obejrzane" value={`${watched} / ${lessons.length}`} href="/lekcje" />
        <Tile icon={Zap} label="Punkty XP" value={`${xp}`} href="/" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <ChartCard title="Postęp kołowo" subtitle="Cała ścieżka, bieżący etap i lekcje"
          table={<DataTable head={["Miara", "Wynik"]} rows={[["Cała ścieżka", `${pct}%`], [`Etap: ${curPhase?.phase ?? "—"}`, `${curPhase?.pct ?? 0}%`], ["Lekcje", `${lessonsPct}%`]]} />}>
          <div className="flex flex-wrap items-center justify-around gap-6">
            <figure className="flex flex-col items-center gap-2"><Ring value={pct} label="Cała ścieżka" /><figcaption className="text-sm text-white/75">Cała ścieżka</figcaption></figure>
            <figure className="flex flex-col items-center gap-2"><Ring value={curPhase?.pct ?? 0} color="var(--viz-progress)" label={`Etap ${curPhase?.phase ?? ""}`} /><figcaption className="max-w-[9rem] text-center text-sm text-white/75">{curPhase?.phase}</figcaption></figure>
            <figure className="flex flex-col items-center gap-2"><Ring value={lessonsPct} color="var(--viz-todo)" label="Lekcje" /><figcaption className="text-sm text-white/75">Lekcje</figcaption></figure>
          </div>
        </ChartCard>

        <ChartCard title={`Twoja ścieżka: ${STEPS.length} kroków`} subtitle="Ile kroków masz zatwierdzonych, w trakcie i przed sobą"
          table={<DataTable head={["Stan", "Kroki"]} rows={[["Zatwierdzone", done], ["W trakcie", draft], ["Do zrobienia", avail], ["Później", locked]]} />}>
          <SegmentedBar total={STEPS.length} parts={[
            { label: "Zatwierdzone", value: done, color: "var(--viz-done)" },
            { label: "W trakcie", value: draft, color: "var(--viz-progress)" },
            { label: "Do zrobienia", value: avail, color: "var(--viz-todo)" },
            { label: "Później", value: locked, color: "var(--viz-track)" },
          ]} />
          <ol className="grid grid-cols-6 gap-2 sm:grid-cols-12" aria-label="Kroki ścieżki">
            {STEPS.map((s) => {
              const st = statuses[s.id];
              return (
                <li key={s.id}>
                  <Link href={st === "locked" ? "/sciezka" : `/krok/${s.id}`} title={`${s.no}. ${s.title}`}
                    className="grid aspect-square place-items-center rounded-xl text-sm font-bold transition hover:scale-105"
                    style={{ background: st === "done" ? "var(--viz-done)" : st === "draft" ? "var(--viz-progress)" : st === "available" ? "var(--viz-todo)" : "var(--viz-track)", color: st === "locked" ? "rgba(255,255,255,.55)" : "#0b1410" }}>
                    {st === "done" ? <Check className="size-4" aria-label={`${s.no}. ${s.title}: zatwierdzony`} /> : st === "locked" ? <Lock className="size-3.5" aria-label={`${s.no}. ${s.title}: później`} /> : <span aria-label={`${s.no}. ${s.title}`}>{s.no}</span>}
                  </Link>
                </li>
              );
            })}
          </ol>
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Postęp w etapach" subtitle="Zatwierdzone kroki w każdym etapie ścieżki"
          table={<DataTable head={["Etap", "Zatwierdzone", "Procent"]} rows={phases.map((p) => [p.phase, `${p.done}/${p.total}`, `${p.pct}%`])} />}>
          <MeterList rows={phases.map((p) => ({ label: p.phase, value: p.pct, note: `${p.done}/${p.total}` }))} />
        </ChartCard>
        <ChartCard title="Punkty XP w ostatnich 30 dniach" subtitle="Rosną z każdym zatwierdzonym dokumentem, lekcją i rozmową"
          table={<DataTable head={["Dzień", "XP łącznie"]} rows={timeline.filter((_, i) => i % 3 === 2 || i === timeline.length - 1).map((d) => [d.label, d.xp])} />}>
          <XpArea data={timeline} />
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Twoja aktywność" subtitle={`Ostatnie 14 tygodni · seria: ${streak} ${streak === 1 ? "dzień" : "dni"}`}
          table={<DataTable head={["Dzień", "Działania"]} rows={grid.flat().filter((d) => d.count > 0).map((d) => [d.label, d.count])} />}>
          <Heatmap cols={grid} />
        </ChartCard>
        <ChartCard title="Rozmowy z asystentem w krokach" subtitle="Ile wiadomości napisałeś w każdym kroku"
          table={<DataTable head={["Krok", "Wiadomości"]} rows={msgs.map((m) => [`${m.label}. ${m.title}`, m.msgs])} />}>
          <MessagesBars data={msgs} />
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <ChartCard title="Kompletność dokumentów" subtitle="Ile pól szablonu masz wypełnionych"
          table={<DataTable head={["Dokument", "Wypełnienie", "Stan"]} rows={docs.map((d) => [d.label, `${d.value}%`, d.approved ? "zatwierdzony" : d.value ? "szkic" : "pusty"])} />}>
          <MeterList color="var(--viz-progress)" rows={docs.map((d) => ({ label: d.label, value: d.value, note: d.approved ? "✓" : `${d.value}%` }))} />
        </ChartCard>
        <ChartCard title={`Odznaki: ${earned} z ${allBadges.length}`} subtitle="Zdobywasz je za prawdziwe postępy">
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {allBadges.map((b, i) => {
              const Icon = BADGE_ICON[b.icon] ?? Trophy;
              return (
                <motion.li key={b.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                  className="flex flex-col items-center gap-1.5 text-center" title={`${b.title}: ${b.desc}`}>
                  <span className={`grid size-14 place-items-center rounded-2xl ${b.earned ? "bg-brand text-brand-ink shadow-[0_8px_24px_-8px_rgba(221,153,51,.9)]" : "bg-white/5 text-white/35"}`}>
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <span className={`text-[11px] font-semibold leading-tight ${b.earned ? "" : "text-white/55"}`}>{b.title}</span>
                  <span className="sr-only">{b.earned ? "zdobyta" : "jeszcze nie"}: {b.desc}</span>
                </motion.li>
              );
            })}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: string; href: string }) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
      <Link href={href} className="glass-card flex items-center gap-4 rounded-2xl p-5">
        <span className="grid size-12 place-items-center rounded-xl bg-white/10"><Icon className="size-5 text-brand" aria-hidden="true" /></span>
        <span><span className="block text-3xl font-extrabold">{value}</span><span className="text-sm text-white/70">{label}</span></span>
      </Link>
    </motion.div>
  );
}
