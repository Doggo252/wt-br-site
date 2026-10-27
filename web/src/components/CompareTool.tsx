"use client";

import Link from "@/components/Link";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CompareStats } from "./CompareStats";
import { ModeToggle } from "./ModeToggle";
import { SearchBox, loadIndex, type SearchRow } from "./SearchBox";
import { MODE_NAME, formatBr, rankToBr } from "@/lib/br";
import { BRANCH_SHORT, type Branch } from "@/lib/branches";
import type { TimeMachine, VersionInfo } from "@/lib/data.gen";
import { nationName } from "@/lib/nations";
import { useMode } from "@/lib/useMode";

const MAX = 5;

/** Categorical series, fixed order. Validated (dataviz checker) against the panel surface:
 * lightness band, chroma, adjacent CVD separation and contrast all pass. Dashes are a second cue. */
const SERIES = [
  { color: "#3987e5", dash: undefined },
  { color: "#d95926", dash: "6 3" },
  { color: "#199e70", dash: "2 3" },
  { color: "#c98500", dash: "8 3 2 3" },
  { color: "#d55181", dash: "1 3" },
];

type Unit = { id: string; name: string; nation: string; branch: string; h: [number, number, number, number][] };

const tmCache = new Map<string, Promise<TimeMachine>>();
function loadTm(branch: string, nation: string) {
  const key = `${branch}/${nation}`;
  if (!tmCache.has(key)) tmCache.set(key, fetch(`/data/timemachine/${key}.json`).then((r) => r.json()));
  return tmCache.get(key)!;
}

function readIds(): string[] {
  const raw = new URLSearchParams(window.location.search).get("ids");
  return raw ? raw.split(",").filter(Boolean).slice(0, MAX) : [];
}

export function CompareTool({ suggestions = [] }: { suggestions?: { label: string; ids: string[] }[] }) {
  const [mode, setMode] = useMode();
  const [ids, setIds] = useState<string[]>([]);
  const [units, setUnits] = useState<Record<string, Unit>>({});
  const [versions, setVersions] = useState<VersionInfo[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL only exists on the client
    setIds(readIds());
    fetch("/data/versions.json")
      .then((r) => r.json())
      .then(setVersions);
  }, []);

  // Load each selected vehicle's history from its nation's time-machine file.
  useEffect(() => {
    let cancelled = false;
    const missing = ids.filter((id) => !units[id]);
    if (!missing.length) return;
    loadIndex().then(async (rows) => {
      const found: Record<string, Unit> = {};
      for (const id of missing) {
        const row = rows.find((r) => r[0] === id);
        if (!row) continue;
        const tm = await loadTm(row[5], row[2]);
        const h = tm.units[id]?.h ?? [];
        found[id] = { id, name: row[1], nation: row[2], branch: row[5], h };
      }
      if (!cancelled) setUnits((u) => ({ ...u, ...found }));
    });
    return () => {
      cancelled = true;
    };
  }, [ids, units]);

  function update(next: string[]) {
    setIds(next);
    const url = new URL(window.location.href);
    if (next.length) url.searchParams.set("ids", next.join(","));
    else url.searchParams.delete("ids");
    window.history.replaceState(null, "", url);
  }

  const shown = ids.filter((id) => units[id]);
  const data = useMemo(() => buildRows(shown.map((id) => units[id]), versions, mode), [shown, units, versions, mode]);
  const values = data.flatMap((r) => shown.map((id) => r[id]).filter((v): v is number => typeof v === "number"));
  const lo = values.length ? Math.floor(Math.min(...values) - 0.34) : 1;
  const hi = values.length ? Math.ceil(Math.max(...values) + 0.34) : 2;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {ids.length < MAX ? (
          <SearchBox
            className="w-72"
            placeholder="Add a vehicle to compare"
            onSelect={(r: SearchRow) => !ids.includes(r[0]) && update([...ids, r[0]])}
          />
        ) : (
          <p className="text-sm text-fg-3">Up to {MAX} vehicles. Remove one to add another.</p>
        )}
        <ModeToggle value={mode} onChange={setMode} />
      </div>

      {ids.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Vehicles being compared">
          {ids.map((id, i) => (
            <li
              key={id}
              className="inline-flex items-center gap-2 panel py-1 pl-2 pr-1 text-sm"
            >
              <svg width="22" height="8" aria-hidden="true">
                <line x1="0" x2="22" y1="4" y2="4" stroke={SERIES[i].color} strokeWidth="2.5" strokeDasharray={SERIES[i].dash} />
              </svg>
              <Link href={`/vehicle/${id}/`} className="font-display">
                {units[id]?.name ?? id}
              </Link>
              {units[id] && (
                <span className="text-xs text-fg-3">
                  {BRANCH_SHORT[units[id].branch as Branch]} · {nationName(units[id].nation)}
                </span>
              )}
              <button
                type="button"
                onClick={() => update(ids.filter((x) => x !== id))}
                aria-label={`Remove ${units[id]?.name ?? id}`}
                className="min-h-7 min-w-7 text-fg-3 hover:text-fg"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {shown.length === 0 ? (
        <div className="panel space-y-3 p-6">
          <p className="text-sm text-fg-2">
            Add vehicles above to see their {MODE_NAME[mode]} BR history on one chart, or start from one of these:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((g) => (
              <button key={g.label} type="button" className="btn" onClick={() => update(g.ids)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <figure className="panel p-3 sm:p-4">
          <figcaption className="sr-only">{MODE_NAME[mode]} BR over time</figcaption>
          <div className="h-72 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid vertical={false} stroke="var(--color-card-border)" />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  ticks={yearTicks(data)}
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
                    const row = payload?.[0]?.payload as Row | undefined;
                    if (!active || !row) return null;
                    return (
                      <div className="border border-card-border bg-bg/95 px-3 py-2 text-sm shadow-lg">
                        <div className="mb-1 text-xs text-fg-3">
                          {row.v ? `Update ${row.v} · ` : ""}
                          {new Date(row.t).toISOString().slice(0, 10)}
                        </div>
                        {shown.map((id) => (
                          <div key={id} className="flex items-center justify-between gap-6">
                            <span className="inline-flex items-center gap-1.5 text-fg-2">
                              <span className="inline-block h-0.5 w-3" style={{ background: SERIES[ids.indexOf(id)].color }} />
                              {units[id].name}
                            </span>
                            <span className="font-display tabular text-fg">
                              {typeof row[id] === "number" ? (row[id] as number).toFixed(1) : "not in game"}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                {shown.map((id) => {
                  const s = SERIES[ids.indexOf(id)];
                  return (
                    <Line
                      key={id}
                      dataKey={id}
                      name={units[id].name}
                      type="stepAfter"
                      stroke={s.color}
                      strokeWidth={2.5}
                      strokeDasharray={s.dash}
                      dot={false}
                      activeDot={{ r: 4, stroke: "var(--color-panel)", strokeWidth: 2, fill: s.color }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>
      )}

      {shown.length > 0 && (
        <CompareStats ids={shown} names={Object.fromEntries(shown.map((id) => [id, units[id].name]))} />
      )}

      {shown.length > 0 && (
        <table className="data-table w-full panel text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 font-semibold">Vehicle</th>
              <th className="px-3 py-2 text-right font-semibold">First {mode.toUpperCase()}</th>
              <th className="px-3 py-2 text-right font-semibold">Now</th>
              <th className="px-3 py-2 text-right font-semibold">Changes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {shown.map((id) => {
              const h = units[id].h;
              const col = mode === "ab" ? 1 : mode === "rb" ? 2 : 3;
              const changes = h.slice(1).filter((p, i) => p[col] !== h[i][col]).length;
              return (
                <tr key={id}>
                  <td className="px-3 py-1.5">
                    <Link href={`/vehicle/${id}/`} className="font-display">
                      {units[id].name}
                    </Link>
                  </td>
                  <td className="px-3 py-1.5 text-right font-display tabular text-fg-2">{h[0] ? formatBr(h[0][col]) : "–"}</td>
                  <td className="px-3 py-1.5 text-right font-display tabular">{h.length ? formatBr(h[h.length - 1][col]) : "–"}</td>
                  <td className="px-3 py-1.5 text-right tabular text-fg-2">{changes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

type Row = { t: number; v?: string } & Record<string, number | string | null | undefined>;

/** One row per date where any selected vehicle changed, with each vehicle's BR at that date. */
function buildRows(units: Unit[], versions: VersionInfo[] | null, mode: "ab" | "rb" | "sb"): Row[] {
  if (!versions || !units.length) return [];
  const col = mode === "ab" ? 1 : mode === "rb" ? 2 : 3;
  const idxs = [...new Set(units.flatMap((u) => u.h.map((p) => p[0])))].sort((a, b) => a - b);
  const rows: Row[] = idxs.map((i) => {
    const row: Row = { t: Date.parse(versions[i].d), v: versions[i].v };
    for (const u of units) {
      const p = [...u.h].reverse().find((x) => x[0] <= i);
      row[u.id] = p ? rankToBr(p[col]) : null;
    }
    return row;
  });
  // Extend every line to the latest version.
  const last = versions[versions.length - 1];
  if (rows.length && Date.parse(last.d) > rows[rows.length - 1].t) {
    rows.push({ ...rows[rows.length - 1], t: Date.parse(last.d), v: last.v });
  }
  return rows;
}

function yearTicks(rows: Row[]): number[] {
  if (!rows.length) return [];
  const out = [];
  for (let y = new Date(rows[0].t).getUTCFullYear() + 1; y <= new Date(rows[rows.length - 1].t).getUTCFullYear(); y++) {
    out.push(Date.UTC(y, 0, 1));
  }
  return out;
}
