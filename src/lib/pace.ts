// TEMPO DO CELU (prośba Pawła 2026-11-28). Bartek rozlicza tempo pracy względem celu z ankiety
// („Co chcesz osiągnąć w ciągu 6 miesięcy?”, pole `cel-liczby`). Kto robi robotę, słyszy „dobra robota”.
// Kto stoi, słyszy coraz mocniej (3 stopnie: wolno → w tyle → stoi). Zawsze na liczbach i bez obrażania
// (ton z metodyki Bartka: „stanowczy mentor, bez obrażania, ale z konfrontacją, krótko i na liczbach”).
// DO ZATWIERDZENIA (Bartek): plan „cała ścieżka w 90 dni”, progi stopni i brzmienie tekstów. Własne teksty Bartka
// podmieniamy w funkcji `talk()` niżej.
import type { JourneyState } from "@/lib/store";
import { STEPS } from "@/lib/journey";

const DAY = 86_400_000;
/** Cała ścieżka w ok. 3 miesiące. Kolejne 3 miesiące z 6-miesięcznego celu zostają na wyniki. */
export const PLAN_DAYS = 90;
/** Horyzont celu z ankiety. */
export const GOAL_MONTHS = 6;
/** Pierwszy tydzień po ankiecie bez rozliczania (rozruch). */
const GRACE_DAYS = 7;

export type PaceLevel = "start" | "meta" | "brawo" | "rowno" | "wolno" | "w-tyle" | "stoi";
/** Stopnie upomnień, od najłagodniejszego. */
export const NUDGE_LEVELS: readonly PaceLevel[] = ["wolno", "w-tyle", "stoi"];
export const isNudge = (level: PaceLevel) => NUDGE_LEVELS.includes(level);

export type Pace = {
  level: PaceLevel;
  goal: string | null; // cel z ankiety (skrócony), null = brak albo „pomóż policzyć”
  deadlineText: string; // termin celu: data ankiety + 6 miesięcy, np. „28 maja 2027”
  daysIn: number; // dni od ankiety
  away: number; // dni od ostatniego działania
  done: number; // zatwierdzone kroki
  total: number;
  planned: number; // ile kroków powinno być zatwierdzonych dziś według planu (pełne kroki)
  plannedExact: number; // to samo bez zaokrąglenia (znacznik na pasku)
  behind: number; // ile kroków zaległości (0 = w planie albo przed)
  finishText: string | null; // ile przy obecnym tempie zajmie reszta ścieżki; null = przy obecnym tempie nigdy
  lateForGoal: boolean; // prognoza końca ścieżki wypada po terminie celu
  headline: string; // jedno zdanie (pulpit, pierwsza linijka sceny)
  lines: string[]; // co mówi Bartek w scenie powitania (pierwsza = headline)
  tip: string | null; // zdanie pod nagłówkiem na pulpicie (null = pokaż podpowiedź o poziomie)
  cta: string; // napis na przycisku w scenie
};

/** 1 krok, 2–4 kroki, 5+ kroków (12–14 kroków). */
function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const d = n % 10;
  const t = n % 100;
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
}
const krokow = (n: number) => `${n} ${plural(n, "krok", "kroki", "kroków")}`;

/** Ile czasu: do 8 tygodni w tygodniach, dalej w miesiącach. */
function span(days: number) {
  if (days <= 7) return "tydzień";
  const weeks = Math.ceil(days / 7);
  if (weeks <= 8) return `${weeks} ${plural(weeks, "tydzień", "tygodnie", "tygodni")}`;
  const months = Math.round(days / 30);
  if (months > 24) return "ponad 2 lata";
  return `${months} ${plural(months, "miesiąc", "miesiące", "miesięcy")}`;
}

/** Cel z ankiety do cytowania: bez cudzysłowów i kropki na końcu, najwyżej ok. 70 znaków. */
function goalText(survey: Record<string, string> | null): string | null {
  const raw = (survey?.["cel-liczby"] ?? "").replace(/[„”"«»]/g, "").replace(/\s+/g, " ").trim().replace(/[.!;,]+$/, "");
  if (raw.length < 3 || /pom[oó][zż]|nie wiem|policz/i.test(raw)) return null;
  if (raw.length <= 70) return raw;
  const cut = raw.slice(0, 70);
  const space = cut.lastIndexOf(" ");
  return `${(space > 40 ? cut.slice(0, space) : cut).replace(/[.,;:\s]+$/, "")}…`;
}

function addMonths(d: Date, n: number) {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

/** Wybór wariantu tekstu: ten sam przez cały dzień, inny następnego dnia. */
const pick = <T,>(list: T[], seed: number) => list[seed % list.length];

/** Liczy tempo. null = brak ankiety (bez niej nie ma celu ani startu). */
export function pace(state: JourneyState, now = new Date()): Pace | null {
  if (!state.survey) return null;
  const t = now.getTime();
  const times = state.events.map((e) => Date.parse(e.at)).filter(Number.isFinite);
  const surveyAt = Date.parse(state.events.find((e) => e.type === "survey")?.at ?? "");
  const start = Number.isFinite(surveyAt) ? surveyAt : times.length ? Math.min(...times) : t;
  const last = times.length ? Math.max(...times) : start;

  const daysIn = Math.max(0, Math.floor((t - start) / DAY));
  const away = Math.max(0, Math.floor((t - last) / DAY));
  const total = STEPS.length;
  const done = STEPS.filter((s) => state.docs[s.docId]?.status === "approved").length;
  const plannedExact = Math.min(total, (total * daysIn) / PLAN_DAYS);
  const planned = Math.floor(plannedExact);
  const behind = Math.max(0, planned - done);

  const deadline = addMonths(new Date(start), GOAL_MONTHS);
  const deadlineText = deadline.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    ...(deadline.getFullYear() !== now.getFullYear() ? { year: "numeric" as const } : {}),
  });

  // Prognoza: dotychczasowe tempo (kroki na dzień od ankiety) przeniesione na resztę ścieżki.
  const remaining = total - done;
  const rate = done > 0 ? done / Math.max(daysIn, 1) : 0;
  const finishDays = remaining === 0 ? 0 : rate > 0 ? Math.ceil(remaining / rate) : null;
  const lateForGoal = finishDays === null || t + finishDays * DAY > deadline.getTime();

  let level: PaceLevel;
  if (done === total) level = "meta";
  else if (daysIn < GRACE_DAYS) level = done > 0 ? "brawo" : "start";
  else if (away >= 14 || behind >= 3) level = "stoi";
  else if (away >= 7 || behind >= 2) level = "w-tyle";
  else if (away >= 4 || behind >= 1) level = "wolno";
  else if (done >= plannedExact) level = "brawo";
  else level = "rowno";

  const base = {
    level,
    goal: goalText(state.survey),
    deadlineText,
    daysIn,
    away,
    done,
    total,
    planned,
    plannedExact,
    behind,
    finishText: finishDays === null ? null : span(finishDays),
    lateForGoal,
  };
  return { ...base, ...talk(base, Math.floor(t / DAY)) };
}

type Base = Omit<Pace, "headline" | "lines" | "tip" | "cta">;

/** Teksty Bartka dla każdego stopnia. DO ZATWIERDZENIA: brzmienie (Bartek może podać własne, mocniejsze). */
function talk(p: Base, seed: number): Pick<Pace, "headline" | "lines" | "tip" | "cta"> {
  const cel = p.goal ? `do celu „${p.goal}”` : "do swojego celu";
  const numbers = `Masz ${p.done} z ${p.total} kroków, a plan na dziś to ${p.planned}.`;

  switch (p.level) {
    case "stoi": {
      const headline =
        p.finishText === null ? `W takim tempie ${cel} nie dojdziesz. Nigdy.`
        : p.lateForGoal ? `W takim tempie ${cel} nie dojdziesz w ${GOAL_MONTHS} miesięcy.`
        : `${p.away} dni ciszy. Cel sam się nie zrobi.`;
      // Po przerwie: „kiedy wracasz”. Przy kimś, kto zagląda, ale nie zatwierdza: „rozmowy to nie wdrożenie”.
      const push = pick(p.away >= 7 ? [
        "Nie pytam, co się stało. Pytam, kiedy wracasz. Najlepiej teraz, 15 minut.",
        "Nie możemy oczekiwać klientów z marketingu, którego nie realizujesz. Bierz się za robotę: dziś jeden krok, 15 minut.",
      ] : [
        "Nie możemy oczekiwać klientów z marketingu, którego nie realizujesz. Bierz się za robotę.",
        "Rozmowy i lekcje to jeszcze nie wdrożenie. Liczy się zatwierdzony krok. Domknij dziś ten, nad którym siedzisz.",
        "Cel się nie zmienił. Zmieniło się tylko to, ile robisz. Do roboty, dziś jeden krok.",
      ], seed);
      const facts = p.away >= 7 ? `${p.away} dni bez ruchu. ${numbers}` : `${numbers} To ${krokow(p.behind)} zaległości.`;
      return { headline, lines: [headline, facts, push], tip: push, cta: "Biorę się za robotę" };
    }
    case "w-tyle": {
      const headline = p.behind >= 2 ? `Odstajesz od planu o ${krokow(p.behind)}.` : `${p.away} dni bez ruchu.`;
      const forecast = p.finishText
        ? `W tym tempie ścieżka zajmie Ci jeszcze ${p.finishText}, a termin ${p.goal ? `celu „${p.goal}”` : "Twojego celu"} to ${p.deadlineText}.${p.lateForGoal ? " Nie zdążysz." : ""}`
        : `Bez zatwierdzonych kroków nie ma tempa, a termin ${p.goal ? `celu „${p.goal}”` : "Twojego celu"} to ${p.deadlineText}.`;
      const push = pick([
        "W tym czasie klienci idą do studia, które robi marketing. Wracamy dziś, jeden krok.",
        "Ogarniamy to dziś: jeden krok i wracasz do gry.",
      ], seed);
      return { headline, lines: [headline, forecast, push], tip: push, cta: "Wracam do roboty" };
    }
    case "wolno": {
      const headline = p.behind >= 1 ? `Jesteś ${krokow(p.behind)} za planem.` : `${p.away} dni przerwy. Zwalniasz.`;
      const need = `Żeby dowieźć ${p.goal ? `cel „${p.goal}”` : "swój cel"} do ${p.deadlineText}, potrzebujesz mniej więcej kroku na tydzień.`;
      const push = "Bez wyrzutów, ale studio samo się nie zrobi. Dziś wystarczy 15 minut.";
      return { headline, lines: [headline, need, push], tip: push, cta: "Nadrabiam" };
    }
    case "brawo": {
      const headline = pick(["Dobra robota. Tak się buduje studio.", "Jedziesz z tematem. Dobra robota.", "Mocno. Dobra robota."], seed);
      const facts = p.daysIn < GRACE_DAYS
        ? `${krokow(p.done).replace(/^1 krok$/, "Pierwszy krok")} w pierwszym tygodniu. Tak trzymaj.`
        : `${numbers} ${p.done > p.planned ? "Jesteś przed planem." : "Trzymasz plan."}`;
      const forecast = p.finishText && !p.lateForGoal ? `W tym tempie ścieżkę domkniesz za ${p.finishText}, przed terminem celu (${p.deadlineText}).` : null;
      return { headline, lines: forecast ? [headline, facts, forecast] : [headline, facts], tip: null, cta: "Jedziemy dalej" };
    }
    case "rowno": {
      const headline = "Trzymasz tempo.";
      return { headline, lines: [headline, `${numbers} Kolejny krok najlepiej jeszcze w tym tygodniu.`], tip: null, cta: "Następny krok" };
    }
    case "meta": {
      const headline = "Cała ścieżka zatwierdzona. Dobra robota.";
      const next = p.goal ? `Teraz liczy się cel „${p.goal}”. Pilnujemy wyników do ${p.deadlineText}.` : "Teraz pilnujemy wyników i łapiemy okazje.";
      return { headline, lines: [headline, next], tip: next, cta: "Zobacz dokumenty" };
    }
    default: {
      const headline = `Plan: cała ścieżka w ${Math.round(PLAN_DAYS / 30)} miesiące, czyli mniej więcej krok na tydzień.`;
      const next = p.goal ? `Termin celu „${p.goal}” to ${p.deadlineText}. Zaczynamy od razu.` : `Termin Twojego celu to ${p.deadlineText}. Zaczynamy od razu.`;
      return { headline, lines: [headline, next], tip: next, cta: "Zaczynamy" };
    }
  }
}
