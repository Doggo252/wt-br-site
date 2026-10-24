"use client";

import { useState } from "react";
import { Arrow } from "./Arrow";
import { UnitCard } from "./UnitCard";
import { ModeToggle } from "./ModeToggle";
import { formatBr, type Mode } from "@/lib/br";
import { roman } from "@/lib/nations";
import { useMode } from "@/lib/useMode";
import type { Ranks, TreeCell } from "@/lib/data.gen";
import type { UnitStatus } from "@/lib/units";

/** The slice of a unit the tree needs, keyed by id. Kept small: it ships to the client. */
export type TreeUnit = {
  name: string;
  status: UnitStatus;
  hidden?: boolean;
  br: Ranks;
  image?: boolean;
};

type Props = {
  columns: TreeCell[][];
  units: Record<string, TreeUnit>;
};

export function TechTree({ columns, units }: Props) {
  const [mode, setMode] = useMode();
  const [showHidden, setShowHidden] = useState(true);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const visible = (id: string) => units[id] && (showHidden || !units[id].hidden);
  const ranks = [...new Set(columns.flat().map((c) => c.rank))].sort((a, b) => a - b);

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
                {columns.map((col, ci) => (
                  <td key={ci} className="w-[150px] min-w-[150px] border-t border-card-border pb-4 pt-3">
                    <div className="flex flex-col gap-2">
                      {col
                        .filter((cell) => cell.rank === rank)
                        .map((cell) => {
                          const ids = cell.units.filter(visible);
                          if (ids.length === 0) return null;
                          if (!cell.group || ids.length === 1) {
                            return ids.map((id) => <TreeCard key={id} id={id} unit={units[id]} mode={mode} />);
                          }
                          const isOpen = open.has(cell.group);
                          return (
                            <div key={cell.group} className="flex flex-col gap-1.5">
                              <FolderCard
                                name={cell.groupName ?? ids.map((id) => units[id].name).join(" / ")}
                                ids={ids}
                                units={units}
                                mode={mode}
                                open={isOpen}
                                onToggle={() => toggle(cell.group!)}
                              />
                              {isOpen && (
                                <div className="ml-2 flex flex-col gap-1.5 border-l border-card-top pl-2">
                                  {ids.map((id) => (
                                    <TreeCard key={id} id={id} unit={units[id]} mode={mode} />
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

function TreeCard({ id, unit, mode }: { id: string; unit: TreeUnit; mode: Mode }) {
  return (
    <UnitCard
      name={unit.name}
      rank={unit.br[mode]}
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
