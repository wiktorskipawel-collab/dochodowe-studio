"use client";

import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS, stepStatuses } from "@/lib/journey";
import { Pill } from "@/components/ui";

export function Documents() {
  const { ready, state } = useJourney();
  if (!ready) return <p className="text-white/70">Wczytuję…</p>;
  const statuses = stepStatuses(state);

  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {STEPS.map((s) => {
        const doc = state.docs[s.docId];
        const locked = statuses[s.id] === "locked";
        return (
          <li key={s.id} className={`glass-card flex flex-col gap-3 rounded-2xl p-5 ${locked ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold"><FileText className="size-5 text-accent" aria-hidden="true" />{s.docTitle}</h2>
              {doc?.status === "approved" ? <Pill tone="good">Zatwierdzony</Pill> : doc ? <Pill tone="warn">Szkic</Pill> : <Pill>{locked ? "Później" : "Do zrobienia"}</Pill>}
            </div>
            {doc ? (
              <details className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                <summary className="cursor-pointer font-medium">Pokaż treść</summary>
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap font-sans text-white/80">{doc.content}</pre>
              </details>
            ) : (
              <p className="text-sm text-white/65">Powstaje w kroku {s.no}: {s.title}.</p>
            )}
            {!locked ? (
              <Link href={`/krok/${s.id}`} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">
                {doc ? "Otwórz krok" : "Zacznij"}<ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
