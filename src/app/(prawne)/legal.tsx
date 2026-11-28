// Wspólne elementy stron prawnych. SZKIC: treść czeka na prawnika (baner na górze każdej strony).
import Link from "next/link";
import type { ReactNode } from "react";

/** Data szkicu (zmienić przy zatwierdzeniu razem z „obowiązuje od”). */
export const DRAFT_DATE = "27.11.2026";

/** Miejsce do uzupełnienia, np. [NAZWA FIRMY BARTKA]: wyróżnione, żeby nie zostało w wersji ostatecznej. */
export function Fill({ children }: { children: ReactNode }) {
  return <span className="rounded-md bg-amber-300/15 px-1 font-semibold text-amber-200">{children}</span>;
}

export function LegalDoc({ title, lead, children }: { title: string; lead: ReactNode; children: ReactNode }) {
  return (
    <>
      <p role="note" className="rounded-2xl border border-amber-300/50 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">
        Wersja robocza — do zatwierdzenia przez prawnika. Szkic z {DRAFT_DATE}: miejsca w nawiasach kwadratowych trzeba uzupełnić przed startem.
      </p>
      <article className="glass-card flex flex-col gap-6 rounded-3xl p-6 text-white/85 md:p-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{title}</h1>
          <p className="leading-relaxed text-white/70">{lead}</p>
        </header>
        {children}
      </article>
      <p className="pb-6 text-center text-sm text-white/55">
        <Link href="/logowanie" className="inline-flex min-h-11 items-center font-semibold text-white/75 underline underline-offset-4 hover:text-white">Przejdź do logowania</Link>
      </p>
    </>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 leading-relaxed">
      <h2 id={id} className="text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

export function Points({ children, ordered }: { children: ReactNode; ordered?: boolean }) {
  const cls = "flex flex-col gap-2 pl-5 marker:text-white/50";
  return ordered ? <ol className={`${cls} list-decimal`}>{children}</ol> : <ul className={`${cls} list-disc`}>{children}</ul>;
}
