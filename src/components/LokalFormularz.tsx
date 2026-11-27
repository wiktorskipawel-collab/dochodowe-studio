"use client";

// Formularz jednego lokalu: pola w grupach (podstawy, koszty, metraż, wyposażenie, umowa, ocena) i wynik liczony na żywo.
// Każda zmiana od razu trafia do store (zapis jak w dokumentach), bez przycisku „Zapisz”.
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ArrowLeft, ArrowRight, Star, CloudCheck } from "lucide-react";
import type { Lokal } from "@/lib/store";
import { GRUPY, PRZYCHODY, policz, zl, type Pole } from "@/app/(app)/lokal/dane";
import { Gwiazdki, UdzialPasek } from "@/components/LokalWspolne";

const INPUT = "min-h-11 w-full rounded-xl border border-white/15 bg-black/25 px-3 text-sm text-white placeholder:text-white/35 focus:border-brand focus:outline-none";
const JEDNOSTKA: Partial<Record<Pole["typ"], string>> = { zl: "zł", m2: "m²", procent: "%", liczba: "" };

export function LokalFormularz({ lokal, onChange, onClose }: { lokal: Lokal; onChange: (pole: string, wartosc: string) => void; onClose: () => void }) {
  const [grupa, setGrupa] = useState(GRUPY[0].id);
  const idx = GRUPY.findIndex((g) => g.id === grupa);
  const g = GRUPY[idx];
  const w = policz(lokal);
  const nazwa = lokal.dane.nazwa?.trim() || "Lokal bez nazwy";

  return (
    <div className="glass-card flex flex-col gap-5 rounded-3xl p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Edytujesz lokal</p>
          <h3 className="mt-1 text-2xl font-extrabold">{nazwa}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/55"><CloudCheck className="size-3.5" aria-hidden="true" />Zmiany zapisują się same.</p>
        </div>
        <button type="button" onClick={onClose}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink hover:brightness-105">
          <Check className="size-4" aria-hidden="true" />Gotowe
        </button>
      </div>

      {/* grupy pól */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Grupy pól">
        {GRUPY.map((gr) => (
          <button key={gr.id} type="button" role="tab" aria-selected={grupa === gr.id} aria-controls="lokal-grupa" onClick={() => setGrupa(gr.id)}
            className={`relative inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-semibold ${grupa === gr.id ? "text-brand-ink" : "text-white/75 hover:text-white"}`}>
            {grupa === gr.id ? <motion.span layoutId="lokal-grupa-pill" className="absolute inset-0 rounded-full bg-brand" transition={{ type: "spring", stiffness: 420, damping: 32 }} /> : <span className="absolute inset-0 rounded-full border border-white/15" />}
            <span className="relative">{gr.title}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div id="lokal-grupa" role="tabpanel" aria-label={g.title} className="flex min-w-0 flex-col gap-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={g.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex flex-col gap-4">
              <p className="text-sm text-white/65">{g.opis}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {g.pola.map((p) => (
                  <PoleEdycji key={p.id} pole={p} id={`${lokal.id}-${p.id}`} value={lokal.dane[p.id] ?? ""} onChange={(v) => onChange(p.id, v)} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-4">
            {idx > 0 ? (
              <button type="button" onClick={() => setGrupa(GRUPY[idx - 1].id)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white">
                <ArrowLeft className="size-4" aria-hidden="true" />{GRUPY[idx - 1].title}
              </button>
            ) : <span />}
            {idx < GRUPY.length - 1 ? (
              <button type="button" onClick={() => setGrupa(GRUPY[idx + 1].id)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">
                Dalej: {GRUPY[idx + 1].title}<ArrowRight className="size-4" aria-hidden="true" />
              </button>
            ) : (
              <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">
                Zakończ i porównaj<ArrowRight className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* wynik na żywo */}
        <aside aria-label="Wynik na żywo" className="glass-strong flex flex-col gap-4 self-start rounded-2xl p-4 lg:sticky lg:top-20">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Wynik na żywo</p>
            <motion.p key={Math.round(w.pelny ?? 0)} initial={{ scale: 1.06, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 24 }}
              className="mt-1 origin-left text-3xl font-extrabold tabular-nums">{zl(w.pelny)}</motion.p>
            <p className="text-xs text-white/60">pełny koszt miesięcznie</p>
          </div>
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-sm">
            <dt className="text-white/60">Czynsz brutto</dt><dd className="text-right tabular-nums">{zl(w.brutto)}</dd>
            <dt className="text-white/60">Koszt za m² sali</dt><dd className="text-right tabular-nums">{w.zaM2 == null ? "–" : `${zl(w.zaM2)}/m²`}</dd>
            <dt className="text-white/60">Na start (kaucja + prowizja)</dt><dd className="text-right tabular-nums">{zl(w.start)}</dd>
          </dl>
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-white/80">Jaką część przychodu zjada lokal</p>
            {w.udzialy.map((u) => <UdzialPasek key={u.przychod} przychod={u.przychod} udzial={u.udzial} />)}
            {w.pelny == null ? <p className="text-xs text-white/50">Wpisz czynsz i opłaty w grupie „Koszty”.</p> : null}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-sm">
            <span className="text-white/60">Ocena</span><Gwiazdki ocena={w.ocena} />
          </div>
          {w.flagi.length ? (
            <ul className="flex flex-col gap-1 text-xs text-red-300">
              {w.flagi.map((f) => <li key={f}>• {f}</li>)}
            </ul>
          ) : null}
          <p className="text-[11px] leading-snug text-white/45">Przychód {PRZYCHODY.map((p) => p / 1000).join(", ")} tys. zł miesięcznie, jak w arkuszu Bartka. Kreski na paskach: 15% i 20%.</p>
        </aside>
      </div>
    </div>
  );
}

function PoleEdycji({ pole, id, value, onChange }: { pole: Pole; id: string; value: string; onChange: (v: string) => void }) {
  const szerokie = pole.typ === "dlugi" || (pole.typ === "wybor" && (pole.opcje?.length ?? 0) > 3 && (pole.opcje?.length ?? 0) <= 4);
  const etykieta = `${id}-label`;
  let control: React.ReactNode;

  if (pole.typ === "dlugi") {
    control = <textarea id={id} rows={3} value={value} placeholder={pole.placeholder} onChange={(e) => onChange(e.target.value)} className={`${INPUT} py-2.5`} />;
  } else if (pole.typ === "ocena") {
    const v = Number(value) || 0;
    control = (
      <div role="radiogroup" aria-labelledby={etykieta} className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button key={n} type="button" role="radio" aria-checked={v === n} aria-label={`${n} z 5`} whileTap={{ scale: 0.85 }}
            onClick={() => onChange(v === n ? "" : String(n))} className="grid size-11 place-items-center rounded-xl hover:bg-white/10">
            <Star className={`size-6 ${n <= v ? "fill-brand text-brand" : "text-white/30"}`} aria-hidden="true" />
          </motion.button>
        ))}
        <span className="ml-1 text-xs text-white/50">{v ? `${v}/5` : "kliknij, żeby ocenić"}</span>
      </div>
    );
  } else if (pole.typ === "wybor" && pole.opcje && pole.opcje.length <= 4) {
    control = (
      <div role="radiogroup" aria-labelledby={etykieta} className="flex flex-wrap gap-1.5">
        {pole.opcje.map((o) => {
          const on = value === o;
          return (
            <button key={o} type="button" role="radio" aria-checked={on} onClick={() => onChange(on ? "" : o)}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold ${on ? "border-brand bg-brand/15 text-brand" : "border-white/15 text-white/75 hover:bg-white/10 hover:text-white"}`}>
              {on ? <Check className="size-3.5" aria-hidden="true" /> : null}{o}
            </button>
          );
        })}
      </div>
    );
  } else if (pole.typ === "wybor") {
    control = (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={INPUT}>
        <option value="" className="bg-[#0c1a0d]">Wybierz…</option>
        {pole.opcje?.map((o) => <option key={o} value={o} className="bg-[#0c1a0d]">{o}</option>)}
      </select>
    );
  } else if (pole.typ === "tekst") {
    control = <input id={id} type="text" value={value} placeholder={pole.placeholder} onChange={(e) => onChange(e.target.value)} className={INPUT} />;
  } else {
    const jedn = JEDNOSTKA[pole.typ];
    control = (
      <div className="relative">
        <input id={id} type="text" inputMode="decimal" autoComplete="off" value={value} placeholder="0" onChange={(e) => onChange(e.target.value.replace(/[^\d\s,.]/g, ""))}
          className={`${INPUT} tabular-nums ${jedn ? "pr-12" : ""}`} />
        {jedn ? <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/45">{jedn}</span> : null}
      </div>
    );
  }

  const radio = pole.typ === "ocena" || (pole.typ === "wybor" && (pole.opcje?.length ?? 0) <= 4);
  return (
    <div className={szerokie ? "sm:col-span-2" : ""}>
      {radio ? (
        <span id={etykieta} className="mb-1.5 block text-sm font-medium text-white/85">{pole.label}</span>
      ) : (
        <label id={etykieta} htmlFor={id} className="mb-1.5 block text-sm font-medium text-white/85">{pole.label}</label>
      )}
      {control}
      {pole.pomoc ? <p className="mt-1 text-xs text-white/50">{pole.pomoc}</p> : null}
    </div>
  );
}
