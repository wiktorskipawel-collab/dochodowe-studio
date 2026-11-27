"use client";

// PULPIT właściciela studia. Kolejność: co dziś zrobić (Bartek + następny krok) → poziom → kamienie milowe (moduły Skool)
// → liczby → co dalej i ścieżka etap po etapie → XP z progami poziomów i seria → dokumenty i odznaki → zapowiedź wyników.
// Przegląd wykresów (2026-11-27): zostały mapa aktywności, kompletność dokumentów (tylko rozpoczęte) i odznaki;
// doszły: szlak kamieni, „Co dalej”, ścieżka etap po etapie (kroki + lekcje), XP z progami poziomów, zapowiedź wyników;
// usunięte: wykres kołowy etapów (trudny do odczytania, zastąpiony ścieżką etap po etapie), słupki „Twój tydzień”
// (7 dni to za mało, rytm pokazuje mapa aktywności), dzienne XP (szarpana linia, zastąpiona XP narastająco z progami)
// i karta „Dokumenty gotowe” (to ta sama liczba co zatwierdzone kroki: 1 krok = 1 dokument).
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Flame, Zap, PlayCircle, Route, Trophy, Flag, TrendingUpIcon } from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS, STAGES, stepStatuses, progressPercent, currentStep, allLessons } from "@/lib/journey";
import {
  LEVELS, xpTotal, levelOf, streakDays, activityGrid, docCompleteness, badges, lastWeek, xpTimeline, milestones, nextMilestone, phaseDetail, lessonDone,
} from "@/lib/gamification";
import { AssistantAvatar, Typewriter, ASSISTANT_NAME } from "@/components/Assistant";
import { Milestones } from "@/components/Milestones";
import { Onboarding } from "@/components/Onboarding";
import { ChartCard, DataTable, Ring, MeterList, Heatmap } from "@/components/Charts";
import { NextUp, PathByPhase, ResultsTeaser, XpLevels } from "@/components/DashboardCharts";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill } from "@/components/ui";
import { BadgeIcon } from "@/components/BadgeIcon";

export function Home() {
  const { state, reset } = useJourney();
  const statuses = stepStatuses(state);
  const pct = progressPercent(state);
  const stage = STAGES.find((s) => s.id === state.stage);
  const cur = currentStep(state);
  const xp = xpTotal(state.events);
  const level = levelOf(xp);
  const streak = streakDays(state.events);
  const lessons = allLessons();
  const watched = lessons.filter((l) => lessonDone(state, l.id)).length;
  const done = STEPS.filter((s) => statuses[s.id] === "done").length;
  const grid = activityGrid(state.events, 14);
  const activeDays = grid.flat().filter((d) => d.count > 0).length;
  const docs = STEPS.map((s) => ({ label: s.docTitle, value: docCompleteness(s.docTemplate, state.docs[s.docId]?.content), approved: state.docs[s.docId]?.status === "approved", started: !!state.docs[s.docId]?.content?.trim() }));
  const started = docs.filter((d) => d.started);
  const allBadges = badges(state);
  const earned = allBadges.filter((b) => b.earned).length;
  const xpWeek = xpTotal(lastWeek(state.events, ["ai", "survey", "path", "draft", "approve", "lesson", "msg"]));
  const stones = milestones(state);
  const stonesDone = stones.filter((m) => m.complete).length;
  const nextStone = nextMilestone(stones);
  const curDoc = cur ? state.docs[cur.docId]?.content : undefined;

  const message =
    streak >= 2 ? `Masz serię ${streak} dni z rzędu. Nie przerywaj, dziś wystarczy jeden ruch.`
    : cur && statuses[cur.id] === "draft" ? `Jesteś w trakcie kroku „${cur.title}”. Dokończmy go razem, zostało niewiele.`
    : cur ? `Następny krok: „${cur.title}”. ${cur.goal}`
    : "Cała ścieżka zatwierdzona. Teraz pilnujemy wyników i okazji.";
  const levelHint = level.next ? `Do poziomu „${level.nextName}” brakuje Ci ${level.next - xp} XP.` : "Masz najwyższy poziom: Dochodowe Studio.";

  const cards = [
    { label: "Kroki zatwierdzone", value: `${done}/${STEPS.length}`, icon: Route, delta: lastWeek(state.events, ["approve"]).length, note: "zatwierdzonych w tym tygodniu", href: "/sciezka" },
    { label: "Kamienie milowe", value: `${stonesDone}/${stones.length}`, icon: Flag, delta: null, note: nextStone ? `najbliższy: ${nextStone.short} (${nextStone.done}/${nextStone.total})` : "wszystkie zdobyte", href: "#kamienie-h" },
    { label: "Lekcje ścieżki", value: `${watched}/${lessons.length}`, icon: PlayCircle, delta: lastWeek(state.events, ["lesson"]).length, note: "lekcji w tym tygodniu", href: "/lekcje" },
    { label: "Punkty XP", value: `${xp}`, icon: Zap, delta: xpWeek, note: "XP w tym tygodniu", href: "#xp-h" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {state.demo ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm">
          <span><strong>Dane przykładowe.</strong> Tak wygląda pulpit uczestnika w połowie ścieżki.</span>
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-4 font-semibold hover:bg-white/10">Wyczyść i zacznij od nowa</button>
        </div>
      ) : null}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <motion.section data-tour="hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-strong relative overflow-hidden rounded-3xl p-6 md:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 size-80 rounded-full bg-[radial-gradient(circle,rgba(46,140,30,.45),transparent_65%)]" />
          <div className="relative flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <AssistantAvatar size={72} talking />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-brand">{ASSISTANT_NAME} · Twój asystent AI</p>
                <p className="mt-1 text-lg font-semibold leading-snug md:text-xl"><Typewriter text={state.profile?.name ? `${state.profile.name.split(" ")[0]}, ${message.charAt(0).toLowerCase()}${message.slice(1)}` : message} /></p>
                <p className="mt-1 text-sm text-white/65">{levelHint}</p>
              </div>
            </div>
            {cur ? (
              <motion.div data-tour="next-step" whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
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

        <motion.section data-tour="progress" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card flex items-center gap-6 rounded-3xl p-6 md:p-8">
          <Ring value={pct} size={150} stroke={12} label="Cała ścieżka" sub="ścieżki" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">Poziom {level.index} z {LEVELS.length}</p>
              <p className="text-2xl font-extrabold leading-tight">{level.name}</p>
              <p className="mt-0.5 text-xs text-white/60">{level.opis}</p>
            </div>
            <div>
              <div className="mb-1 flex justify-between gap-2 text-xs text-white/65"><span>{xp} XP</span><span className="truncate">{level.next ? `${level.nextName} · ${level.next} XP` : "max"}</span></div>
              <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "var(--viz-track)" }} role="progressbar" aria-valuenow={level.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Postęp do kolejnego poziomu">
                <motion.div className="h-full rounded-full bg-orange" initial={{ width: 0 }} animate={{ width: `${level.pct}%` }} transition={{ duration: 1 }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="warn"><Flame className="size-3.5" aria-hidden="true" />{streak} {streak === 1 ? "dzień" : "dni"} z rzędu</Pill>
              <Pill><Trophy className="size-3.5" aria-hidden="true" />{earned}/{allBadges.length} odznak</Pill>
              {stage ? <span className="max-w-full truncate rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/85" title={stage.name}>{stage.name}</span> : null}
            </div>
          </div>
        </motion.section>
      </div>

      <Onboarding />
      <Milestones state={state} />

      {/* Liczby (dashboard-01) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} whileHover={{ y: -5 }} whileTap={{ scale: 0.97 }}>
            <Link href={c.href} className="block h-full">
              <Card className="@container/card h-full">
                <CardHeader>
                  <CardDescription className="flex items-center gap-2"><c.icon className="size-4 text-brand" aria-hidden="true" />{c.label}</CardDescription>
                  <CardTitle className="text-3xl font-extrabold @[250px]/card:text-4xl">{c.value}</CardTitle>
                  {c.delta !== null ? (
                    <CardAction>
                      <Badge variant="outline" className={c.delta ? "border-emerald-400/40 text-emerald-200" : ""}>
                        {c.delta ? <TrendingUpIcon aria-hidden="true" /> : null}+{c.delta}
                      </Badge>
                    </CardAction>
                  ) : null}
                </CardHeader>
                <CardFooter className="text-sm text-muted-foreground">{c.delta !== null ? `+${c.delta} ${c.note}` : c.note}</CardFooter>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
        <div className="flex flex-col gap-5">
          <NextUp step={cur} lessonsDone={(l) => lessonDone(state, l.id)} docPct={cur ? docCompleteness(cur.docTemplate, curDoc) : 0} docStarted={!!curDoc?.trim()} milestone={nextStone} />
          <ResultsTeaser status={statuses.wyniki} />
        </div>
        <PathByPhase phases={phaseDetail(state)} />
      </div>

      <div id="xp-h" className="grid scroll-mt-20 grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <XpLevels data={xpTimeline(state.events, 30)} xp={xp} level={level} />
        <ChartCard title="Seria i aktywność" subtitle={`Ostatnie 14 tygodni · seria: ${streak} ${streak === 1 ? "dzień" : "dni"} · aktywne dni: ${activeDays}`}
          table={<DataTable head={["Dzień", "Działania"]} rows={grid.flat().filter((d) => d.count > 0).map((d) => [d.label, d.count])} />}>
          <Heatmap cols={grid} />
          <p className="text-xs text-white/60">Jedno działanie dziennie (lekcja, wiadomość, dokument) podtrzymuje serię.</p>
        </ChartCard>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <ChartCard title="Kompletność dokumentów" subtitle={`Rozpoczęte: ${started.length} z ${docs.length} · ile pól szablonu masz wypełnionych`}
          table={<DataTable head={["Dokument", "Wypełnienie", "Stan"]} rows={docs.map((d) => [d.label, `${d.value}%`, d.approved ? "zatwierdzony" : d.started ? "szkic" : "nierozpoczęty"])} />}>
          {started.length ? (
            <MeterList color="var(--viz-st-done)" rows={started.map((d) => ({ label: d.label, value: d.value, note: d.approved ? "gotowy" : `${d.value}%` }))} />
          ) : <p className="text-sm text-white/65">Pierwszy dokument powstanie w kroku 1. Tu zobaczysz, ile pól już masz.</p>}
          {docs.length > started.length ? <p className="text-xs text-white/55">Pozostałe {docs.length - started.length} dokumentów powstanie w kolejnych krokach.</p> : null}
        </ChartCard>
        <ChartCard title={`Odznaki: ${earned} z ${allBadges.length}`} subtitle="Zdobywasz je za prawdziwe postępy">
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {allBadges.map((b, i) => (
              <motion.li key={b.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} whileHover={{ y: -4, scale: 1.06 }}
                className="flex flex-col items-center gap-1.5 text-center" title={`${b.title}: ${b.desc}`}>
                <span className={`grid size-14 place-items-center rounded-2xl ${b.earned ? "bg-brand text-brand-ink shadow-[0_8px_24px_-8px_rgba(114,196,28,.55)]" : "bg-white/5 text-white/35"}`}>
                  <BadgeIcon icon={b.icon} className="size-6" />
                </span>
                <span className={`text-[11px] font-semibold leading-tight ${b.earned ? "" : "text-white/55"}`}>{b.title}</span>
                <span className="sr-only">{b.earned ? "zdobyta" : "jeszcze nie"}: {b.desc}</span>
              </motion.li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}
