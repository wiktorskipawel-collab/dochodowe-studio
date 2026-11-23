import { notFound } from "next/navigation";
import { STEPS } from "@/lib/journey";
import { StepWorkspace } from "@/components/StepWorkspace";
import { PageHeader } from "@/components/ui";

export function generateStaticParams() {
  return STEPS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/krok/[id]">) {
  const { id } = await params;
  const step = STEPS.find((s) => s.id === id);
  return { title: step ? `${step.title} · Marketing OS` : "Marketing OS" };
}

export default async function Krok({ params }: PageProps<"/krok/[id]">) {
  const { id } = await params;
  const step = STEPS.find((s) => s.id === id);
  if (!step) notFound();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow={`Krok ${step.no} · ${step.phase}`} title={step.title}>
        {step.goal}
      </PageHeader>
      <StepWorkspace stepId={step.id} />
    </div>
  );
}
