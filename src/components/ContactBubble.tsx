"use client";

// „Chmurka” z kontaktem do Pawła Wiktorskiego (prośba Pawła 2026-11-27): VSL, landing page, automatyzacje.
// - duża: strona „Ustawienia konta” (zawsze widoczna),
// - mała: menu boczne nad kontem; „×” chowa ją na 7 dni (localStorage), w zwiniętym menu jej nie ma.
import { useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { MailIcon, WandSparklesIcon, XIcon } from "lucide-react";

const EMAIL = "kontakt@pawelwiktorski.pl";
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent("Pomoc: VSL / landing page / automatyzacje")}`;
const QUESTION = "Masz problem z VSL, landing page’em czy automatyzacjami?";

// Ukrycie małej chmurki: do kiedy (ms). Zdarzenie w oknie odświeża widok bez przeładowania.
const HIDE_KEY = "mos:kontakt-ukryte-do";
const HIDE_EVENT = "mos:kontakt-ukryte";
const HIDE_DAYS = 7;

function hiddenNow() {
  try {
    return Number(localStorage.getItem(HIDE_KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(HIDE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(HIDE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function hideForAWeek() {
  try {
    localStorage.setItem(HIDE_KEY, String(Date.now() + HIDE_DAYS * 24 * 60 * 60 * 1000));
  } catch {
    // bez localStorage chmurka po prostu wróci po odświeżeniu
  }
  window.dispatchEvent(new Event(HIDE_EVENT));
  toast("Ukryte na 7 dni", { description: "Kontakt znajdziesz zawsze w „Ustawieniach konta”." });
}

/** Awatar z inicjałami (bez zdjęcia). */
function Avatar({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-[linear-gradient(140deg,var(--brand),var(--green-strong))] font-extrabold text-brand-ink ring-2 ring-white/15 shadow-[0_10px_24px_-10px_rgba(114,196,28,.7)] ${small ? "size-7 text-[10px]" : "size-12 text-sm"}`}
    >
      PW
    </span>
  );
}

/** Duża chmurka na stronę ustawień. */
export function ContactBubble() {
  const reduce = useReducedMotion();
  return (
    <div className="flex items-end gap-3">
      <Avatar />
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.92, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 24, delay: 0.15 }}
        style={{ transformOrigin: "0% 100%" }}
        className="relative min-w-0 flex-1 rounded-3xl rounded-bl-md border border-brand/35 bg-[#0f2413] p-4 shadow-[0_24px_50px_-28px_rgba(114,196,28,.55)] md:p-5"
      >
        {/* ogonek dymka w stronę awatara */}
        <span aria-hidden="true" className="absolute -left-[7px] bottom-4 size-3.5 rotate-45 border-b border-l border-brand/35 bg-[#0f2413]" />
        {/* delikatna poświata w rogu */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(22rem_10rem_at_100%_0%,rgba(114,196,28,.16),transparent_70%)]" />
        <p className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand">
          <motion.span
            className="inline-grid"
            animate={reduce ? undefined : { rotate: [0, -14, 10, -6, 0] }}
            transition={{ duration: 1.1, delay: 0.6, repeat: Infinity, repeatDelay: 6 }}
          >
            <WandSparklesIcon className="size-4" aria-hidden="true" />
          </motion.span>
          Paweł Wiktorski
        </p>
        <p className="relative mt-2 text-base font-semibold leading-snug text-white">{QUESTION}</p>
        <p className="relative mt-1 text-sm text-white/75">Zgłoś się do mnie:</p>
        <a
          href={MAILTO}
          className="relative mt-3 inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink shadow-[0_12px_30px_-12px_rgba(114,196,28,.6)] hover:brightness-110"
        >
          <MailIcon className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{EMAIL}</span>
        </a>
      </motion.div>
    </div>
  );
}

/** Mała chmurka w menu bocznym (nad kontem). Ukryta w zwiniętym menu i przez 7 dni po zamknięciu. */
export function ContactBubbleMini() {
  const hidden = useSyncExternalStore(subscribe, hiddenNow, () => true); // na serwerze ukryta: pojawia się po wczytaniu
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {hidden ? null : (
        <motion.aside
          key="kontakt"
          aria-label="Kontakt: Paweł Wiktorski"
          initial={reduce ? false : { opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1, height: "auto" }}
          exit={reduce ? { opacity: 0, transition: { duration: 0.01 } } : { opacity: 0, scale: 0.94, height: 0, transition: { duration: 0.22, ease: "easeIn" } }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          style={{ transformOrigin: "85% 100%" }}
          className="overflow-visible px-1 pb-1 group-data-[collapsible=icon]:hidden"
        >
          <div className="relative rounded-2xl rounded-br-md border border-brand/35 bg-[#0f2413] px-3 py-2.5 text-xs shadow-[0_16px_34px_-22px_rgba(114,196,28,.6)]">
            <span aria-hidden="true" className="absolute -bottom-[7px] right-6 size-3.5 rotate-45 border-b border-r border-brand/35 bg-[#0f2413]" />
            <div className="flex items-center gap-1.5">
              <WandSparklesIcon className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
              <p className="flex-1 font-bold text-brand">Paweł Wiktorski</p>
              {/* pole kliknięcia 44 px, ale bez powiększania dymka (ujemne marginesy) */}
              <button
                type="button"
                onClick={hideForAWeek}
                aria-label="Ukryj kontakt na 7 dni"
                title="Ukryj na 7 dni"
                className="-my-3 -mr-2.5 grid size-11 shrink-0 place-items-center rounded-xl text-white/55 hover:text-white"
              >
                <XIcon className="size-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-1 leading-snug text-white/85">{QUESTION} Zgłoś się do mnie:</p>
            <a href={MAILTO} className="-mb-1.5 inline-flex min-h-11 max-w-full items-center gap-1.5 font-semibold text-brand underline-offset-4 hover:underline">
              <MailIcon className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{EMAIL}</span>
            </a>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
