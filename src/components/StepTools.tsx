"use client";

// „Narzędzia do tego kroku”: szybkie akcje przypisane do kroku (STEP_TOOLS w src/lib/tools-public.ts).
// Kliknięcie otwiera narzędzie w panelu bocznym (Sheet), bez wychodzenia z kroku. Rozmowa zapisuje się tak samo
// jak w /narzedzia (state.chats["tool:<id>"]), więc można ją potem kontynuować na pełnym ekranie.
import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Maximize2, MessageCircle, PanelRightOpen, Wand2, X } from "lucide-react";
import { useJourney } from "@/lib/store";
import { toolsForStep, type ToolId } from "@/lib/tools-public";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ToolGlyph, toolIcon } from "@/components/ToolIcon";
import { toolChatKey } from "@/components/Tools";
import { ToolSheetBody } from "@/components/ToolWorkspace";
import { Pill } from "@/components/ui";

export function StepTools({ stepId }: { stepId: string }) {
  const { state } = useJourney();
  const reduce = useReducedMotion();
  const tools = toolsForStep(stepId);
  // Narzędzie zostaje wybrane także w trakcie zamykania panelu, żeby treść nie znikła przed końcem animacji.
  const [toolId, setToolId] = useState<ToolId | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const open = tools.find((t) => t.id === toolId) ?? null;
  if (!tools.length) return null;

  return (
    <section className="glass-card flex flex-col gap-3 rounded-2xl p-5" aria-labelledby={`narzedzia-${stepId}`}>
      <div>
        <h2 id={`narzedzia-${stepId}`} className="flex items-center gap-2 font-semibold"><Wand2 className="size-5 text-brand" aria-hidden="true" />Narzędzia do tego kroku</h2>
        <p className="mt-1 text-sm text-white/65">Otwierają się z boku, bez wychodzenia z kroku.</p>
      </div>
      <ul className="flex flex-col gap-2">
        {tools.map((t, i) => {
          const Icon = toolIcon(t.icon);
          const talking = (state.chats[toolChatKey(t.id)]?.length ?? 0) > 0;
          return (
            <motion.li key={t.id} initial={reduce ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 26 }}>
              <motion.button
                type="button"
                onClick={() => { setToolId(t.id); setSheetOpen(true); }}
                whileHover={reduce ? undefined : { x: 3 }}
                whileTap={{ scale: 0.98 }}
                aria-haspopup="dialog"
                className="group flex min-h-14 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left hover:border-brand/50 hover:bg-white/[0.07]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand ring-1 ring-brand/25">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold leading-snug">{t.title}</span>
                  <span className="line-clamp-2 text-xs text-white/60">{t.desc}</span>
                </span>
                {talking ? (
                  <Pill tone="accent"><MessageCircle className="size-3.5" aria-hidden="true" /><span className="sr-only">Rozmowa w toku</span></Pill>
                ) : null}
                <PanelRightOpen className="size-4 shrink-0 text-white/50 transition-colors group-hover:text-brand" aria-hidden="true" />
              </motion.button>
            </motion.li>
          );
        })}
      </ul>

      <Sheet open={sheetOpen && !!open} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="z-[66] gap-0 border-white/10 bg-[#07130a]/97 p-0 text-white data-[side=right]:w-full data-[side=right]:sm:max-w-2xl supports-backdrop-filter:backdrop-blur-xl"
        >
          {open ? (
            <>
              <header className="flex items-start gap-3 border-b border-white/10 p-4 pr-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand ring-1 ring-brand/25">
                  <ToolGlyph name={open.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-lg font-bold text-white">{open.title}</SheetTitle>
                  <SheetDescription className="text-sm text-white/65">Rozmowa zapisuje się tak samo jak w „Narzędziach AI”.</SheetDescription>
                </div>
                <Link href={`/narzedzia/${open.id}`} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white">
                  <Maximize2 className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Pełny ekran</span><span className="sr-only sm:hidden">Otwórz na pełnym ekranie</span>
                </Link>
                <SheetClose aria-label="Zamknij panel narzędzia" className="grid size-11 shrink-0 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white">
                  <X className="size-5" aria-hidden="true" />
                </SheetClose>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <ToolSheetBody tool={open} />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}
