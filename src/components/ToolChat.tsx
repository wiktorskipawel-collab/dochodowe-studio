"use client";

// Rozmowa szybkiej akcji. Ten sam wygląd co rozmowa w kroku (StepWorkspace: Message, Bubble, AssistantAvatar),
// plus: kopiowanie odpowiedzi jednym kliknięciem, osobne „Kopiuj wiadomość do klienta”, „Nowa rozmowa”,
// prosty podgląd formatowania (nagłówki, wypunktowania, pogrubienia) bez wstawiania HTML.
// Asystent jest zawsze oznaczony jako AI (AI Act, art. 50): plakietka „AI” na awatarze i podpis „asystent AI”.
// Wiadomość: tekst, dyktowanie, zdjęcia, nagranie i transkrypcja (ChatComposer). Zdjęcia idą tylko z bieżącą wiadomością;
// miniatury widać do końca wizyty (sentPics), a w zapisanej rozmowie zostaje dopisek, że były.
// Pierwsze otwarcie narzędzia: okienko „Jak to działa” (ToolIntro), także w panelu bocznym kroku.
// XP za wiadomość: rewardReply() dopiero po udanej odpowiedzi (setChat sam nie daje XP).
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Copy, Check, RotateCcw, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { useJourney, type ChatMessage } from "@/lib/store";
import { introKey, type ToolMeta } from "@/lib/tools-public";
import { Message, MessageAvatar, MessageContent, MessageHeader } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { TypedScript, TypingBubble } from "@/components/BartekScript";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AssistantAvatar } from "@/components/Assistant";
import { toolIcon } from "@/components/ToolIcon";
import { Pill } from "@/components/ui";
import { ChatComposer, UserMessageBody, composeUserMessage, type ImageDraft } from "@/components/ChatComposer";
import { IntroDialog, useIntro } from "@/components/ToolIntro";

export type ToolContext = { stage?: string; documents: { title: string; content: string }[] };

export function ToolChat({ tool, provider, model, messages, onChange, context, compact = false }: {
  tool: ToolMeta;
  provider: string;
  model: string;
  messages: ChatMessage[];
  onChange: (m: ChatMessage[]) => void;
  context: ToolContext;
  compact?: boolean; // w panelu bocznym kroku: bez osobnego nagłówka (nazwa jest w panelu)
}) {
  const { state, rewardReply } = useJourney();
  const Icon = toolIcon(tool.icon);
  const intro = useIntro(introKey(tool.id));
  const [input, setInput] = useState("");
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [sentPics, setSentPics] = useState<Record<number, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const shown: ChatMessage[] = [{ role: "assistant", content: tool.opener }, ...messages];

  // Wyjście ze strony przerywa odpowiedź (to, co już przyszło, zostaje zapisane).
  useEffect(() => () => {
    abortRef.current?.abort();
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  async function send() {
    const text = input;
    const pics = images;
    if ((!text.trim() && !pics.length) || busy) return;
    const { stored, request } = composeUserMessage(text, pics);
    setError(null);
    setConfirmReset(false);
    setInput("");
    setImages([]);
    const history: ChatMessage[] = [...messages, { role: "user", content: stored }];
    if (pics.length) setSentPics((cur) => ({ ...cur, [history.length]: pics.map((p) => p.url) })); // indeks w `shown` (powitanie = 0)
    onChange([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model, tool: tool.id, messages: [...messages, request], context }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        onChange([...history, { role: "assistant", content: answer }]);
        endRef.current?.scrollIntoView({ block: "end" });
      }
      answer += decoder.decode();
      onChange([...history, { role: "assistant", content: answer.trim() ? answer : "[Brak odpowiedzi. Spróbuj jeszcze raz.]" }]);
      // XP za wiadomość (i ewentualny nowy poziom) dopiero po udanej, niepustej odpowiedzi. Błąd (503, 429, brak sieci)
      // albo przerwanie = bez XP i bez fanfary. Klucz rozmowy jak w ToolWorkspace (toolChatKey).
      if (answer.trim()) rewardReply(`tool:${tool.id}`);
    } catch (err) {
      if (ctrl.signal.aborted) return; // „Nowa rozmowa” albo wyjście ze strony
      setError(err instanceof Error && err.message ? err.message : "Brak połączenia z serwerem.");
      onChange(messages); // wiadomość (i zdjęcia) wracają do pola, można wysłać jeszcze raz
      setInput(text);
      setImages(pics);
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
      setBusy(false);
    }
  }

  function reset() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setError(null);
    setInput("");
    setImages([]);
    setSentPics({});
    setConfirmReset(false);
    onChange([]);
    fieldRef.current?.focus();
  }

  async function copy(text: string, key: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(null), 2000);
      toast("Skopiowano", { description: what });
    } catch {
      toast("Nie udało się skopiować", { description: "Zaznacz tekst i skopiuj go ręcznie (Ctrl+C)." });
    }
  }

  function applyStarter(text: string) {
    setInput(text);
    requestAnimationFrame(() => {
      const el = fieldRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(text.length, text.length);
    });
  }

  const initials = (state.profile?.name ?? "Ty").slice(0, 2).toUpperCase();

  return (
    <>
      {/* Nagłówek rozmowy: narzędzie, oznaczenie AI, „Nowa rozmowa” (w panelu bocznym nazwa jest już w nagłówku panelu) */}
      <div className={compact ? "flex flex-wrap items-center justify-between gap-3" : "glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3 pl-4"}>
        {compact ? (
          <p className="text-xs text-white/60">Asystent AI Dochodowego Studia</p>
        ) : (
          <div className="flex min-w-0 items-center gap-3">
            <AssistantAvatar size={40} icon={Icon} talking={busy} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{tool.title}</p>
              <p className="text-xs text-white/60">Asystent AI Dochodowego Studia</p>
            </div>
          </div>
        )}
        {messages.length ? (
          confirmReset ? (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Potwierdzenie nowej rozmowy">
              <span className="text-sm text-white/75">Wyczyścić tę rozmowę?</span>
              <button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink">Tak, nowa rozmowa</button>
              <button type="button" onClick={() => setConfirmReset(false)} className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">Nie</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmReset(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">
              <RotateCcw className="size-4" aria-hidden="true" />Nowa rozmowa
            </button>
          )
        ) : (
          <Pill>Nowa rozmowa</Pill>
        )}
      </div>

      <div className="glass-card flex flex-col gap-5 rounded-2xl p-4 md:p-5" aria-live="polite">
        {/* Nowa rozmowa: powitanie narzędzia „pisze się” (BartekScript.tsx). Potem zwykła historia. */}
        {!messages.length ? (
          <TypedScript key={`tool:${tool.id}`} storageKey={`tool:${tool.id}`} lines={[tool.opener]} header={`${tool.title} · asystent AI`} icon={Icon} />
        ) : null}
        {messages.length ? shown.map((m, i) => {
          const last = i === shown.length - 1;
          const pending = !m.content && busy && last;
          const streaming = busy && last;
          const section = m.role === "assistant" && i > 0 && !streaming ? extractSection(m.content, tool.copyHeadings ?? []) : null;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {m.role === "assistant" ? (
                <Message>
                  <MessageAvatar><AssistantAvatar size={36} icon={Icon} talking={pending} /></MessageAvatar>
                  <MessageContent>
                    <MessageHeader>{tool.title} · asystent AI</MessageHeader>
                    {pending ? (
                      <TypingBubble label="Asystent pisze…" />
                    ) : (
                      <Bubble variant="tinted" className="max-w-full sm:max-w-[92%]"><BubbleContent><RichText text={m.content} /></BubbleContent></Bubble>
                    )}
                    {i > 0 && !streaming && m.content ? (
                      <div className="flex flex-wrap gap-2 px-1">
                        {section ? (
                          <CopyButton done={copied === `${i}:s`} onClick={() => copy(section, `${i}:s`, "Wiadomość jest w schowku. Sprawdź ją, zanim wyślesz.")} primary>
                            <MessageSquareText className="size-4" aria-hidden="true" />Kopiuj wiadomość do klienta
                          </CopyButton>
                        ) : null}
                        <CopyButton done={copied === `${i}:a`} onClick={() => copy(m.content, `${i}:a`, "Cała odpowiedź jest w schowku.")}>
                          <Copy className="size-4" aria-hidden="true" />Kopiuj odpowiedź
                        </CopyButton>
                      </div>
                    ) : null}
                  </MessageContent>
                </Message>
              ) : (
                <Message align="end">
                  <MessageAvatar><Avatar className="size-9"><AvatarFallback className="bg-green-strong text-xs font-bold text-white">{initials}</AvatarFallback></Avatar></MessageAvatar>
                  <MessageContent>
                    <Bubble><BubbleContent className="max-h-80 overflow-y-auto"><UserMessageBody text={m.content} pictures={sentPics[i]} /></BubbleContent></Bubble>
                  </MessageContent>
                </Message>
              )}
            </motion.div>
          );
        }) : null}
        <div ref={endRef} />
      </div>

      {!messages.length && tool.starters?.length ? (
        <div className="flex flex-wrap gap-2" aria-label="Gotowe początki">
          {tool.starters.map((s) => (
            <motion.button key={s.label} type="button" onClick={() => applyStarter(s.text)} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
              className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-white/85 hover:border-brand/60 hover:text-white">
              {s.label}
            </motion.button>
          ))}
        </div>
      ) : null}

      {error ? <p role="alert" className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

      <ChatComposer
        id={`tool-msg-${tool.id}`}
        label="Twoja wiadomość do asystenta"
        value={input}
        setValue={setInput}
        images={images}
        setImages={setImages}
        onSubmit={() => void send()}
        busy={busy}
        maxChars={tool.maxChars}
        placeholder={tool.placeholder}
        fieldRef={fieldRef}
        features={{ images: tool.inputs.includes("zdjecia"), audio: tool.inputs.includes("nagranie"), transcript: tool.inputs.includes("transkrypcja") }}
      />

      <IntroDialog open={intro.open} onClose={intro.close} eyebrow="Jak to działa" title={tool.title} intro={tool.intro} icon={Icon} />
    </>
  );
}

function CopyButton({ done, onClick, primary, children }: { done: boolean; onClick: () => void; primary?: boolean; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${primary ? "bg-brand text-brand-ink hover:brightness-105" : "border border-white/15 text-white/85 hover:bg-white/10"}`}
    >
      {done ? <><Check className="size-4" aria-hidden="true" />Skopiowano</> : children}
    </motion.button>
  );
}

// ---------- Formatowanie odpowiedzi (bez HTML: tylko elementy React z tekstem) ----------

function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.length > 4 && part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
      : part,
  );
}

function RichText({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-1 leading-relaxed">
      {text.split("\n").map((line, i) => {
        const heading = /^\s{0,3}#{1,6}\s+(.*)$/.exec(line);
        if (heading) return <p key={i} className="mt-2 font-bold text-brand first:mt-0">{inline(heading[1].replace(/\*\*/g, ""))}</p>;
        const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
        if (bullet) return <p key={i} className="relative pl-4"><span aria-hidden="true" className="absolute left-0.5 text-white/50">•</span>{inline(bullet[1])}</p>;
        if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) return <hr key={i} className="my-1 border-white/10" />;
        if (!line.trim()) return <div key={i} aria-hidden="true" className="h-1" />;
        return <p key={i} className="whitespace-pre-wrap">{inline(line)}</p>;
      })}
    </div>
  );
}

const MD_HEADING = /^\s{0,3}#{1,6}\s+/;
const BOLD_HEADING = /^\s*\*\*[^*]{2,80}(\*\*\s*:?\s*$|:\*\*|\*\*\s*:)/;

/** Wycina z odpowiedzi sekcję o podanym nagłówku (np. „Wiadomość do wysłania”), żeby skopiować sam tekst do klienta. */
function extractSection(text: string, headings: string[]): string | null {
  if (!headings.length || !text) return null;
  const lines = text.split("\n");
  const norm = (l: string) => l.replace(/[#*]/g, "").trim().toLowerCase();
  const start = lines.findIndex((l) => (MD_HEADING.test(l) || BOLD_HEADING.test(l)) && headings.some((h) => norm(l).startsWith(h.toLowerCase())));
  if (start < 0) return null;
  const head = lines[start].replace(/[#*]/g, "").trim();
  const colon = head.indexOf(":");
  const body: string[] = colon >= 0 && head.slice(colon + 1).trim() ? [head.slice(colon + 1).trim()] : [];
  for (const l of lines.slice(start + 1)) {
    if (MD_HEADING.test(l) || BOLD_HEADING.test(l)) break;
    body.push(l);
  }
  const out = body
    .join("\n")
    .replace(/\*\*/g, "")
    .replace(/^\s*>\s?/gm, "")
    .trim()
    .replace(/^[„"“]+/, "")
    .replace(/[”"]+$/, "")
    .trim();
  return out || null;
}
