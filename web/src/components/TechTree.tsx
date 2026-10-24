"use client";

import Link from "next/link";
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
  br: Ranks;
  image?: boolean;
  /** BR before the version being viewed, when that version changed it. */
  prev?: Ranks;
};

type Props = {
  branch: string;
  nation: string;
  columns: TreeCell[][];
  units: Record<string, TreeUnit>;
};

type History = { versions: VersionInfo[]; tm: TimeMachine };

export function TechTree({ branch, nation, columns, units }: Props) {
  const [mode, setMode] = useMode();
  const [showHidden, setShowHidden] = useState(true);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<History | null>(null);
  const [loading, setLoading] = useState(false);
  // Index into versions.json, or null for "now".
  const [vIdx, setVIdx] = useState<number | null>(null);

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

  const view = useMemo(
    () => (vIdx !== null && history ? stateAt(history.tm, vIdx) : { columns, units }),
    [vIdx, history, columns, units],
  );

  const visible = (id: string) => view.units[id] && (showHidden || !view.units[id].hidden);
  const ranks = [...new Set(view.columns.flat().map((c) => c.rank))].sort((a, b) => a - b);
  const version = vIdx !== null && history ? history.versions[vIdx] : null;
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
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <ModeToggle value={mode} onChange={setMode} />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-2">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
            className="accent-link"
          />
          Show unobtainable vehicles
        </label>
      </div>

      <PatchSlider
        branch={branch}
        history={history}
        loading={loading}
        vIdx={vIdx}
        onOpen={async () => {
          const h = await loadHistory();
          if (h) goTo(h.versions.length - 1);
        }}
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
        <table className="border-separate border-spacing-x-2 border-spacing-y-0">
          <tbody>
            {ranks.map((rank) => (
              <tr key={rank} className="align-top">
                <th
                  scope="row"
                  className="sticky left-0 z-10 w-10 border-t border-card-border bg-bg pt-3 text-left font-display text-lg font-bold text-fg-3"
                >
                  {roman(rank)}
                </th>
                {view.columns.map((col, ci) => (
                  <td key={ci} className="w-[150px] min-w-[150px] border-t border-card-border pb-4 pt-3">
                    <div className="flex flex-col gap-2">
                      {col
                        .filter((cell) => cell.rank === rank)
                        .map((cell, k) => {
                          const ids = cell.units.filter(visible);
                          if (ids.length === 0) return null;
                          if (!cell.group || ids.length === 1) {
                            return ids.map((id) => <TreeCard key={id} id={id} unit={view.units[id]} mode={mode} />);
                          }
                          const isOpen = open.has(cell.group);
                          return (
                            <div key={`${cell.group}-${k}`} className="flex flex-col gap-1.5">
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
                                    <TreeCard key={id} id={id} unit={view.units[id]} mode={mode} />
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
function stateAt(tm: TimeMachine, vIdx: number): { columns: TreeCell[][]; units: Record<string, TreeUnit> } {
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
  loading,
  vIdx,
  onOpen,
  onChange,
}: {
  branch: string;
  history: History | null;
  loading: boolean;
  vIdx: number | null;
  onOpen: () => void;
  onChange: (i: number | null) => void;
}) {
  if (vIdx === null || !history) {
    return (
      <div className="mb-4">
        <button
          type="button"
          onClick={onOpen}
          disabled={loading}
          className="border border-card-border bg-panel px-3 py-1.5 font-display text-sm text-fg-2 hover:text-fg disabled:opacity-60"
        >
          {loading ? "Loading history…" : "Time machine: view this tree at an older update"}
        </button>
      </div>
    );
  }
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
    <div className="mb-4 border border-card-border bg-panel p-3">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <span className="font-display text-sm font-semibold text-fg">Time machine</span>
        <span className="font-display tabular text-link">{v.v}</span>
        <span className="text-sm tabular text-fg-3">{v.d}</span>
        <span className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={vIdx === 0}
            aria-label="Previous update"
            className="min-h-9 min-w-9 border border-card-border px-2 text-fg-2 hover:text-fg disabled:opacity-40"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={vIdx === max}
            aria-label="Next update"
            className="min-h-9 min-w-9 border border-card-border px-2 text-fg-2 hover:text-fg disabled:opacity-40"
          >
            →
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="min-h-9 border border-card-border px-3 font-display text-sm text-fg-2 hover:text-fg"
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
      availability={unit.hidden ? "unobtainable" : "current"}
      image={unit.image ? `/img/units/${id}.webp` : undefined}
      href={`/vehicle/${id}/`}
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
