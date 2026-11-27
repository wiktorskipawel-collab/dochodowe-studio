import Link from "next/link";
import { Gate } from "@/components/Gate";
import { OnboardingSteps } from "@/components/OnboardingSteps";

export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Dochodowe Studio">
          {/* eslint-disable-next-line @next/next/no-img-element -- mały statyczny logotyp */}
          <img src="/logo-ds.png" alt="Dochodowe Studio" width={70} height={40} className="h-10 w-auto drop-shadow-[0_4px_12px_rgba(114,196,28,.35)]" />
        </Link>
        <OnboardingSteps />
      </header>
      <Gate level="onboarding">{children}</Gate>
    </div>
  );
}
