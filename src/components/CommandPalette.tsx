"use client";

// Szybkie wybieranie (Ctrl+K / ⌘K albo przycisk „Szukaj” w nagłówku): 12 narzędzi AI, 14 kroków ścieżki i strony.
// Wzorzec dostępności: pole z rolą combobox + lista (listbox) z aria-activedescendant; strzałki, Enter, Esc.
// Montowane raz w src/app/(app)/layout.tsx. Otwieranie z innych miejsc: openCommandPalette().
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { motion } from "motion/react";
import {
  ArrowRight, CornerDownLeft, FileSignature, FileText, Footprints, LayoutDashboard, Library, Lock, Dumbbell, PlayCircle, Route, Search,
  Sparkles, Store, type LucideIcon,
} from "lucide-react";
import { useJourney } from "@/lib/store";
import { STEPS, stepStatuses } from "@/lib/journey";
import { TOOLS_PUBLIC, TOOL_CATEGORIES } from "@/lib/tools-public";
import { toolIcon } from "@/components/ToolIcon";
import { MotionDialog } from "@/components/ToolIntro";

const OPEN_EVENT = "mos:szybkie-wybieranie";

/** Otwiera paletę (np. przycisk w nagłówku). */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

type Group = "Narzędzia AI" | "Kroki ścieżki" | "Strony";
type Item = { id: string; group: Group; title: string; hint: string; href: string; icon: LucideIcon; keywords: string; locked?: boolean };

// Strony jak w menu bocznym (app-sidebar.tsx).
const PAGES: Omit<Item, "group" | "id">[] = [
  { title: "Pulpit", hint: "Start, postęp i następny krok", href: "/", icon: LayoutDashboard, keywords: "start dashboard xp seria" },
  { title: "Twoja ścieżka", hint: "Mapa wszystkich kroków", href: "/sciezka", icon: Route, keywords: "mapa etapy" },
  { title: "Lekcje", hint: "Nagrania do kroków", href: "/lekcje", icon: PlayCircle, keywords: "wideo kurs nagrania" },
  { title: "Kursy Bartka", hint: "Biblioteka kursów", href: "/lekcje#kursy", icon: Library, keywords: "skool szkolenia" },
  { title: "Dla trenerów zespołu", hint: "Lekcje dla zespołu", href: "/lekcje#zespol", icon: Dumbbell, keywords: "trenerzy zespół" },
  { title: "Dokumenty", hint: "Wszystko, co powstało na ścieżce", href: "/dokumenty", icon: FileText, keywords: "dna awatar oferta strategia pobierz" },
  { title: "Wzory dokumentów", hint: "Umowy i regulaminy", href: "/dokumenty#wzory", icon: FileSignature, keywords: "umowa regulamin prawnik" },
  { title: "Narzędzia AI", hint: "Wszystkie szybkie akcje", href: "/narzedzia", icon: Sparkles, keywords: "szybkie akcje asystent" },
  { title: "Lokal i otwarcie", hint: "Kalkulator lokalu i najem", href: "/lokal", icon: Store, keywords: "najem czynsz kalkulator" },
];

function countLabel(n: number) {
  if (n === 1) return "1 wynik";
  const few = n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14);
  return `${n} ${few ? "wyniki" : "wyników"}`;
}

/** Małe litery bez polskich znaków: „łódź” = „lodz”. */
const norm = (s: string) => s.toLowerCase().replace(/ł/g, "l").normalize("NFD").replace(/[̀-ͯ]/g, "");

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, state } = useJourney();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const show = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
  }, []);

  // Ctrl+K / ⌘K (także w polach tekstowych — to skrót aplikacji) i zdarzenie z przycisku w nagłówku.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, show);
    };
  }, [open, show]);

  const items = useMemo<Item[]>(() => {
    const statuses = ready ? stepStatuses(state) : {};
    const cat = new Map(TOOL_CATEGORIES.map((c) => [c.id, c.title]));
    const tools: Item[] = TOOLS_PUBLIC.map((t) => ({
      id: `tool-${t.id}`, group: "Narzędzia AI", title: t.title, hint: cat.get(t.category) ?? "", href: `/narzedzia/${t.id}`, icon: toolIcon(t.icon), keywords: t.desc,
    }));
    const steps: Item[] = STEPS.map((s) => {
      const st = statuses[s.id];
      const label = st === "done" ? "zatwierdzony" : st === "draft" ? "w trakcie" : st === "locked" ? "zablokowany" : "do zrobienia";
      return {
        id: `step-${s.id}`, group: "Kroki ścieżki", title: `Krok ${s.no}: ${s.title}`, hint: `${s.phase} · ${label}`, href: `/krok/${s.id}`,
        icon: st === "locked" ? Lock : Footprints, keywords: `${s.goal} ${s.docTitle}`, locked: st === "locked",
      };
    });
    const pages: Item[] = PAGES.map((p) => ({ ...p, id: `page-${p.href}`, group: "Strony" }));
    return [...tools, ...steps, ...pages];
  }, [ready, state]);

  const results = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    if (!words.length) return items;
    const scored = items
      .map((it, i) => {
        const title = norm(it.title);
        const all = `${title} ${norm(it.hint)} ${norm(it.keywords)}`;
        if (!words.every((w) => all.includes(w))) return null;
        const score = (words.every((w) => title.includes(w)) ? 0 : 1000) + (title.startsWith(words[0]) ? 0 : 100) + i;
        return { it, score };
      })
      .filter((x): x is { it: Item; score: number } => !!x);
    // Kolejność grup zostaje (narzędzia, kroki, strony); w grupie najpierw trafienia w tytule.
    const order: Group[] = ["Narzędzia AI", "Kroki ścieżki", "Strony"];
    return order.flatMap((g) => scored.filter((x) => x.it.group === g).sort((a, b) => a.score - b.score).map((x) => x.it));
  }, [items, query]);

  const current = Math.min(active, Math.max(0, results.length - 1));
  const activeId = results[current] ? `paleta-${results[current].id}` : undefined;

  useEffect(() => {
    if (!open || !activeId) return;
    document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [open, activeId]);

  function go(item: Item | undefined) {
    if (!item) return;
    setOpen(false);
    if (item.href === pathname) return;
    router.push(item.href);
    // Jak w menu bocznym: zakładki /lekcje#kursy itp. nasłuchują zmiany kotwicy.
    if (item.href.includes("#")) setTimeout(() => window.dispatchEvent(new HashChangeEvent("hashchange")), 50);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((current + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((current - 1 + results.length) % results.length);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      setActive(Math.min(results.length - 1, current + 5));
    } else if (e.key === "PageUp") {
      e.preventDefault();
      setActive(Math.max(0, current - 5));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[current]);
    }
  }

  let lastGroup: Group | null = null;

  return (
    <MotionDialog open={open} onClose={() => setOpen(false)} top initialFocus={inputRef} className="max-w-2xl" label="Szybkie wybieranie">
      <Dialog.Title className="sr-only">Szybkie wybieranie</Dialog.Title>
      <Dialog.Description className="sr-only">Wpisz nazwę narzędzia, kroku albo strony. Strzałki wybierają, Enter otwiera, Escape zamyka.</Dialog.Description>
      <div className="flex items-center gap-3 border-b border-white/10 px-4 focus-within:border-brand/60 focus-within:bg-white/[0.03]">
        <Search className="size-5 shrink-0 text-brand" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls="paleta-lista"
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-label="Czego szukasz?"
          placeholder="Narzędzie, krok albo strona… np. „rolki”, „oferta”, „lekcje”"
          style={{ outline: "none" }} // fokus widać na całym wierszu (focus-within), a nie jako ramkę w środku okienka
          className="min-h-14 flex-1 bg-transparent text-base text-white placeholder:text-white/45 focus:outline-none"
        />
        <kbd className="hidden rounded-md border border-white/15 px-1.5 py-0.5 text-[11px] font-semibold text-white/55 sm:inline">Esc</kbd>
      </div>

      <ul id="paleta-lista" ref={listRef} role="listbox" aria-label="Wyniki" className="max-h-[min(60vh,30rem)] overflow-y-auto p-2">
        {results.map((it, i) => {
          const head = it.group !== lastGroup ? it.group : null;
          lastGroup = it.group;
          const selected = i === current;
          const Icon = it.icon;
          return (
            <li key={it.id} role="presentation">
              {head ? <p role="presentation" className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">{head}</p> : null}
              <div
                id={`paleta-${it.id}`}
                role="option"
                aria-selected={selected}
                onMouseMove={() => { if (!selected) setActive(i); }}
                onClick={() => go(it)}
                className={`relative flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ${selected ? "text-white" : "text-white/80"}`}
              >
                {selected ? (
                  <motion.span layoutId="paleta-podswietlenie" className="absolute inset-0 rounded-xl bg-brand/15 ring-1 ring-brand/40" transition={{ type: "spring", stiffness: 500, damping: 38 }} aria-hidden="true" />
                ) : null}
                <span className={`relative grid size-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-brand text-brand-ink" : "bg-white/10 text-brand"}`}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="relative flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{it.title}</span>
                  <span className="truncate text-xs text-white/55">{it.hint}</span>
                </span>
                {selected ? <ArrowRight className="relative size-4 shrink-0 text-brand" aria-hidden="true" /> : null}
              </div>
            </li>
          );
        })}
        {!results.length ? <li role="presentation" className="px-3 py-8 text-center text-sm text-white/60">Nic nie pasuje. Spróbuj innego słowa, np. „sprzedaż” albo „reklamy”.</li> : null}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5 text-xs text-white/55">
        <span className="flex items-center gap-3">
          <span><kbd className="font-semibold text-white/75">↑ ↓</kbd> wybór</span>
          <span className="inline-flex items-center gap-1"><CornerDownLeft className="size-3.5" aria-hidden="true" /><span className="sr-only">Enter</span> otwiera</span>
        </span>
        <span role="status" aria-live="polite">{countLabel(results.length)}</span>
      </div>
    </MotionDialog>
  );
}
