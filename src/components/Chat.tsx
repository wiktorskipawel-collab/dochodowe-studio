"use client";

import { useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Send, LoaderCircle } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content:
    "Cześć! Jestem Marketing OS. Zaczniemy od DNA Twojego studia, bo na nim opiera się cała strategia. Pierwsze pytanie: co dziś sprzedajesz najczęściej i w jakiej cenie?",
};

export function Chat() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || busy) return;
    setError(null);
    setInput("");
    const history: Msg[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        setError(await res.text());
        setMessages(history);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: answer }]);
        endRef.current?.scrollIntoView({ block: "end" });
      }
    } catch {
      setError("Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.");
      setMessages(history);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3" aria-live="polite">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-[680px] whitespace-pre-wrap rounded-2xl px-4 py-3 leading-relaxed ${
              m.role === "user" ? "self-end rounded-tr-md bg-white text-neutral-900" : "glass-card rounded-tl-md"
            }`}
          >
            {m.role === "assistant" ? <span className="mb-1 block text-xs font-semibold text-accent">Marketing OS</span> : null}
            {m.content || (busy && i === messages.length - 1 ? <LoaderCircle className="size-5 animate-spin" aria-label="Marketing OS pisze" /> : null)}
          </motion.div>
        ))}
        <div ref={endRef} />
      </div>

      {error ? <p role="alert" className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

      <form onSubmit={send} className="glass-card flex items-end gap-2 rounded-2xl p-2">
        <label htmlFor="msg" className="sr-only">Twoja wiadomość</label>
        <textarea
          id="msg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={2}
          maxLength={4000}
          placeholder="Napisz odpowiedź (Enter wysyła, Shift+Enter nowa linia)"
          className="min-h-11 flex-1 resize-none rounded-xl bg-transparent px-3 py-2 text-white placeholder:text-white/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Wyślij"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink disabled:opacity-40"
        >
          {busy ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <Send className="size-5" aria-hidden="true" />}
        </button>
      </form>
    </div>
  );
}
