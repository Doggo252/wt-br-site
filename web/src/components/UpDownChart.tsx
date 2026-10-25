"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Arrow } from "./Arrow";

export type UpDownRow = { year: string; up: number; down: number };

/**
 * Realistic Battles uptiers (above the axis) and downtiers (below) per year.
 * Uses the site's bad/good colors because the direction is the message; the legend, arrows
 * and tooltip carry it as text too.
 */
export function UpDownChart({ data }: { data: UpDownRow[] }) {
  const rows = data.map((d) => ({ ...d, downNeg: -d.down }));
  const peak = Math.max(1, ...data.map((d) => Math.max(d.up, d.down)));
  const step = niceStep(peak);
  const max = step * Math.ceil(peak / step);
  const ticks: number[] = [];
  for (let t = -max; t <= max; t += step) ticks.push(t);
  return (
    <figure className="panel p-3 sm:p-4">
      <figcaption className="mb-2 flex gap-4 text-sm text-fg-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-bad" aria-hidden />
          <Arrow dir="up" className="text-bad" /> Uptiers
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-good" aria-hidden />
          <Arrow dir="down" className="text-good" /> Downtiers
        </span>
      </figcaption>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} stackOffset="sign" margin={{ top: 8, right: 12, bottom: 0, left: -8 }} barCategoryGap="25%">
            <CartesianGrid vertical={false} stroke="var(--color-card-border)" />
            <XAxis
              dataKey="year"
              tick={{ fill: "var(--color-fg-3)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[-max, max]}
              ticks={ticks}
              tickFormatter={(v: number) => String(Math.abs(v))}
              tick={{ fill: "var(--color-fg-3)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <ReferenceLine y={0} stroke="var(--color-fg-3)" />
            <Tooltip
              isAnimationActive={false}
              cursor={{ fill: "var(--color-header)", opacity: 0.5 }}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as UpDownRow | undefined;
                if (!active || !p) return null;
                return (
                  <div className="border border-card-border bg-bg/95 px-3 py-2 text-sm shadow-lg">
                    <div className="font-display text-fg">{p.year}</div>
                    <div className="text-bad">{p.up} uptiers</div>
                    <div className="text-good">{p.down} downtiers</div>
                  </div>
                );
              }}
            />
            <Bar dataKey="up" stackId="s" fill="var(--color-bad)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="downNeg" stackId="s" fill="var(--color-good)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

/** A round tick step giving at most four ticks on each side of zero. */
function niceStep(max: number): number {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  return ([1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow);
}
