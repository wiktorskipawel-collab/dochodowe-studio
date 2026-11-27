"use client";

// „Dodaj z ogłoszenia” na /lokal: treść ogłoszenia i/lub link(i) → AI platformy (POST /api/lokal/z-ogloszenia)
// → podgląd znalezionych pól (można poprawić) i lista tego, czego nie znaleziono → nowy lokal w kalkulatorze.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sparkles, Link2, Plus, X, ArrowLeft, Check, TriangleAlert, Info, SearchX } from "lucide-react";
import { GRUPY, policz, zl, type Pole } from "@/app/(app)/lokal/dane";
import { LIMITY_OGLOSZENIA, POLA_Z_OGLOSZENIA, linkWygladaOk, type PoleZOgloszenia, type WynikOgloszenia } from "@/app/(app)/lokal/ogloszenie";

type Etap = "wpisz" | "czyta" | "podglad";

const INPUT = "min-h-11 w-full rounded-xl border border-white/15 bg-black/25 px-3 text-sm text-white placeholder:text-white/35 focus:border-brand focus:outline-none";
const JEDNOSTKA: Partial<Record<Pole["typ"], string>> = { zl: "zł", m2: "m²", procent: "%" };
const POLA_AI = new Set<string>(POLA_Z_OGLOSZENIA);
const fmt = new Intl.NumberFormat("pl-PL");
const pol = (n: number) => (n === 1 ? "pole" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "pola" : "pól");

export function LokalZOgloszenia({ onDodaj, onClose }: { onDodaj: (dane: Record<string, string>) => void; onClose: () => void }) {
  const [etap, setEtap] = useState<Etap>("wpisz");
  const [tekst, setTekst] = useState("");
  const [linki, setLinki] = useState<string[]>([""]);
  const [blad, setBlad] = useState<string | null>(null);
  const [wynik, setWynik] = useState<WynikOgloszenia | null>(null);
  const [szkic, setSzkic] = useState<Record<string, string>>({});
  const zapytanie = useRef<AbortController | null>(null);
  const naglowek = useRef<HTMLHeadingElement>(null);
  const pole = useRef<HTMLTextAreaElement>(null);
  const pierwszy = useRef(true);
  const dodane = useRef(false); // podwójne kliknięcie „Dodaj lokal” nie doda lokalu dwa razy

  // fokus: na start w polu ogłoszenia, potem na nagłówku każdego etapu (czytniki ekranu słyszą, co się zmieniło)
  useEffect(() => {
    if (pierwszy.current) {
      pierwszy.current = false;
      pole.current?.focus({ preventScroll: true });
      return;
    }
    naglowek.current?.focus({ preventScroll: true });
  }, [etap]);
  useEffect(() => () => zapytanie.current?.abort(), []);

  const linkiPelne = linki.map((l) => l.trim()).filter(Boolean);

  async function wypelnij() {
    setBlad(null);
    if (!tekst.trim() && !linkiPelne.length) return setBlad("Wklej treść ogłoszenia albo link do niego.");
    const zly = linki.findIndex((l) => l.trim() && !linkWygladaOk(l));
    if (zly !== -1) return setBlad(`${linki.length > 1 ? `Link ${zly + 1}` : "Link"} nie wygląda na adres strony. Skopiuj cały adres z paska przeglądarki (zaczyna się od https://).`);

    const ctrl = new AbortController();
    zapytanie.current = ctrl;
    setEtap("czyta");
    try {
      const res = await fetch("/api/lokal/z-ogloszenia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tekst: tekst.trim(), linki: linkiPelne }),
        signal: ctrl.signal,
      });
      const data = (await res.json().catch(() => null)) as (WynikOgloszenia & { error?: string }) | null;
      if (!res.ok || !data || data.error) {
        setBlad(data?.error ?? "Nie udało się odczytać ogłoszenia. Spróbuj jeszcze raz za chwilę.");
        setEtap("wpisz");
        return;
      }
      setWynik(data);
      setSzkic({ ...data.dane });
      setEtap("podglad");
    } catch {
      if (ctrl.signal.aborted) return;
      setBlad("Brak połączenia z serwerem. Sprawdź internet i spróbuj jeszcze raz.");
      setEtap("wpisz");
    } finally {
      if (zapytanie.current === ctrl) zapytanie.current = null;
    }
  }

  function przerwij() {
    zapytanie.current?.abort();
    zapytanie.current = null;
    setEtap("wpisz");
  }

  function dodaj() {
    if (dodane.current) return;
    dodane.current = true;
    const czyste = Object.fromEntries(Object.entries(szkic).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v));
    onDodaj(czyste);
  }

  const tytul = etap === "wpisz" ? "Wklej ogłoszenie, a AI wypełni formularz" : etap === "czyta" ? "Czytam ogłoszenie…" : "Sprawdź, co znalazło AI";

  return (
    <section className="glass-card flex flex-col gap-5 rounded-3xl p-5 md:p-6" aria-labelledby="z-ogloszenia-h">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand"><Sparkles className="size-3.5" aria-hidden="true" />Dodaj z ogłoszenia</p>
          <h3 id="z-ogloszenia-h" ref={naglowek} tabIndex={-1} className="mt-1 text-xl font-extrabold outline-none md:text-2xl">{tytul}</h3>
        </div>
        <button type="button" onClick={() => { zapytanie.current?.abort(); onClose(); }} aria-label="Zamknij dodawanie z ogłoszenia"
          className="grid size-11 shrink-0 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white">
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={etap} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: "easeOut" }}>
          {etap === "wpisz" ? (
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="ogloszenie-tekst" className="mb-1.5 block text-sm font-medium text-white/85">Treść ogłoszenia</label>
                <textarea id="ogloszenie-tekst" ref={pole} rows={7} value={tekst} maxLength={LIMITY_OGLOSZENIA.tekst} onChange={(e) => setTekst(e.target.value)}
                  aria-describedby="ogloszenie-tekst-pomoc"
                  placeholder="Skopiuj z portalu opis i parametry: cenę, metraż, opłaty, kaucję, piętro…"
                  className={`${INPUT} min-h-36 resize-y py-2.5 leading-relaxed`} />
                <div id="ogloszenie-tekst-pomoc" className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-white/50">
                  <span>Na stronie ogłoszenia zaznacz tekst (Ctrl+A), skopiuj (Ctrl+C) i wklej tutaj.</span>
                  <span className="tabular-nums">{fmt.format(tekst.length)} / {fmt.format(LIMITY_OGLOSZENIA.tekst)} znaków</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/45" aria-hidden="true">
                <span className="h-px flex-1 bg-white/10" />albo i link<span className="h-px flex-1 bg-white/10" />
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1.5 text-sm font-medium text-white/85">Link do ogłoszenia <span className="font-normal text-white/50">(OLX, Otodom, Gratka i inne, maks. {LIMITY_OGLOSZENIA.linki})</span></legend>
                {linki.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
                      <input type="url" inputMode="url" autoComplete="off" spellCheck={false} value={l} aria-label={`Link ${i + 1}`}
                        aria-invalid={!!l.trim() && !linkWygladaOk(l)}
                        onChange={(e) => setLinki((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))}
                        placeholder="https://www.olx.pl/d/oferta/…" className={`${INPUT} pl-9`} />
                    </div>
                    {linki.length > 1 ? (
                      <button type="button" onClick={() => setLinki((cur) => cur.filter((_, j) => j !== i))} aria-label={`Usuń link ${i + 1}`}
                        className="grid size-11 shrink-0 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white">
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                ))}
                {linki.length < LIMITY_OGLOSZENIA.linki ? (
                  <button type="button" onClick={() => setLinki((cur) => [...cur, ""])}
                    className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl px-3 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white">
                    <Plus className="size-4" aria-hidden="true" />Dodaj kolejny link
                  </button>
                ) : null}
                <p className="text-xs text-white/50">Niektóre portale nie pozwalają pobrać strony. Wtedy wklej treść ogłoszenia powyżej.</p>
              </fieldset>

              {blad ? (
                <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-200">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{blad}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <p className="max-w-md text-xs text-white/50">Treść trafia do AI tylko po to, żeby wypełnić pola. Nie zapisujemy jej. Wszystko sprawdzisz przed dodaniem.</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">Anuluj</button>
                  <button type="button" onClick={wypelnij} disabled={!tekst.trim() && !linkiPelne.length}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink hover:brightness-105 disabled:opacity-40">
                    <Sparkles className="size-4" aria-hidden="true" />Wypełnij z AI
                  </button>
                </div>
              </div>
            </div>
          ) : etap === "czyta" ? (
            <Czytanie zLinkiem={linkiPelne.length > 0} onStop={przerwij} />
          ) : wynik ? (
            <Podglad wynik={wynik} szkic={szkic} onZmien={(id, v) => setSzkic((cur) => ({ ...cur, [id]: v }))}
              onDodaj={dodaj} onWroc={() => setEtap("wpisz")} onAnuluj={onClose} />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/** Animacja czytania: kartka z przesuwającym się „skanerem” i zmieniające się podpisy. */
function Czytanie({ zLinkiem, onStop }: { zLinkiem: boolean; onStop: () => void }) {
  const reduce = useReducedMotion();
  const kroki = [...(zLinkiem ? ["Otwieram stronę ogłoszenia…"] : []), "Czytam ogłoszenie…", "Szukam czynszu i opłat…", "Sprawdzam metraż i wyposażenie…", "Układam pola formularza…"];
  const [krok, setKrok] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setKrok((k) => Math.min(k + 1, kroki.length - 1)), 1700);
    return () => clearInterval(t);
  }, [kroki.length]);

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="relative" aria-hidden="true">
        <div className="relative h-32 w-28 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.05] p-3.5">
          {[0.9, 0.65, 0.8, 0.45, 0.75, 0.55, 0.7].map((w, i) => (
            <motion.span key={i} className="mb-2 block h-1.5 rounded-full bg-white/25" style={{ width: `${w * 100}%` }}
              animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12 }} />
          ))}
          {reduce ? null : (
            <motion.span className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-brand/40 to-transparent"
              initial={{ top: "-35%" }} animate={{ top: ["-35%", "105%"] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
          )}
        </div>
        <motion.span className="absolute -bottom-3 -right-3 grid size-11 place-items-center rounded-full bg-brand text-brand-ink shadow-[0_6px_24px_-6px_rgba(114,196,28,.8)]"
          animate={reduce ? undefined : { rotate: [0, 14, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
          <Sparkles className="size-5" />
        </motion.span>
      </div>
      <div role="status" aria-live="polite" className="mt-2 min-h-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={krok} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="font-semibold">
            {kroki[krok]}
          </motion.p>
        </AnimatePresence>
      </div>
      <p className="text-xs text-white/50">Zwykle trwa to kilkanaście sekund.</p>
      <button type="button" onClick={onStop} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">Przerwij</button>
    </div>
  );
}

function Podglad({ wynik, szkic, onZmien, onDodaj, onWroc, onAnuluj }: {
  wynik: WynikOgloszenia;
  szkic: Record<string, string>;
  onZmien: (id: string, v: string) => void;
  onDodaj: () => void;
  onWroc: () => void;
  onAnuluj: () => void;
}) {
  const znalezione = new Set(Object.keys(wynik.dane));
  const grupy = GRUPY.map((g) => ({ ...g, pola: g.pola.filter((p) => POLA_AI.has(p.id) && znalezione.has(p.id)) })).filter((g) => g.pola.length);
  const etykiety = new Map(GRUPY.flatMap((g) => g.pola).map((p) => [p.id, p.label]));
  const brak = wynik.nieZnaleziono.map((id: PoleZOgloszenia) => etykiety.get(id) ?? id);
  const ile = grupy.reduce((a, g) => a + g.pola.length, 0);
  const w = policz({ id: "podglad", dodano: "", dane: { vat: "23", ...szkic } });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-white/70">
          {ile ? <>Znaleziono <strong className="text-white">{ile}</strong> {pol(ile)}. Popraw, jeśli coś się nie zgadza.</> : "AI nie znalazło w tym ogłoszeniu danych do kalkulatora."}
        </p>
        {w.pelny != null ? (
          <p className="rounded-xl bg-white/[0.06] px-3 py-2 text-right">
            <span className="block text-[11px] text-white/55">pełny koszt miesięcznie</span>
            <strong className="text-lg tabular-nums">{zl(w.pelny)}</strong>
          </p>
        ) : null}
      </div>

      {wynik.ostrzezenia.length ? (
        <ul className="flex flex-col gap-1 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2.5 text-sm text-amber-200">
          {wynik.ostrzezenia.map((o) => <li key={o} className="flex items-start gap-2"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{o}</li>)}
        </ul>
      ) : null}
      {wynik.uwagi.length ? (
        <ul className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white/75">
          {wynik.uwagi.map((u) => <li key={u} className="flex items-start gap-2"><Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />{u}</li>)}
        </ul>
      ) : null}

      {grupy.map((g, gi) => (
        <motion.fieldset key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * gi, duration: 0.25 }} className="flex flex-col gap-3">
          <legend className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-brand">{g.title}</legend>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {g.pola.map((p) => <PolePodgladu key={p.id} pole={p} value={szkic[p.id] ?? ""} onChange={(v) => onZmien(p.id, v)} />)}
          </div>
        </motion.fieldset>
      ))}

      {brak.length ? (
        <div className="rounded-xl border border-dashed border-white/20 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-white/85"><SearchX className="size-4 text-white/55" aria-hidden="true" />Nie znaleziono w ogłoszeniu ({brak.length})</p>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Pola, których nie ma w ogłoszeniu">
            {brak.map((b) => <li key={b} className="rounded-lg border border-dashed border-white/20 px-2 py-1 text-xs text-white/60">{b}</li>)}
          </ul>
          <p className="mt-2 text-xs text-white/50">Uzupełnisz je w formularzu po dodaniu lokalu albo dopytasz wynajmującego.</p>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-4">
        <button type="button" onClick={onWroc} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white">
          <ArrowLeft className="size-4" aria-hidden="true" />Wróć do ogłoszenia
        </button>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onAnuluj} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">Anuluj</button>
          <button type="button" onClick={onDodaj}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink hover:brightness-105">
            <Check className="size-4" aria-hidden="true" />Dodaj lokal
          </button>
        </div>
      </div>
    </div>
  );
}

function PolePodgladu({ pole, value, onChange }: { pole: Pole; value: string; onChange: (v: string) => void }) {
  const id = `ogl-${pole.id}`;
  let control: ReactNode;
  if (pole.typ === "wybor") {
    control = (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={INPUT}>
        <option value="" className="bg-[#0c1a0d]">Brak</option>
        {pole.opcje?.map((o) => <option key={o} value={o} className="bg-[#0c1a0d]">{o}</option>)}
      </select>
    );
  } else if (pole.typ === "tekst" || pole.typ === "dlugi") {
    control = <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} className={INPUT} />;
  } else {
    const jedn = JEDNOSTKA[pole.typ];
    control = (
      <div className="relative">
        <input id={id} type="text" inputMode="decimal" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d\s,.]/g, ""))}
          className={`${INPUT} tabular-nums ${jedn ? "pr-12" : ""}`} />
        {jedn ? <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/45">{jedn}</span> : null}
      </div>
    );
  }
  return (
    <div className={pole.id === "link" ? "sm:col-span-2 xl:col-span-3" : ""}>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-white/70">{pole.label}</label>
      {control}
    </div>
  );
}
