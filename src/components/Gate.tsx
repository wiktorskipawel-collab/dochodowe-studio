"use client";

// Pilnuje kolejności wejścia: konto → połączenie AI → ankieta → pulpit.
import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useJourney } from "@/lib/store";
import { Spinner } from "@/components/ui/spinner";

export type GateLevel = "auth" | "onboarding" | "app";

export function requiredPath(level: GateLevel, s: ReturnType<typeof useJourney>["state"], path: string): string | null {
  if (!s.profile) return "/logowanie";
  if (level === "onboarding") {
    if (path.startsWith("/ankieta") && !s.ai.mode) return "/polacz";
    return null;
  }
  if (level === "app") {
    if (!s.ai.mode) return "/polacz";
    if (!s.survey || !s.pathAccepted) return "/ankieta";
  }
  return null;
}

export function Gate({ level, children }: { level: GateLevel; children: ReactNode }) {
  const { ready, state } = useJourney();
  const router = useRouter();
  const path = usePathname();
  const target = ready ? requiredPath(level, state, path) : null;

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (!ready || target) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-white/70" role="status">
        <span className="flex items-center gap-3"><Spinner />Wczytuję…</span>
      </div>
    );
  }
  return <>{children}</>;
}
