import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { findTool, toolCategory, toolIds, toolMeta } from "@/lib/tools";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { PageHeader } from "@/components/ui";

export function generateStaticParams() {
  return toolIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tool = findTool(id);
  return { title: tool ? `${tool.title} · Szybkie akcje · Marketing OS` : "Marketing OS" };
}

export default async function Narzedzie({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tool = findTool(id);
  if (!tool) notFound();
  const category = toolCategory(tool.category);

  // Do przeglądarki trafia toolMeta (bez instrukcji dla AI); instrukcję dokłada serwer w /api/assistant.
  return (
    <div className="flex flex-col gap-5">
      <Link href="/narzedzia" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl px-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white">
        <ArrowLeft className="size-4" aria-hidden="true" />Wszystkie szybkie akcje
      </Link>
      <PageHeader eyebrow={`Szybkie akcje · ${category?.title ?? ""}`} title={tool.title}>
        {tool.desc}
      </PageHeader>
      <ToolWorkspace tool={toolMeta(tool)} />
    </div>
  );
}
