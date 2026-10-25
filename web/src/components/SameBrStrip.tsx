"use client";

import { ModeToggle } from "./ModeToggle";
import { UnitCard } from "./UnitCard";
import { MODE_NAME, formatBr, type Mode } from "@/lib/br";
import { useMode } from "@/lib/useMode";
import type { TreeUnit } from "./TechTree";

type Props = {
  /** Unit ids at the same BR, per mode, best matches first. */
  byMode: Record<Mode, string[]>;
  units: Record<string, TreeUnit>;
  rank: Record<Mode, number>;
};

export function SameBrStrip({ byMode, units, rank }: Props) {
  const [mode, setMode] = useMode();
  const ids = byMode[mode];
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-2">
          {ids.length === 0 ? "No other ground vehicles" : `${ids.length} vehicles`} at {formatBr(rank[mode])} in{" "}
          {MODE_NAME[mode]}
        </p>
        <ModeToggle value={mode} onChange={setMode} />
      </div>
      {ids.length > 0 && (
        <ul className="flex snap-x gap-3 overflow-x-auto pb-3">
          {ids.map((id) => {
            const u = units[id];
            return (
              <li key={id} className="w-[150px] shrink-0 snap-start">
                <UnitCard
                  name={u.name}
                  rank={u.br[mode]}
                  status={u.status}
                  availability={u.hidden ? "unobtainable" : "current"}
                  image={u.image ? `/img/units/${id}.webp` : undefined}
                  href={`/vehicle/${id}/`}
                  type={u.type}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
