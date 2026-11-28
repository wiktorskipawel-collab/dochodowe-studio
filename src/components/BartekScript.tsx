"use client";

// Bartek „pisze” wiadomości po kolei (prośba Pawła 2026-11-28). Przy każdej wiadomości najpierw kropki
// „Bartek pisze…”, potem tekst literka po literce, a dopiero po nim następna wiadomość.
// - Odtwarza się raz na sesję przeglądarki dla danego klucza; powrót do kroku pokazuje od razu całość.
// - Kliknięcie w rozmowę albo „Pokaż od razu” = całość.
// - Przy ograniczonym ruchu w systemie (prefers-reduced-motion) od razu całość.
// Te same kropki pokazujemy, gdy czekamy na odpowiedź AI (`TypingBubble`).
import { useEffect, useState, type ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Message, MessageAvatar, MessageContent, MessageHeader } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { AssistantAvatar, ASSISTANT_NAME } from "@/components/Assistant";

const TICK = 20; // ms między kolejnymi porcjami liter
const MAX_TYPE_MS = 2200; // najdłuższe pisanie jednej wiadomości (długie teksty piszą się szybciej)
const PAUSE_MS = 380; // przerwa po skończonej wiadomości

const storeKey = (key: string) => `ds:pisze:${key}`;

function seen(key: string) {
  try {
    return sessionStorage.getItem(storeKey(key)) === "1";
  } catch {
    return false;
  }
}

function markSeen(key: string) {
  try {
    sessionStorage.setItem(storeKey(key), "1");
  } catch {
    // brak sessionStorage: animacja po prostu odtworzy się przy następnym wejściu
  }
}

type AvatarIcon = ComponentProps<typeof AssistantAvatar>["icon"];
type Look = { header?: string; icon?: AvatarIcon };

/** Kropki w dymku: „pisze…”. */
export function TypingBubble({ label = "Bartek pisze…" }: { label?: string }) {
  return (
    <Bubble variant="tinted">
      <BubbleContent className="flex h-6 items-center gap-1.5" role="status">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="size-2 rounded-full bg-white/75"
            animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
        <span className="sr-only">{label}</span>
      </BubbleContent>
    </Bubble>
  );
}

/** Jedna wiadomość Bartka. `typing` = tekst właśnie się pisze (kursor, mówiący awatar, czytnik ekranu dostaje całość później). */
export function BartekLine({ text, typing, header = `${ASSISTANT_NAME} · asystent AI`, icon }: { text: string; typing?: boolean } & Look) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Message>
        <MessageAvatar><AssistantAvatar size={36} talking={typing} icon={icon} /></MessageAvatar>
        <MessageContent>
          <MessageHeader>{header}</MessageHeader>
          <Bubble variant="tinted">
            <BubbleContent className="whitespace-pre-wrap leading-relaxed">
              {typing ? (
                <span aria-hidden="true">
                  {text}
                  <span className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-[3px] animate-pulse bg-brand" />
                </span>
              ) : text}
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </motion.div>
  );
}

function BartekThinking({ header = `${ASSISTANT_NAME} · asystent AI`, icon }: Look) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Message>
        <MessageAvatar><AssistantAvatar size={36} talking icon={icon} /></MessageAvatar>
        <MessageContent>
          <MessageHeader>{header}</MessageHeader>
          <TypingBubble />
        </MessageContent>
      </Message>
    </motion.div>
  );
}

type Pos = { idx: number; phase: "think" | "type"; n: number };

/** Wiadomości Bartka pisane po kolei. Montuj z `key={storageKey}`, żeby nowy zestaw wiadomości zaczynał od początku. */
export function TypedScript({ lines, storageKey, header, icon }: { lines: string[]; storageKey: string } & Look) {
  const reduce = useReducedMotion();
  const count = lines.length;
  const [pos, setPos] = useState<Pos>(() => (reduce || seen(storageKey) ? { idx: count, phase: "type", n: 0 } : { idx: 0, phase: "think", n: 0 }));
  const done = pos.idx >= count;
  const current = done ? "" : lines[pos.idx];

  useEffect(() => {
    if (done) {
      markSeen(storageKey);
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    if (pos.phase === "think") {
      t = setTimeout(() => setPos({ idx: pos.idx, phase: "type", n: 0 }), Math.min(1500, 650 + current.length * 4));
    } else if (pos.n < current.length) {
      const step = Math.max(1, Math.ceil(current.length / (MAX_TYPE_MS / TICK)));
      t = setTimeout(() => setPos({ idx: pos.idx, phase: "type", n: Math.min(current.length, pos.n + step) }), TICK);
    } else {
      t = setTimeout(() => setPos({ idx: pos.idx + 1, phase: "think", n: 0 }), PAUSE_MS);
    }
    return () => clearTimeout(t);
  }, [pos, done, current, storageKey]);

  const skip = () => setPos({ idx: count, phase: "type", n: 0 });

  return (
    <div className="flex flex-col gap-5" onClick={done ? undefined : skip}>
      {lines.map((line, i) => {
        if (i < pos.idx) return <BartekLine key={i} text={line} header={header} icon={icon} />;
        if (i > pos.idx) return null;
        return pos.phase === "think"
          ? <BartekThinking key={`t${i}`} header={header} icon={icon} />
          : <BartekLine key={i} text={line.slice(0, pos.n)} typing header={header} icon={icon} />;
      })}
      {!done ? (
        <button type="button" onClick={skip} className="min-h-11 self-start rounded-xl px-3 text-xs font-semibold text-white/55 hover:bg-white/10 hover:text-white">
          Pokaż od razu
        </button>
      ) : null}
    </div>
  );
}
