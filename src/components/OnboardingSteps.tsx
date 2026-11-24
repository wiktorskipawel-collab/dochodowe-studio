"use client";

import { usePathname } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { useJourney } from "@/lib/store";

export function OnboardingSteps() {
  const path = usePathname();
  const { state } = useJourney();
  if (!path.startsWith("/ankieta")) return null; // „Połącz AI” to już nie etap wejścia, tylko ustawienie
  const steps = [
    { label: "Konto", done: !!state.profile, on: false },
    { label: "Ankieta z Bartkiem", done: !!state.survey, on: !state.survey },
    { label: "Twoja ścieżka", done: state.pathAccepted, on: !!state.survey && !state.pathAccepted },
  ];
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Kroki wejścia">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-2">
          <span aria-current={s.on ? "step" : undefined}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 font-semibold ${s.on ? "bg-brand text-brand-ink" : s.done ? "bg-emerald-400/15 text-emerald-200" : "bg-white/5 text-white/60"}`}>
            {s.done && !s.on ? <CheckIcon className="size-4" aria-hidden="true" /> : <span aria-hidden="true">{i + 1}</span>}
            {s.label}
          </span>
          {i < steps.length - 1 ? <span className="h-px w-5 bg-white/20" aria-hidden="true" /> : null}
        </li>
      ))}
    </ol>
  );
}
