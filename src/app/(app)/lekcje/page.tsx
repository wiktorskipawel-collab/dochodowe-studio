import { Lessons } from "@/components/Lessons";

export const metadata = { title: "Lekcje · Marketing OS" };

export default function Lekcje() {
  return (
    <div className="flex flex-col gap-5">
      <Lessons />
    </div>
  );
}
