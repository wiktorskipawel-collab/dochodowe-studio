"use client";

// Licznik XP w nagłówku: po nagrodzie „nabija” punkty (GSAP), gdy kulki XP doleciały (flyXp w src/lib/fx.ts).
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function XpCount({ value, live }: { value: number; live: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [first] = useState(value);
  const shown = useRef(value);
  const wasLive = useRef(live);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const from = shown.current;
      shown.current = value;
      // wczytanie konta albo wylogowanie: bez animacji
      if (!wasLive.current || !live || value < from) {
        wasLive.current = live;
        el.textContent = String(value);
        return;
      }
      const o = { v: from };
      gsap.to(o, { v: value, duration: 0.9, delay: 0.75, ease: "power2.out", onUpdate: () => { el.textContent = String(Math.round(o.v)); } });
    },
    { dependencies: [value, live] },
  );
  // tekst ustawia GSAP; React renderuje tylko wartość startową (nie zmienia się, więc nie gryzie się z GSAP)
  return <span ref={ref} className="tabular-nums">{first}</span>;
}
