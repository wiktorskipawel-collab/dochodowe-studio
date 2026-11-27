"use client";

import Link from "next/link";
import { FileText, ArrowRight, Download } from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS, stepStatuses } from "@/lib/journey";
import { downloadText, fileName } from "@/lib/download";
import { Pill } from "@/components/ui";

export function Documents() {
  const { ready, state } = useJourney();
  if (!ready) return <p className="text-white/70">Wczytuję…</p>;
  const statuses = stepStatuses(state);
  const ready_ = STEPS.filter((s) => state.docs[s.docId]?.content.trim());

  // Wszystkie dokumenty w jednym pliku: „Moje studio — dokumenty”.
  function downloadAll() {
    const parts = ready_.map((s) => {
      const doc = state.docs[s.docId]!;
      return `=== ${s.docTitle} (${doc.status === "approved" ? "zatwierdzony" : "szkic"}) ===\n\n${doc.content.trim()}`;
    });
    downloadText("moje-studio-dokumenty.txt", `Dochodowe Studio · Marketing OS — moje dokumenty\n\n${parts.join("\n\n\n")}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/70">Każdy dokument pobierzesz jako zwykły plik tekstowy. Otworzysz go w Wordzie, Google Docs albo w telefonie.</p>
        <button type="button" onClick={downloadAll} disabled={!ready_.length}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink hover:brightness-105 disabled:opacity-40">
          <Download className="size-4" aria-hidden="true" />Pobierz wszystkie ({ready_.length})
        </button>
      </div>
      <ul className="grid gap-4 lg:grid-cols-2">
        {STEPS.map((s) => {
          const doc = state.docs[s.docId];
          const locked = statuses[s.id] === "locked";
          return (
            <li key={s.id} id={s.docId} className={`glass-card flex scroll-mt-24 flex-col gap-3 rounded-2xl p-5 ${locked ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="flex items-center gap-2 font-semibold"><FileText className="size-5 text-brand" aria-hidden="true" />{s.docTitle}</h2>
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
              <div className="flex flex-wrap gap-2">
                {!locked ? (
                  <Link href={`/krok/${s.id}`} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">
                    {doc ? "Otwórz krok" : "Zacznij"}<ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                ) : null}
                {doc?.content.trim() ? (
                  <button type="button" onClick={() => downloadText(fileName(s.docTitle), `${s.docTitle}\n\n${doc.content}`)}
                    className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">
                    <Download className="size-4" aria-hidden="true" />Pobierz
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
