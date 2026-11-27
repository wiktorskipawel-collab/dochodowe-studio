"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { LoaderCircle, FileText, Check, PlayCircle, ClipboardCopy, ExternalLink, Wand2, ArrowRight, Lock, Settings, Download, MessagesSquare } from "lucide-react";
import { useJourney, type ChatMessage } from "@/lib/store";
import { STEPS, stepStatuses, contextDocs } from "@/lib/journey";
import type { Lesson, Step } from "@/lib/journey-types";
import { buildManualPrompt } from "@/lib/assistant";
import { CHAT_LIMITS, activeAi } from "@/lib/models";
import { STEP_CHAT_INTRO, STEP_INTRO_KEY } from "@/lib/tools-public";
import { downloadText, fileName } from "@/lib/download";
import { Pill } from "@/components/ui";
import { toast } from "sonner";
import { Message, MessageAvatar, MessageContent, MessageHeader } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AssistantAvatar, ASSISTANT_NAME } from "@/components/Assistant";
import { ChatComposer, UserMessageBody, composeUserMessage, type ImageDraft } from "@/components/ChatComposer";
import { HowItWorks, IntroDialog, useIntro } from "@/components/ToolIntro";
import { StepTools } from "@/components/StepTools";

// Krok prowadzony przez Bartka (decyzja Pawła 2026-11-27): zapowiedź → lekcja (odhaczenie) → rozmowa → dokument → zatwierdzenie.
// Obok: „Narzędzia do tego kroku” (StepTools, panel boczny) i zwijane „Jak to działa” czatu kroku (pierwszy raz: okienko).
// Rozmowa przyjmuje tekst, dyktowanie, zdjęcia, nagrania i transkrypcje (ChatComposer).
const STAGES = ["Lekcja", "Rozmowa z Bartkiem", "Dokument", "Zatwierdzenie"] as const;

export function StepWorkspace({ stepId }: { stepId: string }) {
  const { ready, state, setChat, saveDoc, markWatched } = useJourney();
  const step = STEPS.find((s) => s.id === stepId)!;
  const statuses = stepStatuses(state);
  const status = statuses[stepId];
  const idx = STEPS.findIndex((s) => s.id === stepId);
  const next = STEPS[idx + 1];
  const doc = state.docs[step.docId];
  const [draft, setDraft] = useState<string | null>(null);
  const docText = draft ?? doc?.content ?? "";

  if (!ready) return <p className="text-white/70">Wczytuję…</p>;

  if (status === "locked") {
    return (
      <div className="glass-card flex flex-col items-start gap-3 rounded-2xl p-6">
        <Lock className="size-6 text-white/70" aria-hidden="true" />
        <h2 className="text-xl font-semibold">Ten krok odblokuje się później</h2>
        <p className="text-white/75">
          {step.unlockAfter
            ? `Ten krok otworzy się po zatwierdzeniu kroku „${STEPS.find((s) => s.id === step.unlockAfter)?.title ?? step.unlockAfter}”.`
            : "Najpierw zatwierdź dokumenty z poprzednich kroków. Kolejność ma znaczenie: każdy krok korzysta z wyników poprzedniego."}
        </p>
        <Link href="/sciezka" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-5 font-semibold text-brand-ink">Wróć do ścieżki</Link>
      </div>
    );
  }

  const approved = doc?.status === "approved";
  const ai = activeAi(state.ai);
  const lessonsDone = step.lessons.every((l) => state.watched[l.id]);
  const stage = !lessonsDone ? 0 : approved ? 3 : docText.trim() ? 2 : 1;
  const name = (state.profile?.name ?? "").trim().split(/\s+/)[0];
  const intro = introLines(step, name, lessonsDone);

  return (
    <div className="flex flex-col gap-5">
      <StageBar stage={stage} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_440px]">
        {/* Rozmowa: Bartek zapowiada krok, prowadzi przez lekcję, potem pyta */}
        <section className="flex min-w-0 flex-col gap-3" aria-label="Rozmowa z asystentem">
          {!lessonsDone ? (
            <>
              <div className="glass-card flex flex-col gap-5 rounded-2xl p-4 md:p-5">
                {intro.map((line, i) => <BartekLine key={i} text={line} />)}
              </div>
              <LessonGate lessons={step.lessons} watched={state.watched} onDone={() => markWatched(step.lessons.map((l) => l.id))} />
            </>
          ) : ai?.mode === "manual" ? (
            <ManualMode stepId={stepId} onPaste={(t) => { setDraft(t); }} />
          ) : ai ? (
            <AssistantChat stepId={stepId} prelude={intro} provider={ai.mode} model={ai.model} messages={state.chats[stepId] ?? []} onChange={(m) => setChat(stepId, m)} onDocument={(t) => setDraft(t)} />
          ) : (
            <div className="glass-card flex flex-col items-start gap-3 rounded-2xl p-6">
              <h2 className="text-lg font-semibold">Połącz swój ChatGPT, żeby zacząć rozmowę</h2>
              <p className="text-white/75">W tym kroku asystent zadaje pytania i pomaga napisać dokument. Korzysta z Twojego ChatGPT albo Claude. Jedno kliknięcie i wracasz tutaj.</p>
              <Link href={`/polacz?wroc=/krok/${stepId}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-brand-ink"><Settings className="size-4" aria-hidden="true" />Połącz ChatGPT</Link>
            </div>
          )}
          <p className="text-xs text-white/60">Odpowiedzi tworzy sztuczna inteligencja na podstawie metodyki Dochodowego Studia. Ważne decyzje zatwierdzasz Ty.</p>
        </section>

        {/* Dokument kroku: szkic, zatwierdzenie, pobranie */}
        <aside className="flex flex-col gap-5" aria-label="Dokument kroku">
          <section className="glass-card flex flex-col gap-3 rounded-2xl p-5" aria-labelledby="doc-h">
            <div className="flex items-center justify-between gap-2">
              <h2 id="doc-h" className="flex items-center gap-2 font-semibold"><FileText className="size-5 text-brand" aria-hidden="true" />{step.docTitle}</h2>
              {approved ? <Pill tone="good">Zatwierdzony</Pill> : docText ? <Pill tone="warn">Szkic</Pill> : <Pill>Pusty</Pill>}
            </div>
            <label htmlFor="doc" className="sr-only">Treść dokumentu: {step.docTitle}</label>
            <textarea
              id="doc"
              value={docText}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={step.docTemplate}
              rows={18}
              className="min-h-72 w-full resize-y rounded-xl border border-white/15 bg-black/25 p-3 text-sm leading-relaxed text-white placeholder:text-white/35 focus:border-brand focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={!docText.trim()} onClick={() => { saveDoc(step.docId, docText, "draft"); setDraft(null); }}
                className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10 disabled:opacity-40">
                Zapisz szkic
              </button>
              <button type="button" disabled={!docText.trim()} onClick={() => { saveDoc(step.docId, docText, "approved", step.docTitle); setDraft(null); }}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink hover:brightness-95 disabled:opacity-40">
                <Check className="size-4" aria-hidden="true" />Zatwierdzam dokument
              </button>
              <button type="button" disabled={!docText.trim()} onClick={() => downloadText(fileName(step.docTitle), `${step.docTitle}\n\n${docText}`)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10 disabled:opacity-40">
                <Download className="size-4" aria-hidden="true" />Pobierz
              </button>
            </div>
            {approved && next ? (
              <Link href={`/krok/${next.id}`} className="inline-flex min-h-11 items-center justify-between gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-neutral-900 hover:bg-white/90">
                Następny krok: {next.title}<ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </section>
          <StepTools stepId={stepId} />
          <section className="glass-card rounded-2xl p-5">
            <h2 className="mb-2 font-semibold">Krok skończony, gdy:</h2>
            <ul className="flex flex-col gap-2 text-sm text-white/80">
              {step.exitCriteria.map((c) => (
                <li key={c} className="flex gap-2">
                  <Check className={`mt-0.5 size-4 shrink-0 ${approved ? "text-emerald-300" : "text-white/40"}`} aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
          </section>
          <HowItWorks intro={STEP_CHAT_INTRO} hint="Bartek prowadzi krok: najpierw lekcja, potem pytania jedno po drugim, na końcu dokument do zatwierdzenia." defaultOpen={false} />
        </aside>
      </div>
    </div>
  );
}

/** Co Bartek mówi na wejściu do kroku. DO ZATWIERDZENIA: brzmienie (Bartek). */
function introLines(step: Step, name: string, lessonsDone: boolean) {
  const lines = [`Hej${name ? `, ${name}` : ""}! Zaczynamy: ${step.title}. ${step.goal}`];
  if (!step.lessons.length) lines.push("Tu nie ma lekcji, więc od razu przechodzimy do pytań.");
  else if (!lessonsDone) lines.push(step.lessons.length === 1
    ? "Najpierw krótka lekcja. Obejrzyj ją i odhacz, potem pogadamy. Bez lekcji moje pytania nie będą miały sensu."
    : "Najpierw krótkie lekcje. Obejrzyj je i odhacz, potem pogadamy. Bez lekcji moje pytania nie będą miały sensu.");
  else lines.push("Lekcja zaliczona. Teraz kilka pytań, jedno po drugim.");
  return lines;
}

function StageBar({ stage }: { stage: number }) {
  return (
    <ol className="glass-card flex flex-wrap gap-2 rounded-2xl p-2" aria-label="Etapy kroku">
      {STAGES.map((label, i) => {
        const done = i < stage || (i === 3 && stage === 3);
        const current = i === stage && stage !== 3;
        return (
          <li key={label} aria-current={current ? "step" : undefined}
            className={`flex min-h-11 flex-1 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${current ? "bg-brand text-brand-ink" : done ? "bg-white/10 text-white" : "text-white/55"}`}>
            <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${current ? "bg-brand-ink/15" : done ? "bg-emerald-400/25 text-emerald-200" : "bg-white/10"}`}>
              {done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

function BartekLine({ text, talking }: { text: string; talking?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Message>
        <MessageAvatar><AssistantAvatar size={36} talking={talking} /></MessageAvatar>
        <MessageContent>
          <MessageHeader>{ASSISTANT_NAME} · asystent AI</MessageHeader>
          <Bubble variant="tinted"><BubbleContent className="whitespace-pre-wrap leading-relaxed">{text}</BubbleContent></Bubble>
        </MessageContent>
      </Message>
    </motion.div>
  );
}

/** Lekcje kroku przed rozmową: jeden odtwarzacz naraz (iframe tylko dla wybranej lekcji), lista lekcji i link „Otwórz na Skool”. */
function LessonGate({ lessons, watched, onDone }: { lessons: Lesson[]; watched: Record<string, boolean>; onDone: () => void }) {
  const [active, setActive] = useState(() => Math.max(0, lessons.findIndex((l) => !watched[l.id])));
  const l = lessons[active] ?? lessons[0];
  if (!l) return null;
  return (
    <section className="glass-card flex flex-col gap-4 rounded-2xl p-5" aria-labelledby="lekcja-h">
      <h2 id="lekcja-h" className="flex items-center gap-2 font-semibold">
        <PlayCircle className="size-5 text-brand" aria-hidden="true" />{lessons.length === 1 ? "Lekcja do tego kroku" : `Lekcje do tego kroku (${lessons.length})`}
      </h2>
      {l.video ? (
        <iframe key={l.id} src={l.video} title={l.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" className="aspect-video w-full rounded-xl border border-white/10 bg-black" />
      ) : (
        <div className="grid aspect-video w-full place-items-center rounded-xl border border-dashed border-white/20 bg-black/30 p-4 text-center">
          <span className="flex flex-col items-center gap-3 text-sm text-white/70">
            <ExternalLink className="size-9 text-white/40" aria-hidden="true" />
            {l.skool ? "Ta lekcja nie ma nagrania. Otwórz jej materiały." : "Tu pojawi się wideo, gdy przeniesiemy kurs do odtwarzacza platformy."}
            {l.skool ? (
              <a href={l.skool} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 font-semibold text-neutral-950 hover:bg-white/90">
                Otwórz materiały<ExternalLink className="size-4" aria-hidden="true" /><span className="sr-only"> (w nowej karcie)</span>
              </a>
            ) : null}
          </span>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm">
          <strong className="font-semibold">{l.title}</strong> <span className="text-white/60">· {l.source}</span>
          {watched[l.id] ? <span className="ml-2 text-emerald-300">zaliczona</span> : null}
        </p>
        {l.opis ? <p className="text-sm text-white/70">{l.opis}</p> : null}
        {l.attachments?.length ? <p className="text-xs text-white/55">Materiały do lekcji: {l.attachments.join(", ")}</p> : null}
        {l.skool && l.video ? (
          <a href={l.skool} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white">
            Otwórz materiały<ExternalLink className="size-3.5" aria-hidden="true" /><span className="sr-only"> (w nowej karcie)</span>
          </a>
        ) : null}
      </div>
      {lessons.length > 1 ? (
        <ol className="flex flex-col gap-1.5" aria-label="Lekcje w tym kroku">
          {lessons.map((x, i) => (
            <li key={x.id}>
              <button type="button" onClick={() => setActive(i)} aria-current={i === active ? "true" : undefined}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm ${i === active ? "bg-brand/15 text-white" : "text-white/75 hover:bg-white/[0.06] hover:text-white"}`}>
                <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${watched[x.id] ? "bg-emerald-400/25 text-emerald-200" : i === active ? "bg-brand text-brand-ink" : "bg-white/10"}`}>
                  {watched[x.id] ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{x.title}</span>
                <span className="shrink-0 text-xs text-white/50">{x.video ? "wideo" : "materiały"}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {active < lessons.length - 1 ? (
          <button type="button" onClick={() => setActive(active + 1)} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 px-4 font-semibold hover:bg-white/10">
            Następna lekcja<ArrowRight className="size-4" aria-hidden="true" />
          </button>
        ) : null}
        <button type="button" onClick={onDone} className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-brand px-5 font-bold text-brand-ink hover:brightness-105">
          <Check className="size-4" aria-hidden="true" />{lessons.length === 1 ? "Obejrzane" : "Obejrzane wszystkie"}, lecimy do pytań
        </button>
      </div>
    </section>
  );
}

function AssistantChat({ stepId, prelude, provider, model, messages, onChange, onDocument }: {
  stepId: string;
  prelude: string[];
  provider: string;
  model: string;
  messages: ChatMessage[];
  onChange: (m: ChatMessage[]) => void;
  onDocument: (text: string) => void;
}) {
  const { state } = useJourney();
  const step = STEPS.find((s) => s.id === stepId)!;
  const intro = useIntro(STEP_INTRO_KEY);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [sentPics, setSentPics] = useState<Record<number, string[]>>({});
  const [busy, setBusy] = useState<"chat" | "document" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const shown: ChatMessage[] = [{ role: "assistant", content: step.opener }, ...messages];

  async function call(mode: "chat" | "document", history: (ChatMessage & { images?: string[] })[], onText: (t: string) => void) {
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        model,
        stepId,
        mode,
        messages: history,
        context: { stage: state.stage ?? undefined, documents: contextDocs(state, stepId) },
      }),
    });
    if (!res.ok || !res.body) throw new Error(await res.text());
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      onText(text);
    }
    return text;
  }

  async function send() {
    const text = input;
    const pics = images;
    if ((!text.trim() && !pics.length) || busy) return;
    const { stored, request } = composeUserMessage(text, pics);
    setError(null);
    setInput("");
    setImages([]);
    const history: ChatMessage[] = [...messages, { role: "user", content: stored }];
    if (pics.length) setSentPics((cur) => ({ ...cur, [history.length]: pics.map((p) => p.url) })); // indeks w `shown` (pierwsza wiadomość kroku = 0)
    onChange([...history, { role: "assistant", content: "" }]);
    setBusy("chat");
    try {
      const answer = await call("chat", [...messages, request], (t) => {
        onChange([...history, { role: "assistant", content: t }]);
        endRef.current?.scrollIntoView({ block: "end" });
      });
      onChange([...history, { role: "assistant", content: answer }]);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Brak połączenia z serwerem.");
      onChange(messages); // wiadomość (i zdjęcia) wracają do pola, można wysłać jeszcze raz
      setInput(text);
      setImages(pics);
    } finally {
      setBusy(null);
    }
  }

  async function makeDocument() {
    if (busy || !messages.length) return;
    setError(null);
    setBusy("document");
    try {
      const text = await call("document", messages, (t) => onDocument(t));
      onDocument(text);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Brak połączenia z serwerem.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="glass-card flex flex-col gap-5 rounded-2xl p-4 md:p-5" aria-live="polite">
        {prelude.map((line, i) => <BartekLine key={`p${i}`} text={line} />)}
        {shown.map((m, i) => {
          const pending = !m.content && busy && i === shown.length - 1;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {m.role === "assistant" ? (
                <Message>
                  <MessageAvatar><AssistantAvatar size={36} talking={!!pending} /></MessageAvatar>
                  <MessageContent>
                    <MessageHeader>{ASSISTANT_NAME} · asystent AI</MessageHeader>
                    {pending ? (
                      <Marker role="status"><MarkerIcon><Spinner /></MarkerIcon><MarkerContent className="shimmer">Bartek myśli…</MarkerContent></Marker>
                    ) : (
                      <Bubble variant="tinted"><BubbleContent className="whitespace-pre-wrap leading-relaxed">{m.content}</BubbleContent></Bubble>
                    )}
                  </MessageContent>
                </Message>
              ) : (
                <Message align="end">
                  <MessageAvatar><Avatar className="size-9"><AvatarFallback className="bg-green-strong text-xs font-bold text-white">{(state.profile?.name ?? "Ty").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar></MessageAvatar>
                  <MessageContent>
                    <Bubble><BubbleContent className="max-h-80 overflow-y-auto"><UserMessageBody text={m.content} pictures={sentPics[i]} /></BubbleContent></Bubble>
                  </MessageContent>
                </Message>
              )}
            </motion.div>
          );
        })}
        {busy === "document" ? <Marker role="status"><MarkerIcon><Spinner /></MarkerIcon><MarkerContent className="shimmer">Bartek składa dokument z rozmowy…</MarkerContent></Marker> : null}
        <div ref={endRef} />
      </div>
      {error ? <p role="alert" className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      <ChatComposer
        id={`msg-${stepId}`}
        label="Twoja odpowiedź"
        value={input}
        setValue={setInput}
        images={images}
        setImages={setImages}
        onSubmit={() => void send()}
        busy={busy === "chat"}
        maxChars={CHAT_LIMITS.message}
        rows={2}
        placeholder="Napisz albo podyktuj odpowiedź"
        features={{ images: true, audio: true, transcript: true }}
      />
      <button type="button" onClick={makeDocument} disabled={!!busy || messages.length < 2}
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10 disabled:opacity-40">
        {busy === "document" ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Wand2 className="size-4" aria-hidden="true" />}
        Przygotuj dokument z rozmowy
      </button>
      <IntroDialog open={intro.open} onClose={intro.close} eyebrow="Jak to działa" title={`Rozmowa z Bartkiem: ${step.title}`} intro={STEP_CHAT_INTRO} icon={MessagesSquare} />
    </>
  );
}

function ManualMode({ stepId, onPaste }: { stepId: string; onPaste: (t: string) => void }) {
  const { state } = useJourney();
  const [copied, setCopied] = useState(false);
  const prompt = buildManualPrompt(stepId, { stage: state.stage ?? undefined, documents: contextDocs(state, stepId) });

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      return true;
    } catch {
      setCopied(false);
      return false;
    }
  }

  /** Otwiera prywatny ChatGPT / Claude uczestnika z gotowym poleceniem. Długie polecenie: kopiujemy i prosimy o wklejenie. */
  async function openIn(base: string, name: string) {
    const url = base + encodeURIComponent(prompt);
    if (url.length <= 7500) {
      window.open(url, "_blank", "noopener");
      return;
    }
    const ok = await copy();
    window.open(base.replace(/\?q=$/, ""), "_blank", "noopener");
    toast(ok ? "Polecenie skopiowane" : "Skopiuj polecenie ręcznie", { description: ok ? "Wklej je w " + name + " (Ctrl+V) i wyślij." : "Rozwiń „Zobacz polecenie” poniżej." });
  }

  return (
    <div className="glass-card flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <AssistantAvatar size={44} />
        <div>
          <h2 className="text-lg font-bold">Pracujemy w Twoim ChatGPT</h2>
          <p className="text-sm text-white/70">Jedno kliknięcie: Twój ChatGPT otworzy się z metodyką tego kroku i Twoimi dokumentami.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => openIn("https://chatgpt.com/?q=", "ChatGPT")} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-5 font-bold text-brand-ink shadow-[0_10px_30px_-12px_rgba(114,196,28,.55)] hover:brightness-105">
          <ExternalLink className="size-4" aria-hidden="true" />Otwórz w moim ChatGPT
        </button>
        <button type="button" onClick={() => openIn("https://claude.ai/new?q=", "Claude")} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">Otwórz w Claude</button>
        <button type="button" onClick={copy} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">
          {copied ? <Check className="size-4" aria-hidden="true" /> : <ClipboardCopy className="size-4" aria-hidden="true" />}{copied ? "Skopiowano" : "Kopiuj polecenie"}
        </button>
      </div>
      <p className="text-sm text-white/70">Odpowiadaj na pytania w ChatGPT. Na końcu poproś: „Wypisz gotowy dokument”, i wklej go poniżej.</p>
      <details className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
        <summary className="cursor-pointer font-medium">Zobacz polecenie</summary>
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-white/75">{prompt}</pre>
      </details>
      <label htmlFor="paste" className="text-sm font-medium">Wklej tu gotowy dokument z czatu</label>
      <textarea id="paste" rows={4} onChange={(e) => onPaste(e.target.value)} placeholder="Wklej wynik — trafi do dokumentu po prawej, gdzie możesz go poprawić i zatwierdzić."
        className="w-full rounded-xl border border-white/15 bg-black/25 p-3 text-sm text-white placeholder:text-white/40 focus:border-brand focus:outline-none" />
    </div>
  );
}
