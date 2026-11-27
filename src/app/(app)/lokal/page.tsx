import { LokalKalkulator } from "@/components/LokalKalkulator";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Kalkulator lokalu · Marketing OS" };

export default function Lokal() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Przed otwarciem i przeprowadzka" title="Kalkulator lokalu">
        Dodaj lokale, które oglądasz: ręcznie albo wklej ogłoszenie, a AI wypełni pola. Kalkulator policzy pełny koszt miesięczny, koszt za metr sali i to, jaką część przychodu zjada lokal. Przed podpisaniem przejdź listę warunków umowy najmu.
      </PageHeader>
      <LokalKalkulator />
    </div>
  );
}
