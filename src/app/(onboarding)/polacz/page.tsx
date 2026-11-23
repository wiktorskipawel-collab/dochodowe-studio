import { AiConnect } from "@/components/AiConnect";
import { BartekSays } from "@/components/Survey";

export const metadata = { title: "Połącz AI · Marketing OS" };

export default function Polacz() {
  return (
    <div className="flex flex-col gap-6">
      <div className="glass-strong rounded-3xl p-5 md:p-6">
        <BartekSays text="Cześć! Tu Bartłomiej Sikorski, a dokładniej mój asystent AI. Zanim zaczniemy, połącz swój ChatGPT. To zajmie chwilę, a potem przeprowadzę Cię przez krótką ankietę." />
      </div>
      <AiConnect />
    </div>
  );
}
