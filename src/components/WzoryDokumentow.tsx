"use client";

// Sekcja „Wzory dokumentów dla studia” na stronie /dokumenty: karty z opisem, pobieraniem (.txt) i podglądem w okienku.
// Treść wzorów: src/lib/wzory.ts.
// Podgląd otwiera się w okienku (Base UI Dialog), a nie w karcie: rozwinięta karta rozciągała cały wiersz siatki,
// przez co przyciski karty obok (przyklejone do jej dołu) uciekały daleko w dół i wyglądało, jakby ich nie było.
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { motion, useReducedMotion } from "motion/react";
import { Download, Copy, Check, Eye, X, FileSignature, Handshake, ShieldCheck, ScrollText, Scale, ListChecks, type LucideIcon } from "lucide-react";
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

/** Kopiowanie treści wzoru do schowka z krótkim „Skopiowane”. */
function useKopiuj(tresc: string) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(tresc);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // brak dostępu do schowka: zostaje przycisk „Pobierz”
    }
  }
  return { copied, copy };
}

const BTN_GLOWNY = "inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink hover:brightness-105";
const BTN_RAMKA = "inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10";
const BTN_CICHY = "inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white";

function WzorCard({ wzor }: { wzor: Wzor }) {
  const [open, setOpen] = useState(false);
  const { copied, copy } = useKopiuj(wzor.tresc);
  const Icon = ICON[wzor.id] ?? FileSignature;
  const pola = polaWzoru(wzor.tresc);
  const pobierz = () => downloadText(fileName(`wzór ${wzor.title}`), wzor.tresc);

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

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <div className="mt-auto flex flex-wrap gap-2">
          <button type="button" onClick={pobierz} className={BTN_GLOWNY}>
            <Download className="size-4" aria-hidden="true" />Pobierz
          </button>
          <button type="button" onClick={copy} className={BTN_RAMKA}>
            {copied ? <Check className="size-4 text-brand" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            <span aria-live="polite">{copied ? "Skopiowane" : "Kopiuj"}</span>
          </button>
          {/* Dialog.Trigger sam ustawia aria-haspopup="dialog", aria-expanded i aria-controls */}
          <Dialog.Trigger className={BTN_CICHY}>
            <Eye className="size-4" aria-hidden="true" />Podgląd
          </Dialog.Trigger>
        </div>
        <PodgladWzoru wzor={wzor} Icon={Icon} copied={copied} onCopy={copy} onDownload={pobierz} />
      </Dialog.Root>
    </article>
  );
}

/** Okienko z pełną treścią wzoru. Na telefonie na cały ekran, na komputerze na środku. Esc, klik w tło i „Zamknij” zamykają. */
function PodgladWzoru({ wzor, Icon, copied, onCopy, onDownload }: { wzor: Wzor; Icon: LucideIcon; copied: boolean; onCopy: () => void; onDownload: () => void }) {
  const reduce = useReducedMotion();
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-[75] bg-[#020904]/75 backdrop-blur-md transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <Dialog.Viewport className="fixed inset-0 z-[76] grid place-items-center sm:p-4">
        <Dialog.Popup
          className={`relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#07130a] text-white outline-none sm:h-auto sm:max-h-[min(90dvh,60rem)] sm:max-w-3xl sm:rounded-3xl sm:bg-[#07130a]/95 ${reduce ? "" : "transition-[opacity,scale,translate] duration-250 ease-[cubic-bezier(.2,.8,.2,1)] data-ending-style:translate-y-3 data-ending-style:scale-[.98] data-starting-style:translate-y-6 data-starting-style:scale-[.97]"} data-ending-style:opacity-0 data-starting-style:opacity-0`}
          style={{ boxShadow: "0 0 0 1px rgba(114,196,28,.3), 0 40px 100px -30px rgba(0,0,0,.9), 0 0 80px -30px rgba(114,196,28,.4)" }}
        >
          <header className="flex items-start gap-3 border-b border-white/10 p-4 pr-16 sm:p-5 sm:pr-16">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand"><Icon className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Podgląd wzoru</p>
              <Dialog.Title className="text-lg font-bold leading-snug md:text-xl">{wzor.title}</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-sm text-white/65">{UWAGA_PRAWNA}</Dialog.Description>
            </div>
            <Dialog.Close aria-label="Zamknij podgląd" className="absolute right-3 top-3 grid size-11 place-items-center rounded-xl text-white/65 hover:bg-white/10 hover:text-white">
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
            <div className="flex flex-col gap-3">
              {wzor.uwagi?.length ? <Lista ikona={Scale} tytul="Sprawdź z prawnikiem" pozycje={wzor.uwagi} /> : null}
              {wzor.wdrozenie?.length ? <Lista ikona={ListChecks} tytul="Jak wprowadzić w studiu" pozycje={wzor.wdrozenie} /> : null}
              <pre className="whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/25 p-4 font-sans text-sm leading-relaxed text-white/85 sm:text-[15px]">
                <Podswietl tekst={wzor.tresc} />
              </pre>
            </div>
          </div>

          <footer className="flex flex-wrap items-center gap-2 border-t border-white/10 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:p-4">
            <button type="button" onClick={onDownload} className={BTN_GLOWNY}>
              <Download className="size-4" aria-hidden="true" />Pobierz
            </button>
            <button type="button" onClick={onCopy} className={BTN_RAMKA}>
              {copied ? <Check className="size-4 text-brand" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              <span aria-live="polite">{copied ? "Skopiowane" : "Kopiuj"}</span>
            </button>
            <Dialog.Close className={`${BTN_CICHY} ml-auto`}>Zamknij</Dialog.Close>
          </footer>
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
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
