import { PathMap } from "@/components/PathMap";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Twoja ścieżka · Marketing OS" };

export default function Sciezka() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Twoja ścieżka" title="Krok po kroku według metodyki Dochodowego Studia">
        Każdy krok kończy się dokumentem, który zatwierdzasz. Kolejny krok odblokowuje się po zatwierdzeniu poprzedniego.
      </PageHeader>
      <PathMap />
    </div>
  );
}
