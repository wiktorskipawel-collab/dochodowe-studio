"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Check, Flame, Zap, FileCheck2, PlayCircle, Route, Trophy, Lock, TrendingUpIcon } from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS, STAGES, stepStatuses, progressPercent, currentStep, allLessons } from "@/lib/journey";
import { xpTotal, levelOf, streakDays, activityGrid, phaseProgress, docCompleteness, badges, weeklyActivity, dailySeries, lastWeek } from "@/lib/gamification";
import { AssistantAvatar, Typewriter, ASSISTANT_NAME } from "@/components/Assistant";
import { Milestones } from "@/components/Milestones";
import { Onboarding } from "@/components/Onboarding";
import { ChartCard, DataTable, Ring, SegmentedBar, MeterList, Heatmap } from "@/components/Charts";
import { PhasesRadial, WeekStacked, ActivityLine } from "@/components/DashboardCharts";
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
  const watched = lessons.filter((l) => state.watched[l.id]).length;
  const done = STEPS.filter((s) => statuses[s.id] === "done").length;
  const draft = STEPS.filter((s) => statuses[s.id] === "draft").length;
  const avail = STEPS.filter((s) => statuses[s.id] === "available").length;
  const locked = STEPS.length - done - draft - avail;
  const phases = phaseProgress(state);
  const grid = activityGrid(state.events, 14);
  const docs = STEPS.map((s) => ({ label: s.docTitle, value: docCompleteness(s.docTemplate, state.docs[s.docId]?.content), approved: state.docs[s.docId]?.status === "approved" }));
  const allBadges = badges(state);
  const earned = allBadges.filter((b) => b.earned).length;
  const xpWeek = lastWeek(state.events, ["ai", "survey", "path", "draft", "approve", "lesson", "msg"]).length ? xpTotal(lastWeek(state.events, ["ai", "survey", "path", "draft", "approve", "lesson", "msg"])) : 0;

  const message =
    streak >= 2 ? `Masz serię ${streak} dni z rzędu. Nie przerywaj, dziś wystarczy jeden ruch.`
    : cur && statuses[cur.id] === "draft" ? `Jesteś w trakcie kroku „${cur.title}”. Dokończmy go razem, zostało niewiele.`
    : cur ? `Następny krok: „${cur.title}”. ${cur.goal}`
    : "Cała ścieżka zatwierdzona. Teraz pilnujemy wyników i okazji.";
  const levelHint = level.next ? `Do poziomu „${level.nextName}” brakuje Ci ${level.next - xp} XP.` : "Masz najwyższy poziom.";

  const cards = [
    { label: "Kroki zatwierdzone", value: `${done}/${STEPS.length}`, icon: Route, delta: lastWeek(state.events, ["approve"]).length, note: "zatwierdzonych w tym tygodniu", href: "/sciezka" },
    { label: "Dokumenty gotowe", value: `${docs.filter((d) => d.approved).length}/${docs.length}`, icon: FileCheck2, delta: lastWeek(state.events, ["draft", "approve"]).length, note: "zmian w dokumentach w tym tygodniu", href: "/dokumenty" },
    { label: "Lekcje obejrzane", value: `${watched}/${lessons.length}`, icon: PlayCircle, delta: lastWeek(state.events, ["lesson"]).length, note: "lekcji w tym tygodniu", href: "/lekcje" },
    { label: "Punkty XP", value: `${xp}`, icon: Zap, delta: xpWeek, note: "XP w tym tygodniu", href: "/" },
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
              {stage ? <span className="max-w-full truncate rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/85" title={stage.name}>{stage.name}</span> : null}
            </div>
          </div>
        </motion.section>
      </div>

      <Onboarding />
      <Milestones state={state} />

      {/* Karty z liczbami (dashboard-01) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} whileHover={{ y: -5 }} whileTap={{ scale: 0.97 }}>
            <Link href={c.href} className="block">
              <Card className="@container/card">
                <CardHeader>
                  <CardDescription className="flex items-center gap-2"><c.icon className="size-4 text-brand" aria-hidden="true" />{c.label}</CardDescription>
                  <CardTitle className="text-3xl font-extrabold @[250px]/card:text-4xl">{c.value}</CardTitle>
                  <CardAction>
                    <Badge variant="outline" className={c.delta ? "border-emerald-400/40 text-emerald-200" : ""}>
                      {c.delta ? <TrendingUpIcon /> : null}+{c.delta}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="text-sm text-muted-foreground">+{c.delta} {c.note}</CardFooter>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <PhasesRadial phases={phases} />
        <WeekStacked data={weeklyActivity(state.events, 7)} />
      </div>

      <ActivityLine data={dailySeries(state.events, 60)} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-2">
        <ChartCard title={`Twoja ścieżka: ${STEPS.length} kroków`} subtitle="Zatwierdzone, w trakcie i przed Tobą"
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
                    className="grid aspect-square place-items-center rounded-xl text-sm font-bold transition hover:scale-110"
                    style={{ background: st === "done" ? "var(--viz-done)" : st === "draft" ? "var(--viz-progress)" : st === "available" ? "var(--viz-todo)" : "var(--viz-track)", color: st === "locked" ? "rgba(255,255,255,.55)" : "#0b1410" }}>
                    {st === "done" ? <Check className="size-4" aria-label={`${s.no}. ${s.title}: zatwierdzony`} /> : st === "locked" ? <Lock className="size-3.5" aria-label={`${s.no}. ${s.title}: później`} /> : <span aria-label={`${s.no}. ${s.title}`}>{s.no}</span>}
                  </Link>
                </li>
              );
            })}
          </ol>
        </ChartCard>
        <ChartCard title="Mapa aktywności" subtitle={`Ostatnie 14 tygodni · seria: ${streak} ${streak === 1 ? "dzień" : "dni"}`}
          table={<DataTable head={["Dzień", "Działania"]} rows={grid.flat().filter((d) => d.count > 0).map((d) => [d.label, d.count])} />}>
          <Heatmap cols={grid} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <ChartCard title="Kompletność dokumentów" subtitle="Ile pól szablonu masz wypełnionych"
          table={<DataTable head={["Dokument", "Wypełnienie", "Stan"]} rows={docs.map((d) => [d.label, `${d.value}%`, d.approved ? "zatwierdzony" : d.value ? "szkic" : "pusty"])} />}>
          <MeterList color="var(--viz-progress)" rows={docs.map((d) => ({ label: d.label, value: d.value, note: d.approved ? "✓" : `${d.value}%` }))} />
        </ChartCard>
        <ChartCard title={`Odznaki: ${earned} z ${allBadges.length}`} subtitle="Zdobywasz je za prawdziwe postępy">
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {allBadges.map((b, i) => {
              return (
                <motion.li key={b.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} whileHover={{ y: -4, scale: 1.06 }}
                  className="flex flex-col items-center gap-1.5 text-center" title={`${b.title}: ${b.desc}`}>
                  <span className={`grid size-14 place-items-center rounded-2xl ${b.earned ? "bg-brand text-brand-ink shadow-[0_8px_24px_-8px_rgba(114,196,28,.55)]" : "bg-white/5 text-white/35"}`}>
                    <BadgeIcon icon={b.icon} className="size-6" />
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
