"use client";

// „Obejrzane” w lekcji dopiero po chwili z otwartym odtwarzaczem (Lessons.tsx i LessonGate w StepWorkspace.tsx).
// Liczymy wyłącznie czas, przez który odtwarzacz tej lekcji jest otwarty na ekranie. Nic poza tym nie śledzimy:
// bez API Loom/YouTube, bez wysyłania czegokolwiek na serwer. Próg: watchSeconds() w src/lib/gamification.ts.
import { useEffect, useState } from "react";

/** Ile sekund zostało do włączenia „Obejrzane” dla lekcji `key`. Licznik startuje, gdy lekcja się otworzy (i od nowa przy zmianie lekcji). */
export function useWatchCountdown(key: string, need: number, active = true) {
  const [tick, setTick] = useState<{ key: string; s: number }>({ key, s: 0 });
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    const t = window.setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      setTick((cur) => (cur.key === key && cur.s === s ? cur : { key, s }));
      if (s >= need) window.clearInterval(t);
    }, 250);
    return () => window.clearInterval(t);
  }, [key, need, active]);
  return Math.max(0, need - (tick.key === key ? tick.s : 0));
}

/** 0:24 */
export const countdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
