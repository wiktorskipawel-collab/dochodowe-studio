"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS } from "@/lib/journey";
import type { ToolGroup } from "@/lib/tools";
import { Pill } from "@/components/ui";
import { toolIcon } from "@/components/ToolIcon";

// Szybkie akcje: każda karta prowadzi do osobnej rozmowy z asystentem AI (/narzedzia/<id>) na promptach Bartka.
// Kotwice kart (#nowy-awatar, #vsl, #rolki, #ctr…) zostają, bo linkuje do nich menu boczne.
// DO ZATWIERDZENIA: czy wszystkie akcje są dostępne od początku, czy część dopiero po kamieniu milowym.

/** Dokumenty, z których korzysta narzędzie — tylko te, które istnieją w ścieżce (journey.ts). */
export function toolDocDefs(uses: string[]) {
  return uses.flatMap((id) => {
    const step = STEPS.find((s) => s.docId === id);
    return step ? [{ id, title: step.docTitle, stepId: step.id, stepNo: step.no }] : [];
  });
}

export const toolChatKey = (id: string) => `tool:${id}`;

export function Tools({ groups }: { groups: ToolGroup[] }) {
  const { ready, state } = useJourney();
  const reduce = useReducedMotion();
  // numer karty na całej stronie: karty pojawiają się po kolei
  const order = new Map(groups.flatMap((g) => g.tools).map((t, i) => [t.id, i]));

  return (
    <div className="flex flex-col gap-8">
      {groups.map((g) => {
        const GroupIcon = toolIcon(g.icon);
        return (
          <section key={g.id} aria-labelledby={`kat-${g.id}`} className="flex flex-col gap-3">
            <div>
              <h2 id={`kat-${g.id}`} className="flex items-center gap-2 text-lg font-semibold">
                <GroupIcon className="size-5 text-brand" aria-hidden="true" />{g.title}
              </h2>
              <p className="text-sm text-white/65">{g.desc}</p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {g.tools.map((t) => {
                const Icon = toolIcon(t.icon);
                const docs = toolDocDefs(t.uses);
                const talking = ready && (state.chats[toolChatKey(t.id)]?.length ?? 0) > 0;
                const i = order.get(t.id) ?? 0;
                return (
                  <motion.li
                    key={t.id}
                    id={t.id}
                    className="scroll-mt-24"
                    initial={reduce ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.5), type: "spring", stiffness: 260, damping: 28 }}
                  >
                    <motion.div className="h-full" whileHover={reduce ? undefined : { y: -5 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
                      <Link
                        href={`/narzedzia/${t.id}`}
                        className="glass-card group flex h-full flex-col gap-3 rounded-3xl p-5 outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand ring-1 ring-brand/25">
                            <Icon className="size-6" aria-hidden="true" />
                          </span>
                          {talking ? <Pill tone="accent"><MessageCircle className="size-3.5" aria-hidden="true" />Rozmowa w toku</Pill> : <Pill>Asystent AI</Pill>}
                        </span>
                        <span className="text-lg font-semibold leading-snug">{t.title}</span>
                        <span className="flex-1 text-sm text-white/75">{t.desc}</span>
                        {docs.length ? (
                          <span className="flex flex-wrap items-center gap-1.5 text-xs text-white/60">
                            Korzysta z:
                            {docs.map((d) => {
                              const ok = ready && state.docs[d.id]?.status === "approved";
                              return (
                                <span key={d.id} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${ok ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/70"}`}>
                                  {ok ? <Check className="size-3" aria-hidden="true" /> : null}
                                  {d.title}
                                  <span className="sr-only">{ok ? " (zatwierdzony)" : " (jeszcze niezatwierdzony)"}</span>
                                </span>
                              );
                            })}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                          {talking ? "Wróć do rozmowy" : "Zacznij"}
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </span>
                      </Link>
                    </motion.div>
                  </motion.li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
