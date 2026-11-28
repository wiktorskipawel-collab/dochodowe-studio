"use client";

// Asystent na ekranie: postać Bartka Sikorskiego jako przewodnik (zawsze oznaczona jako AI — AI Act, art. 50).
// Zdjęcie: wgraj plik do /public i ustaw ASSISTANT_PHOTO, np. "/bartek.jpg". Do tego czasu inicjały.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, Sparkles, type LucideIcon } from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS } from "@/lib/journey";
import { dayKey } from "@/lib/gamification";

export const ASSISTANT_PHOTO: string | null = "/bartek.png"; // TESTOWO — zdjęcie od Pawła; przed startem: zgoda Bartka i lepsze zdjęcie portretowe
export const ASSISTANT_NAME = "Bartłomiej Sikorski";

/** icon (opcjonalnie): ikona narzędzia zamiast zdjęcia Bartka — szybkie akcje w /narzedzia. Plakietka „AI” zostaje zawsze. */
export function AssistantAvatar({ size = 56, talking = false, icon: Icon }: { size?: number; talking?: boolean; icon?: LucideIcon }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      {/* pulsująca aura w złocie DS */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(114,196,28,.4), transparent 70%)" }}
        animate={reduce ? undefined : { scale: talking ? [1, 1.25, 1] : [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: talking ? 1.2 : 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span
        className="relative grid size-full place-items-center overflow-hidden rounded-full font-bold text-white"
        style={{ background: "linear-gradient(145deg, #3c9e22, #14561a)", boxShadow: "0 0 0 2px #72c41c, 0 8px 24px -8px rgba(0,0,0,.6)", fontSize: size * 0.34 }}
      >
        {Icon ? (
          <Icon aria-hidden="true" style={{ width: size * 0.48, height: size * 0.48 }} />
        ) : ASSISTANT_PHOTO ? (
          // eslint-disable-next-line @next/next/no-img-element -- zwykłe zdjęcie z /public
          <img src={ASSISTANT_PHOTO} alt="" className="size-full object-cover" />
        ) : (
          "BS"
        )}
      </span>
      <span className="absolute -bottom-0.5 -right-0.5 rounded-md bg-brand px-1 text-[10px] font-extrabold leading-4 text-brand-ink" aria-hidden="true">AI</span>
    </span>
  );
}

/** Tekst pisany na żywo (szanuje „ogranicz ruch”). */
export function Typewriter({ text, speed = 18 }: { text: string; speed?: number }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduce) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restart animacji przy nowym tekście
    setN(0);
    const id = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 1)), speed);
    return () => clearInterval(id);
  }, [text, speed, reduce]);
  const shown = reduce ? text : text.slice(0, n);
  return (
    <span>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

export const GREETING = `Cześć! Tu ${ASSISTANT_NAME}, a dokładniej mój asystent AI. Jestem tu, żeby przybliżyć Cię do Twojego celu.`;

// Krótka podpowiedź do ekranu. Bez powtarzania celu kroku (jest w nagłówku), za to z tym, co daje kliknięcie w awatar.
function messageFor(path: string): string | null {
  if (path === "/") return null; // na pulpicie asystent mówi w głównej karcie
  if (path.startsWith("/sciezka")) return "Każdy zatwierdzony dokument to cegła w Twoim studiu. Idziemy po kolei, bez skakania.";
  if (path.startsWith("/dokumenty")) return "Tu masz wszystko, co już powstało na ścieżce. Wracaj tu, kiedy potrzebujesz konkretów.";
  if (path.startsWith("/lekcje")) return "Lekcja pomaga zrozumieć, ale liczy się wdrożenie. Obejrzyj i od razu działaj.";
  if (STEPS.some((s) => path === `/krok/${s.id}`)) return "Coś blokuje w tym kroku? Kliknij moje zdjęcie, podpowiem, co dalej.";
  return null;
}

// --- Dok: zasady, żeby nigdy nie leżał na treści (audyt UX 2026-11-27, K1) ---
// • Telefon i tablet (bez myszy): sam awatar, podpowiedź po stuknięciu (scena na środku).
// • Komputer: podpowiedź tekstowa raz dziennie na danej stronie, przez kilka sekund; znika przy przewijaniu,
//   przy pisaniu w polu tekstowym i gdy pod nią pojawi się coś klikalnego. „×” wyłącza podpowiedzi do końca dnia.
// • Awatar chowa się, gdy pod nim leży przycisk, link albo pole (nie przechwytuje kliknięć) i gdy ktoś pisze
//   (klawiatura telefonu). Treść stron ma dolny odstęp (layout: pb-28), więc ostatni element zawsze da się wysunąć ponad awatar.
const HINT_KEY = "mos:asystent-podpowiedz";
const HINT_MS = 7000;
const HINT_DELAY = 1400;
const HINT_W = 288; // w-72
const HINT_H = 132; // z zapasem: nagłówek + 3 linijki tekstu
const INTERACTIVE =
  "a[href],button,input,textarea,select,summary,label,iframe,video,[role=button],[role=link],[role=tab],[role=checkbox],[role=switch],[role=slider],[contenteditable=''],[contenteditable=true],[tabindex]:not([tabindex='-1'])";
const FIELD = "input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]),textarea,select,[contenteditable=''],[contenteditable=true]";

type HintMemo = { day: string; closed: boolean; seen: string[] };

function readMemo(): HintMemo {
  const day = dayKey(new Date());
  try {
    const m = JSON.parse(localStorage.getItem(HINT_KEY) ?? "null") as Partial<HintMemo> | null;
    if (m?.day === day) return { day, closed: !!m.closed, seen: Array.isArray(m.seen) ? m.seen : [] };
  } catch {
    // brak localStorage: podpowiedź po prostu pokaże się jeszcze raz
  }
  return { day, closed: false, seen: [] };
}

function writeMemo(m: HintMemo) {
  try {
    localStorage.setItem(HINT_KEY, JSON.stringify(m));
  } catch {
    // jw.
  }
}

const mediaStore = (query: string) => ({
  subscribe: (cb: () => void) => {
    const m = window.matchMedia(query);
    m.addEventListener("change", cb);
    return () => m.removeEventListener("change", cb);
  },
  get: () => window.matchMedia(query).matches,
});
const DESKTOP = mediaStore("(min-width: 768px) and (hover: hover) and (pointer: fine)");
const MD = mediaStore("(min-width: 768px)");
const serverFalse = () => false;

/** Czy w prostokącie (poza samym dokiem) leży coś klikalnego. Próbki co ~24 px, więc nie przegapi przycisku. */
function hitsInteractive(r: { left: number; top: number; right: number; bottom: number }, dock: Element | null) {
  const w = r.right - r.left;
  const h = r.bottom - r.top;
  if (w <= 0 || h <= 0) return false;
  const cols = Math.max(2, Math.ceil(w / 24));
  const rows = Math.max(2, Math.ceil(h / 24));
  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) {
      const x = Math.min(window.innerWidth - 1, Math.max(0, r.left + 3 + ((w - 6) * i) / cols));
      const y = Math.min(window.innerHeight - 1, Math.max(0, r.top + 3 + ((h - 6) * j) / rows));
      const under = document.elementsFromPoint(x, y).find((n) => !dock?.contains(n));
      if (under?.closest(INTERACTIVE)) return true;
    }
  }
  return false;
}

/** Awatar to koło: próbkujemy jego wnętrze (bez rogów kwadratu). */
function avatarBlocked(btn: HTMLElement, dock: Element | null) {
  const r = btn.getBoundingClientRect();
  const k = r.width * 0.15;
  return hitsInteractive({ left: r.left + k, top: r.top + k, right: r.right - k, bottom: r.bottom - k }, dock);
}

const modalOpen = () => !!document.querySelector('[aria-modal="true"], [data-slot="sheet-content"], [data-slot="dialog-content"]');
const typingNow = () => !!document.activeElement?.matches?.(FIELD);

/**
 * Pływający asystent w prawym dolnym rogu. Kliknięcie postaci przywołuje Bartka na środek (onSummon).
 * Gdy scena jest otwarta, dok się chowa, a wspólny layoutId sprawia, że postać przelatuje między rogiem a środkiem.
 */
export function AssistantDock({ hidden = false, onSummon }: { hidden?: boolean; onSummon?: () => void }) {
  const path = usePathname();
  const { ready } = useJourney();
  const desktop = useSyncExternalStore(DESKTOP.subscribe, DESKTOP.get, serverFalse);
  const md = useSyncExternalStore(MD.subscribe, MD.get, serverFalse);
  const msg = messageFor(path);
  const dockRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const [hintFor, setHintFor] = useState<string | null>(null); // ścieżka, na której teraz wisi podpowiedź
  const [blocked, setBlocked] = useState(false);
  const [typing, setTyping] = useState(false);
  const showHint = ready && !hidden && desktop && !!msg && hintFor === path;

  // Pisanie w polu tekstowym: chowamy dok (na telefonie klawiatura i tak zabiera dół ekranu).
  useEffect(() => {
    const sync = () => setTimeout(() => setTyping(typingNow()), 0);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", sync);
    return () => {
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", sync);
    };
  }, []);

  // Awatar nie może leżeć na przycisku ani polu: sprawdzamy po przewinięciu, zmianie rozmiaru i co chwilę (treść się doładowuje).
  useEffect(() => {
    if (!ready || hidden) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      const btn = avatarRef.current;
      if (btn) setBlocked(avatarBlocked(btn, dockRef.current));
    };
    const later = () => {
      clearTimeout(t);
      t = setTimeout(check, 140);
    };
    const first = setTimeout(check, 300);
    const id = setInterval(check, 900);
    window.addEventListener("scroll", later, { capture: true, passive: true });
    window.addEventListener("resize", later);
    return () => {
      clearTimeout(t);
      clearTimeout(first);
      clearInterval(id);
      window.removeEventListener("scroll", later, { capture: true });
      window.removeEventListener("resize", later);
    };
  }, [ready, hidden, path]);

  // Podpowiedź na komputerze: raz dziennie na stronę, tylko gdy pod jej miejscem nie ma nic klikalnego.
  useEffect(() => {
    if (!ready || hidden || !desktop || !msg) return;
    const memo = readMemo();
    if (memo.closed || memo.seen.includes(path)) return;
    let tries = 0;
    let t = setTimeout(function attempt() {
      const btn = avatarRef.current;
      const a = btn?.getBoundingClientRect();
      const free =
        !!a && !modalOpen() && !typingNow() &&
        !hitsInteractive({ left: a.left - 12 - HINT_W, top: a.bottom - HINT_H, right: a.left - 12, bottom: a.bottom }, dockRef.current);
      if (free) {
        writeMemo({ ...memo, seen: [...memo.seen, path] });
        setHintFor(path);
      } else if (++tries < 5) t = setTimeout(attempt, 1200);
    }, HINT_DELAY);
    // Ktoś już przewija albo pisze: nie wyskakujemy z podpowiedzią w trakcie (tylko działania użytkownika,
    // nie przewijanie programowe — np. Next.js przewija na górę po zmianie strony).
    const cancel = () => clearTimeout(t);
    window.addEventListener("wheel", cancel, { passive: true, once: true });
    window.addEventListener("keydown", cancel, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("keydown", cancel);
    };
  }, [ready, hidden, desktop, msg, path]);

  // Widoczna podpowiedź znika sama po kilku sekundach, przy przewijaniu, pisaniu i gdy coś klikalnego wjedzie pod nią.
  useEffect(() => {
    if (!showHint) return;
    const off = () => setHintFor(null);
    const t = setTimeout(off, HINT_MS);
    const id = setInterval(() => {
      const r = hintRef.current?.getBoundingClientRect();
      if (r && hitsInteractive(r, dockRef.current)) off();
    }, 400);
    window.addEventListener("scroll", off, { passive: true, once: true }); // przewijanie strony
    window.addEventListener("wheel", off, { passive: true, once: true }); // kółko myszy także nad przewijanym panelem
    return () => {
      clearTimeout(t);
      clearInterval(id);
      window.removeEventListener("scroll", off);
      window.removeEventListener("wheel", off);
    };
  }, [showHint]);

  if (!ready) return null;

  const closeForToday = () => {
    writeMemo({ ...readMemo(), closed: true });
    setHintFor(null);
  };
  const hint = showHint && !typing ? msg : null;
  const avatarOff = blocked || typing;

  return (
    <div
      ref={dockRef}
      data-assistant-dock=""
      className="pointer-events-none fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-40 flex max-w-[calc(100vw-1.5rem)] items-end gap-3 md:bottom-6 md:right-6"
    >
      <AnimatePresence>
        {hint ? (
          <motion.div
            ref={hintRef}
            key={path}
            data-assistant-hint=""
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="pointer-events-auto relative w-72 max-w-full rounded-2xl rounded-br-md border border-brand/30 bg-[#07130a] p-4 pr-11 text-sm leading-relaxed text-white/90 shadow-[0_24px_60px_-20px_rgba(0,0,0,.9)]"
            role="status"
          >
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-brand"><Sparkles className="size-3.5" aria-hidden="true" />{ASSISTANT_NAME} · asystent AI</p>
            <Typewriter text={hint} />
            <button
              type="button"
              onClick={closeForToday}
              aria-label="Zamknij podpowiedzi do jutra"
              title="Nie pokazuj podpowiedzi do jutra"
              className="absolute right-1 top-1 grid size-11 place-items-center rounded-xl text-white/60 hover:text-white"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {!hidden ? (
        <span
          className={`transition-[opacity,scale] duration-200 ${avatarOff ? "pointer-events-none scale-75 opacity-0" : "pointer-events-auto"}`}
          aria-hidden={avatarOff || undefined}
        >
          <motion.button
            ref={avatarRef}
            layoutId="bartek-avatar"
            type="button"
            onClick={onSummon}
            tabIndex={avatarOff ? -1 : undefined}
            aria-label={`Przywołaj asystenta (${ASSISTANT_NAME}, AI)`}
            title={`${ASSISTANT_NAME} · asystent AI`}
            className="grid rounded-full"
            whileHover={{ scale: 1.08, y: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 210, damping: 24 }}
          >
            <AssistantAvatar size={md ? 56 : 48} talking={!!hint} />
          </motion.button>
        </span>
      ) : null}
    </div>
  );
}
