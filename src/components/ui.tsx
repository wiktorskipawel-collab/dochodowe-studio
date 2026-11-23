"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Users, Coins, ShoppingBag, Target, type LucideIcon } from "lucide-react";

// Ikony wybierane po nazwie, bo komponent serwerowy nie może przekazać funkcji do klienta.
const ICONS = { users: Users, coins: Coins, bag: ShoppingBag, target: Target } satisfies Record<string, LucideIcon>;
export type IconName = keyof typeof ICONS;

export function GlassCard({ children, className = "", lift = false }: { children: ReactNode; className?: string; lift?: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={lift ? { y: -5 } : undefined}
      className={`glass-card rounded-2xl p-5 md:p-6 ${className}`}
    >
      {children}
    </motion.section>
  );
}

export function StatsCard({ title, value, note, icon, tone = "neutral" }: {
  title: string;
  value: string;
  note: string;
  icon: IconName;
  tone?: "neutral" | "good" | "warn";
}) {
  const Icon = ICONS[icon];
  const noteColor = tone === "good" ? "text-good" : tone === "warn" ? "text-warn" : "text-white/70";
  return (
    <motion.div whileHover={{ y: -5 }} className="glass-card flex flex-col gap-3 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-white/10">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <div>
        <p className="text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
        <p className="text-sm text-white/70">{title}</p>
      </div>
      <p className={`text-sm font-medium ${noteColor}`}>{note}</p>
    </motion.div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "accent" }) {
  const map = {
    neutral: "bg-white/10 text-white/85",
    good: "bg-emerald-400/15 text-emerald-300",
    warn: "bg-amber-400/15 text-amber-300",
    bad: "bg-red-400/15 text-red-300",
    accent: "bg-brand text-brand-ink",
  } as const;
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-1.5 pb-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      {children ? <div className="max-w-3xl text-white/75">{children}</div> : null}
    </header>
  );
}

export function AiNote() {
  return (
    <p className="text-xs text-white/65">
      Odpowiedzi tworzy sztuczna inteligencja (OpenAI) na podstawie metodyki Dochodowego Studia. Ważne decyzje zawsze zatwierdzasz Ty.
    </p>
  );
}
