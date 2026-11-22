"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { House, Route, FileText, PlayCircle, Users, PlugZap } from "lucide-react";
import { useJourney } from "@/lib/store";
import { progressPercent } from "@/lib/journey";

const NAV = [
  { href: "/", label: "Pulpit", icon: House },
  { href: "/sciezka", label: "Twoja ścieżka", icon: Route },
  { href: "/dokumenty", label: "Dokumenty", icon: FileText },
  { href: "/lekcje", label: "Lekcje", icon: PlayCircle },
  { href: "/start", label: "Połącz AI", icon: PlugZap },
  { href: "/zespol", label: "Panel zespołu DS", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { ready, state } = useJourney();
  const pct = ready ? progressPercent(state) : 0;

  return (
    <nav
      aria-label="Menu główne"
      className="glass-card flex shrink-0 items-center gap-2 overflow-x-auto rounded-2xl p-2 md:sticky md:top-5 md:h-[calc(100vh-2.5rem)] md:w-[76px] md:flex-col md:overflow-visible md:py-4"
    >
      <Link href="/" aria-label="Dochodowe Studio, pulpit" className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-sm font-extrabold text-accent-ink md:mb-4">
        DS
      </Link>
      <ul className="flex gap-1 md:flex-col">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/sciezka" && pathname.startsWith("/krok"));
          return (
            <li key={href} className="group relative">
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={`grid size-11 place-items-center rounded-xl transition-colors ${active ? "bg-white text-neutral-900" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </Link>
              </motion.div>
              <span className="pointer-events-none absolute left-14 top-1/2 z-20 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-neutral-900/90 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
                {label}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="ml-auto flex items-center gap-2 md:ml-0 md:mt-auto md:flex-col" title={`Postęp ścieżki: ${pct}%`}>
        <div className="relative grid size-11 place-items-center" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Postęp ścieżki">
          <svg viewBox="0 0 36 36" className="absolute inset-0 size-11 -rotate-90" aria-hidden="true">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 97.4} 97.4`} />
          </svg>
          <span className="text-[11px] font-semibold tabular-nums">{pct}%</span>
        </div>
      </div>
    </nav>
  );
}
