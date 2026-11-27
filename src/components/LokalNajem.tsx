"use client";

// Zakładka „Warunki umowy najmu” na /lokal: checklista z arkusza Bartka. Przy każdym warunku:
// propozycja właściciela, nasz warunek, uzgodnione (Tak / Częściowo / Do negocjacji / Do sprawdzenia / Nie), ryzyko / komentarz.
// Osobna lista dla każdego lokalu (negocjujesz z różnymi właścicielami).
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Download, Info, Handshake } from "lucide-react";
import { useJourney, type Lokal, type NajemWpis } from "@/lib/store";
import { downloadText, fileName } from "@/lib/download";
import { play } from "@/lib/sfx";
import { Ring } from "@/components/Charts";
import { UZGODNIONE, WARUNKI, WARUNKI_WSZYSTKIE, policz, type Warunek } from "@/app/(app)/lokal/dane";

const OGOLNE = "ogolne";
const INPUT = "w-full rounded-xl border border-white/15 bg-black/25 p-3 text-sm text-white placeholder:text-white/35 focus:border-brand focus:outline-none";
const STATUS_STYL: Record<string, string> = {
  Tak: "bg-emerald-400/15 text-emerald-300",
  Częściowo: "bg-sky-400/15 text-sky-300",
  "Do negocjacji": "bg-amber-400/15 text-amber-200",
  "Do sprawdzenia": "bg-white/10 text-white/80",
  Nie: "bg-red-400/15 text-red-300",
};

export function LokalNajem({ lokale }: { lokale: Lokal[] }) {
  const { state, setNajem } = useJourney();
  const najem = state.najem ?? {};
  const opcje = [
    ...lokale.map((l) => ({ id: l.id, nazwa: l.dane.nazwa?.trim() || "Bez nazwy", odpada: policz(l).odpada })),
    ...(!lokale.length || najem[OGOLNE] ? [{ id: OGOLNE, nazwa: "Ogólna lista", odpada: false }] : []),
  ];
  const [wybrany, setWybrany] = useState<string>(() => opcje.find((o) => !o.odpada)?.id ?? opcje[0]?.id ?? OGOLNE);
  const [otwarty, setOtwarty] = useState<string | null>(null);
  const aktywny = opcje.some((o) => o.id === wybrany) ? wybrany : (opcje[0]?.id ?? OGOLNE);
  const nazwa = opcje.find((o) => o.id === aktywny)?.nazwa ?? "Ogólna lista";
  const wpisy = najem[aktywny] ?? {};

  const ile = (s: string) => WARUNKI_WSZYSTKIE.filter((w) => wpisy[w.id]?.uzgodnione === s).length;
  const uzgodnione = ile("Tak");
  const pct = Math.round((uzgodnione / WARUNKI_WSZYSTKIE.length) * 100);

  const zmien = (warunek: string, patch: Partial<NajemWpis>) =>
    setNajem((cur) => ({ ...cur, [aktywny]: { ...(cur[aktywny] ?? {}), [warunek]: { ...(cur[aktywny]?.[warunek] ?? {}), ...patch } } }));

  function pobierz() {
    const linie = WARUNKI.map((g) => {
      const poz = g.pozycje.map((w) => {
        const e = wpisy[w.id] ?? {};
        return [`• ${w.label}: ${e.uzgodnione || "—"}`, e.wlasciciel ? `  Propozycja właściciela: ${e.wlasciciel}` : "", e.nasz ? `  Nasz warunek: ${e.nasz}` : "", e.komentarz ? `  Ryzyko / komentarz: ${e.komentarz}` : ""].filter(Boolean).join("\n");
      });
      return `== ${g.title} ==\n${poz.join("\n")}`;
    });
    downloadText(fileName(`warunki najmu ${nazwa}`), `Warunki umowy najmu: ${nazwa}\nUzgodnione: ${uzgodnione} z ${WARUNKI_WSZYSTKIE.length}\n\n${linie.join("\n\n")}`);
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="glass-card grid gap-5 rounded-3xl p-5 md:grid-cols-[minmax(0,1fr)_auto] md:p-6">
        <div className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Handshake className="size-5 text-brand" aria-hidden="true" />Warunki umowy najmu</h2>
          <p className="max-w-2xl text-sm text-white/70">
            Przejdź tę listę przed podpisaniem. Przy każdym punkcie zapisz, co proponuje właściciel, czego chcesz Ty i na czym stanęło. Pokaż listę prawnikowi razem z projektem umowy.
          </p>
          {opcje.length > 1 || lokale.length ? (
            <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Lista dla lokalu">
              <span className="mr-1 text-xs font-semibold text-white/55">Lokal:</span>
              {opcje.map((o) => (
                <button key={o.id} type="button" role="radio" aria-checked={aktywny === o.id} onClick={() => { setWybrany(o.id); setOtwarty(null); }}
                  className={`relative inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-semibold ${aktywny === o.id ? "text-brand-ink" : "text-white/75 hover:text-white"} ${o.odpada ? "opacity-60" : ""}`}>
                  {aktywny === o.id ? <motion.span layoutId="najem-lokal" className="absolute inset-0 rounded-full bg-brand" transition={{ type: "spring", stiffness: 420, damping: 32 }} /> : <span className="absolute inset-0 rounded-full border border-white/15" />}
                  <span className="relative">{o.nazwa}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/50">Dodaj lokal w zakładce „Porównanie lokali”, żeby prowadzić osobną listę dla każdego.</p>
          )}
          <div className="flex flex-wrap gap-2 text-xs">
            {UZGODNIONE.map((s) => <span key={s} className={`rounded-full px-2.5 py-1 font-semibold ${STATUS_STYL[s]}`}>{s}: <span className="tabular-nums">{ile(s)}</span></span>)}
          </div>
          <button type="button" onClick={pobierz}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">
            <Download className="size-4" aria-hidden="true" />Pobierz listę (.txt)
          </button>
        </div>
        <div className="grid place-items-center">
          <Ring value={pct} size={128} stroke={11} label="Uzgodnione warunki" sub={`${uzgodnione} z ${WARUNKI_WSZYSTKIE.length}`} />
        </div>
      </section>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={aktywny} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
          className="grid gap-5 xl:grid-cols-2">
          {WARUNKI.map((g) => {
            const gotowe = g.pozycje.filter((w) => wpisy[w.id]?.uzgodnione === "Tak").length;
            return (
              <section key={g.id} className="glass-card flex flex-col gap-1 self-start rounded-2xl p-4 md:p-5" aria-labelledby={`najem-${g.id}`}>
                <header className="flex items-center justify-between gap-3 px-1 pb-2">
                  <h3 id={`najem-${g.id}`} className="font-semibold">{g.title}</h3>
                  <span className={`text-xs font-semibold tabular-nums ${gotowe === g.pozycje.length ? "text-brand" : "text-white/55"}`}>{gotowe}/{g.pozycje.length}</span>
                </header>
                <ul className="flex flex-col">
                  {g.pozycje.map((w) => (
                    <WarunekWiersz key={w.id} warunek={w} wpis={wpisy[w.id] ?? {}} otwarty={otwarty === w.id}
                      onToggle={() => setOtwarty((o) => (o === w.id ? null : w.id))} onChange={(patch) => zmien(w.id, patch)} />
                  ))}
                </ul>
              </section>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function WarunekWiersz({ warunek, wpis, otwarty, onToggle, onChange }: {
  warunek: Warunek;
  wpis: NajemWpis;
  otwarty: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<NajemWpis>) => void;
}) {
  const tak = wpis.uzgodnione === "Tak";
  const panel = `warunek-${warunek.id}`;
  return (
    <li className="border-t border-white/[0.07] first:border-t-0">
      <div className="flex items-center gap-2 py-1.5">
        <motion.button type="button" whileTap={{ scale: 0.85 }} aria-pressed={tak} aria-label={`${warunek.label}: ${tak ? "uzgodnione, kliknij, żeby cofnąć" : "oznacz jako uzgodnione"}`}
          onClick={() => { onChange({ uzgodnione: tak ? "" : "Tak" }); if (!tak) play("tap"); }}
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${tak ? "" : "hover:bg-white/10"}`}>
          <span className={`grid size-6 place-items-center rounded-full border-2 transition-colors ${tak ? "border-brand bg-brand text-brand-ink" : "border-white/30"}`}>
            <AnimatePresence>{tak ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check className="size-3.5" strokeWidth={3} aria-hidden="true" /></motion.span> : null}</AnimatePresence>
          </span>
        </motion.button>
        <button type="button" onClick={onToggle} aria-expanded={otwarty} aria-controls={panel}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-2 text-left hover:bg-white/[0.06]">
          <span className="min-w-0 flex-1">
            <span className={`block text-sm font-medium ${tak ? "text-white/60 line-through decoration-white/30" : ""}`}>{warunek.label}</span>
            {wpis.nasz ? <span className="block truncate text-xs text-white/50">Nasz warunek: {wpis.nasz}</span> : null}
          </span>
          {wpis.uzgodnione && !tak ? <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYL[wpis.uzgodnione] ?? ""}`}>{wpis.uzgodnione}</span> : null}
          <ChevronDown className={`size-4 shrink-0 text-white/50 transition-transform duration-300 ${otwarty ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {otwarty ? (
          <motion.div id={panel} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }} className="overflow-hidden">
            <div className="flex flex-col gap-3 pb-4 pl-[3.25rem] pr-1">
              <p className="flex items-start gap-2 text-xs text-white/60"><Info className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden="true" />{warunek.pomoc}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Tekst id={`${panel}-wl`} label="Propozycja właściciela" value={wpis.wlasciciel} onChange={(v) => onChange({ wlasciciel: v })} />
                <Tekst id={`${panel}-nasz`} label="Nasz warunek" value={wpis.nasz} onChange={(v) => onChange({ nasz: v })} />
              </div>
              <div>
                <span id={`${panel}-st`} className="mb-1.5 block text-xs font-semibold text-white/75">Uzgodnione</span>
                <div role="radiogroup" aria-labelledby={`${panel}-st`} className="flex flex-wrap gap-1.5">
                  {UZGODNIONE.map((s) => {
                    const on = wpis.uzgodnione === s;
                    return (
                      <button key={s} type="button" role="radio" aria-checked={on} onClick={() => onChange({ uzgodnione: on ? "" : s })}
                        className={`inline-flex min-h-10 items-center rounded-xl border px-3 text-sm font-semibold ${on ? `border-transparent ${STATUS_STYL[s]}` : "border-white/15 text-white/70 hover:bg-white/10 hover:text-white"}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Tekst id={`${panel}-kom`} label="Ryzyko / komentarz" value={wpis.komentarz} onChange={(v) => onChange({ komentarz: v })} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

function Tekst({ id, label, value, onChange }: { id: string; label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-white/75">{label}</label>
      <textarea id={id} rows={2} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={INPUT} />
    </div>
  );
}
