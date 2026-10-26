"use client";

import { useEffect, useMemo, useState } from "react";
import { BranchIcon } from "./BranchIcon";
import { Flag } from "./Flag";
import { ModeToggle } from "./ModeToggle";
import { UnitCard } from "./UnitCard";
import { MODE_NAME, formatBr } from "@/lib/br";
import { BRANCHES, BRANCH_NAME, BRANCH_SHORT, type Branch } from "@/lib/branches";
import { nationName } from "@/lib/nations";
import { useMode } from "@/lib/useMode";
import type { UnitStatus } from "@/lib/units";

/**
 * [id, name, nation, branch, type, status index, hidden, ab, rb, sb, image, planned, price] from
 * /data/lineup.json, plus [13] today's ranks when the planned BRs are being shown instead.
 */
type Row = [
  string, string, string, Branch, string, number, number, number, number, number, number, Planned, number,
  ([number, number, number] | 0)?,
]; // prettier-ignore
/** Announced, not yet live: [ab, rb, sb] with null for unchanged modes, or 0 for none. */
type Planned = (number | null)[] | 0;

const STATUS: UnitStatus[] = ["tree", "premium", "squadron", "event"];
const MODE_COL = { ab: 7, rb: 8, sb: 9 } as const;
/** Matchmaking spread: ±1.0 BR = ±3 ranks. */
const SPREAD = 3;

let data: Promise<Row[]> | null = null;
const load = () => (data ??= fetch("/data/lineup.json").then((r) => r.json()));

const brToRank = (br: string) => Math.round((Number(br) - 1) * 3);

function readParams() {
  const p = new URLSearchParams(window.location.search);
  const b = p.get("b") as Branch | null;
  return {
    branch: b && BRANCHES.includes(b) ? b : null,
    nation: p.get("n"),
    rank: p.get("br") ? brToRank(p.get("br")!) : null,
    planned: p.get("planned") === "1",
  };
}

export function LineupTool({ nations }: { nations: Record<Branch, string[]> }) {
  const [mode, setMode] = useMode();
  const [rows, setRows] = useState<Row[]>([]);
  const [branch, setBranch] = useState<Branch>("ground");
  const [nation, setNation] = useState("usa");
  const [wantRank, setRank] = useState(17);
  // Selected bar as an offset from your BR, so it survives branch/nation/mode changes.
  const [focusOffset, setFocusOffset] = useState<number | null>(null);
  // Plan with the BRs from Gaijin's newest announcement instead of today's.
  const [usePlanned, setUsePlanned] = useState(false);

  useEffect(() => {
    const p = readParams();
    /* eslint-disable react-hooks/set-state-in-effect -- the URL only exists on the client */
    if (p.branch) setBranch(p.branch);
    if (p.nation) setNation(p.nation);
    if (p.rank !== null && Number.isFinite(p.rank)) setRank(p.rank);
    if (p.planned) setUsePlanned(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    load().then(setRows);
  }, []);

  const col = MODE_COL[mode];
  const anyPlanned = rows.some((r) => r[11]);
  const view = useMemo(
    () =>
      usePlanned
        ? rows.map((r) => {
            const p = r[11];
            if (!p) return r;
            const c = [...r] as Row;
            c[13] = [r[7], r[8], r[9]];
            for (let i = 0; i < 3; i++) if (p[i] != null) c[7 + i] = p[i]!;
            c[11] = 0;
            return c;
          })
        : rows,
    [rows, usePlanned],
  );
  const pool = useMemo(() => view.filter((r) => r[3] === branch && !r[6]), [view, branch]);
  const ranks = useMemo(() => [...new Set(pool.map((r) => r[col]))].sort((a, b) => a - b), [pool, col]);
  const nationList = nations[branch].includes(nation) ? nation : nations[branch][0];
  // The chosen BR may not exist in this branch or mode: use the nearest one that does.
  const rank = ranks.length
    ? ranks.reduce((best, r) => (Math.abs(r - wantRank) < Math.abs(best - wantRank) ? r : best))
    : wantRank;

  const low = Math.max(0, rank - SPREAD);

  // Keep the URL shareable, with what is actually shown.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("b", branch);
    url.searchParams.set("n", nationList);
    url.searchParams.set("br", formatBr(rank));
    if (usePlanned) url.searchParams.set("planned", "1");
    else url.searchParams.delete("planned");
    window.history.replaceState(null, "", url);
  }, [branch, nationList, rank, usePlanned]);

  const lineup = pool
    .filter((r) => r[2] === nationList && r[col] <= rank && r[col] >= low)
    .sort((a, b) => b[col] - a[col] || a[1].localeCompare(b[1]));
  // Nothing sits below BR 1.0 (rank 0).
  const steps = Array.from({ length: SPREAD * 2 + 1 }, (_, i) => rank - SPREAD + i).filter((s) => s >= 0);
  const counts = steps.map((s) => pool.filter((r) => r[col] === s).length);
  const max = Math.max(1, ...counts);
  const shown = Math.max(0, rank + (focusOffset ?? SPREAD));
  const facing = pool.filter((r) => r[col] === shown);
  const byNation = new Map<string, Row[]>();
  for (const r of facing) byNation.set(r[2], [...(byNation.get(r[2]) ?? []), r]);

  return (
    <div className="space-y-6">
      <div className="panel flex flex-wrap items-end gap-x-5 gap-y-3 p-3">
        <div className="flex gap-1" role="group" aria-label="Branch">
          {BRANCHES.map((b) => (
            <button
              key={b}
              type="button"
              aria-pressed={b === branch}
              onClick={() => setBranch(b)}
              className={`btn gap-1.5 ${b === branch ? "border-gold text-fg" : ""}`}
            >
              <BranchIcon branch={b} />
              {BRANCH_SHORT[b]}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Nation
          <select value={nationList} onChange={(e) => setNation(e.target.value)} className={INPUT}>
            {nations[branch].map((n) => (
              <option key={n} value={n}>
                {nationName(n)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Your top BR
          <select
            value={rank}
            onChange={(e) => {
              setRank(Number(e.target.value));
              setFocusOffset(null);
            }}
            className={`${INPUT} tabular`}
          >
            {(ranks.length ? ranks : [rank]).map((r) => (
              <option key={r} value={r}>
                {formatBr(r)}
              </option>
            ))}
          </select>
        </label>
        <ModeToggle value={mode} onChange={setMode} />
        {anyPlanned && (
          <label className="flex cursor-pointer items-center gap-2 self-center text-sm text-gold">
            <input
              type="checkbox"
              checked={usePlanned}
              onChange={(e) => {
                setUsePlanned(e.target.checked);
                setFocusOffset(null);
              }}
              className="accent-gold"
            />
            Use Gaijin&apos;s planned BRs
          </label>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="section-title">
          <Flag nation={nationList} className="h-4" />
          Your lineup, {formatBr(low)}–{formatBr(rank)}
        </h2>
        <p className="text-sm text-fg-2">
          {lineup.length} {nationName(nationList)} {BRANCH_NAME[branch].toLowerCase()} vehicles you can bring without
          raising your {MODE_NAME[mode]} BR above {formatBr(rank)}. Unobtainable vehicles are left out.
        </p>
        {usePlanned ? (
          <p className="callout-gold px-3 py-2 text-sm">
            Showing every vehicle at the BR Gaijin has announced but not yet applied.{" "}
            {lineup.filter((r) => r[13] && r[13][col - 7] !== r[col]).length} of these would move into or within this
            lineup; their current BR is marked below.
          </p>
        ) : (
          lineup.some((r) => planned(r, col) !== null) && (
            <p className="callout-gold px-3 py-2 text-sm">
              {lineup.filter((r) => planned(r, col) !== null).length} of these have a BR change announced by Gaijin that
              isn&apos;t live yet, marked below.
            </p>
          )
        )}
        {lineup.length > 0 && <Cards rows={lineup} col={col} />}
      </section>

      <section className="space-y-3">
        <h2 className="section-title">What you can meet</h2>
        <p className="text-sm text-fg-2">
          Vehicles from every nation at each BR in your matchmaking range. Select a bar to list them.
        </p>
        <div className="panel p-4">
          <div className="flex h-44 items-end gap-[2px]" role="group" aria-label="Vehicles per BR">
            {steps.map((s, i) => {
              const selected = s === shown;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={selected}
                  title={`${formatBr(s)}: ${counts[i]} vehicles`}
                  aria-label={`BR ${formatBr(s)}: ${counts[i]} vehicles`}
                  onClick={() => setFocusOffset(s - rank)}
                  className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
                >
                  <span className="text-xs tabular text-fg-2">{counts[i]}</span>
                  <span
                    className={`w-full max-w-16 rounded-t-[4px] transition-colors ${
                      selected ? "bg-gold" : "bg-link/70 group-hover:bg-link"
                    }`}
                    style={{
                      height: `${(counts[i] / max) * 100}%`,
                      minHeight: counts[i] ? 2 : 0,
                    }}
                  />
                </button>
              );
            })}
          </div>
          <div className="mt-1 flex gap-[2px] border-t border-card-border pt-1">
            {steps.map((s) => (
              <span
                key={s}
                className={`flex-1 text-center font-display text-sm tabular ${s === rank ? "text-fg" : "text-fg-3"}`}
              >
                {formatBr(s)}
                <span className="block text-[10px] uppercase tracking-wide text-fg-3">
                  {s === rank
                    ? "You"
                    : s === rank + SPREAD
                      ? "Full uptier"
                      : s === rank - SPREAD && s >= 0
                        ? "Full downtier"
                        : " "}
                </span>
              </span>
            ))}
          </div>
        </div>

        <h3 className="font-display text-lg font-semibold">
          {facing.length} vehicles at {formatBr(shown)}
          {shown !== rank && (
            <span className="ml-2 text-sm font-normal text-fg-3">
              {shown > rank ? "uptier +" : "downtier −"}
              {(Math.abs(shown - rank) / 3).toFixed(1)}
            </span>
          )}
        </h3>
        <div className="space-y-4">
          {[...byNation.entries()]
            .sort((a, b) => b[1].length - a[1].length)
            .map(([n, list]) => (
              <div key={n}>
                <h4 className="mb-2 flex items-center gap-2 text-sm text-fg-2">
                  <Flag nation={n} className="h-3.5" />
                  {nationName(n)} <span className="text-fg-3">{list.length}</span>
                </h4>
                <Cards rows={list} col={col} />
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

/** The announced rank for this mode column, or null. */
function planned(r: Row, col: number): number | null {
  const p = r[11];
  return p ? (p[col - 7] ?? null) : null;
}

function Cards({ rows, col }: { rows: Row[]; col: number }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
      {rows.map((r) => {
        const next = planned(r, col);
        const now = r[13] ? r[13][col - 7] : null;
        return (
          <li key={r[0]}>
            <UnitCard
              name={r[1]}
              rank={r[col] as number}
              previousRank={now != null && now !== r[col] ? now : undefined}
              status={STATUS[r[5]]}
              image={r[10] ? `/img/units/${r[0]}.webp` : undefined}
              href={`/vehicle/${r[0]}/`}
              type={r[4]}
              price={r[12] || undefined}
            />
            {next !== null && (
              <p className="mt-1 text-xs text-gold">
                Planned: {formatBr(r[col] as number)} → {formatBr(next)}
              </p>
            )}
            {now != null && now !== r[col] && <p className="mt-1 text-xs text-gold">Today: {formatBr(now)}</p>}
          </li>
        );
      })}
    </ul>
  );
}

const INPUT = "border border-card-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-link focus:outline-none";
