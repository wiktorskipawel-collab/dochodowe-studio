"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Send, LoaderCircle, FileText, Check, PlayCircle, ClipboardCopy, ExternalLink, Wand2, ArrowRight, Lock, Settings } from "lucide-react";
import { useJourney, type ChatMessage } from "@/lib/store";
import { STEPS, stepStatuses, contextDocs } from "@/lib/journey";
import { buildManualPrompt } from "@/lib/assistant";
import { Pill } from "@/components/ui";
import { toast } from "sonner";
import { Message, MessageAvatar, MessageContent, MessageHeader } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AssistantAvatar, ASSISTANT_NAME } from "@/components/Assistant";

export function StepWorkspace({ stepId }: { stepId: string }) {
  const { ready, state, setChat, saveDoc, toggleWatched } = useJourney();
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
        <p className="text-white/75">Najpierw zatwierdź dokumenty z poprzednich kroków. Kolejność ma znaczenie: każdy krok korzysta z wyników poprzedniego.</p>
        <Link href="/sciezka" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-5 font-semibold text-brand-ink">Wróć do ścieżki</Link>
      </div>
    );
  }

  const approved = doc?.status === "approved";

  return (
    <div className="grid gap-5 2xl:grid-cols-[300px_minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_400px]">
      {/* Lewa kolumna: co robimy + lekcje */}
      <aside className="flex flex-col gap-5 xl:col-span-2 2xl:col-span-1" aria-label="Co robimy w tym kroku">
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
        {step.lessons.length ? (
          <section className="glass-card rounded-2xl p-5">
            <h2 className="mb-3 font-semibold">Lekcje do tego kroku</h2>
            <ul className="flex flex-col gap-2">
              {step.lessons.map((l) => {
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
        ) : null}
      </aside>

      {/* Środek: asystent */}
      <section className="flex min-w-0 flex-col gap-3" aria-label="Asystent">
        {state.ai.mode === "manual" ? (
          <ManualMode stepId={stepId} onPaste={(t) => { setDraft(t); }} />
        ) : state.ai.mode ? (
          <AssistantChat stepId={stepId} messages={state.chats[stepId] ?? []} onChange={(m) => setChat(stepId, m)} onDocument={(t) => setDraft(t)} />
        ) : (
          <div className="glass-card flex flex-col items-start gap-3 rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Najpierw podłącz swoje AI</h2>
            <p className="text-white/75">Asystent korzysta z Twojego ChatGPT albo Claude. To zajmie minutę.</p>
            <Link href="/start" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-brand-ink"><Settings className="size-4" aria-hidden="true" />Połącz AI</Link>
          </div>
        )}
        <p className="text-xs text-white/60">Odpowiedzi tworzy sztuczna inteligencja na podstawie metodyki Dochodowego Studia. Ważne decyzje zatwierdzasz Ty.</p>
      </section>

      {/* Prawa kolumna: dokument */}
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
        </div>
        {approved && next ? (
          <Link href={`/krok/${next.id}`} className="inline-flex min-h-11 items-center justify-between gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-neutral-900 hover:bg-white/90">
            Następny krok: {next.title}<ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </section>
    </div>
  );
}

function AssistantChat({ stepId, messages, onChange, onDocument }: {
  stepId: string;
  messages: ChatMessage[];
  onChange: (m: ChatMessage[]) => void;
  onDocument: (text: string) => void;
}) {
  const { state } = useJourney();
  const step = STEPS.find((s) => s.id === stepId)!;
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<"chat" | "document" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const shown: ChatMessage[] = [{ role: "assistant", content: step.opener }, ...messages];

  async function call(mode: "chat" | "document", history: ChatMessage[], onText: (t: string) => void) {
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: state.ai.mode,
        model: state.ai.model,
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

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || busy) return;
    setError(null);
    setInput("");
    const history: ChatMessage[] = [...messages, { role: "user", content }];
    onChange([...history, { role: "assistant", content: "" }]);
    setBusy("chat");
    try {
      const answer = await call("chat", history, (t) => {
        onChange([...history, { role: "assistant", content: t }]);
        endRef.current?.scrollIntoView({ block: "end" });
      });
      onChange([...history, { role: "assistant", content: answer }]);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Brak połączenia z serwerem.");
      onChange(history);
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
                    <Bubble><BubbleContent className="whitespace-pre-wrap leading-relaxed">{m.content}</BubbleContent></Bubble>
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
      <form onSubmit={send} className="glass-card flex items-end gap-2 rounded-2xl p-2">
        <label htmlFor="msg" className="sr-only">Twoja odpowiedź</label>
        <textarea id="msg" value={input} rows={2} maxLength={6000} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
          placeholder="Napisz odpowiedź (Enter wysyła, Shift+Enter nowa linia)"
          className="min-h-11 flex-1 resize-none rounded-xl bg-transparent px-3 py-2 text-white placeholder:text-white/50 focus:outline-none" />
        <button type="submit" disabled={!!busy || !input.trim()} aria-label="Wyślij" className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink disabled:opacity-40">
          {busy === "chat" ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <Send className="size-5" aria-hidden="true" />}
        </button>
      </form>
      <button type="button" onClick={makeDocument} disabled={!!busy || messages.length < 2}
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10 disabled:opacity-40">
        {busy === "document" ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Wand2 className="size-4" aria-hidden="true" />}
        Przygotuj dokument z rozmowy
      </button>
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
        <button type="button" onClick={() => openIn("https://chatgpt.com/?q=", "ChatGPT")} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-5 font-bold text-brand-ink shadow-[0_10px_30px_-12px_rgba(221,153,51,.9)] hover:brightness-105">
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
