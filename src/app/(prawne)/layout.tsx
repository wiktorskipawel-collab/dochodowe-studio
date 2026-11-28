// Strony prawne (/regulamin, /polityka-prywatnosci): dostępne bez logowania, bez bramki Gate i bez menu aplikacji.
import Link from "next/link";

export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex min-h-11 items-center gap-2" aria-label="Dochodowe Studio: strona główna">
          {/* eslint-disable-next-line @next/next/no-img-element -- mały statyczny logotyp */}
          <img src="/logo-ds.png" alt="" width={70} height={40} className="h-10 w-auto drop-shadow-[0_4px_12px_rgba(114,196,28,.35)]" />
        </Link>
        <nav aria-label="Dokumenty" className="flex flex-wrap items-center gap-1 text-sm font-semibold">
          <Link href="/regulamin" className="inline-flex min-h-11 items-center rounded-xl px-3 text-white/75 hover:bg-white/10 hover:text-white">Regulamin</Link>
          <Link href="/polityka-prywatnosci" className="inline-flex min-h-11 items-center rounded-xl px-3 text-white/75 hover:bg-white/10 hover:text-white">Polityka prywatności</Link>
        </nav>
      </header>
      <main className="flex flex-col gap-6">{children}</main>
    </div>
  );
}
