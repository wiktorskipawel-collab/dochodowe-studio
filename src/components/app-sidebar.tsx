"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboardIcon, RouteIcon, FileTextIcon, PlayCircleIcon, PlugZapIcon, LogOutIcon, EllipsisVerticalIcon, FlameIcon,
  DnaIcon, UserRoundIcon, GemIcon, TargetIcon, ClapperboardIcon, FilmIcon, MousePointerClickIcon, CheckIcon, PhoneCallIcon, HeadsetIcon, SparklesIcon, StoreIcon, FileSignatureIcon, LibraryIcon, CompassIcon, Volume2Icon, VolumeXIcon,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  { title: "Obsługa zgłoszeń", url: "/dokumenty#sprzedaz", icon: PhoneCallIcon, doc: "sprzedaz" },
  { title: "Strategia", url: "/dokumenty#strategia", icon: TargetIcon, doc: "strategia" },
  { title: "Wszystkie dokumenty", url: "/dokumenty", icon: FileTextIcon },
];
const ACTIONS: Item[] = [
  { title: "Asystent sprzedaży", url: "/narzedzia/asystent-sprzedazy", icon: HeadsetIcon },
  { title: "Analiza reklam", url: "/narzedzia/ctr", icon: MousePointerClickIcon },
  { title: "Nowe rolki", url: "/narzedzia/rolki", icon: FilmIcon },
  { title: "Scenariusz VSL", url: "/narzedzia/vsl", icon: ClapperboardIcon },
  { title: "Wszystkie narzędzia AI", url: "/narzedzia", icon: SparklesIcon },
];
// Moduły studia poza ścieżką (decyzja Pawła 2026-11-27: platforma obejmuje cały program DS).
// Kursy ułożone jak na Skool (kurs → moduły → lekcje); osobna biblioteka „Dla trenerów zespołu” znika (prośba 2026-11-27).
const STUDIO: Item[] = [
  { title: "Lokal i otwarcie", url: "/lokal", icon: StoreIcon },
  { title: "Kursy (jak na Skool)", url: "/lekcje#kursy", icon: LibraryIcon },
  { title: "Wzory dokumentów", url: "/dokumenty#wzory", icon: FileSignatureIcon },
];

// Menu zwija się do paska ikon (collapsible="icon"): ikony z podpowiedziami, znak DS zamiast logotypu z napisem,
// etykiety grup ukryte (zamiast nich cienka linia), karta poziomu → mały pierścień z numerem poziomu i podpowiedzią.
// Na telefonie menu jest wysuwanym panelem (Sheet) w pełnej wersji i zamyka się po wyborze strony.
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const path = usePathname();
  const { state } = useJourney();
  const { isMobile, setOpenMobile } = useSidebar();
  const [hover, setHover] = React.useState<string | null>(null);
  const pct = progressPercent(state);
  const xp = xpTotal(state.events);
  const level = levelOf(xp);
  const streak = streakDays(state.events);
  const streakText = `${streak} ${streak === 1 ? "dzień" : "dni"} z rzędu`;

  const isActive = (url: string) => {
    if (url.includes("#")) return false; // skróty do miejsc na stronie nie podświetlają się na stałe
    if (url === "/narzedzia") return path === "/narzedzia";
    return url === "/" ? path === "/" : path.startsWith(url) || (url === "/sciezka" && path.startsWith("/krok"));
  };

  const go = (url: string) => () => {
    if (isMobile) setOpenMobile(false);
    if (url.includes("#")) setTimeout(() => window.dispatchEvent(new HashChangeEvent("hashchange")), 50);
  };

  const group = (label: string, items: Item[], tour: string, first = false) => (
    <SidebarGroup data-tour={tour} className={first ? "" : "group-data-[collapsible=icon]:border-t group-data-[collapsible=icon]:border-white/[0.08]"}>
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
                  tooltip={approved ? `${item.title} · zatwierdzony` : item.title}
                  isActive={active}
                  render={<Link href={item.url} onClick={go(item.url)} />}
                  className={`relative z-10 h-10 bg-transparent hover:bg-transparent active:bg-transparent data-active:bg-transparent ${active ? "font-bold text-brand-ink hover:text-brand-ink data-active:text-brand-ink" : ""}`}
                >
                  <item.icon />
                  <span>{item.title}</span>
                  {approved ? <CheckIcon className="ml-auto size-4 text-emerald-300" aria-label="zatwierdzony" /> : null}
                </SidebarMenuButton>
                {/* w trybie ikon ✓ się nie mieści: zielona kropka przy ikonie */}
                {approved ? <span className="pointer-events-none absolute right-0.5 top-0.5 z-20 hidden size-2 rounded-full bg-emerald-300 ring-2 ring-[#06120a] group-data-[collapsible=icon]:block" aria-hidden="true" /> : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/" onClick={go("/")} className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0" aria-label="Dochodowe Studio · pulpit">
          {/* eslint-disable-next-line @next/next/no-img-element -- mały statyczny logotyp */}
          <img src="/logo-ds.png" alt="" width={58} height={33} className="h-9 w-auto shrink-0 drop-shadow-[0_4px_12px_rgba(114,196,28,.35)] transition-[width,height] group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:w-8" />
          <span className="text-sm font-extrabold leading-tight group-data-[collapsible=icon]:hidden">Dochodowe<br /><span className="text-brand">Studio</span></span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto group-data-[collapsible=icon]:overflow-x-hidden">
        {group("Ścieżka", PATH, "nav-path", true)}
        {group("Mój marketing", MARKETING, "nav-marketing")}
        {group("Szybkie akcje", ACTIONS, "nav-actions")}
        {group("Studio", STUDIO, "nav-studio")}

        <SidebarGroup className="mt-auto">
          <div className="glass-card flex items-center gap-3 rounded-2xl p-3 group-data-[collapsible=icon]:hidden">
            <Ring value={pct} size={56} stroke={6} label="Postęp ścieżki" />
            <div className="min-w-0 text-xs">
              <p className="font-bold">Poziom {level.index}: {level.name}</p>
              <p className="text-white/65">{xp} XP</p>
              <p className="mt-0.5 flex items-center gap-1 text-orange"><FlameIcon className="size-3.5" aria-hidden="true" />{streakText}</p>
            </div>
          </div>
          <MiniLevel pct={pct} index={level.index} text={`Poziom ${level.index}: ${level.name} · ${xp} XP · ${streakText} · ścieżka ${pct}%`} />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/** Zwinięte menu: pierścień postępu ścieżki z numerem poziomu; szczegóły w podpowiedzi (także z klawiatury). */
function MiniLevel({ pct, index, text }: { pct: number; index: number; text: string }) {
  const size = 32;
  const r = 13;
  const c = 2 * Math.PI * r;
  return (
    <div className="hidden justify-center group-data-[collapsible=icon]:flex">
      <Tooltip>
        <TooltipTrigger render={<Link href="/" aria-label={text} className="relative grid size-8 place-items-center rounded-full" />}>
          <svg width={size} height={size} viewBox="0 0 32 32" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx={16} cy={16} r={r} fill="none" stroke="var(--viz-track)" strokeWidth={3} />
            <circle cx={16} cy={16} r={r} fill="none" stroke="var(--viz-done)" strokeWidth={3} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
          </svg>
          <span className="text-[11px] font-extrabold" aria-hidden="true">{index}</span>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">{text}</TooltipContent>
      </Tooltip>
    </div>
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
