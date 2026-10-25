"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type TopBrPoint = { t: number; v: string; br: number };

/** Highest ground RB Battle Rating in the game over time: a single stepped series. */
export function TopBrChart({ data }: { data: TopBrPoint[] }) {
  const lo = Math.floor(Math.min(...data.map((d) => d.br)) - 0.5);
  const hi = Math.ceil(Math.max(...data.map((d) => d.br)) + 0.5);
  const years: number[] = [];
  for (let y = new Date(data[0].t).getUTCFullYear() + 1; y <= new Date(data[data.length - 1].t).getUTCFullYear(); y++) {
    years.push(Date.UTC(y, 0, 1));
  }
  return (
    <figure className="panel p-3 sm:p-4">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke="var(--color-card-border)" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={years}
              tickFormatter={(t: number) => new Date(t).getUTCFullYear().toString()}
              tick={{ fill: "var(--color-fg-3)", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-card-border)" }}
            />
            <YAxis
              domain={[lo, hi]}
              ticks={Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)}
              tickFormatter={(v: number) => v.toFixed(1)}
              tick={{ fill: "var(--color-fg-3)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: "var(--color-fg-3)", strokeWidth: 1 }}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as TopBrPoint | undefined;
                if (!active || !p) return null;
                return (
                  <div className="border border-card-border bg-bg/95 px-3 py-2 text-sm shadow-lg">
                    <div className="font-display text-fg">Update {p.v}</div>
                    <div className="text-xs text-fg-3">{new Date(p.t).toISOString().slice(0, 10)}</div>
                    <div className="mt-1 font-display tabular text-fg">Top BR {p.br.toFixed(1)}</div>
                  </div>
                );
              }}
            />
            <Line
              dataKey="br"
              type="stepAfter"
              stroke="var(--color-mode-rb)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, stroke: "var(--color-panel)", strokeWidth: 2, fill: "var(--color-mode-rb)" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
