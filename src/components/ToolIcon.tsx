"use client";

// Ikony szybkich akcji wybierane po nazwie (strona serwerowa nie może przekazać komponentu Lucide do klienta).
import { createElement } from "react";
import {
  BookCheck, CalendarClock, ClipboardCheck, Clapperboard, Drama, Film, Handshake, HeartHandshake, Megaphone,
  MessagesSquare, MousePointerClick, Star, TrendingUp, UserPlus, Users, type LucideIcon,
} from "lucide-react";
import type { ToolIconName } from "@/lib/tools-public";

const TOOL_ICONS: Record<ToolIconName, LucideIcon> = {
  MessagesSquare, ClipboardCheck, Drama, MousePointerClick, Film, Clapperboard, UserPlus,
  Megaphone, BookCheck, TrendingUp, Star, CalendarClock, Handshake, Users, HeartHandshake,
};

export function toolIcon(name: ToolIconName): LucideIcon {
  return TOOL_ICONS[name] ?? MessagesSquare;
}

/** Ikona narzędzia jako element (gdy narzędzie zmienia się w trakcie, np. panel boczny kroku). */
export function ToolGlyph({ name, className }: { name: ToolIconName; className?: string }) {
  return createElement(toolIcon(name), { className, "aria-hidden": true });
}
