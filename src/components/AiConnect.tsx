"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Bot, Sparkles, ClipboardCopy, Check, KeyRound, ExternalLink, ShieldCheck } from "lucide-react";
import { useJourney } from "@/lib/store";
import { PROVIDERS, type ConnectionMode, type Provider } from "@/lib/models";

const OPTIONS: { mode: ConnectionMode; title: string; text: string; icon: typeof Bot }[] = [
  { mode: "openai", title: "ChatGPT", text: "Asystent działa tutaj, na Twoim koncie OpenAI. Płacisz OpenAI tylko za to, z czego korzystasz.", icon: Bot },
  { mode: "anthropic", title: "Claude", text: "Asystent działa tutaj, na Twoim koncie Anthropic. Płacisz Anthropic tylko za to, z czego korzystasz.", icon: Sparkles },
  { mode: "manual", title: "Pracuję w swoim czacie", text: "Masz ChatGPT Plus albo Claude Pro? Kopiujesz gotowe polecenie do swojego czatu, a wynik wklejasz tutaj.", icon: ClipboardCopy },
];

export function AiConnect() {
  const { state, setAi } = useJourney();
  const router = useRouter();
  const [mode, setMode] = useState<ConnectionMode | null>(state.ai.mode);
  const [model, setModel] = useState(state.ai.model);
  const [apiKey, setApiKey] = useState(state.ai.apiKey);
  const [saved, setSaved] = useState(false);

  const provider = mode === "openai" || mode === "anthropic" ? (mode as Provider) : null;
  const info = provider ? PROVIDERS[provider] : null;
  const chosenModel = info?.models.some((m) => m.id === model) ? model : info?.models[1]?.id ?? info?.models[0]?.id ?? "";
  const keyLooksWrong = provider && apiKey && !apiKey.trim().startsWith(PROVIDERS[provider].keyPrefix);
  const canSave = mode === "manual" || (provider && apiKey.trim().length > 20 && !keyLooksWrong);

  function save() {
    if (!mode || !canSave) return;
    setAi({ mode, model: provider ? chosenModel : "", apiKey: provider ? apiKey.trim() : "" });
    setSaved(true);
    router.push(state.survey ? "/sciezka" : "/ankieta");
  }

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="grid gap-4 md:grid-cols-3">
        <legend className="sr-only">Wybierz, z jakim AI chcesz pracować</legend>
        {OPTIONS.map(({ mode: m, title, text, icon: Icon }) => {
          const on = mode === m;
          return (
            <motion.label
              key={m}
              whileHover={{ y: -5 }}
              className={`glass-card flex cursor-pointer flex-col gap-3 rounded-2xl p-5 ${on ? "outline outline-2 outline-accent" : ""}`}
            >
              <input type="radio" name="ai-mode" value={m} checked={on} onChange={() => { setMode(m); setSaved(false); }} className="sr-only" />
              <span className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-white/10"><Icon className="size-5" aria-hidden="true" /></span>
                {on ? <span className="grid size-7 place-items-center rounded-full bg-accent text-accent-ink"><Check className="size-4" aria-hidden="true" /></span> : null}
              </span>
              <span className="text-lg font-semibold">{title}</span>
              <span className="text-sm text-white/75">{text}</span>
            </motion.label>
          );
        })}
      </fieldset>

      {info && provider ? (
        <section className="glass-card flex flex-col gap-4 rounded-2xl p-5 md:p-6" aria-labelledby="key-h">
          <h2 id="key-h" className="text-lg font-semibold">Podłącz {info.name}</h2>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-white/80">Model</legend>
            <div className="grid gap-2 md:grid-cols-3">
              {info.models.map((m) => (
                <label key={m.id} className={`flex min-h-11 cursor-pointer flex-col rounded-xl border px-4 py-3 text-sm ${chosenModel === m.id ? "border-accent bg-accent/10" : "border-white/15 hover:border-white/35"}`}>
                  <input type="radio" name="model" value={m.id} checked={chosenModel === m.id} onChange={() => setModel(m.id)} className="sr-only" />
                  <span className="font-semibold">{m.label}</span>
                  <span className="text-white/65">{m.note}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-2">
            <label htmlFor="api-key" className="text-sm font-medium text-white/80">Klucz API</label>
            <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/20 px-3 focus-within:border-accent">
              <KeyRound className="size-4 text-white/60" aria-hidden="true" />
              <input
                id="api-key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
                placeholder={`${info.keyPrefix}…`}
                className="min-h-11 flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none"
                aria-describedby="key-help"
              />
            </div>
            {keyLooksWrong ? <p role="alert" className="text-sm text-amber-300">Ten klucz nie wygląda na klucz {info.name}. Powinien zaczynać się od „{info.keyPrefix}”.</p> : null}
            <p id="key-help" className="text-sm text-white/65">
              Klucz wygenerujesz na stronie{" "}
              <a href={info.keyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-accent underline-offset-2 hover:underline">
                {new URL(info.keyUrl).hostname}<ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
              . Abonamentu ChatGPT Plus ani Claude Pro nie da się podłączyć automatycznie — OpenAI i Anthropic na to nie pozwalają. Wtedy wybierz „Pracuję w swoim czacie”.
            </p>
          </div>
          <p className="flex items-start gap-2 rounded-xl bg-white/5 p-3 text-sm text-white/75">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden="true" />
            Klucz zostaje w tej przeglądarce. Wysyłamy go tylko razem z Twoim pytaniem do AI i nigdzie go nie zapisujemy.
          </p>
        </section>
      ) : null}

      {mode === "manual" ? (
        <section className="glass-card rounded-2xl p-5 text-sm text-white/80 md:p-6">
          <h2 className="mb-2 text-lg font-semibold text-white">Jak to działa</h2>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5">
            <li>W każdym kroku dostajesz gotowe polecenie z metodyką Dochodowego Studia.</li>
            <li>Kopiujesz je do swojego ChatGPT albo Claude i odpowiadasz na pytania asystenta.</li>
            <li>Gotowy dokument wklejasz tutaj. Postęp i dokumenty zapisują się na platformie.</li>
          </ol>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="inline-flex min-h-11 items-center rounded-xl bg-accent px-6 font-semibold text-accent-ink hover:brightness-95 disabled:opacity-40"
        >
          Zapisz i przejdź dalej
        </button>
        {saved ? <span className="text-sm text-emerald-300">Zapisano.</span> : null}
      </div>
    </div>
  );
}
