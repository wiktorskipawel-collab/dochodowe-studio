"use client";

// Ikony szybkich akcji wybierane po nazwie (strona serwerowa nie może przekazać komponentu Lucide do klienta).
import {
  BookCheck, CalendarClock, ClipboardCheck, Clapperboard, Drama, Film, Handshake, HeartHandshake, Megaphone,
  MessagesSquare, MousePointerClick, Star, TrendingUp, UserPlus, Users, type LucideIcon,
} from "lucide-react";
import type { ToolIconName } from "@/lib/tools";

const TOOL_ICONS: Record<ToolIconName, LucideIcon> = {
  MessagesSquare, ClipboardCheck, Drama, MousePointerClick, Film, Clapperboard, UserPlus,
  Megaphone, BookCheck, TrendingUp, Star, CalendarClock, Handshake, Users, HeartHandshake,
};

export function toolIcon(name: ToolIconName): LucideIcon {
  return TOOL_ICONS[name] ?? MessagesSquare;
}
