"use client";

// Dźwięki nagród (src/lib/sfx.ts): jeden stan dla menu konta (app-sidebar) i strony /ustawienia.
// Zmiana w jednym miejscu od razu widać w drugim (zdarzenie w oknie + „storage” z innych kart).
import { useCallback, useSyncExternalStore } from "react";
import { play, setSoundOn, soundOn } from "@/lib/sfx";

const EVENT = "ds:dzwieki-zmiana";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** [włączone?, przełącz]. Na serwerze zawsze „włączone” (tak jak domyślnie w sfx.ts). */
export function useSoundSetting(): [boolean, () => void] {
  const on = useSyncExternalStore(subscribe, soundOn, () => true);
  const toggle = useCallback(() => {
    const next = !soundOn();
    setSoundOn(next);
    window.dispatchEvent(new Event(EVENT));
    if (next) play("xp");
  }, []);
  return [on, toggle];
}
