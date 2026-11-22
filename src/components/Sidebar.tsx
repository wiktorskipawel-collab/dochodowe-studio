"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home, Route, MessageSquare, PlayCircle, Users, Settings } from "lucide-react";

const NAV = [
  { href: "/", label: "Pulpit", icon: Home },
  { href: "/sciezka", label: "Ścieżka", icon: Route },
  { href: "/rozmowa", label: "Rozmowa z Marketing OS", icon: MessageSquare },
  { href: "/lekcje", label: "Lekcje i mentoringi", icon: PlayCircle },
  { href: "/zespol", label: "Panel zespołu DS", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Menu główne"
      className="glass-card flex shrink-0 items-center gap-2 overflow-x-auto rounded-2xl p-2 md:sticky md:top-5 md:h-[calc(100vh-2.5rem)] md:w-[76px] md:flex-col md:overflow-visible md:py-4"
    >
      <Link
        href="/"
        aria-label="Marketing OS, strona główna"
        className="mb-0 grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-sm font-extrabold text-accent-ink md:mb-4"
      >
        DS
      </Link>
      <ul className="flex gap-1 md:flex-col">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="group relative">
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={`grid size-11 place-items-center rounded-xl transition-colors ${
                    active ? "bg-white text-neutral-900" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
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
      <div className="ml-auto md:ml-0 md:mt-auto">
        <span
          className="grid size-11 place-items-center rounded-xl text-white/70"
          title="Ustawienia (wkrótce)"
          aria-label="Ustawienia (wkrótce)"
          role="img"
        >
          <Settings className="size-5" aria-hidden="true" />
        </span>
      </div>
    </nav>
  );
}
