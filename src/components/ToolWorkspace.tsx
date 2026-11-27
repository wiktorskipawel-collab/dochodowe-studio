"use client";

// Ekran jednej szybkiej akcji (/narzedzia/<id>): rozmowa z asystentem AI + co narzędzie wie o studiu.
// Rozmowa zapisuje się w state.chats["tool:<id>"] (setChat), więc wraca po odświeżeniu i na innym urządzeniu.
// ToolSheetBody: to samo narzędzie w panelu bocznym kroku (StepTools) — ta sama rozmowa, ten sam zapis.
import Link from "next/link";
import { motion } from "motion/react";
import { Check, CircleAlert, FileText, ShieldCheck } from "lucide-react";
import { useJourney, type JourneyState } from "@/lib/store";
import { surveySummary } from "@/lib/journey";
import { activeAi } from "@/lib/models";
import type { ToolMeta } from "@/lib/tools-public";
import { ToolChat, type ToolContext } from "@/components/ToolChat";
import { toolChatKey, toolDocDefs } from "@/components/Tools";
import { HowItWorks } from "@/components/ToolIntro";

/** Kontekst dla asystenta: ankieta startowa + zatwierdzone dokumenty, z których korzysta narzędzie. */
export function toolContext(state: JourneyState, uses: string[]): ToolContext {
  const documents: ToolContext["documents"] = [];
  const survey = surveySummary(state.survey);
  if (survey) documents.push({ title: "Ankieta startowa (deklaracje właściciela)", content: survey });
  for (const d of toolDocDefs(uses)) {
    const doc = state.docs[d.id];
    if (doc?.status === "approved" && doc.content.trim()) documents.push({ title: d.title, content: doc.content });
  }
  return { stage: state.stage ?? undefined, documents };
}

const AI_NOTE = "Odpowiedzi tworzy sztuczna inteligencja (AI) na podstawie metodyki Dochodowego Studia. Sprawdź każdy tekst, zanim wyślesz go klientowi. Ważne decyzje podejmujesz Ty.";

/** Rozmowa z narzędziem albo informacja, że AI jest chwilowo niedostępne. */
function ToolConversation({ tool, compact }: { tool: ToolMeta; compact?: boolean }) {
  const { state, setChat } = useJourney();
  const key = toolChatKey(tool.id);
  const ai = activeAi(state.ai);
  if (!ai || ai.mode === "manual") {
    return (
      <div className="glass-card flex flex-col items-start gap-3 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Asystent jest chwilowo niedostępny</h2>
        <p className="text-white/75">Szybkie akcje działają na AI platformy. Spróbuj ponownie za kilka minut.</p>
      </div>
    );
  }
  return (
    <ToolChat
      tool={tool}
      provider={ai.mode}
      model={ai.model}
      messages={state.chats[key] ?? []}
      onChange={(m) => setChat(key, m)}
      context={toolContext(state, tool.uses)}
      compact={compact}
    />
  );
}

export function ToolWorkspace({ tool }: { tool: ToolMeta }) {
  const { ready, state } = useJourney();
  if (!ready) return <p className="text-white/70">Wczytuję…</p>;

  const docs = toolDocDefs(tool.uses);
  const missing = docs.filter((d) => state.docs[d.id]?.status !== "approved");

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className="flex min-w-0 flex-col gap-3" aria-label={`Rozmowa: ${tool.title}`}>
        <ToolConversation tool={tool} />
        <p className="text-xs text-white/60">{AI_NOTE}</p>
      </section>

      <aside className="flex flex-col gap-4" aria-label="Jak korzystać z narzędzia">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <HowItWorks intro={tool.intro} hint={tool.hint} />
        </motion.div>

        {docs.length ? (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card flex flex-col gap-3 rounded-2xl p-5">
            <h2 className="flex items-center gap-2 font-semibold"><FileText className="size-5 text-brand" aria-hidden="true" />Co asystent wie o Twoim studiu</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {docs.map((d) => {
                const ok = state.docs[d.id]?.status === "approved";
                return (
                  <li key={d.id} className="flex items-start justify-between gap-3">
                    <span className="flex items-start gap-2">
                      {ok ? <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden="true" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-white/45" aria-hidden="true" />}
                      <span className={ok ? "text-white/90" : "text-white/65"}>{d.title}<span className="sr-only">{ok ? " — zatwierdzony" : " — jeszcze niezatwierdzony"}</span></span>
                    </span>
                    {ok ? null : (
                      <Link href={`/krok/${d.stepId}`} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-brand hover:bg-white/10">Krok {d.stepNo}</Link>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-white/60">
              {missing.length
                ? "Bez tych dokumentów też zadziała, ale asystent dopyta o więcej. Korzysta tylko z dokumentów zatwierdzonych."
                : "Masz wszystko, czego potrzeba. Asystent korzysta z tych dokumentów i z ankiety startowej."}
            </p>
          </motion.section>
        ) : null}

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card flex flex-col gap-2 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-5 text-brand" aria-hidden="true" />Dane klientów</h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-white/75">
            <li>Zamiast nazwiska wpisz samo imię albo „Klientka A”.</li>
            <li>Nie wklejaj numerów telefonów, adresów e-mail ani informacji o zdrowiu klientów. Na zrzutach ekranu zakryj numery.</li>
            <li>Rozmowa zapisuje się na Twoim koncie. „Nowa rozmowa” ją usuwa. Zdjęć i nagrań nie zapisujemy.</li>
          </ul>
        </motion.section>
      </aside>
    </div>
  );
}

/** Narzędzie w panelu bocznym kroku: rozmowa + zwinięte „Jak to działa”. */
export function ToolSheetBody({ tool }: { tool: ToolMeta }) {
  const { ready } = useJourney();
  if (!ready) return <p className="text-white/70">Wczytuję…</p>;
  return (
    <div className="flex flex-col gap-3">
      <HowItWorks intro={tool.intro} hint={tool.hint} defaultOpen={false} />
      <ToolConversation tool={tool} compact />
      <p className="text-xs text-white/60">{AI_NOTE}</p>
    </div>
  );
}
