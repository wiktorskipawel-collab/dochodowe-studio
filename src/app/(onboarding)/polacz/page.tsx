import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AiConnect } from "@/components/AiConnect";
import { BartekSays } from "@/components/Survey";

export const metadata = { title: "Połącz AI · Marketing OS" };

export default function Polacz() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
        <ArrowLeft className="size-4" aria-hidden="true" />Wróć do pulpitu
      </Link>
      <div className="glass-strong rounded-3xl p-5 md:p-6">
        <BartekSays text="Połącz swój ChatGPT, a w każdym kroku popracujemy razem: ja zadaję pytania, Ty zatwierdzasz dokumenty. To zajmie chwilę." />
      </div>
      <AiConnect />
    </div>
  );
}
