"use client";

// Stan ścieżki uczestnika.
// - Z kluczami Supabase (.env): konto w Supabase Auth, postęp w tabeli public.journeys (RLS: tylko własny wiersz).
// - Bez kluczy: PROTOTYP w tej przeglądarce (localStorage).
// Klucz AI nigdy tu nie trafia (zaszyfrowane ciasteczko po stronie serwera).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, supabaseEnabled } from "@/lib/supabase/client";
import { signOutRemote } from "@/lib/auth";
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
  demo?: boolean; // dane przykładowe z przycisku „Zobacz demo”
  profile: { name: string; email: string } | null; // PROTOTYP: konto w tej przeglądarce, docelowo Supabase Auth
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
  profile: null,
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

export type CloudStatus = "local" | "saving" | "saved" | "error";

type Ctx = {
  ready: boolean;
  cloud: CloudStatus;
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
  signIn: (profile: { name: string; email: string }) => void;
  signOut: () => void;
};

const JourneyContext = createContext<Ctx | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JourneyState>(EMPTY);
  const [ready, setReady] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);

  const [cloud, setCloud] = useState<CloudStatus>(supabaseEnabled ? "saving" : "local");
  const userId = useRef<string | null>(null);

  // Wczytanie: najpierw kopia z przeglądarki, a z Supabase — konto i postęp z bazy.
  useEffect(() => {
    let local: JourneyState | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<JourneyState>) : null;
      if (parsed?.version === 1) {
        local = { ...EMPTY, ...parsed, ai: { mode: parsed.ai?.mode ?? null, model: parsed.ai?.model ?? "" }, events: parsed.events ?? [], profile: parsed.profile ?? null };
      }
    } catch {
      // uszkodzony zapis: zaczynamy od nowa
    }

    const sb = getSupabase();
    if (!sb) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- jednorazowe wczytanie z przeglądarki po zamontowaniu
      if (local) setState(local);
      setReady(true);
      return;
    }

    const loadUser = async (user: User) => {
      const meta = user.user_metadata as { full_name?: string; name?: string };
      const profile = { name: meta.full_name ?? meta.name ?? (user.email ?? "").split("@")[0], email: user.email ?? "" };
      const { data, error } = await sb.from("journeys").select("state").eq("user_id", user.id).maybeSingle();
      userId.current = user.id;
      if (error) setCloud("error");
      const remote = data?.state as Partial<JourneyState> | undefined;
      if (remote?.version === 1) setState({ ...EMPTY, ...remote, demo: false, profile });
      else setState(local && !local.demo && local.profile?.email === profile.email ? { ...local, profile } : { ...EMPTY, profile });
      setCloud(error ? "error" : "saved");
      setReady(true);
    };

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        // Wywołania bazy poza callbackiem (zalecenie Supabase, unika blokady sesji).
        if (session?.user) {
          if (session.user.id !== userId.current) setTimeout(() => void loadUser(session.user), 0);
        } else if (event === "INITIAL_SESSION") {
          userId.current = null;
          setState(EMPTY);
          setReady(true);
        }
      } else if (event === "SIGNED_OUT") {
        userId.current = null;
        setState(EMPTY);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Zapis: kopia w przeglądarce zawsze, a z Supabase — do bazy (z opóźnieniem, żeby nie zapisywać każdej litery).
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(state));
    const sb = getSupabase();
    const uid = userId.current;
    if (!sb || !uid || state.demo || !state.profile) return;
    setCloud("saving");
    const t = setTimeout(async () => {
      const { profile: _profile, ...rest } = state;
      void _profile;
      const { error } = await sb.from("journeys").upsert({ user_id: uid, state: rest, updated_at: new Date().toISOString() });
      setCloud(error ? "error" : "saved");
    }, 800);
    return () => clearTimeout(t);
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
      cloud,
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
      // Nowa osoba albo wyjście z demo = czysta ścieżka, żeby zawsze przeszła wejście (Połącz AI → ankieta).
      signIn: (profile) => setState((cur) => (cur.demo || !cur.profile || cur.profile.email !== profile.email ? { ...EMPTY, profile } : { ...cur, profile })),
      signOut: () => {
        userId.current = null;
        void signOutRemote();
        setState(EMPTY);
      },
    };
  }, [ready, cloud, state, reward, commit]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney poza JourneyProvider");
  return ctx;
}
