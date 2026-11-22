"use client";

// Stan ścieżki uczestnika. PROTOTYP: zapis w przeglądarce (localStorage).
// Docelowo: Supabase (Frankfurt) — wtedy postęp i dokumenty widzi też zespół DS.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ConnectionMode } from "@/lib/models";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type DocStatus = "draft" | "approved";
export type JourneyDoc = { content: string; status: DocStatus; updatedAt: string };

export type JourneyState = {
  version: 1;
  ai: { mode: ConnectionMode | null; model: string; apiKey: string };
  survey: Record<string, string> | null;
  stage: string | null;
  pathAccepted: boolean;
  chats: Record<string, ChatMessage[]>;
  docs: Record<string, JourneyDoc>;
  watched: Record<string, boolean>;
};

const EMPTY: JourneyState = {
  version: 1,
  ai: { mode: null, model: "", apiKey: "" },
  survey: null,
  stage: null,
  pathAccepted: false,
  chats: {},
  docs: {},
  watched: {},
};

const KEY = "marketing-os:v1";

type Ctx = {
  ready: boolean;
  state: JourneyState;
  setAi: (ai: JourneyState["ai"]) => void;
  saveSurvey: (answers: Record<string, string>, stage: string) => void;
  acceptPath: () => void;
  setChat: (stepId: string, messages: ChatMessage[]) => void;
  saveDoc: (docId: string, content: string, status?: DocStatus) => void;
  toggleWatched: (lessonId: string) => void;
  reset: () => void;
};

const JourneyContext = createContext<Ctx | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JourneyState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as JourneyState;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- jednorazowe wczytanie z przeglądarki po zamontowaniu
        if (parsed?.version === 1) setState({ ...EMPTY, ...parsed });
      }
    } catch {
      // uszkodzony zapis: zaczynamy od nowa
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const update = useCallback((fn: (s: JourneyState) => JourneyState) => setState((s) => fn(s)), []);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      state,
      setAi: (ai) => update((s) => ({ ...s, ai })),
      saveSurvey: (answers, stage) => update((s) => ({ ...s, survey: answers, stage })),
      acceptPath: () => update((s) => ({ ...s, pathAccepted: true })),
      setChat: (stepId, messages) => update((s) => ({ ...s, chats: { ...s.chats, [stepId]: messages } })),
      saveDoc: (docId, content, status = "draft") =>
        update((s) => ({ ...s, docs: { ...s.docs, [docId]: { content, status, updatedAt: new Date().toISOString() } } })),
      toggleWatched: (lessonId) => update((s) => ({ ...s, watched: { ...s.watched, [lessonId]: !s.watched[lessonId] } })),
      reset: () => update(() => EMPTY),
    }),
    [ready, state, update],
  );

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney poza JourneyProvider");
  return ctx;
}
