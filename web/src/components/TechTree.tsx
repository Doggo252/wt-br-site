"use client";

import Link from "@/components/Link";
import { useEffect, useMemo, useState } from "react";
import { Arrow } from "./Arrow";
import { UnitCard } from "./UnitCard";
import { ModeToggle } from "./ModeToggle";
import { formatBr, type Mode } from "@/lib/br";
import { roman } from "@/lib/nations";
import { useMode } from "@/lib/useMode";
import type { Ranks, TimeMachine, TreeCell, VersionInfo } from "@/lib/data.gen";
import type { UnitStatus } from "@/lib/units";

/** The slice of a unit the tree needs, keyed by id. Kept small: it ships to the client. */
export type TreeUnit = {
  name: string;
  status: UnitStatus;
  hidden?: boolean;
  /** Lowest Gaijin Market offer in GJN: hidden event vehicles you can still buy there. */
  price?: number;
  br: Ranks;
  image?: boolean;
  type?: string;
  /** BR before the version being viewed, when that version changed it. */
  prev?: Ranks;
  /** Announced by Gaijin, not live yet (only the modes that change). */
  planned?: Partial<Ranks>;
};

type Props = {
  branch: string;
  nation: string;
  columns: TreeCell[][];
  units: Record<string, TreeUnit>;
};

type History = { versions: VersionInfo[]; tm: TimeMachine };

/** Outside a "Lineup at" window: fade the pictures only, so names and BRs stay readable. */
const DIM = "[&_img]:opacity-20 [&_img]:grayscale [&_svg]:opacity-20";

export function TechTree({ branch, nation, columns, units }: Props) {
  const [mode, setMode] = useMode();
  const [showHidden, setShowHidden] = useState(true);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<History | null>(null);
  const [loading, setLoading] = useState(false);
  // Index into versions.json, or null for "now".
  const [vIdx, setVIdx] = useState<number | null>(null);
  // Top BR (rank) of a lineup to highlight: vehicles from 1.0 below it up to it stay lit.
  const [lineupAt, setLineupAt] = useState<number | null>(null);
  const [showPlanned, setShowPlanned] = useState(false);

  async function loadHistory(): Promise<History | null> {
    if (history) return history;
    setLoading(true);
    try {
      const [versions, tm] = await Promise.all([
        fetch("/data/versions.json").then((r) => r.json() as Promise<VersionInfo[]>),
        fetch(`/data/timemachine/${branch}/${nation}.json`).then((r) => r.json() as Promise<TimeMachine>),
      ]);
      const h = { versions, tm };
      setHistory(h);
      return h;
    } finally {
      setLoading(false);
    }
  }

  // ?v=<version> opens the time machine at that version.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("v");
    if (!v) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL only exists on the client
    loadHistory().then((h) => {
      const i = h?.versions.findIndex((x) => x.v === v) ?? -1;
      if (i >= 0) setVIdx(i);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  function goTo(i: number | null) {
    setVIdx(i);
    const url = new URL(window.location.href);
    if (i === null || !history) url.searchParams.delete("v");
    else url.searchParams.set("v", history.versions[i].v);
    window.history.replaceState(null, "", url);
  }

  const plannedCount = Object.values(units).filter((u) => u.planned).length;
  const view = useMemo(() => {
    if (vIdx !== null && history) return stateAt(history.tm, vIdx, units);
    if (!showPlanned) return { columns, units };
    // Preview the announcement: planned ranks, with today's as "previous" so cards show the move.
    const next: Record<string, TreeUnit> = {};
    for (const [id, u] of Object.entries(units)) {
      next[id] = u.planned ? { ...u, br: { ...u.br, ...u.planned }, prev: u.br } : u;
    }
    return { columns, units: next };
  }, [vIdx, history, columns, units, showPlanned]);

  const visible = (id: string) => view.units[id] && (showHidden || !view.units[id].hidden);
  const ranks = [...new Set(view.columns.flat().map((c) => c.rank))].sort((a, b) => a - b);
  const headers = view.columns.map((col) => columnLabel(col, view.units));
  const version = vIdx !== null && history ? history.versions[vIdx] : null;
  const brOptions = [...new Set(Object.values(view.units).map((u) => u.br[mode]))].sort((a, b) => a - b);
  const lit = (id: string) => {
    if (lineupAt === null) return true;
    const r = view.units[id].br[mode];
    return r <= lineupAt && r >= lineupAt - 3;
  };
  const changedHere = Object.values(view.units).filter((u) => u.prev && u.prev[mode] !== u.br[mode]).length;

  function toggle(group: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  return (
    // As wide as the tree, but never narrower than the page column, so small trees line up with it.
    <div className="mx-auto w-fit min-w-[min(100%,70rem)] max-w-full">
      <div className="panel mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 px-3 py-2.5">
        <ModeToggle value={mode} onChange={setMode} />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-2">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
            className="accent-link"
          />
          Show unobtainable and market-only vehicles
        </label>
        <label className="flex items-center gap-2 text-sm text-fg-2">
          Lineup at
          <select
            value={lineupAt ?? ""}
            onChange={(e) => setLineupAt(e.target.value === "" ? null : Number(e.target.value))}
            className="border border-card-border bg-bg px-2 py-1 font-display text-sm tabular text-fg focus:border-link focus:outline-none"
          >
            <option value="">Off</option>
            {brOptions.map((r) => (
              <option key={r} value={r}>
                {formatBr(r)}
              </option>
            ))}
          </select>
        </label>
        {vIdx === null && plannedCount > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gold">
            <input
              type="checkbox"
              checked={showPlanned}
              onChange={(e) => setShowPlanned(e.target.checked)}
              className="accent-gold"
            />
            Preview {plannedCount} planned BR change{plannedCount === 1 ? "" : "s"}
          </label>
        )}
        {vIdx === null && (
          <button
            type="button"
            disabled={loading}
            className="btn sm:ml-auto"
            onClick={async () => {
              const h = await loadHistory();
              if (h) goTo(h.versions.length - 1);
            }}
          >
            <ClockIcon />
            {loading ? "Loading history…" : "Time machine"}
          </button>
        )}
      </div>

      <PatchSlider
        branch={branch}
        history={history}
        vIdx={vIdx}
        onChange={goTo}
      />

      {version && (
        <p className="mb-3 text-sm text-fg-2">
          Showing the tree as of update{" "}
          <Link href={`/updates/${version.v}/`} className="font-display tabular">
            {version.v}
          </Link>{" "}
          ({version.d}).{" "}
          {changedHere > 0 ? (
            <>
              {changedHere} vehicle{changedHere === 1 ? "" : "s"} in this tree changed BR in this update (marked{" "}
              <Arrow dir="up" className="text-bad" />
              <Arrow dir="down" className="text-good" />
              ).
            </>
          ) : (
            "No BR changes in this tree in this update."
          )}
        </p>
      )}

      <div className="overflow-x-auto pb-4">
        <table className="table-fixed border-separate border-spacing-x-2 border-spacing-y-0">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-[#12161b]/95">
                <span className="sr-only">Rank</span>
              </th>
              {headers.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`pb-2 text-left font-display text-[11px] font-semibold uppercase tracking-[0.12em] ${h.premium ? "text-premium" : "text-fg-3"}`}
                >
                  {h.label || <span className="sr-only">Column {i + 1}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranks.map((rank) => (
              <tr key={rank} className="align-top">
                <th
                  scope="row"
                  className="sticky left-0 z-10 w-12 border-t border-[#262f35] bg-[#12161b]/95 pt-3 text-center align-top"
                >
                  <span className="inline-block min-w-8 border border-[#3a4650] bg-gradient-to-b from-[#2b343c] to-[#20272d] px-1.5 py-0.5 font-display text-base font-bold text-gold shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]">
                    {roman(rank)}
                  </span>
                </th>
                {view.columns.map((col, ci) => (
                  <td key={ci} className="w-[156px] min-w-[156px] max-w-[156px] border-t border-[#262f35] pb-4 pt-3">
                    <div className="flex flex-col gap-2">
                      {col
                        .filter((cell) => cell.rank === rank)
                        .map((cell, k) => {
                          const ids = cell.units.filter(visible);
                          if (ids.length === 0) return null;
                          if (!cell.group || ids.length === 1) {
                            return ids.map((id) => (
                              <div key={id} className={lit(id) ? "" : DIM}>
                                <TreeCard id={id} unit={view.units[id]} mode={mode} />
                              </div>
                            ));
                          }
                          const isOpen = open.has(cell.group);
                          return (
                            <div
                              key={`${cell.group}-${k}`}
                              className={`flex flex-col gap-1.5 ${ids.some(lit) ? "" : DIM}`}
                            >
                              <FolderCard
                                name={cell.groupName ?? ids.map((id) => view.units[id].name).join(" / ")}
                                ids={ids}
                                units={view.units}
                                mode={mode}
                                open={isOpen}
                                onToggle={() => toggle(cell.group!)}
                              />
                              {isOpen && (
                                <div className="ml-2 flex flex-col gap-1.5 border-l border-card-top pl-2">
                                  {ids.map((id) => (
                                    <div key={id} className={lit(id) ? "" : DIM}>
                                      <TreeCard id={id} unit={view.units[id]} mode={mode} />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Tree layout and BRs at a past version, from the time-machine file. */
function stateAt(
  tm: TimeMachine,
  vIdx: number,
  today: Record<string, TreeUnit>,
): { columns: TreeCell[][]; units: Record<string, TreeUnit> } {
  let layout = tm.layouts[0];
  for (const l of tm.layouts) {
    if (l[0] <= vIdx) layout = l;
    else break;
  }
  const units: Record<string, TreeUnit> = {};
  for (const [id, u] of Object.entries(tm.units)) {
    let cur: number[] | undefined;
    let before: number[] | undefined;
    for (const p of u.h) {
      if (p[0] > vIdx) break;
      before = cur;
      cur = p;
    }
    if (!cur) continue;
    const toRanks = (p: number[]): Ranks => ({ ab: p[1], rb: p[2], sb: p[3] });
    units[id] = {
      name: u.n,
      // The time-machine file has no classes; today's is right for any vehicle still in the game.
      type: today[id]?.type,
      status: u.s,
      image: u.i,
      br: toRanks(cur),
      prev: cur[0] === vIdx && before ? toRanks(before) : undefined,
    };
  }
  return { columns: layout[1], units };
}

function PatchSlider({
  branch,
  history,
  vIdx,
  onChange,
}: {
  branch: string;
  history: History | null;
  vIdx: number | null;
  onChange: (i: number | null) => void;
}) {
  if (vIdx === null || !history) return null;
  const max = history.versions.length - 1;
  const v = history.versions[vIdx];
  // Jump between versions that changed something, skipping layout-only ones.
  const step = (dir: -1 | 1) => {
    for (let i = vIdx + dir; i >= 0 && i <= max; i += dir) {
      const c = history.versions[i].byBranch?.[branch as keyof VersionInfo["byBranch"]];
      if (c?.changes || c?.added || c?.removed || i === 0 || i === max) return onChange(i);
    }
  };
  return (
    <div className="panel mb-4 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <span className="eyebrow">Time machine</span>
        <span className="font-display text-lg font-semibold tabular text-fg">{v.v}</span>
        <span className="text-sm tabular text-fg-3">{v.d}</span>
        <span className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={vIdx === 0}
            aria-label="Previous update"
            className="btn min-h-9 min-w-9 justify-center px-2"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={vIdx === max}
            aria-label="Next update"
            className="btn min-h-9 min-w-9 justify-center px-2"
          >
            →
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="btn min-h-9"
          >
            Back to now
          </button>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={vIdx}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Game version"
        aria-valuetext={`Update ${v.v}, ${v.d}`}
        className="w-full accent-link"
      />
      <div className="flex justify-between text-xs tabular text-fg-3">
        <span>{history.versions[0].d.slice(0, 4)}</span>
        <span>{history.versions[max].d.slice(0, 4)}</span>
      </div>
    </div>
  );
}

function TreeCard({ id, unit, mode }: { id: string; unit: TreeUnit; mode: Mode }) {
  return (
    <UnitCard
      name={unit.name}
      rank={unit.br[mode]}
      previousRank={unit.prev?.[mode]}
      status={unit.status}
      availability={unit.hidden && unit.price == null ? "unobtainable" : "current"}
      price={unit.price}
      image={unit.image ? `/img/units/${id}.webp` : undefined}
      href={`/vehicle/${id}/`}
      type={unit.type}
    />
  );
}

function FolderCard({
  name,
  ids,
  units,
  mode,
  open,
  onToggle,
}: {
  name: string;
  ids: string[];
  units: Record<string, TreeUnit>;
  mode: Mode;
  open: boolean;
  onToggle: () => void;
}) {
  const brs = ids.map((id) => units[id].br[mode]);
  const lo = Math.min(...brs);
  const hi = Math.max(...brs);
  const first = ids.find((id) => units[id].image);
  const changed = ids.some((id) => units[id].prev && units[id].prev![mode] !== units[id].br[mode]);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="relative block w-full max-w-[180px] border border-card-border bg-card-bg text-left before:absolute before:inset-x-0 before:-top-px before:h-[2px] before:bg-card-top before:content-[''] hover:brightness-125"
    >
      {/* Stacked edge, like the in-game folder. */}
      <span aria-hidden className="absolute -bottom-1 left-1 right-1 h-1 border border-t-0 border-card-border bg-card-bg" />
      <div className="relative aspect-[2/1] w-full overflow-hidden">
        {first && (
          // eslint-disable-next-line @next/next/no-img-element -- static export
          <img src={`/img/units/${first}.webp`} alt="" loading="lazy" className="h-full w-full object-contain" />
        )}
        {changed && (
          <span className="absolute left-1 top-1 rounded-sm bg-bg/80 px-1 font-display text-[10px] uppercase text-gold">
            Changed
          </span>
        )}
        <span className="absolute right-1 top-1 inline-flex items-center gap-1 rounded-sm bg-bg/80 px-1 font-display text-[11px] text-fg-2">
          {ids.length} <Arrow dir={open ? "up" : "down"} />
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2 px-1.5 pb-1 pt-0.5">
        <span className="min-w-0 truncate font-display text-[13px] leading-tight text-fg" title={name}>
          {name}
        </span>
        <span className="shrink-0 font-display text-[13px] font-semibold tabular text-fg-2">
          {lo === hi ? formatBr(lo) : `${formatBr(lo)}–${formatBr(hi)}`}
        </span>
      </div>
    </button>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="8" r="6.2" />
      <path d="M8 4.5V8l2.4 1.6" />
    </svg>
  );
}

const COLUMN_LABEL: Record<string, string> = {
  light_tank: "Light tanks",
  medium_tank: "Medium tanks",
  heavy_tank: "Heavy tanks",
  tank_destroyer: "Tank destroyers",
  spaa: "Anti-air",
  fighter: "Fighters",
  strike: "Strike aircraft",
  bomber: "Bombers",
  attack_helicopter: "Attack helicopters",
  utility_helicopter: "Utility helicopters",
};

/** Name a column by its most common vehicle class; columns of only non-tree vehicles are "Premium". */
function columnLabel(col: TreeCell[], units: Record<string, TreeUnit>): { label: string; premium: boolean } {
  const list = col.flatMap((c) => c.units).map((id) => units[id]).filter(Boolean);
  if (list.length && list.every((u) => u.status !== "tree" || u.hidden)) return { label: "Premium & event", premium: true };
  const counts = new Map<string, number>();
  for (const u of list) if (u.type) counts.set(u.type, (counts.get(u.type) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return { label: top ? (COLUMN_LABEL[top] ?? "") : "", premium: false };
}
