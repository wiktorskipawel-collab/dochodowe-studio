"use client";

// Sekcja „Wzory dokumentów dla studia” na stronie /dokumenty: karty z opisem, pobieraniem (.txt) i podglądem po rozwinięciu.
// Treść wzorów: src/lib/wzory.ts.
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, Copy, Check, ChevronDown, FileSignature, Handshake, ShieldCheck, ScrollText, Scale, ListChecks, type LucideIcon } from "lucide-react";
import { WZORY, UWAGA_PRAWNA, polaWzoru, type Wzor } from "@/lib/wzory";
import { downloadText, fileName } from "@/lib/download";
import { Pill } from "@/components/ui";

const ICON: Record<string, LucideIcon> = { "umowa-klient": FileSignature, "umowa-zlecenia": Handshake, nda: ShieldCheck, regulamin: ScrollText };

export function WzoryDokumentow() {
  return (
    <section id="wzory" aria-labelledby="wzory-h" className="flex scroll-mt-24 flex-col gap-4 pt-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Dla Twojego studia</p>
        <h2 id="wzory-h" className="text-xl font-semibold tracking-tight md:text-2xl">Wzory dokumentów dla studia</h2>
        <p className="max-w-3xl text-white/75">
          Umowy i regulamin z materiałów Bartka, bez cudzych danych. Uzupełnij pola w <mark className="rounded bg-brand/15 px-1 text-brand">[NAWIASACH]</mark> i daj dokument do sprawdzenia prawnikowi.
        </p>
      </div>
      <p className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
        <Scale className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{UWAGA_PRAWNA} Przepisy się zmieniają, a każde studio ma trochę inne zasady.
      </p>
      <ul className="grid gap-4 lg:grid-cols-2">
        {WZORY.map((w, i) => (
          <motion.li key={w.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.06, ease: "easeOut" }}>
            <WzorCard wzor={w} />
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

function WzorCard({ wzor }: { wzor: Wzor }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = ICON[wzor.id] ?? FileSignature;
  const pola = polaWzoru(wzor.tresc);
  const panelId = `wzor-${wzor.id}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(wzor.tresc);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // brak dostępu do schowka: zostaje przycisk „Pobierz”
    }
  }

  return (
    <article className="glass-card flex h-full flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand"><Icon className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{wzor.title}</h3>
            <Pill>Wzór</Pill>
          </div>
          <p className="mt-1 text-sm text-white/75">{wzor.opis}</p>
        </div>
      </div>
      <p className="text-sm text-white/65"><span className="font-semibold text-white/85">Kiedy: </span>{wzor.kiedy}</p>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-semibold text-white/70">Do uzupełnienia ({pola.length}):</span>
        {pola.slice(0, 5).map((p) => <span key={p} className="rounded-md bg-white/8 px-1.5 py-0.5 text-white/70">{p.toLowerCase()}</span>)}
        {pola.length > 5 ? <span className="text-white/50">i {pola.length - 5} więcej</span> : null}
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <button type="button" onClick={() => downloadText(fileName(`wzór ${wzor.title}`), wzor.tresc)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink hover:brightness-105">
          <Download className="size-4" aria-hidden="true" />Pobierz
        </button>
        <button type="button" onClick={copy}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">
          {copied ? <Check className="size-4 text-brand" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          <span aria-live="polite">{copied ? "Skopiowane" : "Kopiuj"}</span>
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={panelId}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white">
          {open ? "Zwiń podgląd" : "Podgląd"}
          <ChevronDown className={`size-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div id={panelId} key="panel" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }} className="overflow-hidden">
            <div className="flex flex-col gap-3">
              {wzor.uwagi?.length ? <Lista ikona={Scale} tytul="Sprawdź z prawnikiem" pozycje={wzor.uwagi} /> : null}
              {wzor.wdrozenie?.length ? <Lista ikona={ListChecks} tytul="Jak wprowadzić w studiu" pozycje={wzor.wdrozenie} /> : null}
              <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/25 p-4 font-sans text-sm leading-relaxed text-white/80">
                <Podswietl tekst={wzor.tresc} />
              </pre>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}

function Lista({ ikona: Ikona, tytul, pozycje }: { ikona: LucideIcon; tytul: string; pozycje: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="flex items-center gap-2 text-sm font-semibold"><Ikona className="size-4 text-brand" aria-hidden="true" />{tytul}</p>
      <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-white/75">
        {pozycje.map((p) => <li key={p}>{p}</li>)}
      </ul>
    </div>
  );
}

/** Pola w [NAWIASACH] wyróżnione kolorem marki, żeby od razu było widać, co uzupełnić. */
function Podswietl({ tekst }: { tekst: string }) {
  return tekst.split(/(\[[^\]]+\])/g).map((part, i) =>
    part.startsWith("[") && part.endsWith("]") ? <mark key={i} className="rounded bg-brand/15 px-0.5 text-brand">{part}</mark> : part,
  );
}
