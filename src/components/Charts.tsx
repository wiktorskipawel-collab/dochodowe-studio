"use client";

// Wykresy pulpitu uczestnika: klocki wspólne (karta z tabelą danych, pierścień, pasek segmentowy, mierniki, mapa aktywności).
// Uwaga (walidator dataviz, 2026-11-27): para --viz-done #4fb52a / --viz-progress #bd8222 nie przechodzi testu daltonizmu
// (deutan ΔE 3,0) — do stanów kroków pulpit używa --viz-st-* (globals.css) i zawsze ikony. Tło toru rgba(255,255,255,.09),
// złota rampa aktywności (--heat-1…5).
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export function ChartCard({ title, subtitle, children, table, className = "" }: { title: string; subtitle?: string; children: ReactNode; table?: ReactNode; className?: string }) {
  return (
    <section className={`glass-card flex flex-col gap-4 rounded-2xl p-5 md:p-6 ${className}`}>
      <header>
        <h2 className="text-base font-bold">{title}</h2>
        {subtitle ? <p className="text-sm text-white/65">{subtitle}</p> : null}
      </header>
      {children}
      {table ? (
        <details className="text-sm text-white/75">
          <summary className="cursor-pointer select-none text-xs font-semibold text-white/60 hover:text-white">Pokaż dane w tabeli</summary>
          <div className="mt-2 overflow-x-auto">{table}</div>
        </details>
      ) : null}
    </section>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-left">
      <thead><tr className="border-b border-white/10 text-xs text-white/60">{head.map((h) => <th key={h} scope="col" className="py-1.5 pr-3 font-medium">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-white/5">{r.map((c, j) => <td key={j} className="py-1.5 pr-3 tabular-nums">{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

/** Pierścień (miernik jednej proporcji). */
export function Ring({ value, size = 120, stroke = 10, color = "var(--viz-done)", label, sub }: { value: number; size?: number; stroke?: number; color?: string; label?: string; sub?: string }) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label ?? "Postęp"}: ${v}%`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--viz-track)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v / 100) }}
          transition={{ duration: reduce ? 0 : 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center" aria-hidden="true">
        <div className="font-extrabold leading-none" style={{ fontSize: size * 0.24 }}>{v}%</div>
        {sub ? <div className="mt-1 text-[11px] text-white/65">{sub}</div> : null}
      </div>
    </div>
  );
}

/** Wysoki pasek segmentowy: jeden całość, ≤ 6 części, z legendą. */
export function SegmentedBar({ parts, total }: { parts: { label: string; value: number; color: string }[]; total: number }) {
  const shown = parts.filter((p) => p.value > 0);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-7 w-full gap-[2px] overflow-hidden rounded-md" role="img" aria-label={parts.map((p) => `${p.label}: ${p.value} z ${total}`).join(", ")}>
        {shown.map((p) => (
          <motion.div
            key={p.label}
            initial={{ flexGrow: 0 }}
            animate={{ flexGrow: p.value }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="flex min-w-0 items-center rounded-[4px] px-2 text-xs font-bold"
            style={{ background: p.color, flexBasis: 0, color: p.color === "var(--viz-track)" ? "rgba(255,255,255,.75)" : "#0b1410" }}
            title={`${p.label}: ${p.value}`}
          >
            {p.value / total >= 0.12 ? p.value : ""}
          </motion.div>
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-white/80">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2"><span className="size-3 rounded-[3px]" style={{ background: p.color }} aria-hidden="true" />{p.label} <span className="text-white/55">{p.value}</span></li>
        ))}
      </ul>
    </div>
  );
}

/** Lista mierników: nazwa, pasek, liczba. */
export function MeterList({ rows, color = "var(--viz-done)" }: { rows: { label: string; value: number; note: string }[]; color?: string }) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[180px_minmax(0,1fr)_64px]">
          <span className="truncate text-sm">{r.label}</span>
          <span className="text-right text-sm text-white/70 sm:order-3">{r.note}</span>
          <span className="col-span-2 h-2 overflow-hidden rounded-full sm:order-2 sm:col-span-1" style={{ background: "var(--viz-track)" }} aria-hidden="true">
            <motion.span className="block h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${r.value}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Mapa aktywności (ostatnie tygodnie), złota rampa — więcej działań = jaśniej. */
export function Heatmap({ cols }: { cols: { key: string; label: string; count: number; future: boolean }[][] }) {
  const max = Math.max(1, ...cols.flat().map((d) => d.count));
  const shade = (n: number) => (n === 0 ? "var(--viz-track)" : `var(--heat-${Math.min(5, Math.max(1, Math.ceil((n / max) * 5)))})`);
  const days = ["pn", "wt", "śr", "cz", "pt", "sb", "nd"];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex flex-col justify-between py-0.5 text-[10px] text-white/50" aria-hidden="true">{days.map((d, i) => <span key={d} className={i % 2 ? "invisible" : ""}>{d}</span>)}</div>
        <div className="grid flex-1 gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 22px))` }} role="img" aria-label="Mapa Twojej aktywności w ostatnich tygodniach">
          {cols.map((col, i) => (
            <div key={i} className="grid gap-[3px]">
              {col.map((d) => (
                <span key={d.key} title={d.future ? "" : `${d.label}: ${d.count} ${d.count === 1 ? "działanie" : "działań"}`} className="aspect-square rounded-[3px]" style={{ background: d.future ? "transparent" : shade(d.count) }} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 text-[11px] text-white/55" aria-hidden="true">
        mniej {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="size-3 rounded-[3px]" style={{ background: i === 0 ? "var(--viz-track)" : `var(--heat-${i})` }} />)} więcej
      </div>
    </div>
  );
}

const xpConfig = { xp: { label: "Punkty XP", color: "var(--chart-2)" } } satisfies ChartConfig;

/** XP narastająco — jeden szereg, złoto DS. */
export function XpArea({ data }: { data: { label: string; xp: number }[] }) {
  return (
    <ChartContainer config={xpConfig} className="aspect-auto h-56 w-full">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-xp)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-xp)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,.07)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} />
        <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
        <ChartTooltip cursor={{ stroke: "rgba(255,255,255,.25)" }} content={<ChartTooltipContent indicator="line" />} />
        <Area dataKey="xp" type="monotone" stroke="var(--color-xp)" strokeWidth={2} fill="url(#xpFill)" activeDot={{ r: 5, strokeWidth: 2, stroke: "#0f1f19" }} />
      </AreaChart>
    </ChartContainer>
  );
}

const msgConfig = { msgs: { label: "Twoje wiadomości", color: "var(--chart-1)" } } satisfies ChartConfig;

/** Rozmowy z asystentem w każdym kroku — jeden szereg, zieleń DS. */
export function MessagesBars({ data }: { data: { label: string; msgs: number }[] }) {
  return (
    <ChartContainer config={msgConfig} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,.07)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
        <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
        <ChartTooltip cursor={{ fill: "rgba(255,255,255,.06)" }} content={<ChartTooltipContent />} />
        <Bar dataKey="msgs" fill="var(--color-msgs)" radius={[4, 4, 0, 0]} barSize={20} />
      </BarChart>
    </ChartContainer>
  );
}
