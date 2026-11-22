import { Chat } from "@/components/Chat";
import { GlassCard, Pill, PageHeader, AiNote } from "@/components/ui";
import { studio } from "@/lib/data";

export const metadata = { title: "Rozmowa · Marketing OS" };

export default function Rozmowa() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Moduł 00 · Fundament i DNA studia" title="Rozmowa z Marketing OS">
        AI zadaje jedno pytanie naraz i pyta tylko o to, czego brakuje. Na końcu dostajesz Kartę DNA studia do zatwierdzenia.
      </PageHeader>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-3">
          <Chat />
          <AiNote />
        </div>
        <aside className="flex flex-col gap-5" aria-label="Karta studia">
          <GlassCard>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Karta: DNA studia</h2>
              <Pill tone="warn">W trakcie</Pill>
            </div>
            <dl className="flex flex-col gap-3 text-sm">
              <div><dt className="text-white/60">Studio</dt><dd>{studio.name} · {studio.city}</dd></div>
              <div><dt className="text-white/60">Oferta</dt><dd className="text-white/50">uzupełni się z rozmowy</dd></div>
              <div><dt className="text-white/60">Awatar</dt><dd className="text-white/50">uzupełni się z rozmowy</dd></div>
              <div><dt className="text-white/60">Liczby</dt><dd className="text-white/50">uzupełni się z rozmowy</dd></div>
              <div><dt className="text-white/60">Cel na 90 dni</dt><dd>{studio.goal}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-white/60">Zapisywanie karty w bazie dojdzie w kolejnym kroku (Supabase, Frankfurt).</p>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}
