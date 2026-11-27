import { Plug, Flag, Dna, User, Gem, Target, Rocket, PenLine, ChartColumn, MessageCircle, BookOpen, Flame, ChartPie, Trophy, type LucideIcon } from "lucide-react";

const BADGE_ICON: Record<string, LucideIcon> = { plug: Plug, flag: Flag, dna: Dna, user: User, gem: Gem, target: Target, rocket: Rocket, pen: PenLine, chart: ChartColumn, chat: MessageCircle, book: BookOpen, flame: Flame, half: ChartPie, trophy: Trophy };

/** Ikona odznaki (nazwa ikony z gamification.ts → ikona Lucide). */
export function BadgeIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = BADGE_ICON[icon] ?? Trophy;
  return <Icon className={className} aria-hidden="true" />;
}
