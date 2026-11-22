import { TriangleAlert, BarChart3, Flag } from "lucide-react";
import { GlassCard, Pill, PageHeader } from "@/components/ui";
import { studios, alerts } from "@/lib/data";

export const metadata = { title: "Panel zespołu · Marketing OS" };

const KPI = [
  { label: "Aktywne w tym tygodniu", value: "84 / 100" },
  { label: "Wymaga interwencji", value: "7", tone: "text-red-300" },
  { label: "Średni postęp ścieżki", value: "41%" },
  { label: "Koszt AI w tym miesiącu", value: "186 zł", note: "limit: 20 zł na osobę" },
];

const ALERT_ICON = { bad: TriangleAlert, warn: BarChart3, accent: Flag } as const;
const ALERT_COLOR = { bad: "text-red-300", warn: "text-amber-300", accent: "text-accent" } as const;

export default function Zespol() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Panel zespołu DS · dane przykładowe" title="Przegląd studiów">
        Wyniki, aktywność, diagnozy AI i sprawy, w których trzeba zadzwonić do uczestnika.
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI.map((k) => (
          <GlassCard key={k.label} lift>
            <p className="text-sm text-white/70">{k.label}</p>
            <p className={`mt-1 text-3xl font-semibold tabular-nums ${k.tone ?? ""}`}>{k.value}</p>
            {k.note ? <p className="mt-1 text-sm text-white/65">{k.note}</p> : null}
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <GlassCard>
          <h2 className="mb-3 text-lg font-semibold">Studia</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/65">
                  <th scope="col" className="py-2 pr-3 font-medium">Studio</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Moduł</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Ostatnio</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Leady 30 dni</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Koszt leada</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Sygnał</th>
                  <th scope="col" className="py-2 text-right font-medium">AI / mies.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {studios.map((s) => (
                  <tr key={s.name} className="hover:bg-white/5">
                    <td className="py-3 pr-3 font-medium">{s.name}</td>
                    <td className="py-3 pr-3 text-white/80">{s.module}</td>
                    <td className="py-3 pr-3 text-white/80">{s.last}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">{s.leads}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">{s.cpl}</td>
                    <td className="py-3 pr-3"><Pill tone={s.signal.tone}>{s.signal.text}</Pill></td>
                    <td className="py-3 text-right tabular-nums text-white/80">{s.ai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <aside className="flex flex-col gap-4" aria-label="Alerty">
          <h2 className="text-lg font-semibold">Alerty dla zespołu</h2>
          {alerts.map((a) => {
            const Icon = ALERT_ICON[a.tone];
            return (
              <GlassCard key={a.title} className="flex gap-3">
                <Icon className={`size-5 shrink-0 ${ALERT_COLOR[a.tone]}`} aria-hidden="true" />
                <div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="mt-1 text-sm text-white/70">{a.text}</p>
                </div>
              </GlassCard>
            );
          })}
          <GlassCard>
            <h3 className="font-semibold">Pytania bez dobrej odpowiedzi</h3>
            <p className="mt-1 text-sm text-white/70">Tu AI nie znalazło zasady w metodyce. Odpowiedź Bartka trafia do bazy wiedzy.</p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              <li>„Jak wycenić karnet dla seniorów?” · 3 osoby</li>
              <li>„Konkurs na Instagramie czy na Facebooku?” · 2 osoby</li>
            </ul>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}
