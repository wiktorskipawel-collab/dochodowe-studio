"use client";

// Stan ścieżki uczestnika. PROTOTYP: zapis w przeglądarce (localStorage), bez kluczy AI
// (klucz jest zaszyfrowany w ciasteczku po stronie serwera). Docelowo: Supabase (Frankfurt).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ConnectionMode } from "@/lib/models";
import { XP, levelOf, xpTotal } from "@/lib/gamification";
import { demoState } from "@/lib/demo";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type DocStatus = "draft" | "approved";
export type JourneyDoc = { content: string; status: DocStatus; updatedAt: string };
export type JourneyEvent = { type: "ai" | "survey" | "path" | "draft" | "approve" | "lesson" | "msg"; at: string; ref?: string };
export type Reward = { xp: number; title: string; levelUp?: string; big?: boolean };

export type JourneyState = {
  version: 1;
  demo?: boolean; // dane przykładowe z przycisku „Pokaż przykładowy postęp”
  ai: { mode: ConnectionMode | null; model: string };
  survey: Record<string, string> | null;
  stage: string | null;
  pathAccepted: boolean;
  chats: Record<string, ChatMessage[]>;
  docs: Record<string, JourneyDoc>;
  watched: Record<string, boolean>;
  events: JourneyEvent[];
};

const EMPTY: JourneyState = {
  version: 1,
  ai: { mode: null, model: "" },
  survey: null,
  stage: null,
  pathAccepted: false,
  chats: {},
  docs: {},
  watched: {},
  events: [],
};

const KEY = "marketing-os:v1";

type Ctx = {
  ready: boolean;
  state: JourneyState;
  reward: Reward | null;
  clearReward: () => void;
  setAi: (ai: JourneyState["ai"]) => void;
  saveSurvey: (answers: Record<string, string>, stage: string) => void;
  acceptPath: () => void;
  setChat: (stepId: string, messages: ChatMessage[]) => void;
  saveDoc: (docId: string, content: string, status?: DocStatus, title?: string) => void;
  toggleWatched: (lessonId: string) => void;
  reset: () => void;
  loadDemo: () => void;
};

const JourneyContext = createContext<Ctx | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JourneyState>(EMPTY);
  const [ready, setReady] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<JourneyState> & { ai?: { mode?: ConnectionMode | null; model?: string } };
        if (parsed?.version === 1) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- jednorazowe wczytanie z przeglądarki po zamontowaniu
          setState({ ...EMPTY, ...parsed, ai: { mode: parsed.ai?.mode ?? null, model: parsed.ai?.model ?? "" }, events: parsed.events ?? [] });
        }
      }
    } catch {
      // uszkodzony zapis: zaczynamy od nowa
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  /** Zmiana stanu + zdarzenie (XP). Pokazuje nagrodę, a przy awansie — nowy poziom. */
  const commit = useCallback((prev: JourneyState, next: JourneyState, event?: Omit<JourneyEvent, "at">, title?: string, big?: boolean) => {
    if (!event) return setState(next);
    const before = levelOf(xpTotal(prev.events));
    const events = [...next.events, { ...event, at: new Date().toISOString() }];
    const after = levelOf(xpTotal(events));
    setState({ ...next, events });
    if (title || after.index > before.index) {
      setReward({ xp: XP[event.type], title: title ?? "Postęp!", levelUp: after.index > before.index ? after.name : undefined, big: big || after.index > before.index });
    }
  }, []);

  const value = useMemo<Ctx>(() => {
    const s = state;
    const once = (type: JourneyEvent["type"], ref?: string) => !s.events.some((e) => e.type === type && e.ref === ref);
    return {
      ready,
      state,
      reward,
      clearReward: () => setReward(null),
      setAi: (ai) => commit(s, { ...s, ai }, !s.ai.mode && ai.mode ? { type: "ai" } : undefined, ai.mode && !s.ai.mode ? "AI połączone" : undefined),
      saveSurvey: (answers, stage) => commit(s, { ...s, survey: answers, stage }, once("survey") ? { type: "survey" } : undefined, once("survey") ? "Ankieta gotowa" : undefined),
      acceptPath: () => commit(s, { ...s, pathAccepted: true }, once("path") ? { type: "path" } : undefined, once("path") ? "Ścieżka zaakceptowana" : undefined),
      setChat: (stepId, messages) => {
        const prevUser = (s.chats[stepId] ?? []).filter((m) => m.role === "user").length;
        const nextUser = messages.filter((m) => m.role === "user").length;
        commit(s, { ...s, chats: { ...s.chats, [stepId]: messages } }, nextUser > prevUser ? { type: "msg", ref: stepId } : undefined);
      },
      saveDoc: (docId, content, status = "draft", title) => {
        const prev = s.docs[docId];
        const next = { ...s, docs: { ...s.docs, [docId]: { content, status, updatedAt: new Date().toISOString() } } };
        if (status === "approved" && prev?.status !== "approved" && once("approve", docId)) {
          commit(s, next, { type: "approve", ref: docId }, title ? `Zatwierdzone: ${title}` : "Dokument zatwierdzony", true);
        } else if (!prev && once("draft", docId)) {
          commit(s, next, { type: "draft", ref: docId }, "Pierwszy szkic");
        } else commit(s, next);
      },
      toggleWatched: (lessonId) => {
        const on = !s.watched[lessonId];
        const next = { ...s, watched: { ...s.watched, [lessonId]: on } };
        commit(s, next, on && once("lesson", lessonId) ? { type: "lesson", ref: lessonId } : undefined, on && once("lesson", lessonId) ? "Lekcja obejrzana" : undefined);
      },
      reset: () => setState(EMPTY),
      loadDemo: () => setState(demoState()),
    };
  }, [ready, state, reward, commit]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney poza JourneyProvider");
  return ctx;
}
