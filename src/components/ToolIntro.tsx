"use client";

// „Jak to działa”: okienko przy pierwszym otwarciu narzędzia (i czatu kroku) + zwijany panel obok rozmowy.
// Co ktoś już widział, pamięta state.toolIntro (klucz "tool:<id>" albo "krok"), bez XP.
// MotionDialog: wspólna skorupa okienek (Base UI Dialog + animacje Motion), także dla wklejania transkrypcji i palety Ctrl+K.
// Działa też wewnątrz panelu bocznego (Sheet): Base UI traktuje je wtedy jako okno zagnieżdżone.
import { useId, useRef, useState, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronDown, ClipboardPaste, Lightbulb, ShieldCheck, Sparkles, X, type LucideIcon } from "lucide-react";
import { useJourney } from "@/lib/store";
import { MEDIA_PRIVACY, type ToolIntro } from "@/lib/tools-public";

// ---------- Skorupa okienka ----------

export function MotionDialog({ open, onClose, children, className = "", top = false, initialFocus, label }: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  top?: boolean; // przy górnej krawędzi (paleta), zamiast na środku
  initialFocus?: Dialog.Popup.Props["initialFocus"];
  label?: string; // aria-label, gdy okienko nie ma <Dialog.Title>
}) {
  const reduce = useReducedMotion();
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal keepMounted>
            <Dialog.Viewport
              render={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />}
              className={`fixed inset-0 z-[75] grid justify-items-center overflow-y-auto bg-[#020904]/75 p-4 backdrop-blur-md ${top ? "items-start pt-[8vh]" : "items-center"}`}
            >
              <Dialog.Popup
                initialFocus={initialFocus}
                aria-label={label}
                render={
                  <motion.div
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: top ? -16 : 36, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: top ? -10 : 20, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 280, damping: 26 }}
                  />
                }
                className={`glass-strong relative w-full overflow-hidden rounded-3xl bg-[#07130a]/95 text-white outline-none ${className}`}
                style={{ boxShadow: "0 0 0 1px rgba(114,196,28,.3), 0 40px 100px -30px rgba(0,0,0,.9), 0 0 80px -30px rgba(114,196,28,.4)" }}
              >
                {children}
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

export function DialogCloseButton({ label = "Zamknij" }: { label?: string }) {
  return (
    <Dialog.Close aria-label={label} className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white">
      <X className="size-4" aria-hidden="true" />
    </Dialog.Close>
  );
}

// ---------- Pierwsze otwarcie ----------

/** Czy pokazać okienko „Jak to działa” (pierwsze otwarcie) i jak je zamknąć na stałe. */
export function useIntro(key: string, enabled = true) {
  const { ready, state, setToolIntro } = useJourney();
  return { open: ready && enabled && !state.toolIntro?.[key], close: () => setToolIntro(key) };
}

const POINTS: { key: keyof ToolIntro; label: string; icon: LucideIcon }[] = [
  { key: "wklej", label: "Co wkleić albo nagrać", icon: ClipboardPaste },
  { key: "dostaniesz", label: "Co dostaniesz", icon: Sparkles },
  { key: "przyklad", label: "Przykład", icon: Lightbulb },
  { key: "prywatnosc", label: "Prywatność", icon: ShieldCheck },
];

export function IntroDialog({ open, onClose, eyebrow, title, intro, icon: Icon }: {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  intro: ToolIntro;
  icon: LucideIcon;
}) {
  const reduce = useReducedMotion();
  const start = useRef<HTMLButtonElement>(null);
  return (
    <MotionDialog
      open={open}
      onClose={onClose}
      // Na komputerze fokus od razu na „Zaczynam”; na telefonie na górze okienka (inaczej przewinęłoby się do przycisku).
      initialFocus={() => (window.matchMedia("(min-width: 640px)").matches ? start.current : true)}
      className="max-w-2xl p-5 md:p-7"
    >
      <DialogCloseButton />
      <div className="flex items-center gap-3 pr-10">
        <motion.span
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand ring-1 ring-brand/30"
          initial={reduce ? false : { scale: 0.4, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.1 }}
        >
          <Icon className="size-6" aria-hidden="true" />
        </motion.span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
          <Dialog.Title className="text-xl font-extrabold leading-tight md:text-2xl">{title}</Dialog.Title>
        </div>
      </div>
      <Dialog.Description className="sr-only">Krótko, jak działa to narzędzie: co wkleić, co dostaniesz, przykład i prywatność.</Dialog.Description>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2">
        {POINTS.map((p, i) => (
          <motion.li
            key={p.key}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 + i * 0.08, type: "spring", stiffness: 260, damping: 24 }}
            className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-brand">
              <p.icon className="size-4" aria-hidden="true" />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{p.label}</span>
              <span className="text-sm leading-relaxed text-white/75">{intro[p.key]}</span>
            </span>
          </motion.li>
        ))}
      </ol>
      <p className="mt-4 flex gap-2 text-xs text-white/60">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden="true" />
        {MEDIA_PRIVACY}
      </p>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/55">To okienko pokazuje się raz. Później znajdziesz je w panelu „Jak to działa”.</p>
        <Dialog.Close ref={start} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 font-bold text-brand-ink shadow-[0_12px_30px_-12px_rgba(114,196,28,.6)] hover:brightness-110">
          Zaczynam<ArrowRight className="size-4" aria-hidden="true" />
        </Dialog.Close>
      </div>
    </MotionDialog>
  );
}

// ---------- Panel obok rozmowy ----------

/** Zwijany panel „Jak to działa” (te same 4 punkty co okienko + jedno zdanie o metodzie). */
export function HowItWorks({ intro, hint, defaultOpen = true, className = "" }: { intro: ToolIntro; hint?: string; defaultOpen?: boolean; className?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  const id = useId();
  return (
    <section className={`glass-card rounded-2xl ${className}`} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="m-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`${id}-body`}
          className="flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl px-5 py-3 text-left font-semibold hover:bg-white/[0.04]"
        >
          <span className="flex items-center gap-2"><Lightbulb className="size-5 text-brand" aria-hidden="true" />Jak to działa</span>
          <ChevronDown className={`size-4 text-white/60 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </h2>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={`${id}-body`}
            key="body"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 px-5 pb-5 text-sm">
              {hint ? <p className="text-white/80">{hint}</p> : null}
              <ul className="flex flex-col gap-2.5">
                {POINTS.map((p) => (
                  <li key={p.key} className="flex gap-2.5">
                    <p.icon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                    <span><span className="font-semibold text-white">{p.label}: </span><span className="text-white/75">{intro[p.key]}</span></span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-white/55">{MEDIA_PRIVACY}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
