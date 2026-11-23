"use client";

// Nagroda za postęp: konfetti w barwach DS + karta z punktami i ewentualnym awansem.
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Trophy, Zap } from "lucide-react";
import { useJourney } from "@/lib/store";
import { AssistantAvatar } from "@/components/Assistant";

const COLORS = ["#dd9933", "#f2c472", "#16a37b", "#007f5f", "#ffffff"];

export function Celebration() {
  const { reward, clearReward } = useJourney();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!reward) return;
    if (!reduce && reward.big) {
      const burst = (x: number) => confetti({ particleCount: 70, spread: 75, startVelocity: 42, origin: { x, y: 0.75 }, colors: COLORS, disableForReducedMotion: true });
      burst(0.25);
      burst(0.75);
      if (reward.levelUp) setTimeout(() => confetti({ particleCount: 140, spread: 120, origin: { y: 0.55 }, colors: COLORS, disableForReducedMotion: true }), 350);
    }
    const t = setTimeout(clearReward, reward.levelUp ? 5200 : 3200);
    return () => clearTimeout(t);
  }, [reward, reduce, clearReward]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {reward ? (
          <motion.div
            key={`${reward.title}-${reward.levelUp ?? ""}`}
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="glass-strong pointer-events-auto flex items-center gap-4 rounded-2xl px-5 py-4 shadow-2xl"
            style={{ boxShadow: "0 0 0 1px rgba(221,153,51,.5), 0 20px 50px -20px rgba(221,153,51,.5)" }}
          >
            {reward.levelUp ? <AssistantAvatar size={48} talking /> : <span className="grid size-12 place-items-center rounded-xl bg-brand text-brand-ink"><Zap className="size-6" aria-hidden="true" /></span>}
            <div>
              <p className="font-bold">{reward.title}</p>
              <p className="text-sm text-white/80">
                <motion.span initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="inline-block font-extrabold text-brand">+{reward.xp} XP</motion.span>
                {reward.levelUp ? <span className="ml-2 inline-flex items-center gap-1"><Trophy className="size-4 text-brand" aria-hidden="true" />Nowy poziom: <strong className="text-white">{reward.levelUp}</strong></span> : null}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
