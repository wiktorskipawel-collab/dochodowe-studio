import { Lessons } from "@/components/Lessons";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Lekcje · Marketing OS" };

export default function Lekcje() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Lekcje" title="Kurs Dochodowego Studia przy każdym kroku">
        Lekcje są przypięte do kroków ścieżki. Odhaczaj obejrzane, a postęp zobaczysz na pulpicie.
      </PageHeader>
      <Lessons />
    </div>
  );
}
