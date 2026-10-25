"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MODES, MODE_LABEL, MODE_NAME, rankToBr, type Mode } from "@/lib/br";
import type { HistoryPoint } from "@/lib/data.gen";

const SERIES: Record<Mode, { color: string; dash?: string; width: number }> = {
  ab: { color: "var(--color-mode-ab)", dash: "6 4", width: 2 },
  rb: { color: "var(--color-mode-rb)", width: 2.5 },
  sb: { color: "var(--color-mode-sb)", dash: "2 3", width: 2 },
};

type Row = {
  t: number;
  v: string;
  ab: number | null;
  rb: number | null;
  sb: number | null;
  end?: boolean;
  /** A future point showing Gaijin's announced BR. */
  planned?: boolean;
  abPlan?: number;
  rbPlan?: number;
  sbPlan?: number;
};

/** How far right the planned step is drawn; the announced change has no exact date. */
const PLAN_DAYS = 45;

type Props = {
  history: HistoryPoint[];
  /** Date of the latest data, so the last step runs to the present. */
  asOf: string;
  /** Announced but not yet live: new ranks per mode, and the announcement date. */
  planned?: { date: string; ab?: number; rb?: number; sb?: number };
};

/** BR over time, one stepped line per game mode. Steps hold until the next change. */
export function BrStepChart({ history, asOf, planned }: Props) {
  const [hidden, setHidden] = useState<Set<Mode>>(new Set());

  const rows: Row[] = history.map((h) => ({
    t: Date.parse(h.d),
    v: h.v,
    ab: rankToBr(h.ab),
    rb: rankToBr(h.rb),
    sb: rankToBr(h.sb),
  }));
  const last = rows[rows.length - 1];
  const end = Date.parse(asOf.slice(0, 10));
  if (last && end > last.t) rows.push({ ...last, t: end, end: true });
  const plannedModes = MODES.filter((m) => planned?.[m] !== undefined);
  if (planned && plannedModes.length && rows.length) {
    const now = rows[rows.length - 1];
    const day = 86_400_000;
    // Step up right after today and hold, so the jump is visible.
    const soon: Row = { t: now.t + day, v: "", ab: null, rb: null, sb: null, planned: true };
    const later: Row = { ...soon, t: now.t + PLAN_DAYS * day };
    for (const m of plannedModes) {
      now[`${m}Plan`] = now[m] ?? undefined;
      soon[`${m}Plan`] = later[`${m}Plan`] = rankToBr(planned[m]!);
    }
    rows.push(soon, later);
  }

  const values = rows.flatMap((r) =>
    MODES.filter((m) => !hidden.has(m)).flatMap((m) => [r[m], r[`${m}Plan`]].filter((v): v is number => typeof v === "number")),
  );
  const lo = Math.floor(Math.min(...values, 99) - 0.34);
  const hi = Math.ceil(Math.max(...values, 0) + 0.34);
  const ticks = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

  function toggle(m: Mode) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else if (next.size < MODES.length - 1) next.add(m);
      return next;
    });
  }

  return (
    <figure className="panel p-3 sm:p-4">
      <figcaption className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => toggle(m)}
            aria-pressed={!hidden.has(m)}
            className={`inline-flex items-center gap-2 font-display ${hidden.has(m) ? "text-fg-3 line-through" : "text-fg-2 hover:text-fg"}`}
          >
            <svg width="24" height="8" aria-hidden="true">
              <line
                x1="0"
                x2="24"
                y1="4"
                y2="4"
                stroke={SERIES[m].color}
                strokeWidth={SERIES[m].width}
                strokeDasharray={SERIES[m].dash}
              />
            </svg>
            {MODE_NAME[m]}
          </button>
        ))}
        <span className="ml-auto text-xs text-fg-3">Click a mode to hide it</span>
      </figcaption>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke="var(--color-card-border)" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(t: number) => new Date(t).getUTCFullYear().toString()}
              ticks={yearTicks(rows)}
              stroke="var(--color-fg-3)"
              tick={{ fill: "var(--color-fg-3)", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-card-border)" }}
            />
            <YAxis
              domain={[lo, hi]}
              ticks={ticks}
              tickFormatter={(v: number) => v.toFixed(1)}
              tick={{ fill: "var(--color-fg-3)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              content={<ChartTooltip hidden={hidden} plannedDate={planned?.date} />}
              cursor={{ stroke: "var(--color-fg-3)", strokeWidth: 1 }}
              isAnimationActive={false}
            />
            {MODES.filter((m) => !hidden.has(m)).map((m) => (
              <Line
                key={m}
                dataKey={m}
                type="stepAfter"
                stroke={SERIES[m].color}
                strokeWidth={SERIES[m].width}
                strokeDasharray={SERIES[m].dash}
                dot={false}
                activeDot={{ r: 4, stroke: "var(--color-panel)", strokeWidth: 2, fill: SERIES[m].color }}
                isAnimationActive={false}
              />
            ))}
            {plannedModes
              .filter((m) => !hidden.has(m))
              .map((m) => (
                <Line
                  key={`${m}-plan`}
                  dataKey={`${m}Plan`}
                  type="stepAfter"
                  stroke={SERIES[m].color}
                  strokeOpacity={0.6}
                  strokeWidth={2}
                  strokeDasharray="3 4"
                  dot={false}
                  activeDot={false}
                  connectNulls
                  isAnimationActive={false}
                  legendType="none"
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

function yearTicks(rows: Row[]): number[] {
  if (rows.length === 0) return [];
  const first = new Date(rows[0].t).getUTCFullYear() + 1;
  const last = new Date(rows[rows.length - 1].t).getUTCFullYear();
  const out = [];
  for (let y = first; y <= last; y++) out.push(Date.UTC(y, 0, 1));
  return out;
}

function ChartTooltip({
  active,
  payload,
  hidden,
  plannedDate,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
  hidden: Set<Mode>;
  plannedDate?: string;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  if (row.planned) {
    return (
      <div className="border border-card-premium-border bg-bg/95 px-3 py-2 text-sm shadow-lg">
        <div className="mb-1 font-display text-gold">Planned by Gaijin</div>
        <div className="mb-1 text-xs text-fg-3">Announced {plannedDate}, not live yet</div>
        {MODES.filter((m) => !hidden.has(m) && typeof row[`${m}Plan`] === "number").map((m) => (
          <div key={m} className="flex items-center justify-between gap-6">
            <span className="text-fg-2">{MODE_LABEL[m]}</span>
            <span className="font-display tabular text-fg">{(row[`${m}Plan`] as number).toFixed(1)}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="border border-card-border bg-bg/95 px-3 py-2 text-sm shadow-lg">
      <div className="mb-1 font-display text-fg">
        {row.end ? "Current" : `Update ${row.v}`}
        <span className="ml-2 text-xs text-fg-3">{new Date(row.t).toISOString().slice(0, 10)}</span>
      </div>
      {MODES.filter((m) => !hidden.has(m)).map((m) => (
        <div key={m} className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-1.5 text-fg-2">
            <span className="inline-block h-0.5 w-3" style={{ background: SERIES[m].color }} />
            {MODE_LABEL[m]}
          </span>
          <span className="font-display tabular text-fg">{row[m]?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}
