"use client";

import { UnitCard } from "./UnitCard";
import type { TreeUnit } from "./TechTree";
import { useMode } from "@/lib/useMode";

/** A run of tech tree cards in the shared game mode, with `current` outlined and not linked. */
export function TreeLineStrip({ units, current }: { units: (TreeUnit & { id: string })[]; current: string }) {
  const [mode] = useMode();
  return (
    <ul className="flex snap-x gap-2 overflow-x-auto pb-3">
      {units.map((o) => (
        <li key={o.id} className="w-[140px] shrink-0 snap-start">
          <UnitCard
            name={o.name}
            rank={o.br[mode]}
            status={o.status}
            availability={o.hidden ? "unobtainable" : "current"}
            image={o.image ? `/img/units/${o.id}.webp` : undefined}
            href={o.id === current ? undefined : `/vehicle/${o.id}/`}
            selected={o.id === current}
            type={o.type}
          />
        </li>
      ))}
    </ul>
  );
}
