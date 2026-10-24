"use client";

import { useMemo, useState } from "react";
import { ModeToggle } from "./ModeToggle";
import { UnitCard } from "./UnitCard";
import { formatBr } from "@/lib/br";
import { nationName } from "@/lib/nations";
import { useMode } from "@/lib/useMode";
import type { Ranks } from "@/lib/data.gen";
import type { UnitStatus } from "@/lib/units";

export type ThermalUnit = {
  id: string;
  name: string;
  nation: string;
  status: UnitStatus;
  hidden?: boolean;
  image?: boolean;
  br: Ranks;
  thermal: { gunner?: number; commander?: number; driver?: number };
};

type Crew = "gunner" | "commander" | "driver" | "any";

const CREW_OPTIONS: { value: Crew; label: string }[] = [
  { value: "gunner", label: "Gunner" },
  { value: "commander", label: "Commander" },
  { value: "driver", label: "Driver" },
  { value: "any", label: "Any crew" },
];

/** "Which vehicles have Gen 2 gunner thermals, and what's the lowest BR?" */
export function ThermalFinder({ units, nations }: { units: ThermalUnit[]; nations: string[] }) {
  const [mode, setMode] = useMode();
  const [crew, setCrew] = useState<Crew>("gunner");
  const [gen, setGen] = useState(2);
  const [nation, setNation] = useState("all");
  const [showHidden, setShowHidden] = useState(false);

  const results = useMemo(() => {
    const best = (u: ThermalUnit) =>
      crew === "any" ? Math.max(u.thermal.gunner ?? 0, u.thermal.commander ?? 0, u.thermal.driver ?? 0) : (u.thermal[crew] ?? 0);
    return units
      .filter((u) => best(u) >= gen && (nation === "all" || u.nation === nation) && (showHidden || !u.hidden))
      .sort((a, b) => a.br[mode] - b.br[mode] || a.name.localeCompare(b.name));
  }, [units, crew, gen, nation, showHidden, mode]);

  const lowest = results[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 border border-card-border bg-panel p-3">
        <Field label="Crew position">
          <select value={crew} onChange={(e) => setCrew(e.target.value as Crew)} className={SELECT}>
            {CREW_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="At least">
          <select value={gen} onChange={(e) => setGen(Number(e.target.value))} className={SELECT}>
            <option value={1}>Gen 1</option>
            <option value={2}>Gen 2</option>
            <option value={3}>Gen 3</option>
          </select>
        </Field>
        <Field label="Nation">
          <select value={nation} onChange={(e) => setNation(e.target.value)} className={SELECT}>
            <option value="all">All nations</option>
            {nations.map((n) => (
              <option key={n} value={n}>
                {nationName(n)}
              </option>
            ))}
          </select>
        </Field>
        <ModeToggle value={mode} onChange={setMode} />
        <label className="flex cursor-pointer items-center gap-2 pb-1.5 text-sm text-fg-2">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
            className="accent-link"
          />
          Include unobtainable
        </label>
      </div>
      <p className="text-sm text-fg-2" aria-live="polite">
        {results.length === 0
          ? "No vehicles match."
          : `${results.length} vehicles. Lowest ${mode.toUpperCase()} BR: ${lowest.name} at ${formatBr(lowest.br[mode])}.`}
      </p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {results.slice(0, 120).map((u) => (
          <li key={u.id}>
            <UnitCard
              name={u.name}
              rank={u.br[mode]}
              status={u.status}
              availability={u.hidden ? "unobtainable" : "current"}
              image={u.image ? `/img/units/${u.id}.webp` : undefined}
              href={`/vehicle/${u.id}/`}
            />
          </li>
        ))}
      </ul>
      {results.length > 120 && <p className="text-sm text-fg-3">Showing the 120 lowest BR. Narrow the filters to see more.</p>}
    </div>
  );
}

const SELECT =
  "border border-card-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-link focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-fg-3">
      {label}
      {children}
    </label>
  );
}
