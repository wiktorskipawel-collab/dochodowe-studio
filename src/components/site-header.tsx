"use client";

import { usePathname } from "next/navigation";
import { FlameIcon, ZapIcon, CloudIcon, CloudAlertIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useJourney } from "@/lib/store";
import { STEPS } from "@/lib/journey";
import { levelOf, streakDays, xpTotal } from "@/lib/gamification";

function titleFor(path: string) {
  if (path === "/") return "Pulpit";
  if (path.startsWith("/sciezka")) return "Twoja ścieżka";
  if (path.startsWith("/dokumenty")) return "Dokumenty";
  if (path.startsWith("/lekcje")) return "Lekcje";
  const step = STEPS.find((s) => path === `/krok/${s.id}`);
  return step ? `Krok ${step.no}: ${step.title}` : "Marketing OS";
}

export function SiteHeader() {
  const path = usePathname();
  const { state, cloud } = useJourney();
  const xp = xpTotal(state.events);
  const level = levelOf(xp);
  const streak = streakDays(state.events);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-white/10 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
        <h1 className="truncate text-base font-semibold">{titleFor(path)}</h1>
        <div className="ml-auto flex items-center gap-2">
          {cloud !== "local" && !state.demo ? (
            <span className={`hidden items-center gap-1.5 text-xs md:inline-flex ${cloud === "error" ? "text-red-300" : "text-white/55"}`} role="status">
              {cloud === "error" ? <CloudAlertIcon className="size-4" aria-hidden="true" /> : <CloudIcon className="size-4" aria-hidden="true" />}
              {cloud === "saving" ? "Zapisuję…" : cloud === "saved" ? "Zapisano w chmurze" : "Błąd zapisu"}
            </span>
          ) : null}
          <Badge variant="outline" className="hidden gap-1 border-amber-300/40 text-amber-200 sm:inline-flex"><FlameIcon />{streak} {streak === 1 ? "dzień" : "dni"}</Badge>
          <Badge className="gap-1"><ZapIcon />{xp} XP · {level.name}</Badge>
        </div>
      </div>
    </header>
  );
}
