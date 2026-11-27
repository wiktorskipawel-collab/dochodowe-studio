import { Tools } from "@/components/Tools";
import { PageHeader } from "@/components/ui";
import { toolGroups } from "@/lib/tools";

export const metadata = { title: "Szybkie akcje · Marketing OS" };

export default function Narzedzia() {
  // Strona serwerowa: do przeglądarki trafiają tylko opisy narzędzi, bez instrukcji dla AI.
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Szybkie akcje" title="Zrób jedną rzecz, bez przechodzenia całej ścieżki">
        Każde narzędzie to osobna rozmowa z asystentem AI na metodyce Dochodowego Studia. Korzysta z Twoich zatwierdzonych dokumentów (DNA, awatar, oferta), więc nie zaczynasz od zera.
      </PageHeader>
      <Tools groups={toolGroups()} />
      <p className="text-xs text-white/60">Odpowiedzi tworzy sztuczna inteligencja (AI). Sprawdź każdy tekst, zanim wyślesz go klientowi. Ważne decyzje podejmujesz Ty.</p>
    </div>
  );
}
