"use client";

import Link from "next/link";
import { UserPlus, Clapperboard, Film, MousePointerClick, ArrowRight, type LucideIcon } from "lucide-react";
import { useJourney } from "@/lib/store";
import { Pill } from "@/components/ui";

// Szybkie akcje z rozmowy z Bartkiem (2026-11-27). Każda to osobna rozmowa z asystentem na gotowym prompcie Bartka.
// DO ZATWIERDZENIA: prompty, kolejność i to, które akcje są dostępne od początku, a które po kamieniu milowym.
type Tool = { id: string; title: string; desc: string; uses: string[]; icon: LucideIcon; now?: { label: string; href: string } };

const TOOLS: Tool[] = [
  {
    id: "nowy-awatar", title: "Nowy awatar", icon: UserPlus,
    desc: "Drugi typ klienta, np. osoby po ciąży albo seniorzy. Bartek przeprowadzi Cię przez te same pytania co w kroku 4.",
    uses: ["dna", "awatar"], now: { label: "Na razie: krok 4, Awatar klienta", href: "/krok/awatar" },
  },
  {
    id: "vsl", title: "Scenariusz VSL", icon: Clapperboard,
    desc: "Scenariusz krótkiego filmu sprzedażowego pod Twoją ofertę: hak, problem, rozwiązanie, dowód, wezwanie do działania.",
    uses: ["awatar", "oferta"],
  },
  {
    id: "rolki", title: "Nowe rolki", icon: Film,
    desc: "Pomysły i scenariusze rolek na najbliższe tygodnie, w języku Twojego klienta.",
    uses: ["dna", "awatar"],
  },
  {
    id: "ctr", title: "Analiza CTR reklam", icon: MousePointerClick,
    desc: "Wklejasz wyniki z Menedżera reklam (plik CSV albo zrzut ekranu). Bartek mówi, które reklamy zostawić, które wyłączyć i co poprawić.",
    uses: ["strategia"],
  },
];

const DOC_NAME: Record<string, string> = { dna: "DNA studia", awatar: "awatar", oferta: "oferta", strategia: "strategia" };

export function Tools() {
  const { state } = useJourney();
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {TOOLS.map((t) => {
        const missing = t.uses.filter((d) => state.docs[d]?.status !== "approved");
        return (
          <li key={t.id} id={t.id} className="glass-card flex scroll-mt-24 flex-col gap-3 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><t.icon className="size-5 text-brand" aria-hidden="true" />{t.title}</h2>
              <Pill>Wkrótce</Pill>
            </div>
            <p className="text-sm text-white/80">{t.desc}</p>
            <p className="text-xs text-white/60">
              Korzysta z: {t.uses.map((d) => DOC_NAME[d]).join(", ")}.
              {missing.length ? ` Najpierw zatwierdź: ${missing.map((d) => DOC_NAME[d]).join(", ")}.` : " Masz wszystko, czego potrzeba."}
            </p>
            {t.now ? (
              <Link href={t.now.href} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">
                {t.now.label}<ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
