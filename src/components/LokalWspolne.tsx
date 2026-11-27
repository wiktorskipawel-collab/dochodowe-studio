"use client";

// Drobne elementy kalkulatora lokalu, wspólne dla kart, formularza i tabeli.
import { motion } from "motion/react";
import { Star } from "lucide-react";
import { PROGI, poziom, proc, tys, type Poziom } from "@/app/(app)/lokal/dane";

export const POZIOM_STYL: Record<Poziom, { box: string; bar: string; tekst: string; slowo: string }> = {
  ok: { box: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300", bar: "bg-emerald-400", tekst: "text-emerald-300", slowo: "bezpiecznie" },
  uwaga: { box: "border-amber-400/35 bg-amber-400/10 text-amber-200", bar: "bg-amber-400", tekst: "text-amber-200", slowo: "uwaga" },
  ryzyko: { box: "border-red-400/40 bg-red-400/10 text-red-300", bar: "bg-red-400", tekst: "text-red-300", slowo: "ryzyko" },
};

/** Udział kosztu lokalu w przychodzie: kolor + słowo (nie tylko kolor). */
export function UdzialChip({ przychod, udzial }: { przychod: number; udzial: number | null }) {
  if (udzial == null) return <span className="rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-white/45">przy {tys(przychod)}: –</span>;
  const s = POZIOM_STYL[poziom(udzial)];
  return (
    <span className={`flex flex-col rounded-xl border px-2.5 py-1.5 text-xs ${s.box}`}>
      <span className="text-[11px] opacity-80">przy {tys(przychod)}</span>
      <strong className="text-sm tabular-nums">{proc(udzial)}</strong>
      <span className="text-[11px] font-semibold">{s.slowo}</span>
    </span>
  );
}

/** Pasek udziału (formularz): skala do 30% przychodu, kreski na progach. */
export function UdzialPasek({ przychod, udzial }: { przychod: number; udzial: number | null }) {
  const max = 0.3;
  const s = udzial == null ? null : POZIOM_STYL[poziom(udzial)];
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-white/65">przy {tys(przychod)}</span>
        <span className={`font-semibold tabular-nums ${s?.tekst ?? "text-white/45"}`}>{udzial == null ? "–" : `${proc(udzial)} · ${s!.slowo}`}</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
        <motion.span className={`absolute inset-y-0 left-0 rounded-full ${s?.bar ?? ""}`} initial={false}
          animate={{ width: `${Math.min((udzial ?? 0) / max, 1) * 100}%` }} transition={{ type: "spring", stiffness: 220, damping: 30 }} />
        <span aria-hidden="true" className="absolute inset-y-0 w-px bg-white/50" style={{ left: `${(PROGI.ok / max) * 100}%` }} />
        <span aria-hidden="true" className="absolute inset-y-0 w-px bg-white/50" style={{ left: `${(PROGI.ryzyko / max) * 100}%` }} />
      </div>
    </div>
  );
}

/** Ocena 1–5 do wyświetlania (średnia może być ułamkiem). */
export function Gwiazdki({ ocena, size = "size-4" }: { ocena: number | null; size?: string }) {
  if (ocena == null) return <span className="text-xs text-white/45">bez oceny</span>;
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Ocena ${ocena.toFixed(1).replace(".", ",")} z 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden="true" className={`${size} ${ocena >= n - 0.25 ? "fill-brand text-brand" : ocena >= n - 0.75 ? "fill-brand/40 text-brand" : "text-white/25"}`} />
      ))}
      <span className="ml-1 text-xs font-semibold tabular-nums text-white/75">{ocena.toFixed(1).replace(".", ",")}</span>
    </span>
  );
}
