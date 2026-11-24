"use client";

// Pilnuje kolejności wejścia: konto → ankieta → pulpit.
// Połączenie AI nie blokuje wejścia — prosimy o nie dopiero w kroku, gdy asystent ma rozmawiać.
import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useJourney } from "@/lib/store";
import { Spinner } from "@/components/ui/spinner";

export type GateLevel = "auth" | "onboarding" | "app";

export function requiredPath(level: GateLevel, s: ReturnType<typeof useJourney>["state"], path: string): string | null {
  if (!s.profile) return "/logowanie";
  void path;
  if (level === "app" && (!s.survey || !s.pathAccepted)) return "/ankieta";
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
