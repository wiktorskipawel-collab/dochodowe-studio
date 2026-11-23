"use client";

// Ankieta startowa prowadzona przez asystenta Bartka (komponent Questionnaire z shadcn).
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon, ArrowRightIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Questionnaire, QuestionnaireActions, QuestionnaireChoice, QuestionnaireChoices, QuestionnaireDescription, QuestionnaireError,
  QuestionnaireInput, QuestionnaireItem, QuestionnaireNext, QuestionnairePrevious, QuestionnaireProgress, QuestionnaireSubmit, QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import { Message, MessageAvatar, MessageContent, MessageHeader } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useJourney } from "@/lib/store";
import { SURVEY, STAGES, STEPS, detectStage } from "@/lib/journey";
import { AssistantAvatar, ASSISTANT_NAME, Typewriter } from "@/components/Assistant";

const ITEMS = SURVEY.map((q) => ({ name: q.id, required: true, ...(q.options ? { choices: q.options.map((o) => ({ value: o.value })) } : {}) }));

/** Bartek mówi: najpierw „pisze…”, potem tekst pojawia się na żywo. */
export function BartekSays({ text, title }: { text: string; title?: string }) {
  const [typing, setTyping] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- krótki wskaźnik pisania przy każdej nowej wiadomości
    setTyping(true);
    const t = setTimeout(() => setTyping(false), 650);
    return () => clearTimeout(t);
  }, [text]);
  return (
    <Message>
      <MessageAvatar><AssistantAvatar size={44} talking={typing} /></MessageAvatar>
      <MessageContent>
        <MessageHeader>{title ?? `${ASSISTANT_NAME} · asystent AI`}</MessageHeader>
        <AnimatePresence mode="wait">
          {typing ? (
            <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Marker role="status"><MarkerIcon><Spinner /></MarkerIcon><MarkerContent className="shimmer">Bartek pisze…</MarkerContent></Marker>
            </motion.div>
          ) : (
            <motion.div key="msg" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Bubble variant="tinted"><BubbleContent className="text-base leading-relaxed"><Typewriter text={text} /></BubbleContent></Bubble>
            </motion.div>
          )}
        </AnimatePresence>
      </MessageContent>
    </Message>
  );
}

export function Survey() {
  const { state, saveSurvey, acceptPath } = useJourney();
  const router = useRouter();
  const [current, setCurrent] = useState(SURVEY[0].id);
  const [result, setResult] = useState<string | null>(state.survey && state.stage ? state.stage : null);
  const q = SURVEY.find((x) => x.id === current) ?? SURVEY[0];

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const answers: Record<string, string> = {};
    for (const s of SURVEY) answers[s.id] = String(data.get(s.id) ?? "").trim();
    const stage = detectStage(answers);
    saveSurvey(answers, stage);
    setResult(stage);
  }

  if (result) {
    const stage = STAGES.find((s) => s.id === result) ?? STAGES[0];
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="glass-strong flex flex-col gap-5 rounded-3xl p-6 md:p-8">
          <BartekSays text={`Dziękuję! Z Twoich odpowiedzi wynika, że jesteś na etapie: ${stage.name}. ${stage.description} Skupimy się na tym: ${stage.focus}.`} />
          <Message>
            <MessageAvatar><span className="block size-11" /></MessageAvatar>
            <MessageContent>
              <Bubble variant="muted"><BubbleContent>Ułożyłem Ci ścieżkę. Każdy krok kończy się dokumentem, który zatwierdzasz. Zaczynamy od Twoich materiałów.</BubbleContent></Bubble>
            </MessageContent>
          </Message>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="font-bold" onClick={() => { acceptPath(); toast("Ścieżka zaakceptowana", { description: "Witaj na pulpicie. Pierwszy krok czeka." }); router.push("/"); }}>
              <CheckIcon />Akceptuję ścieżkę i wchodzę
            </Button>
            <Button size="lg" variant="outline" onClick={() => setResult(null)}>Popraw odpowiedzi</Button>
          </div>
        </section>
        <section className="glass-card rounded-3xl p-6 md:p-8" aria-labelledby="path-h">
          <h2 id="path-h" className="mb-4 text-lg font-bold">Twoja ścieżka</h2>
          <ol className="flex flex-col gap-2">
            {stage.steps.map((id, n) => {
              const s = STEPS.find((x) => x.id === id);
              if (!s) return null;
              return (
                <motion.li key={id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + n * 0.06 }}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-brand/50">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-sm font-extrabold text-brand-ink">{n + 1}</span>
                  <span className="text-sm"><strong className="block">{s.title}</strong><span className="text-white/65">{s.goal}</span></span>
                </motion.li>
              );
            })}
          </ol>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="glass-strong flex flex-col gap-4 self-start rounded-3xl p-6 md:p-8" aria-label="Asystent">
        <div className="flex items-center gap-4">
          <AssistantAvatar size={84} talking />
          <div>
            <p className="text-lg font-extrabold">{ASSISTANT_NAME}</p>
            <p className="text-sm text-white/65">Dochodowe Studio · Twój asystent AI</p>
          </div>
        </div>
        <BartekSays text={q.intro ?? q.question} />
      </section>

      <section className="glass-card rounded-3xl p-6 md:p-8">
        <Questionnaire className="mx-auto flex max-w-xl flex-col gap-6" defaultItem={SURVEY[0].id} items={ITEMS} shortcuts="letters" onItemChange={setCurrent} onSubmit={submit}>
          <QuestionnaireProgress />
          {SURVEY.map((s) => (
            <QuestionnaireItem key={s.id} name={s.id} required>
              <QuestionnaireTitle>{s.question}</QuestionnaireTitle>
              {s.help ? <QuestionnaireDescription>{s.help}</QuestionnaireDescription> : null}
              <QuestionnaireChoices>
                {s.options ? (
                  s.options.map((o) => <QuestionnaireChoice key={o.value} value={o.value}>{o.label}</QuestionnaireChoice>)
                ) : (
                  <QuestionnaireInput aria-label={s.question} placeholder={s.placeholder} />
                )}
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>
          ))}
          <QuestionnaireActions>
            <QuestionnairePrevious>Wstecz</QuestionnairePrevious>
            <QuestionnaireNext>Dalej <ArrowRightIcon /></QuestionnaireNext>
            <QuestionnaireSubmit>Pokaż mój etap</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
      </section>
    </div>
  );
}
