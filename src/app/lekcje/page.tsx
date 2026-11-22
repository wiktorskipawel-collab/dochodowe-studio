import Link from "next/link";
import { Play, PlayCircle, BookOpen, Users, Video, MessageSquare } from "lucide-react";
import { GlassCard, Pill, PageHeader } from "@/components/ui";
import { lessons, library } from "@/lib/data";

export const metadata = { title: "Lekcje · Marketing OS" };

export default function Lekcje() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Biblioteka" title="Wszystkie lekcje i mentoringi w jednym miejscu">
        {library.lessons} lekcji z {library.courses} kursów Skool · {library.mentorings} mentoringów grupowych · kanał YouTube. Każda lekcja jest przypięta do modułów ścieżki.
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-5">
          <GlassCard className="flex flex-col gap-4">
            <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-black/50" role="img" aria-label="Odtwarzacz wideo lekcji (podgląd)">
              <span className="grid size-16 place-items-center rounded-full bg-white/15"><Play className="size-7" aria-hidden="true" /></span>
              <p className="absolute bottom-3 left-4 text-sm text-white/70">Odtwarzacz Bunny Stream: tylko dla zalogowanych, bez pobierania</p>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-white/65">Kurs Skool · sprzedaż</p>
                <h2 className="text-xl font-semibold">System Sprzedaży Studia Treningu Personalnego</h2>
              </div>
              <Link href="/rozmowa" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-neutral-900 hover:bg-white/90">
                <MessageSquare className="size-4" aria-hidden="true" />Zapytaj o tę lekcję
              </Link>
            </div>
            <div className="rounded-xl border border-dashed border-white/20 p-4 text-sm text-white/70">
              Tu pojawi się transkrypcja z podziałem na minuty. Kliknięcie w czas przewinie film, a Marketing OS w rozmowie odeśle właśnie do takich minut.
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="mb-3 text-lg font-semibold">Lekcje do Twojej ścieżki</h2>
            <ul className="divide-y divide-white/10">
              {lessons.map((l) => (
                <li key={l.title} className="flex items-center gap-3 py-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10"><PlayCircle className="size-5 text-accent" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{l.title}</p>
                    <p className="text-sm text-white/65">{l.source}</p>
                  </div>
                  <Pill>{l.module}</Pill>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-white/65">…i {library.lessons - lessons.length} kolejnych lekcji. Nazwy kursów i lekcji przeniesiemy 1:1 ze Skoola.</p>
          </GlassCard>
        </div>

        <aside className="flex flex-col gap-5" aria-label="Zawartość biblioteki">
          <GlassCard>
            <h2 className="mb-3 text-lg font-semibold">Co będzie w bibliotece</h2>
            <ul className="flex flex-col gap-3 text-sm">
              <li className="flex items-center gap-3"><BookOpen className="size-5 text-accent" aria-hidden="true" /><span className="flex-1">{library.courses} kursów Skool · {library.lessons} lekcji</span><Pill tone="good">wideo</Pill></li>
              <li className="flex items-center gap-3"><Users className="size-5 text-accent" aria-hidden="true" /><span className="flex-1">{library.mentorings} mentoringów grupowych</span><Pill>wiedza AI</Pill></li>
              <li className="flex items-center gap-3"><Video className="size-5 text-accent" aria-hidden="true" /><span className="flex-1">YouTube Dochodowego Studia</span><Pill>wiedza AI</Pill></li>
            </ul>
          </GlassCard>
          <GlassCard>
            <h2 className="mb-3 text-lg font-semibold">Jak trafią tu filmy</h2>
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-white/80">
              <li>Pobieramy lekcje z Looma (tam są osadzone w Skoolu).</li>
              <li>Wgrywamy je do Bunny Stream: serwery we Frankfurcie, odtwarzanie tylko dla zalogowanych.</li>
              <li>Tworzymy transkrypcje z podziałem na minuty.</li>
              <li>Przypinamy lekcje do modułów ścieżki.</li>
            </ol>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}
