"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboardIcon, RouteIcon, FileTextIcon, PlayCircleIcon, PlugZapIcon, LogOutIcon, EllipsisVerticalIcon, FlameIcon,
  DnaIcon, UserRoundIcon, GemIcon, TargetIcon, UserPlusIcon, ClapperboardIcon, FilmIcon, MousePointerClickIcon, CheckIcon, CompassIcon, Volume2Icon, VolumeXIcon,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useJourney } from "@/lib/store";
import { progressPercent } from "@/lib/journey";
import { platformAi } from "@/lib/models";
import { levelOf, streakDays, xpTotal } from "@/lib/gamification";
import { Ring } from "@/components/Charts";
import { startTour } from "@/components/Onboarding";
import { play, setSoundOn, soundOn } from "@/lib/sfx";

type Item = { title: string; url: string; icon: LucideIcon; doc?: string };

// Ścieżka = prowadzenie krok po kroku. „Mój marketing” = to, do czego właściciel wraca po ścieżce (decyzja Pawła 2026-11-27).
const PATH: Item[] = [
  { title: "Pulpit", url: "/", icon: LayoutDashboardIcon },
  { title: "Twoja ścieżka", url: "/sciezka", icon: RouteIcon },
  { title: "Lekcje", url: "/lekcje", icon: PlayCircleIcon },
  ...(platformAi ? [] : [{ title: "Połącz AI", url: "/polacz", icon: PlugZapIcon }]),
];
const MARKETING: Item[] = [
  { title: "DNA studia", url: "/dokumenty#dna", icon: DnaIcon, doc: "dna" },
  { title: "Awatar klienta", url: "/dokumenty#awatar", icon: UserRoundIcon, doc: "awatar" },
  { title: "Oferta", url: "/dokumenty#oferta", icon: GemIcon, doc: "oferta" },
  { title: "Strategia", url: "/dokumenty#strategia", icon: TargetIcon, doc: "strategia" },
  { title: "Wszystkie dokumenty", url: "/dokumenty", icon: FileTextIcon },
];
const ACTIONS: Item[] = [
  { title: "Nowy awatar", url: "/narzedzia#nowy-awatar", icon: UserPlusIcon },
  { title: "Scenariusz VSL", url: "/narzedzia#vsl", icon: ClapperboardIcon },
  { title: "Nowe rolki", url: "/narzedzia#rolki", icon: FilmIcon },
  { title: "Analiza CTR reklam", url: "/narzedzia#ctr", icon: MousePointerClickIcon },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const path = usePathname();
  const { state } = useJourney();
  const [hover, setHover] = React.useState<string | null>(null);
  const pct = progressPercent(state);
  const xp = xpTotal(state.events);
  const level = levelOf(xp);
  const streak = streakDays(state.events);

  const isActive = (url: string) => {
    if (url.includes("#")) return false; // skróty do miejsc na stronie nie podświetlają się na stałe
    return url === "/" ? path === "/" : path.startsWith(url) || (url === "/sciezka" && path.startsWith("/krok"));
  };

  const group = (label: string, items: Item[], tour: string) => (
    <SidebarGroup data-tour={tour}>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu onMouseLeave={() => setHover(null)}>
          {items.map((item) => {
            const active = isActive(item.url);
            const approved = item.doc ? state.docs[item.doc]?.status === "approved" : false;
            return (
              <SidebarMenuItem key={item.url} className="relative" onMouseEnter={() => setHover(item.url)}>
                {/* płynna „pigułka”, która przepływa za kursorem */}
                {hover === item.url && !active ? (
                  <motion.span layoutId="nav-hover" className="absolute inset-0 rounded-lg bg-white/[0.07]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                ) : null}
                {active ? (
                  <motion.span layoutId="nav-active" className="absolute inset-0 rounded-lg bg-brand shadow-[0_8px_24px_-10px_rgba(114,196,28,.55)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                ) : null}
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={active}
                  render={<Link href={item.url} />}
                  className={`relative z-10 h-10 bg-transparent hover:bg-transparent active:bg-transparent data-active:bg-transparent ${active ? "font-bold text-brand-ink hover:text-brand-ink data-active:text-brand-ink" : ""}`}
                >
                  <item.icon />
                  <span>{item.title}</span>
                  {approved ? <CheckIcon className="ml-auto size-4 text-emerald-300" aria-label="zatwierdzony" /> : null}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 px-2 py-2" aria-label="Dochodowe Studio · pulpit">
          {/* eslint-disable-next-line @next/next/no-img-element -- mały statyczny logotyp */}
          <img src="/logo-ds.png" alt="Dochodowe Studio" width={58} height={33} className="h-9 w-auto drop-shadow-[0_4px_12px_rgba(114,196,28,.35)]" />
          <span className="text-sm font-extrabold leading-tight">Dochodowe<br /><span className="text-brand">Studio</span></span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {group("Ścieżka", PATH, "nav-path")}
        {group("Mój marketing", MARKETING, "nav-marketing")}
        {group("Szybkie akcje", ACTIONS, "nav-actions")}

        <SidebarGroup className="mt-auto">
          <div className="glass-card flex items-center gap-3 rounded-2xl p-3">
            <Ring value={pct} size={56} stroke={6} label="Postęp ścieżki" />
            <div className="min-w-0 text-xs">
              <p className="font-bold">Poziom {level.index}: {level.name}</p>
              <p className="text-white/65">{xp} XP</p>
              <p className="mt-0.5 flex items-center gap-1 text-orange"><FlameIcon className="size-3.5" aria-hidden="true" />{streak} {streak === 1 ? "dzień" : "dni"} z rzędu</p>
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

function NavUser() {
  const { isMobile } = useSidebar();
  const { state, signOut } = useJourney();
  const router = useRouter();
  const [sound, setSound] = React.useState(soundOn);
  const name = state.profile?.name ?? "Uczestnik";
  const email = state.profile?.email ?? "";
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />}>
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-green-strong font-bold text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{name}</span>
              <span className="truncate text-xs text-foreground/70">{email}</span>
            </div>
            <EllipsisVerticalIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Konto</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => { router.push("/"); startTour(); }}><CompassIcon />Powitanie i przewodnik</DropdownMenuItem>
            <DropdownMenuItem closeOnClick={false} onClick={() => { const on = !sound; setSoundOn(on); setSound(on); if (on) play("xp"); }}>{sound ? <Volume2Icon /> : <VolumeXIcon />}Dźwięki nagród: {sound ? "włączone" : "wyłączone"}</DropdownMenuItem>
            {platformAi ? null : <DropdownMenuItem onClick={() => router.push("/polacz")}><PlugZapIcon />Połączenie z AI</DropdownMenuItem>}
            {platformAi ? null : <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => { signOut(); router.push("/logowanie"); }}><LogOutIcon />Wyloguj</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
