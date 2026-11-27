"use client";

import { Eye } from "lucide-react";
import { useJourney } from "@/lib/store";

// Pasek trybu pokazu (?pokaz=1). Widać go tylko na koncie, które go włączyło.
export function PreviewBanner() {
  const { state, setPreview } = useJourney();
  if (!state.preview) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-300/30 bg-sky-300/10 px-5 py-3 text-sm">
      <span className="flex items-center gap-2">
        <Eye className="size-4 shrink-0 text-sky-200" aria-hidden="true" />
        <span><strong>Tryb pokazu.</strong> Wszystkie kroki są odblokowane. Uczestnicy przechodzą je po kolei.</span>
      </span>
      <button type="button" onClick={() => setPreview(false)} className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-4 font-semibold hover:bg-white/10">Wyłącz</button>
    </div>
  );
}
