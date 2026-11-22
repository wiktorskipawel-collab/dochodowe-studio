import { Survey } from "@/components/Survey";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Ankieta · Marketing OS" };

export default function Ankieta() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Krok 1 · Diagnoza" title="Na jakim etapie jest Twoje studio?">
        Kilka pytań, żeby dobrać ścieżkę do Ciebie. Szczegóły dopytamy w kolejnych krokach.
      </PageHeader>
      <Survey />
    </div>
  );
}
