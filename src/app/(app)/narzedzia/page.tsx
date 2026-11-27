import { Tools } from "@/components/Tools";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Szybkie akcje · Marketing OS" };

export default function Narzedzia() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Szybkie akcje" title="Zrób jedną rzecz, bez przechodzenia całej ścieżki">
        Bartek korzysta z Twoich zatwierdzonych dokumentów (DNA, awatar, oferta), więc nie zaczynasz od zera.
      </PageHeader>
      <Tools />
    </div>
  );
}
