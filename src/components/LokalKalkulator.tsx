"use client";

// Kalkulator lokalu (/lokal) — etap „Przed otwarciem” i przeprowadzka. Na podstawie arkusza Bartka „Porównanie lokali”:
// dodawanie lokali, pełny koszt miesięczny, koszt za m² sali, udział kosztu w przychodzie przy 20/50/70 tys. zł,
// porównanie z wyróżnieniem najtańszego i najlepiej ocenionego oraz zakładka „Warunki umowy najmu”.
// Dane i obliczenia: src/app/(app)/lokal/dane.ts. Zapis: store (`lokale`, `najem`), bez XP.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Building2, Plus, Pencil, Trash2, FileSpreadsheet, Trophy, Wallet, MapPin, ChevronRight, TriangleAlert, Lightbulb, Star, Scale } from "lucide-react";
import { useJourney, type Lokal } from "@/lib/store";
import { downloadText } from "@/lib/download";
import { Pill } from "@/components/ui";
import { LokalFormularz } from "@/components/LokalFormularz";
import { LokalNajem } from "@/components/LokalNajem";
import { Gwiazdki, POZIOM_STYL, UdzialChip } from "@/components/LokalWspolne";
import { KOLEJNOSC, NA_CO_PATRZEC, PRZYCHODY, WARUNKI_WSZYSTKIE, doCsv, liczba, nowyLokal, policz, poziom, proc, tys, wyroznienia, zl, type Wynik } from "@/app/(app)/lokal/dane";

type Zakladka = "porownanie" | "najem";

export function LokalKalkulator() {
  const { ready, state, setLokale, setNajem } = useJourney();
  const [zakladka, setZakladka] = useState<Zakladka>("porownanie");
  const [edytowany, setEdytowany] = useState<string | null>(null);
  const edytor = useRef<HTMLDivElement>(null);

  // po otwarciu formularza przewiń do niego
  useEffect(() => {
    if (!edytowany) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => edytor.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 60);
    return () => clearTimeout(t);
  }, [edytowany]);

  if (!ready) return <p className="text-white/70">Wczytuję…</p>;
  const lokale = state.lokale ?? [];
  const najem = state.najem ?? {};
  const { najtanszy, najlepszy } = wyroznienia(lokale);
  const edyt = lokale.find((l) => l.id === edytowany) ?? null;
  const uzgodnioneRazem = Object.values(najem).reduce((a, w) => a + WARUNKI_WSZYSTKIE.filter((x) => w[x.id]?.uzgodnione === "Tak").length, 0);

  const dodaj = () => {
    const l = nowyLokal(lokale);
    setLokale((cur) => [...cur, l]);
    setEdytowany(l.id);
  };
  const usun = (id: string) => {
    setLokale((cur) => cur.filter((l) => l.id !== id));
    setNajem((cur) => {
      const next = { ...cur };
      delete next[id];
      return next;
    });
    if (edytowany === id) setEdytowany(null);
  };
  const zmien = (id: string, pole: string, wartosc: string) =>
    setLokale((cur) => cur.map((l) => (l.id === id ? { ...l, dane: { ...l.dane, [pole]: wartosc } } : l)));

  return (
    <div className="flex flex-col gap-6">
      <Kolejnosc />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kalkulator lokalu">
        {([
          ["porownanie", "Porównanie lokali", lokale.length],
          ["najem", "Warunki umowy najmu", uzgodnioneRazem],
        ] as [Zakladka, string, number][]).map(([z, label, n]) => (
          <button key={z} type="button" role="tab" aria-selected={zakladka === z} aria-controls={`lokal-${z}`} onClick={() => setZakladka(z)}
            className={`relative inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${zakladka === z ? "text-brand-ink" : "text-white/75 hover:text-white"}`}>
            {zakladka === z ? <motion.span layoutId="lokal-zakladka" className="absolute inset-0 rounded-full bg-brand" transition={{ type: "spring", stiffness: 420, damping: 32 }} /> : <span className="absolute inset-0 rounded-full border border-white/15" />}
            <span className="relative">{label}</span>
            <span className={`relative rounded-full px-1.5 text-xs tabular-nums ${zakladka === z ? "bg-black/15" : "bg-white/10"}`}>{n}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={zakladka} id={`lokal-${zakladka}`} role="tabpanel" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}>
          {zakladka === "najem" ? (
            <LokalNajem lokale={lokale} />
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm text-white/65"><Scale className="size-4 shrink-0" aria-hidden="true" />
                  Kolory jak w arkuszu Bartka: do 15% przychodu bezpiecznie, 15–20% uwaga, powyżej 20% ryzyko.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => downloadText("porownanie-lokali.csv", doCsv(lokale))} disabled={!lokale.length}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10 disabled:opacity-40">
                    <FileSpreadsheet className="size-4" aria-hidden="true" />Pobierz do Excela
                  </button>
                  <button type="button" onClick={dodaj}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink hover:brightness-105">
                    <Plus className="size-4" aria-hidden="true" />Dodaj lokal
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {edyt ? (
                  <motion.div ref={edytor} key={edyt.id} className="scroll-mt-24" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.98 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                    <LokalFormularz lokal={edyt} onChange={(pole, v) => zmien(edyt.id, pole, v)} onClose={() => setEdytowany(null)} />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {lokale.length ? (
                <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  <AnimatePresence initial={false}>
                    {lokale.map((l) => (
                      <LokalKarta key={l.id} lokal={l} wynik={policz(l)} najtanszy={najtanszy === l.id} najlepszy={najlepszy === l.id} aktywny={edytowany === l.id}
                        onEdit={() => setEdytowany(l.id)} onDelete={() => usun(l.id)} />
                    ))}
                  </AnimatePresence>
                </ul>
              ) : (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card grid place-items-center rounded-3xl p-8 text-center md:p-12">
                  <div className="flex max-w-md flex-col items-center gap-3">
                    <span className="grid size-16 place-items-center rounded-2xl bg-brand/15 text-brand"><Building2 className="size-8" aria-hidden="true" /></span>
                    <p className="text-xl font-bold">Dodaj pierwszy lokal</p>
                    <p className="text-white/65">Wpisz czynsz, opłaty i metraż sali. Najlepiej porównać co najmniej 2–3 lokale, zanim zaczniesz negocjować.</p>
                    <button type="button" onClick={dodaj} className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand px-6 font-bold text-brand-ink shadow-[0_6px_0_0_rgba(0,0,0,.35)]">
                      <Plus className="size-5" aria-hidden="true" />Dodaj lokal
                    </button>
                  </div>
                </motion.div>
              )}

              {lokale.length >= 2 ? <TabelaPorownania lokale={lokale} najtanszy={najtanszy} najlepszy={najlepszy} /> : null}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Kolejność decyzji i na co patrzeć — z lekcji „Nie kupujesz sprzętu do lokalu”. */
function Kolejnosc() {
  return (
    <section className="glass-card grid gap-5 rounded-3xl p-5 md:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" aria-labelledby="lokal-kolejnosc">
      <div className="flex flex-col gap-3">
        <p id="lokal-kolejnosc" className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Najpierw model, potem metry i sprzęt</p>
        <ol className="flex flex-wrap items-center gap-1.5">
          {KOLEJNOSC.map((k, i) => (
            <motion.li key={k} className="flex items-center gap-1.5" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i, duration: 0.3 }}>
              <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${i === KOLEJNOSC.length - 1 ? "border border-white/15 text-white/70" : "bg-white/[0.08]"}`}>
                <span className="mr-1.5 text-xs tabular-nums text-brand">{i + 1}</span>{k}
              </span>
              {i < KOLEJNOSC.length - 1 ? <ChevronRight className="size-4 text-white/35" aria-hidden="true" /> : null}
            </motion.li>
          ))}
        </ol>
        <p className="text-sm text-white/65">Lokal dobierasz do tego, jak pracuje Twoje studio: ile osób trenuje naraz i jakie ruchy wykonują. Nie odwrotnie.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold"><Lightbulb className="size-4 text-brand" aria-hidden="true" />Na co patrzeć przy oględzinach</p>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-white/70">
          {NA_CO_PATRZEC.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
    </section>
  );
}

function LokalKarta({ lokal, wynik: w, najtanszy, najlepszy, aktywny, onEdit, onDelete }: {
  lokal: Lokal;
  wynik: Wynik;
  najtanszy: boolean;
  najlepszy: boolean;
  aktywny: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [potwierdz, setPotwierdz] = useState(false);
  const d = lokal.dane;
  const sala = liczba(d.metrazSali);
  const status = d.decyzja || d.status;
  const wyrozniony = najtanszy || najlepszy;
  return (
    <motion.li layout initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className={`glass-card flex flex-col gap-4 rounded-2xl p-5 ${w.odpada ? "opacity-60" : ""} ${aktywny ? "border-brand/70" : wyrozniony ? "border-brand/40 shadow-[0_0_60px_-30px_rgba(114,196,28,.8)]" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-bold">{d.nazwa?.trim() || "Bez nazwy"}</h3>
            {status ? <Pill tone={status === "Odpada" ? "bad" : status === "Wybrany" ? "good" : "neutral"}>{status}</Pill> : null}
          </div>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-white/60"><MapPin className="size-3.5 shrink-0" aria-hidden="true" />{d.adres || d.lokalizacja || "Bez adresu"}</p>
        </div>
      </div>
      {wyrozniony ? (
        <div className="flex flex-wrap gap-1.5">
          {najtanszy ? <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-extrabold text-brand-ink"><Wallet className="size-3.5" aria-hidden="true" />Najtańszy</span> : null}
          {najlepszy ? <span className="inline-flex items-center gap-1 rounded-full bg-orange px-2.5 py-1 text-xs font-extrabold text-neutral-950"><Trophy className="size-3.5" aria-hidden="true" />Najlepiej oceniony</span> : null}
        </div>
      ) : null}

      <div>
        <p className="text-3xl font-extrabold tabular-nums">{zl(w.pelny)}</p>
        <p className="text-xs text-white/60">pełny koszt miesięcznie</p>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <Mini label="za m² sali" value={w.zaM2 == null ? "–" : zl(w.zaM2)} />
        <Mini label="sala" value={sala == null ? "–" : `${sala} m²`} />
        <Mini label="na start" value={zl(w.start)} />
      </dl>
      <div className="grid grid-cols-3 gap-2">
        {w.udzialy.map((u) => <UdzialChip key={u.przychod} przychod={u.przychod} udzial={u.udzial} />)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Gwiazdki ocena={w.ocena} />
        {w.doPotwierdzenia ? <span className="text-xs text-white/55">{w.doPotwierdzenia} do potwierdzenia</span> : null}
      </div>
      {w.flagi.length ? (
        <ul className="flex flex-col gap-1 rounded-xl border border-red-400/25 bg-red-400/[0.07] p-3 text-xs text-red-300">
          {w.flagi.map((f) => <li key={f} className="flex items-start gap-1.5"><TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />{f}</li>)}
        </ul>
      ) : null}
      {d.zaleta || d.ryzyko ? (
        <div className="flex flex-col gap-1 text-xs text-white/65">
          {d.zaleta ? <p><span className="font-semibold text-white/85">Zaleta: </span>{d.zaleta}</p> : null}
          {d.ryzyko ? <p><span className="font-semibold text-white/85">Ryzyko: </span>{d.ryzyko}</p> : null}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={onEdit} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">
          <Pencil className="size-4" aria-hidden="true" />{aktywny ? "Edytujesz" : "Edytuj"}
        </button>
        {potwierdz ? (
          <span className="inline-flex items-center gap-1">
            <button type="button" onClick={onDelete} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-500/90 px-3 text-sm font-semibold text-white hover:bg-red-500">Usuń na pewno</button>
            <button type="button" onClick={() => setPotwierdz(false)} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-white/65 hover:bg-white/10 hover:text-white">Zostaw</button>
          </span>
        ) : (
          <button type="button" onClick={() => setPotwierdz(true)} aria-label={`Usuń lokal ${d.nazwa || ""}`.trim()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white">
            <Trash2 className="size-4" aria-hidden="true" />Usuń
          </button>
        )}
      </div>
    </motion.li>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse rounded-xl bg-white/[0.05] px-2 py-2">
      <dt className="text-[11px] text-white/55">{label}</dt>
      <dd className="text-sm font-bold tabular-nums">{value}</dd>
    </div>
  );
}

type Wiersz = { label: string; pokaz: (l: Lokal, w: Wynik) => ReactNode; liczba?: (l: Lokal, w: Wynik) => number | null; lepiej?: "min" | "max" };

const WIERSZE: Wiersz[] = [
  { label: "Status", pokaz: (l) => l.dane.status || "–" },
  { label: "Pełny koszt miesięczny", pokaz: (_, w) => zl(w.pelny), liczba: (_, w) => w.pelny, lepiej: "min" },
  { label: "Czynsz brutto", pokaz: (_, w) => zl(w.brutto), liczba: (_, w) => w.brutto, lepiej: "min" },
  { label: "Koszt za m² sali", pokaz: (_, w) => (w.zaM2 == null ? "–" : `${zl(w.zaM2)}/m²`), liczba: (_, w) => w.zaM2, lepiej: "min" },
  { label: "Metraż sali", pokaz: (l) => (liczba(l.dane.metrazSali) == null ? "–" : `${liczba(l.dane.metrazSali)} m²`), liczba: (l) => liczba(l.dane.metrazSali), lepiej: "max" },
  { label: "Maks. klientów jednocześnie", pokaz: (l) => l.dane.maxKlientow || "–", liczba: (l) => liczba(l.dane.maxKlientow), lepiej: "max" },
  ...PRZYCHODY.map((p, i): Wiersz => ({
    label: `Udział w przychodzie ${tys(p)}`,
    pokaz: (_, w) => {
      const u = w.udzialy[i].udzial;
      return u == null ? "–" : <span className={`font-semibold ${POZIOM_STYL[poziom(u)].tekst}`}>{proc(u)} · {POZIOM_STYL[poziom(u)].slowo}</span>;
    },
  })),
  { label: "Na start (kaucja + prowizja)", pokaz: (_, w) => zl(w.start), liczba: (_, w) => w.start, lepiej: "min" },
  { label: "Ocena", pokaz: (_, w) => <Gwiazdki ocena={w.ocena} size="size-3.5" />, liczba: (_, w) => w.ocena, lepiej: "max" },
  { label: "Zgoda na studio", pokaz: (l) => l.dane.zgodaStudio || "–" },
  { label: "Ryzyko hałasu", pokaz: (l) => l.dane.halas || "–" },
  { label: "Długość umowy", pokaz: (l) => l.dane.dlugosc || "–" },
  { label: "Czerwone flagi", pokaz: (_, w) => (w.flagi.length ? <span className="text-red-300">{w.flagi.length}</span> : "0"), liczba: (_, w) => w.flagi.length, lepiej: "min" },
  { label: "Decyzja", pokaz: (l) => l.dane.decyzja || "–" },
];

function TabelaPorownania({ lokale, najtanszy, najlepszy }: { lokale: Lokal[]; najtanszy: string | null; najlepszy: string | null }) {
  const wyniki = lokale.map((l) => ({ l, w: policz(l) }));
  // najlepsza wartość w wierszu (tylko lokale, które nie odpadły, i tylko gdy jest z czym porównać)
  const najlepsze = (r: Wiersz) => {
    if (!r.liczba || !r.lepiej) return null;
    const vals = wyniki.filter(({ w }) => !w.odpada).map(({ l, w }) => r.liczba!(l, w)).filter((n): n is number => n != null);
    if (vals.length < 2) return null;
    return r.lepiej === "min" ? Math.min(...vals) : Math.max(...vals);
  };
  return (
    <section className="glass-card flex flex-col gap-3 rounded-3xl p-5 md:p-6" aria-labelledby="lokal-tabela">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="lokal-tabela" className="text-lg font-bold">Porównanie obok siebie</h2>
        <p className="flex items-center gap-1.5 text-xs text-white/55"><Star className="size-3.5 text-brand" aria-hidden="true" />Zielone tło = najlepsza wartość w wierszu</p>
      </div>
      <div className="-mx-2 overflow-x-auto px-2">
        <table className="w-full min-w-[36rem] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-[#0b180c] py-2 pr-3 text-xs font-medium text-white/55">Lokal</th>
              {wyniki.map(({ l, w }) => (
                <th key={l.id} scope="col" className={`px-3 py-2 align-bottom font-bold ${w.odpada ? "text-white/45" : ""}`}>
                  <span className="block">{l.dane.nazwa?.trim() || "Bez nazwy"}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {najtanszy === l.id ? <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-extrabold text-brand-ink">Najtańszy</span> : null}
                    {najlepszy === l.id ? <span className="rounded-full bg-orange px-2 py-0.5 text-[10px] font-extrabold text-neutral-950">Najlepiej oceniony</span> : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WIERSZE.map((r) => {
              const best = najlepsze(r);
              return (
                <tr key={r.label}>
                  <th scope="row" className="sticky left-0 z-10 border-t border-white/[0.07] bg-[#0b180c] py-2 pr-3 text-xs font-medium text-white/65">{r.label}</th>
                  {wyniki.map(({ l, w }) => {
                    const v = r.liczba?.(l, w);
                    const top = best != null && v === best && !w.odpada;
                    return (
                      <td key={l.id} className={`border-t border-white/[0.07] px-3 py-2 tabular-nums ${top ? "bg-brand/15 font-semibold text-brand" : ""} ${w.odpada ? "text-white/45" : ""}`}>
                        {r.pokaz(l, w)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
