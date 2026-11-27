"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Bot, Sparkles, Check, KeyRound, ExternalLink, LogIn, Unplug, Clock } from "lucide-react";
import { useJourney } from "@/lib/store";
import { PROVIDERS, modelLabel, type Provider } from "@/lib/models";

const ERRORS: Record<string, string> = {
  anulowano: "Logowanie zostało anulowane. Spróbuj jeszcze raz, kiedy chcesz.",
  sesja: "Sesja logowania wygasła. Kliknij jeszcze raz „Zaloguj się”.",
  kod: "Kod logowania wygasł albo był nieprawidłowy. Spróbuj ponownie.",
  wymiana: "Nie udało się dokończyć połączenia. Spróbuj ponownie za chwilę.",
  siec: "Brak połączenia z OpenRouter. Sprawdź internet i spróbuj ponownie.",
};

const WROC = "mos:wroc";
/** Dokąd wrócić po połączeniu: zapamiętany ?wroc=… (np. krok), inaczej pulpit albo ankieta. */
function backTo(surveyDone: boolean) {
  const w = sessionStorage.getItem(WROC);
  sessionStorage.removeItem(WROC);
  return w && w.startsWith("/") && !w.startsWith("//") ? w : surveyDone ? "/" : "/ankieta";
}

export function AiConnect() {
  const { ready, state, setAi } = useJourney();
  const router = useRouter();
  const [serverProvider, setServerProvider] = useState<string | null | undefined>(undefined);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // Powrót z logowania OpenRouter (?polaczono=… / ?blad=…)
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams(window.location.search);
    const wroc = q.get("wroc");
    if (wroc) {
      sessionStorage.setItem(WROC, wroc);
      window.history.replaceState(null, "", "/polacz");
    }
    const ok = q.get("polaczono");
    const err = q.get("blad");
    if (ok === "openrouter") {
      const model = q.get("model") ?? "openai/gpt-5-mini";
      setAi({ mode: "openrouter", model });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- jednorazowa reakcja na powrót z logowania
      setNotice({ ok: true, text: `Połączono! Asystent działa na modelu ${modelLabel("openrouter", model)}.` });
      window.history.replaceState(null, "", "/polacz");
      setTimeout(() => router.push(backTo(!!state.survey)), 1800);
    } else if (err) {
      setNotice({ ok: false, text: ERRORS[err] ?? "Coś poszło nie tak. Spróbuj ponownie." });
      window.history.replaceState(null, "", "/polacz");
    }
    // tylko przy pierwszym wczytaniu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    fetch("/api/polacz", { cache: "no-store" }).then((r) => r.json()).then((d) => setServerProvider(d.provider)).catch(() => setServerProvider(null));
  }, [state.ai.mode]);

  if (!ready) return <p className="text-white/70">Wczytuję…</p>;

  const connected = state.ai.mode === "manual" || (state.ai.mode && serverProvider === state.ai.mode);

  async function disconnect() {
    await fetch("/api/polacz", { method: "DELETE" });
    setAi({ mode: null, model: "" });
    setServerProvider(null);
    setNotice(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {notice ? (
        <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} role={notice.ok ? "status" : "alert"}
          className={`rounded-2xl border px-5 py-4 font-semibold ${notice.ok ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-red-400/40 bg-red-400/10 text-red-100"}`}>
          {notice.text}
        </motion.p>
      ) : null}

      {connected && state.ai.mode ? (
        <ConnectedCard onDisconnect={disconnect} />
      ) : null}

      <ChatGptFirst />

      <details className="glass-card rounded-2xl p-5">
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-bold"><Bot className="size-5 text-white/70" aria-hidden="true" />Inny sposób: asystent odpowiada bezpośrednio w aplikacji</summary>
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-sm text-white/70">
            Logujesz się jednym kliknięciem przez OpenRouter (Google, GitHub albo e-mail). Jedno konto daje modele GPT i Claude, płacisz tylko za użycie (cała ścieżka to zwykle kilka złotych), klucz ma bezpiecznik 10 $.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <ProviderTile title="GPT" desc="Modele OpenAI w aplikacji." model="openai/gpt-5-mini" icon={Bot} gradient="linear-gradient(145deg, rgba(22,163,123,.35), rgba(0,84,63,.15))" />
            <ProviderTile title="Claude" desc="Modele Anthropic, świetne do tekstów." model="anthropic/claude-sonnet-5.5" icon={Sparkles} gradient="linear-gradient(145deg, rgba(221,153,51,.35), rgba(120,70,10,.12))" />
          </div>
          <OwnKey />
        </div>
      </details>
    </div>
  );
}

function ProviderTile({ title, desc, model, icon: Icon, gradient }: { title: string; desc: string; model: string; icon: typeof Bot; gradient: string }) {
  return (
    <motion.a
      href={`/api/polacz/openrouter?model=${encodeURIComponent(model)}`}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className="glass-card group relative flex min-h-44 flex-col justify-between gap-4 overflow-hidden rounded-3xl p-6"
      style={{ backgroundImage: gradient }}
    >
      <span className="flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-2xl bg-white/15"><Icon className="size-7" aria-hidden="true" /></span>
        <span><span className="block text-2xl font-extrabold">{title}</span><span className="text-sm text-white/75">{desc}</span></span>
      </span>
      <span className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-white px-5 font-bold text-neutral-900 transition group-hover:bg-brand group-hover:text-brand-ink">
        <LogIn className="size-5" aria-hidden="true" />Zaloguj się i połącz
      </span>
    </motion.a>
  );
}

function ConnectedCard({ onDisconnect }: { onDisconnect: () => void }) {
  const { state, setAi } = useJourney();
  const mode = state.ai.mode!;
  return (
    <section className="glass-strong flex flex-col gap-4 rounded-3xl p-6" aria-labelledby="conn-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="conn-h" className="flex items-center gap-2 text-lg font-bold"><Check className="size-5 text-emerald-300" aria-hidden="true" />
          {mode === "manual" ? "Połączono: Twój prywatny ChatGPT (lub Claude)" : `Połączono przez ${PROVIDERS[mode].name}`}
        </h2>
        <button type="button" onClick={onDisconnect} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">
          <Unplug className="size-4" aria-hidden="true" />{mode === "manual" ? "Zmień sposób" : "Rozłącz"}
        </button>
      </div>
      {mode !== "manual" ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-white/80">Model asystenta</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PROVIDERS[mode].models.map((m) => (
              <label key={m.id} className={`flex min-h-11 cursor-pointer flex-col rounded-xl border px-4 py-3 text-sm ${state.ai.model === m.id ? "border-brand bg-brand/10" : "border-white/15 hover:border-white/35"}`}>
                <input type="radio" name="model" className="sr-only" checked={state.ai.model === m.id} onChange={() => setAi({ mode, model: m.id })} />
                <span className="font-semibold">{m.label}</span><span className="text-white/65">{m.note}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
    </section>
  );
}

function ChatGptFirst() {
  const { state, setAi } = useJourney();
  const router = useRouter();
  const choose = () => { setAi({ mode: "manual", model: "" }); router.push(backTo(!!state.survey)); };
  return (
    <section aria-labelledby="gpt-h" className="flex flex-col gap-4">
      <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 380, damping: 24 }}
        className="glass-strong relative flex flex-col gap-5 overflow-hidden rounded-3xl p-6 md:p-8"
        style={{ backgroundImage: "linear-gradient(145deg, rgba(22,163,123,.28), rgba(221,153,51,.10))" }}>
        <div className="flex items-center gap-4">
          <span className="grid size-16 place-items-center rounded-2xl bg-white/15"><Bot className="size-8" aria-hidden="true" /></span>
          <div>
            <h2 id="gpt-h" className="text-2xl font-extrabold">Twój prywatny ChatGPT</h2>
            <p className="text-white/75">Działa z Twoim kontem, także z abonamentem Plus. Bez kluczy i bez dodatkowych opłat.</p>
          </div>
        </div>
        <ol className="grid gap-3 text-sm md:grid-cols-3">
          {["W każdym kroku klikasz „Otwórz w moim ChatGPT”.", "Twój ChatGPT otwiera się z gotowym poleceniem i metodyką Bartka.", "Wynik wraca na platformę: zatwierdzasz dokument i zbierasz postęp."].map((t, i) => (
            <li key={t} className="flex gap-3 rounded-xl bg-black/20 p-3"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand text-sm font-extrabold text-brand-ink">{i + 1}</span>{t}</li>
          ))}
        </ol>
        <button type="button" onClick={choose} className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-brand px-6 text-lg font-bold text-brand-ink shadow-[0_10px_30px_-10px_rgba(114,196,28,.5)] hover:brightness-105">
          <LogIn className="size-5" aria-hidden="true" />Połącz mój ChatGPT
        </button>
      </motion.div>
      <p className="flex items-start gap-2 text-sm text-white/60"><Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Wkrótce: logowanie przez ChatGPT jednym kliknięciem (OpenAI daje je wybranym aplikacjom, składamy wniosek) oraz aplikacja Dochodowe Studio w ChatGPT, która sama zapisze postęp.
      </p>
    </section>
  );
}

function OwnKey() {
  const { state, setAi } = useJourney();
  const router = useRouter();
  const [provider, setProvider] = useState<Exclude<Provider, "openrouter">>("openai");
  const [model, setModel] = useState(PROVIDERS.openai.models[0].id);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const info = PROVIDERS[provider];

  async function save() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/polacz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, apiKey }) });
    setBusy(false);
    if (!res.ok) return setError(((await res.json()) as { error?: string }).error ?? "Nie udało się zapisać klucza.");
    setApiKey("");
    setAi({ mode: provider, model });
    router.push(backTo(!!state.survey));
  }

  return (
    <details className="glass-card rounded-2xl p-5">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-bold"><KeyRound className="size-5 text-white/70" aria-hidden="true" />Mam własny klucz API (dla zaawansowanych)</summary>
      <div className="mt-4 flex flex-col gap-4">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Dostawca</legend>
          {(["openai", "anthropic"] as const).map((p) => (
            <label key={p} className={`flex min-h-11 cursor-pointer items-center rounded-xl border px-4 text-sm font-semibold ${provider === p ? "border-brand bg-brand/10" : "border-white/15"}`}>
              <input type="radio" name="own-provider" className="sr-only" checked={provider === p} onChange={() => { setProvider(p); setModel(PROVIDERS[p].models[0].id); }} />
              {PROVIDERS[p].name}
            </label>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-white/80">Model</span>
          <select value={model} onChange={(e) => setModel(e.target.value)} className="min-h-11 rounded-xl border border-white/20 bg-black/30 px-3 text-white">
            {info.models.map((m) => <option key={m.id} value={m.id}>{m.label} · {m.note}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-white/80">Klucz API</span>
          <input type="password" autoComplete="off" spellCheck={false} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={`${info.keyPrefix}…`}
            className="min-h-11 rounded-xl border border-white/20 bg-black/30 px-3 text-white placeholder:text-white/40 focus:border-brand focus:outline-none" />
        </label>
        <p className="text-sm text-white/65">
          Klucz wygenerujesz na <a className="inline-flex items-center gap-1 font-semibold text-brand hover:underline" href={info.keyUrl} target="_blank" rel="noreferrer">{new URL(info.keyUrl).hostname}<ExternalLink className="size-3.5" aria-hidden="true" /></a>.
          Zapisujemy go zaszyfrowanego po stronie serwera; nie wraca do przeglądarki.
        </p>
        {error ? <p role="alert" className="text-sm text-red-200">{error}</p> : null}
        <button type="button" onClick={save} disabled={busy || apiKey.trim().length < 20}
          className="inline-flex min-h-11 w-fit items-center rounded-xl bg-brand px-5 font-bold text-brand-ink disabled:opacity-40">
          Zapisz klucz i połącz
        </button>
      </div>
    </details>
  );
}
