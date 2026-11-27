"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { FlameIcon, ZapIcon, CloudIcon, CloudAlertIcon, SearchIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useJourney } from "@/lib/store";
import { XpCount } from "@/components/XpCount";
import { STEPS } from "@/lib/journey";
import { levelOf, streakDays, xpTotal } from "@/lib/gamification";
import { openCommandPalette } from "@/components/CommandPalette";

// Mac pokazuje ⌘K, reszta Ctrl K (na serwerze zawsze Ctrl K, więc bez różnic przy hydratacji).
const noop = () => () => {};
const useMac = () => useSyncExternalStore(noop, () => /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent), () => false);

function titleFor(path: string) {
  if (path === "/") return "Pulpit";
  if (path.startsWith("/sciezka")) return "Twoja ścieżka";
  if (path.startsWith("/dokumenty")) return "Dokumenty";
  if (path.startsWith("/lekcje")) return "Lekcje";
  if (path.startsWith("/narzedzia/")) return "Narzędzie AI";
  if (path.startsWith("/narzedzia")) return "Narzędzia AI";
  if (path.startsWith("/lokal")) return "Lokal i otwarcie";
  const step = STEPS.find((s) => path === `/krok/${s.id}`);
  return step ? `Krok ${step.no}: ${step.title}` : "Marketing OS";
}

export function SiteHeader() {
  const path = usePathname();
  const { ready, state, cloud } = useJourney();
  const xp = xpTotal(state.events);
  const level = levelOf(xp);
  const streak = streakDays(state.events);
  const mac = useMac();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-white/10 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
        <h1 className="truncate text-base font-semibold">{titleFor(path)}</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Szybkie wybieranie: narzędzia, kroki i strony"
            aria-keyshortcuts="Control+K Meta+K"
            title={mac ? "Szybkie wybieranie (⌘K)" : "Szybkie wybieranie (Ctrl+K)"}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white/75 hover:border-brand/50 hover:text-white"
          >
            <SearchIcon className="size-4" aria-hidden="true" />
            <span className="hidden lg:inline">Szukaj</span>
            <kbd className="hidden rounded-md border border-white/15 px-1.5 text-[11px] font-semibold text-white/55 md:inline">{mac ? "⌘K" : "Ctrl K"}</kbd>
          </button>
          {cloud !== "local" && !state.demo ? (
            <span className={`hidden items-center gap-1.5 text-xs md:inline-flex ${cloud === "error" ? "text-red-300" : "text-white/55"}`} role="status">
              {cloud === "error" ? <CloudAlertIcon className="size-4" aria-hidden="true" /> : <CloudIcon className="size-4" aria-hidden="true" />}
              {cloud === "saving" ? "Zapisuję…" : cloud === "saved" ? "Zapisano w chmurze" : "Błąd zapisu"}
            </span>
          ) : null}
          <Badge variant="outline" className="hidden gap-1 border-amber-300/40 text-amber-200 sm:inline-flex"><FlameIcon />{streak} {streak === 1 ? "dzień" : "dni"}</Badge>
          <Badge data-xp-target className="gap-1"><ZapIcon /><XpCount value={xp} live={ready} /> XP · {level.name}</Badge>
        </div>
      </div>
    </header>
  );
}
