import { Documents } from "@/components/Documents";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Dokumenty · Marketing OS" };

export default function Dokumenty() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Twoje dokumenty" title="Wszystko, co powstało na ścieżce">
        Każdy krok kończy się dokumentem. Asystent korzysta z zatwierdzonych dokumentów w kolejnych krokach, więc nie musisz powtarzać tych samych informacji.
      </PageHeader>
      <Documents />
    </div>
  );
}
