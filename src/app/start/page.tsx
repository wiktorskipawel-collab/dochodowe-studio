import { AiConnect } from "@/components/AiConnect";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Połącz AI · Marketing OS" };

export default function Start() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Krok 0 · Zanim zaczniemy" title="Połącz swoje AI">
        Asystent Marketing OS pracuje na Twoim ChatGPT albo Claude. Metodyka, ścieżka, postęp i Twoje dokumenty zostają w Dochodowym Studiu.
      </PageHeader>
      <AiConnect />
    </div>
  );
}
