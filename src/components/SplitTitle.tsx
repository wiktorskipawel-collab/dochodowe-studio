"use client";

// Tytuł strony wjeżdża słowo po słowie (GSAP SplitText z maską), przy każdym wejściu na stronę.
import { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, useGSAP);

export function SplitTitle({ text, className, as: Tag = "h1" }: { text: string; className?: string; as?: "h1" | "h2" }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(
    () => {
      if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const split = SplitText.create(ref.current, { type: "words", mask: "words" });
      gsap.from(split.words, { yPercent: 110, opacity: 0, rotate: 4, duration: 0.8, stagger: 0.05, ease: "expo.out", delay: 0.1 });
    },
    { scope: ref, dependencies: [text], revertOnUpdate: true },
  );
  // key: nowy tekst = nowy element, więc React nie dotyka tekstu pociętego przez SplitText
  return <Tag key={text} ref={ref} className={className}>{text}</Tag>;
}
