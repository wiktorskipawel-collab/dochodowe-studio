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
import { XP, levelOf, xpTotal, badges, phaseProgress, milestones, type Badge } from "@/lib/gamification";
import { STEPS, stepStatuses } from "@/lib/journey";
import { demoState } from "@/lib/demo";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type DocStatus = "draft" | "approved";
export type JourneyDoc = { content: string; status: DocStatus; updatedAt: string };
export type JourneyEvent = { type: "ai" | "survey" | "path" | "draft" | "approve" | "lesson" | "msg"; at: string; ref?: string };
/** Nagroda po działaniu. Pola dodatkowe = to, co się właśnie odblokowało (pokazujemy po kolei, jak w Duolingo). */
export type Reward = {
  id: number;
  kind: JourneyEvent["type"];
  xp: number;
  title: string;
  levelUp?: { index: number; name: string };
  big?: boolean;
  badges?: Badge[]; // nowe odznaki
  phase?: string; // zamknięty etap
  unlocked?: { id: string; no: string; title: string }; // odblokowany kolejny krok
  milestone?: { no: number; title: string; call: boolean }; // nowo zdobyty kamień milowy (call = 30 min z Bartkiem)
};

/** Lokal z kalkulatora /lokal. Pola formularza jako tekst (tak jak w arkuszu); liczby liczy strona przy wyświetlaniu. */
export type Lokal = { id: string; dane: Record<string, string>; dodano: string };
/** Jeden warunek z zakładki „Warunki umowy najmu” (/lokal). */
export type NajemWpis = { wlasciciel?: string; nasz?: string; uzgodnione?: string; komentarz?: string };

export type JourneyState = {
  version: 1;
  demo?: boolean; // dane przykładowe z przycisku „Zobacz demo”
  preview?: boolean; // TRYB POKAZU (?pokaz=1): wszystkie kroki odblokowane na tym koncie. Przed startem usunąć albo ograniczyć.
  onboarded?: string; // kiedy ktoś zamknął powitanie z wideo / przewodnik po pulpicie (brak = pokaż przy wejściu)
  toolIntro?: Record<string, string>; // okienko „Jak to działa”: klucz ("tool:<id>" albo "krok") → kiedy zamknięte (brak = pokaż)
  lokale?: Lokal[]; // kalkulator lokalu (/lokal): porównywane lokale
  najem?: Record<string, Record<string, NajemWpis>>; // warunki umowy najmu: id lokalu → id warunku → wpis
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

/** Data ostatniego powitania Bartka (scena na środku). Wylogowanie ustawia „out”, żeby po zalogowaniu przywitał znowu. */
export const helloKey = (email: string) => `mos:hello:${email}`;
const forgetHello = (email: string | undefined, value: string | null) => {
  if (!email) return;
  try {
    if (value === null) localStorage.removeItem(helloKey(email));
    else localStorage.setItem(helloKey(email), value);
  } catch {
    // brak dostępu do localStorage: powitanie pokaże się po prostu częściej
  }
};

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
  setChat: (stepId: string, messages: ChatMessage[]) => void; // sam zapis rozmowy, bez XP
  rewardReply: (ref: string) => void; // XP za wiadomość: dopiero po UDANEJ odpowiedzi asystenta (krok albo narzędzie)
  saveDoc: (docId: string, content: string, status?: DocStatus, title?: string) => void;
  toggleWatched: (lessonId: string) => void;
  markWatched: (lessonIds: string[]) => void;
  setPreview: (on: boolean) => void;
  setOnboarded: () => void;
  setToolIntro: (key: string) => void; // bez XP
  setLokale: (update: (cur: Lokal[]) => Lokal[]) => void; // bez XP
  setNajem: (update: (cur: Record<string, Record<string, NajemWpis>>) => Record<string, Record<string, NajemWpis>>) => void; // bez XP
  reset: () => void;
  loadDemo: () => void;
  signIn: (profile: { name: string; email: string }) => void;
  setProfileName: (name: string) => void; // /ustawienia: imię po zapisie w Supabase (user_metadata.full_name)
  signOut: () => void;
};

const JourneyContext = createContext<Ctx | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JourneyState>(EMPTY);
  // Zawsze najnowszy stan, także między renderami. Strumień odpowiedzi AI woła setChat wiele razy z jednej (starej)
  // klatki, a stare domknięcie nadpisywało stan: XP „wskakiwało” i znikało. Każda zmiana przechodzi przez put().
  const live = useRef<JourneyState>(EMPTY);
  const put = useCallback((next: JourneyState) => {
    live.current = next;
    setState(next);
  }, []);
  const update = useCallback((fn: (cur: JourneyState) => JourneyState) => put(fn(live.current)), [put]);
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
      if (local) live.current = local;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- jednorazowe wczytanie z przeglądarki po zamontowaniu
      if (local) setState(local);
      setReady(true);
      return;
    }

    const loadUser = async (user: User) => {
      const meta = user.user_metadata as { full_name?: string; name?: string };
      // Zgoda z formularza rejestracji (Google nie przyjmuje danych w logowaniu): zapisz ją na koncie raz.
      try {
        const zgoda = localStorage.getItem("ds:zgoda");
        if (zgoda) {
          localStorage.removeItem("ds:zgoda");
          if (!(user.user_metadata as { zgoda_regulamin?: string }).zgoda_regulamin) void sb.auth.updateUser({ data: { zgoda_regulamin: zgoda, zgoda_wersja: "robocza-2026-11" } });
        }
      } catch {
        // brak localStorage: zgoda z formularza e-mail i tak jest zapisana przy rejestracji
      }
      const profile = { name: meta.full_name ?? meta.name ?? (user.email ?? "").split("@")[0], email: user.email ?? "" };
      const { data, error } = await sb.from("journeys").select("state").eq("user_id", user.id).maybeSingle();
      userId.current = user.id;
      if (error) setCloud("error");
      const remote = data?.state as Partial<JourneyState> | undefined;
      if (remote?.version === 1) put({ ...EMPTY, ...remote, demo: false, profile });
      else if (local && !local.demo && local.profile?.email === profile.email) put({ ...local, profile });
      else {
        // Konto bez zapisanej ścieżki = nowa (albo wyzerowana) osoba: pełne pierwsze powitanie Bartka.
        if (!error) forgetHello(profile.email, null);
        put({ ...EMPTY, profile });
      }
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
          put(EMPTY);
          setReady(true);
        }
      } else if (event === "SIGNED_OUT") {
        userId.current = null;
        put(EMPTY);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [put]);

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

  // Tryb pokazu włączany adresem: ?pokaz=1 włącza, ?pokaz=0 wyłącza. Dopisek znika z paska adresu.
  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    const flag = url.searchParams.get("pokaz");
    if (flag !== "1" && flag !== "0") return;
    // jednorazowe odczytanie przełącznika z adresu
    put({ ...live.current, preview: flag === "1" });
    url.searchParams.delete("pokaz");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, [ready, put]);

  /** Zmiana stanu + zdarzenie (XP). Pokazuje nagrodę, a przy awansie — nowy poziom. */
  const commit = useCallback((prev: JourneyState, next: JourneyState, event?: Omit<JourneyEvent, "at">, title?: string, big?: boolean) => {
    if (!event) return put(next);
    const before = levelOf(xpTotal(prev.events));
    const events = [...next.events, { ...event, at: new Date().toISOString() }];
    const after = levelOf(xpTotal(events));
    const done = { ...next, events };
    put(done);
    // co się właśnie odblokowało
    const had = new Set(badges(prev).filter((b) => b.earned).map((b) => b.id));
    const fresh = badges(done).filter((b) => b.earned && !had.has(b.id));
    const phasesBefore = new Map(phaseProgress(prev).map((p) => [p.phase, p.done === p.total]));
    const phase = phaseProgress(done).find((p) => p.done === p.total && !phasesBefore.get(p.phase))?.phase;
    const stBefore = stepStatuses(prev);
    const stAfter = stepStatuses(done);
    const opened = STEPS.find((st) => stBefore[st.id] === "locked" && stAfter[st.id] !== "locked");
    const levelUp = after.index > before.index ? { index: after.index, name: after.name } : undefined;
    const stonesBefore = new Set(milestones(prev).filter((m) => m.complete).map((m) => m.id));
    const stone = milestones(done).find((m) => m.complete && !stonesBefore.has(m.id));
    if (title || levelUp || fresh.length || phase || stone) {
      setReward({
        id: Date.now(),
        kind: event.type,
        xp: XP[event.type],
        title: title ?? "Postęp!",
        levelUp,
        big: big || !!levelUp || !!fresh.length || !!phase || !!stone,
        badges: fresh.length ? fresh : undefined,
        phase,
        unlocked: opened ? { id: opened.id, no: opened.no, title: opened.title } : undefined,
        milestone: stone ? { no: stone.no, title: stone.title, call: !!stone.call } : undefined,
      });
    }
  }, [put]);

  const value = useMemo<Ctx>(() => {
    // Działania czytają najnowszy stan (live.current) w chwili wywołania, nie stan z renderu, w którym powstały.
    const once = (s: JourneyState, type: JourneyEvent["type"], ref?: string) => !s.events.some((e) => e.type === type && e.ref === ref);
    return {
      ready,
      cloud,
      state,
      reward,
      clearReward: () => setReward(null),
      setAi: (ai) => {
        const s = live.current;
        commit(s, { ...s, ai }, !s.ai.mode && ai.mode ? { type: "ai" } : undefined, ai.mode && !s.ai.mode ? "AI połączone" : undefined);
      },
      saveSurvey: (answers, stage) => {
        const s = live.current;
        commit(s, { ...s, survey: answers, stage }, once(s, "survey") ? { type: "survey" } : undefined, once(s, "survey") ? "Ankieta gotowa" : undefined);
      },
      acceptPath: () => {
        const s = live.current;
        commit(s, { ...s, pathAccepted: true }, once(s, "path") ? { type: "path" } : undefined, once(s, "path") ? "Ścieżka zaakceptowana" : undefined);
      },
      setChat: (stepId, messages) => update((cur) => ({ ...cur, chats: { ...cur.chats, [stepId]: messages } })),
      rewardReply: (ref) => {
        const s = live.current;
        commit(s, s, { type: "msg", ref });
      },
      saveDoc: (docId, content, status = "draft", title) => {
        const s = live.current;
        const prev = s.docs[docId];
        const next = { ...s, docs: { ...s.docs, [docId]: { content, status, updatedAt: new Date().toISOString() } } };
        if (status === "approved" && prev?.status !== "approved" && once(s, "approve", docId)) {
          commit(s, next, { type: "approve", ref: docId }, title ? `Zatwierdzone: ${title}` : "Dokument zatwierdzony", true);
        } else if (!prev && once(s, "draft", docId)) {
          commit(s, next, { type: "draft", ref: docId }, "Pierwszy szkic");
        } else commit(s, next);
      },
      toggleWatched: (lessonId) => {
        const s = live.current;
        const on = !s.watched[lessonId];
        const next = { ...s, watched: { ...s.watched, [lessonId]: on } };
        commit(s, next, on && once(s, "lesson", lessonId) ? { type: "lesson", ref: lessonId } : undefined, on && once(s, "lesson", lessonId) ? "Lekcja obejrzana" : undefined);
      },
      markWatched: (ids) => {
        const s = live.current;
        const fresh = ids.filter((id) => !s.watched[id]);
        if (!fresh.length) return;
        const watched = { ...s.watched };
        for (const id of fresh) watched[id] = true;
        const scored = fresh.filter((id) => once(s, "lesson", id));
        const now = new Date().toISOString();
        const earlier = scored.slice(0, -1).map((ref) => ({ type: "lesson" as const, ref, at: now }));
        const last = scored.at(-1);
        commit(s, { ...s, watched, events: [...s.events, ...earlier] }, last ? { type: "lesson", ref: last } : undefined, last ? "Lekcja zaliczona" : undefined);
      },
      setPreview: (on) => update((cur) => ({ ...cur, preview: on })),
      setOnboarded: () => update((cur) => (cur.onboarded ? cur : { ...cur, onboarded: new Date().toISOString() })),
      setToolIntro: (key) => update((cur) => (cur.toolIntro?.[key] ? cur : { ...cur, toolIntro: { ...cur.toolIntro, [key]: new Date().toISOString() } })),
      setLokale: (fn) => update((cur) => ({ ...cur, lokale: fn(cur.lokale ?? []) })),
      setNajem: (fn) => update((cur) => ({ ...cur, najem: fn(cur.najem ?? {}) })),
      reset: () => put(EMPTY),
      loadDemo: () => {
        const demo = demoState();
        forgetHello(demo.profile?.email, null); // demo zawsze zaczyna się pełnym przywitaniem
        put(demo);
      },
      // Nowa osoba albo wyjście z demo = czysta ścieżka, żeby zawsze przeszła wejście (Połącz AI → ankieta).
      signIn: (profile) => update((cur) => (cur.demo || !cur.profile || cur.profile.email !== profile.email ? { ...EMPTY, profile } : { ...cur, profile })),
      setProfileName: (name) => update((cur) => (cur.profile ? { ...cur, profile: { ...cur.profile, name } } : cur)),
      signOut: () => {
        forgetHello(live.current.profile?.email, "out");
        userId.current = null;
        void signOutRemote();
        put(EMPTY);
      },
    };
  }, [ready, cloud, state, reward, commit, put, update]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney poza JourneyProvider");
  return ctx;
}
