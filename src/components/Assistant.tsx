"use client";

// Asystent na ekranie: postać Bartka Sikorskiego jako przewodnik (zawsze oznaczona jako AI — AI Act, art. 50).
// Zdjęcie: wgraj plik do /public i ustaw ASSISTANT_PHOTO, np. "/bartek.jpg". Do tego czasu inicjały.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, Sparkles } from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS } from "@/lib/journey";

export const ASSISTANT_PHOTO: string | null = null;
export const ASSISTANT_NAME = "Bartłomiej Sikorski";

export function AssistantAvatar({ size = 56, talking = false }: { size?: number; talking?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      {/* pulsująca aura w złocie DS */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(221,153,51,.45), transparent 70%)" }}
        animate={reduce ? undefined : { scale: talking ? [1, 1.25, 1] : [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: talking ? 1.2 : 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span
        className="relative grid size-full place-items-center overflow-hidden rounded-full font-bold text-white"
        style={{ background: "linear-gradient(145deg, #0a8f6b, #00543f)", boxShadow: "0 0 0 2px #dd9933, 0 8px 24px -8px rgba(0,0,0,.6)", fontSize: size * 0.34 }}
      >
        {ASSISTANT_PHOTO ? (
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

function messageFor(path: string): string | null {
  if (path === "/") return null; // na pulpicie asystent mówi w głównej karcie
  if (path.startsWith("/zespol")) return null;
  if (path.startsWith("/start")) return "Połącz swoje AI jednym kliknięciem. Zajmie to minutę, a potem poprowadzę Cię krok po kroku.";
  if (path.startsWith("/ankieta")) return "Odpowiadaj szczerze. Na tej podstawie dobiorę Twoją ścieżkę. Nie ma złych odpowiedzi.";
  if (path.startsWith("/sciezka")) return "Każdy zatwierdzony dokument to cegła w Twoim marketingu. Idziemy po kolei, bez skakania.";
  if (path.startsWith("/dokumenty")) return "Tu masz wszystko, co już zbudowałeś. Wracaj tu, kiedy potrzebujesz konkretów.";
  if (path.startsWith("/lekcje")) return "Lekcja pomaga zrozumieć, ale liczy się wdrożenie. Obejrzyj i od razu działaj.";
  const step = STEPS.find((s) => path === `/krok/${s.id}`);
  if (step) return `Pracujemy nad krokiem „${step.title}”. ${step.goal}`;
  return null;
}

/** Pływający asystent w prawym dolnym rogu, z podpowiedzią do bieżącego ekranu. */
export function AssistantDock() {
  const path = usePathname();
  const { ready } = useJourney();
  const msg = messageFor(path);
  const [closedFor, setClosedFor] = useState<string | null>(null);
  const visible = ready && !!msg && closedFor !== path;

  if (!ready || !msg) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] items-end gap-3 md:bottom-6 md:right-6">
      <AnimatePresence>
        {visible ? (
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="glass-strong pointer-events-auto relative w-80 max-w-full rounded-2xl rounded-br-md p-4 pr-10 text-sm leading-relaxed shadow-2xl"
            role="status"
          >
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-brand"><Sparkles className="size-3.5" aria-hidden="true" />{ASSISTANT_NAME} · asystent AI</p>
            <Typewriter text={msg} />
            <button type="button" onClick={() => setClosedFor(path)} aria-label="Zamknij podpowiedź" className="absolute right-1 top-1 grid size-11 place-items-center rounded-xl text-white/60 hover:text-white">
              <X className="size-4" aria-hidden="true" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <button type="button" onClick={() => setClosedFor(null)} aria-label={`Pokaż podpowiedź asystenta (${ASSISTANT_NAME}, AI)`} className="pointer-events-auto rounded-full">
        <AssistantAvatar size={60} talking={visible} />
      </button>
    </div>
  );
}
