"use client";

// Wykresy pulpitu na komponentach shadcn (Card + Chart/Recharts), w barwach DS.
// Kolory sprawdzone walidatorem dataviz w trybie ciemnym: etapy = zielona rampa (ordinal),
// tydzień = zieleń / złoto / niebieski (categorical), linia = jeden szereg.
import * as React from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, RadialBar, RadialBarChart, XAxis } from "recharts";
import { TrendingUpIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

// ---------- 1. Kołowy z siatką: postęp w etapach ----------
export function PhasesRadial({ phases }: { phases: { phase: string; pct: number; done: number; total: number }[] }) {
  const keys = phases.map((_, i) => `p${i + 1}`);
  const config = Object.fromEntries([["pct", { label: "Postęp" }], ...phases.map((p, i) => [keys[i], { label: p.phase, color: `var(--phase-${i + 1})` }])]) satisfies ChartConfig;
  const data = phases.map((p, i) => ({ key: keys[i], pct: Math.max(p.pct, 2), real: p.pct, fill: `var(--color-${keys[i]})` }));
  const best = [...phases].sort((a, b) => b.pct - a.pct)[0];
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Postęp w etapach</CardTitle>
        <CardDescription>Ile procent każdego etapu ścieżki masz zatwierdzone</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[260px]">
          <RadialBarChart data={data} innerRadius={32} outerRadius={110} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="key" formatter={(_v, _n, item) => (
              <span className="flex w-full justify-between gap-4"><span>{config[item.payload.key as string]?.label}</span><strong>{item.payload.real}%</strong></span>
            )} />} />
            <PolarGrid gridType="circle" stroke="rgba(255,255,255,.08)" />
            <RadialBar dataKey="pct" background={{ fill: "rgba(255,255,255,.05)" }} cornerRadius={6} />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-3 text-sm">
        <ul className="grid w-full gap-1.5">
          {phases.map((p, i) => (
            <li key={p.phase} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2"><span className="size-3 rounded-[3px]" style={{ background: `var(--phase-${i + 1})` }} aria-hidden="true" />{p.phase}</span>
              <span className="tabular-nums text-muted-foreground">{p.done}/{p.total} · {p.pct}%</span>
            </li>
          ))}
        </ul>
        {best && best.pct > 0 ? (
          <div className="flex items-center gap-2 font-medium leading-none">Najdalej jesteś w etapie „{best.phase}” <TrendingUpIcon className="size-4 text-brand" /></div>
        ) : null}
      </CardFooter>
    </Card>
  );
}

// ---------- 2. Słupki piętrowe: Twój tydzień ----------
const weekConfig = {
  dokumenty: { label: "Dokumenty", color: "var(--chart-1)" },
  lekcje: { label: "Lekcje", color: "var(--chart-4)" },
  rozmowy: { label: "Rozmowy", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function WeekStacked({ data }: { data: { label: string; rozmowy: number; lekcje: number; dokumenty: number }[] }) {
  const total = data.reduce((s, d) => s + d.rozmowy + d.lekcje + d.dokumenty, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Twój tydzień</CardTitle>
        <CardDescription>Ostatnie 7 dni · {total} {total === 1 ? "działanie" : "działań"}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={weekConfig} className="aspect-auto h-[260px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ top: 8, left: 4, right: 4 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,.07)" />
            <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} />
            <Bar dataKey="dokumenty" stackId="a" fill="var(--color-dokumenty)" radius={[0, 0, 4, 4]} barSize={24} stroke="#0f1f19" strokeWidth={2} />
            <Bar dataKey="lekcje" stackId="a" fill="var(--color-lekcje)" barSize={24} stroke="#0f1f19" strokeWidth={2} />
            <Bar dataKey="rozmowy" stackId="a" fill="var(--color-rozmowy)" radius={[4, 4, 0, 0]} barSize={24} stroke="#0f1f19" strokeWidth={2} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} cursor={false} />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ---------- 3. Interaktywny liniowy: XP i działania ----------
const lineConfig = {
  views: { label: "Dzień" },
  xp: { label: "Punkty XP", color: "var(--chart-2)" },
  dzialania: { label: "Działania", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ActivityLine({ data }: { data: { day: string; label: string; xp: number; dzialania: number }[] }) {
  const [active, setActive] = React.useState<"xp" | "dzialania">("xp");
  const total = React.useMemo(() => ({ xp: data.reduce((s, d) => s + d.xp, 0), dzialania: data.reduce((s, d) => s + d.dzialania, 0) }), [data]);
  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b border-white/10 p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:py-5">
          <CardTitle>Twoja aktywność w czasie</CardTitle>
          <CardDescription>Ostatnie {data.length} dni · przełącz widok obok</CardDescription>
        </div>
        <div className="flex" role="tablist" aria-label="Wybierz dane na wykresie">
          {(["xp", "dzialania"] as const).map((key) => (
            <button key={key} type="button" role="tab" aria-selected={active === key} data-active={active === key} onClick={() => setActive(key)}
              className="flex flex-1 flex-col justify-center gap-1 border-t border-white/10 px-6 py-4 text-left transition even:border-l data-[active=true]:bg-white/[0.06] sm:border-t-0 sm:border-l sm:px-8 sm:py-6">
              <span className="text-xs text-muted-foreground">{lineConfig[key].label}</span>
              <span className="text-lg leading-none font-bold sm:text-3xl">{total[key].toLocaleString("pl-PL")}</span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={lineConfig} className="aspect-auto h-[250px] w-full">
          <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,.07)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
            <ChartTooltip content={<ChartTooltipContent className="w-[160px]" nameKey="views" labelFormatter={(_v, p) => (p?.[0]?.payload?.day ? new Date(p[0].payload.day).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }) : "")} />} />
            <Line dataKey={active} type="monotone" stroke={`var(--color-${active})`} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "#0f1f19", strokeWidth: 2 }} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
